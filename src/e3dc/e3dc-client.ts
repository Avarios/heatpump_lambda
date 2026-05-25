import * as net from "net";
import {
  Tag,
  Type,
  RscpCrypto,
  buildFrame,
  decodeFrame,
  decodeItems,
  encodeContainer,
  findTag,
  type RscpItem,
} from "./rscp.js";
import { ErrResult, OkResult, type Result } from "../result.js";
import type { E3dcConfig, E3dcData } from "./e3dc-types.js";

const DEFAULT_PORT = 5033;
const CONNECT_TIMEOUT_MS = 10_000;

export class E3dcClient {
  private socket: net.Socket | null = null;
  private crypto: RscpCrypto;
  private config: E3dcConfig;
  private connected = false;

  constructor(config: E3dcConfig) {
    this.config = config;
    this.crypto = new RscpCrypto(config.rscpKey);
  }

  get isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      const port = this.config.port ?? DEFAULT_PORT;

      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error(`E3DC connection timeout after ${CONNECT_TIMEOUT_MS}ms`));
      }, CONNECT_TIMEOUT_MS);

      socket.once("connect", () => {
        clearTimeout(timer);
        this.socket = socket;
        this.connected = true;
        console.log(`E3DC: connected to ${this.config.host}:${port}`);
        resolve();
      });

      socket.once("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });

      socket.connect(port, this.config.host);
    });

    await this.authenticate();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.connected = false;
    console.log("E3DC: disconnected");
  }

  onDisconnectOrError(callback: () => void): void {
    if (!this.socket) return;
    this.socket.on("close", callback);
    this.socket.on("error", callback);
  }

  async fetchE3dcData(): Promise<Result<E3dcData, { reason: string }>> {
    if (!this.connected) return ErrResult({ reason: "E3DC client is not connected" });

    try {
      const [emsItems, pviItems, batItems, pmItems] = await Promise.all([
        this.sendRequest(buildEmsRequest()),
        this.sendRequest(buildPviRequest()),
        this.sendRequest(buildBatRequest()),
        this.sendRequest(buildPmRequest()),
      ]);

      const n = (tag: number, items: RscpItem[]): number | null => {
        const v = findTag(items, tag);
        return v !== undefined ? (v as number) : null;
      };

      const power_pv = n(Tag.EMS_POWER_PV, emsItems);
      const power_bat = n(Tag.EMS_POWER_BAT, emsItems);
      const power_home = n(Tag.EMS_POWER_HOME, emsItems);
      const power_grid = n(Tag.EMS_POWER_GRID, emsItems);
      const bat_soc = n(Tag.EMS_BAT_SOC, emsItems);
      const autarky = n(Tag.EMS_AUTARKY, emsItems);
      const self_consumption = n(Tag.EMS_SELF_CONSUMPTION, emsItems);

      if (
        power_pv === null ||
        power_bat === null ||
        power_home === null ||
        power_grid === null ||
        bat_soc === null ||
        autarky === null ||
        self_consumption === null
      ) {
        return ErrResult({ reason: "E3DC response missing required EMS tags" });
      }

      const pvi = parsePviData(pviItems);
      const bat = parseBatData(batItems);
      const pm = parsePmData(pmItems);

      return OkResult({
        power_pv,
        power_bat,
        power_home,
        power_grid,
        bat_soc,
        autarky,
        self_consumption,
        power_add: n(Tag.EMS_POWER_ADD, emsItems),
        power_wb_all: n(Tag.EMS_POWER_WB_ALL, emsItems),
        power_wb_solar: n(Tag.EMS_POWER_WB_SOLAR, emsItems),
        coupling_mode: n(Tag.EMS_COUPLING_MODE, emsItems),
        status: n(Tag.EMS_STATUS, emsItems),
        bat_charge_limit: n(Tag.EMS_BAT_CHARGE_LIMIT, emsItems),
        bat_discharge_limit: n(Tag.EMS_BAT_DISCHARGE_LIMIT, emsItems),
        remaining_bat_charge_power: n(Tag.EMS_REMAINING_BAT_CHARGE_POWER, emsItems),
        remaining_bat_discharge_power: n(Tag.EMS_REMAINING_BAT_DISCHARGE_POWER, emsItems),
        emergency_power_status: n(Tag.EMS_EMERGENCY_POWER_STATUS, emsItems),
        ...pvi,
        ...bat,
        ...pm,
      });
    } catch (err) {
      console.error("E3DC: failed to fetch data:", err);
      this.connected = false;
      return ErrResult({ reason: "Failed to fetch E3DC data" });
    }
  }

  private async authenticate(): Promise<void> {
    const authRequest: RscpItem[] = [
      [
        Tag.RSCP_REQ_AUTHENTICATION,
        Type.Container,
        [
          [Tag.RSCP_AUTHENTICATION_USER, Type.CString, this.config.username],
          [Tag.RSCP_AUTHENTICATION_PASSWORD, Type.CString, this.config.password],
        ] as RscpItem[],
      ],
    ];

    const response = await this.sendRequest(authRequest);
    const authLevel = findTag(response, Tag.RSCP_AUTHENTICATION);

    if (!authLevel || (authLevel as number) === 0) {
      this.disconnect();
      throw new Error("E3DC authentication failed — check username/password/rscpKey");
    }

    console.log(`E3DC: authenticated, access level ${authLevel}`);
  }

  private sendRequest(items: RscpItem[]): Promise<RscpItem[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("No socket"));

      const payload = encodeContainer(items);
      const frame = buildFrame(payload);
      const encrypted = this.crypto.encrypt(frame);

      let received = Buffer.alloc(0);

      const onData = (chunk: Buffer) => {
        received = Buffer.concat([received, chunk]);
        try {
          const decrypted = this.crypto.decrypt(received);
          const responsePayload = decodeFrame(decrypted);
          const decoded = decodeItems(responsePayload);
          this.socket?.off("data", onData);
          this.socket?.off("error", onError);
          resolve(decoded);
        } catch {
          // incomplete frame — wait for more data
        }
      };

      const onError = (err: Error) => {
        this.socket?.off("data", onData);
        reject(err);
      };

      this.socket.on("data", onData);
      this.socket.once("error", onError);
      this.socket.write(encrypted);
    });
  }
}

// ── Request builders ──────────────────────────────────────────────────────────

function buildEmsRequest(): RscpItem[] {
  return [
    [Tag.EMS_REQ_POWER_PV, Type.NoneType, null],
    [Tag.EMS_REQ_POWER_BAT, Type.NoneType, null],
    [Tag.EMS_REQ_POWER_HOME, Type.NoneType, null],
    [Tag.EMS_REQ_POWER_GRID, Type.NoneType, null],
    [Tag.EMS_REQ_BAT_SOC, Type.NoneType, null],
    [Tag.EMS_REQ_AUTARKY, Type.NoneType, null],
    [Tag.EMS_REQ_SELF_CONSUMPTION, Type.NoneType, null],
    [Tag.EMS_REQ_POWER_ADD, Type.NoneType, null],
    [Tag.EMS_REQ_POWER_WB_ALL, Type.NoneType, null],
    [Tag.EMS_REQ_POWER_WB_SOLAR, Type.NoneType, null],
    [Tag.EMS_REQ_COUPLING_MODE, Type.NoneType, null],
    [Tag.EMS_REQ_STATUS, Type.NoneType, null],
    [Tag.EMS_REQ_BAT_CHARGE_LIMIT, Type.NoneType, null],
    [Tag.EMS_REQ_BAT_DISCHARGE_LIMIT, Type.NoneType, null],
    [Tag.EMS_REQ_REMAINING_BAT_CHARGE_POWER, Type.NoneType, null],
    [Tag.EMS_REQ_REMAINING_BAT_DISCHARGE_POWER, Type.NoneType, null],
    [Tag.EMS_REQ_EMERGENCY_POWER_STATUS, Type.NoneType, null],
  ];
}

// PVI/BAT/PM use a container-based indexed request:
// PVI_REQ_DATA { PVI_INDEX=0, REQ_AC_POWER, REQ_DC_POWER, ... }

function buildPviRequest(): RscpItem[] {
  // Request PVI index 0 (first inverter)
  const inner: RscpItem[] = [
    [Tag.PVI_INDEX, Type.Uint16, 0],
    [Tag.PVI_REQ_ON_GRID, Type.NoneType, null],
    [Tag.PVI_REQ_STATE, Type.NoneType, null],
    [Tag.PVI_REQ_TEMPERATURE, Type.NoneType, null],
    [Tag.PVI_REQ_AC_POWER, Type.UChar8, 0],    // phase index 0
    [Tag.PVI_REQ_AC_POWER, Type.UChar8, 1],    // phase index 1
    [Tag.PVI_REQ_AC_POWER, Type.UChar8, 2],    // phase index 2
    [Tag.PVI_REQ_AC_VOLTAGE, Type.UChar8, 0],
    [Tag.PVI_REQ_AC_VOLTAGE, Type.UChar8, 1],
    [Tag.PVI_REQ_AC_VOLTAGE, Type.UChar8, 2],
    [Tag.PVI_REQ_AC_CURRENT, Type.UChar8, 0],
    [Tag.PVI_REQ_AC_CURRENT, Type.UChar8, 1],
    [Tag.PVI_REQ_AC_CURRENT, Type.UChar8, 2],
    [Tag.PVI_REQ_AC_ENERGY_ALL, Type.UChar8, 0],
    [Tag.PVI_REQ_AC_ENERGY_ALL, Type.UChar8, 1],
    [Tag.PVI_REQ_AC_ENERGY_ALL, Type.UChar8, 2],
    [Tag.PVI_REQ_AC_ENERGY_DAY, Type.UChar8, 0],
    [Tag.PVI_REQ_AC_ENERGY_DAY, Type.UChar8, 1],
    [Tag.PVI_REQ_AC_ENERGY_DAY, Type.UChar8, 2],
    [Tag.PVI_REQ_AC_FREQUENCY, Type.UChar8, 0],
    [Tag.PVI_REQ_DC_POWER, Type.UChar8, 0],    // string index 0
    [Tag.PVI_REQ_DC_POWER, Type.UChar8, 1],    // string index 1
    [Tag.PVI_REQ_DC_VOLTAGE, Type.UChar8, 0],
    [Tag.PVI_REQ_DC_VOLTAGE, Type.UChar8, 1],
    [Tag.PVI_REQ_DC_CURRENT, Type.UChar8, 0],
    [Tag.PVI_REQ_DC_CURRENT, Type.UChar8, 1],
  ];
  return [[Tag.PVI_REQ_DATA, Type.Container, inner]];
}

function buildBatRequest(): RscpItem[] {
  const inner: RscpItem[] = [
    [Tag.BAT_INDEX, Type.Uint16, 0],
    [Tag.BAT_REQ_RSOC, Type.NoneType, null],
    [Tag.BAT_REQ_MODULE_VOLTAGE, Type.NoneType, null],
    [Tag.BAT_REQ_CURRENT, Type.NoneType, null],
    [Tag.BAT_REQ_CHARGE_CYCLES, Type.NoneType, null],
    [Tag.BAT_REQ_TERMINAL_VOLTAGE, Type.NoneType, null],
    [Tag.BAT_REQ_STATUS_CODE, Type.NoneType, null],
    [Tag.BAT_REQ_ERROR_CODE, Type.NoneType, null],
    [Tag.BAT_REQ_DCB_COUNT, Type.NoneType, null],
    [Tag.BAT_REQ_TRAINING_MODE, Type.NoneType, null],
  ];
  return [[Tag.BAT_REQ_DATA, Type.Container, inner]];
}

function buildPmRequest(): RscpItem[] {
  const inner: RscpItem[] = [
    [Tag.PM_INDEX, Type.Uint16, 0],
    [Tag.PM_REQ_POWER_L1, Type.NoneType, null],
    [Tag.PM_REQ_POWER_L2, Type.NoneType, null],
    [Tag.PM_REQ_POWER_L3, Type.NoneType, null],
    [Tag.PM_REQ_VOLTAGE_L1, Type.NoneType, null],
    [Tag.PM_REQ_VOLTAGE_L2, Type.NoneType, null],
    [Tag.PM_REQ_VOLTAGE_L3, Type.NoneType, null],
    [Tag.PM_REQ_ENERGY_L1, Type.NoneType, null],
    [Tag.PM_REQ_ENERGY_L2, Type.NoneType, null],
    [Tag.PM_REQ_ENERGY_L3, Type.NoneType, null],
    [Tag.PM_REQ_ACTIVE_PHASES, Type.NoneType, null],
    [Tag.PM_REQ_MODE, Type.NoneType, null],
    [Tag.PM_REQ_ERROR_CODE, Type.NoneType, null],
    [Tag.PM_REQ_TYPE, Type.NoneType, null],
  ];
  return [[Tag.PM_REQ_DATA, Type.Container, inner]];
}

// ── Response parsers ──────────────────────────────────────────────────────────

type PviFields = Pick<
  import("./e3dc-types.js").E3dcData,
  | "pvi_on_grid" | "pvi_state" | "pvi_temperature"
  | "pvi_ac_power" | "pvi_ac_voltage" | "pvi_ac_current"
  | "pvi_ac_energy_all" | "pvi_ac_energy_day" | "pvi_ac_frequency"
  | "pvi_dc_power" | "pvi_dc_voltage" | "pvi_dc_current"
>;

function parsePviData(items: RscpItem[]): PviFields {
  // PVI_DATA is the response container for index 0
  const pviData = items.find((i) => i[0] === Tag.PVI_DATA);
  if (!pviData || pviData[1] !== Type.Container) {
    return nullPviFields();
  }
  const d = pviData[2] as RscpItem[];

  const on_grid = findTag(d, Tag.PVI_ON_GRID);
  const state = findTag(d, Tag.PVI_STATE);
  const temperature = findTag(d, Tag.PVI_TEMPERATURE);

  return {
    pvi_on_grid: on_grid !== undefined ? (on_grid as boolean) : null,
    pvi_state: state !== undefined ? (state as string) : null,
    pvi_temperature: temperature !== undefined ? (temperature as number) : null,
    pvi_ac_power: collectIndexed(d, Tag.PVI_AC_POWER),
    pvi_ac_voltage: collectIndexed(d, Tag.PVI_AC_VOLTAGE),
    pvi_ac_current: collectIndexed(d, Tag.PVI_AC_CURRENT),
    pvi_ac_energy_all: collectIndexed(d, Tag.PVI_AC_ENERGY_ALL),
    pvi_ac_energy_day: collectIndexed(d, Tag.PVI_AC_ENERGY_DAY),
    pvi_ac_frequency: collectIndexed(d, Tag.PVI_AC_FREQUENCY),
    pvi_dc_power: collectIndexed(d, Tag.PVI_DC_POWER),
    pvi_dc_voltage: collectIndexed(d, Tag.PVI_DC_VOLTAGE),
    pvi_dc_current: collectIndexed(d, Tag.PVI_DC_CURRENT),
  };
}

function nullPviFields(): PviFields {
  return {
    pvi_on_grid: null, pvi_state: null, pvi_temperature: null,
    pvi_ac_power: null, pvi_ac_voltage: null, pvi_ac_current: null,
    pvi_ac_energy_all: null, pvi_ac_energy_day: null, pvi_ac_frequency: null,
    pvi_dc_power: null, pvi_dc_voltage: null, pvi_dc_current: null,
  };
}

// Each indexed measurement (AC_POWER, DC_POWER, etc.) is returned as a Container
// with PVI_INDEX (phase/string index) and PVI_VALUE (scalar).
function collectIndexed(items: RscpItem[], containerTag: number): number[] | null {
  const entries: [number, number][] = [];
  for (const item of items) {
    if (item[0] !== containerTag || item[1] !== Type.Container) continue;
    const inner = item[2] as RscpItem[];
    const idx = findTag(inner, Tag.PVI_INDEX);
    const val = findTag(inner, Tag.PVI_VALUE);
    if (idx !== undefined && val !== undefined) {
      entries.push([idx as number, val as number]);
    }
  }
  if (entries.length === 0) return null;
  entries.sort((a, b) => a[0] - b[0]);
  return entries.map((e) => e[1]);
}

type BatFields = Pick<
  import("./e3dc-types.js").E3dcData,
  | "bat_rsoc" | "bat_module_voltage" | "bat_current" | "bat_charge_cycles"
  | "bat_terminal_voltage" | "bat_status_code" | "bat_error_code"
  | "bat_dcb_count" | "bat_training_mode"
>;

function parseBatData(items: RscpItem[]): BatFields {
  const batData = items.find((i) => i[0] === Tag.BAT_DATA);
  if (!batData || batData[1] !== Type.Container) {
    return {
      bat_rsoc: null, bat_module_voltage: null, bat_current: null,
      bat_charge_cycles: null, bat_terminal_voltage: null,
      bat_status_code: null, bat_error_code: null,
      bat_dcb_count: null, bat_training_mode: null,
    };
  }
  const d = batData[2] as RscpItem[];
  const n = (tag: number) => {
    const v = findTag(d, tag);
    return v !== undefined ? (v as number) : null;
  };
  return {
    bat_rsoc: n(Tag.BAT_RSOC),
    bat_module_voltage: n(Tag.BAT_MODULE_VOLTAGE),
    bat_current: n(Tag.BAT_CURRENT),
    bat_charge_cycles: n(Tag.BAT_CHARGE_CYCLES),
    bat_terminal_voltage: n(Tag.BAT_TERMINAL_VOLTAGE),
    bat_status_code: n(Tag.BAT_STATUS_CODE),
    bat_error_code: n(Tag.BAT_ERROR_CODE),
    bat_dcb_count: n(Tag.BAT_DCB_COUNT),
    bat_training_mode: n(Tag.BAT_TRAINING_MODE),
  };
}

type PmFields = Pick<
  import("./e3dc-types.js").E3dcData,
  | "pm_power_l1" | "pm_power_l2" | "pm_power_l3"
  | "pm_voltage_l1" | "pm_voltage_l2" | "pm_voltage_l3"
  | "pm_energy_l1" | "pm_energy_l2" | "pm_energy_l3"
  | "pm_active_phases" | "pm_mode" | "pm_error_code" | "pm_type"
>;

function parsePmData(items: RscpItem[]): PmFields {
  const pmData = items.find((i) => i[0] === Tag.PM_DATA);
  if (!pmData || pmData[1] !== Type.Container) {
    return {
      pm_power_l1: null, pm_power_l2: null, pm_power_l3: null,
      pm_voltage_l1: null, pm_voltage_l2: null, pm_voltage_l3: null,
      pm_energy_l1: null, pm_energy_l2: null, pm_energy_l3: null,
      pm_active_phases: null, pm_mode: null, pm_error_code: null, pm_type: null,
    };
  }
  const d = pmData[2] as RscpItem[];
  const n = (tag: number) => {
    const v = findTag(d, tag);
    return v !== undefined ? (v as number) : null;
  };
  return {
    pm_power_l1: n(Tag.PM_POWER_L1),
    pm_power_l2: n(Tag.PM_POWER_L2),
    pm_power_l3: n(Tag.PM_POWER_L3),
    pm_voltage_l1: n(Tag.PM_VOLTAGE_L1),
    pm_voltage_l2: n(Tag.PM_VOLTAGE_L2),
    pm_voltage_l3: n(Tag.PM_VOLTAGE_L3),
    pm_energy_l1: n(Tag.PM_ENERGY_L1),
    pm_energy_l2: n(Tag.PM_ENERGY_L2),
    pm_energy_l3: n(Tag.PM_ENERGY_L3),
    pm_active_phases: n(Tag.PM_ACTIVE_PHASES),
    pm_mode: n(Tag.PM_MODE),
    pm_error_code: n(Tag.PM_ERROR_CODE),
    pm_type: n(Tag.PM_TYPE),
  };
}

export default E3dcClient;
