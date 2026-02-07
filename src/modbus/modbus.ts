import ModbusRTU from "modbus-serial";
import { type HeatpumpData, type ModbusConfig } from "./modbus-types.js";
import {
  ambient_state,
  boiler_state,
  buffer_state,
  convertToTemperature,
  convertToTemperatureHigh,
  heating_circuit_state,
  heatpump_errorstates,
  heatpump_operating_state,
  heatpump_request_state,
  heatpump_states,
  int32ToNumber,
} from "./lambda-states.js";
import { ErrResult, OkResult, type Result } from "../result.js";

export class ModbusClient {
  private client: ModbusRTU;
  private config: ModbusConfig;
  private connected: boolean = false;

  constructor(config: ModbusConfig) {
    this.client = new ModbusRTU();
    this.config = {
      ...{
        unitId: 1,
        timeout: 5000,
      },
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await this.client.connectTCP(this.config.host, {
      port: this.config.port,
    });

    this.client.setID(this.config.unitId);
    this.connected = true;
    console.log(
      `Connected to Modbus TCP server at ${this.config.host}:${this.config.port}`,
    );
    this.client.on("close",() => {
      console.log("Disconnected from Modbus TCP server");
      this.connected = false;
    });
    this.client.on("error",() => {
      console.log("Error state modbus");
      this.connected = false;
    });
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.client.close();
    this.connected = false;
    console.log("Disconnected from Modbus TCP server");
  }

  onDisconnectOrError(callback: () => void) {
    this.client.on("close", callback);
    this.client.on("error", callback);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async readRegister(
    adress: number,
    length: number,
  ): Promise<Array<number>> {
    const result = await this.client.readHoldingRegisters(adress, length);
    return result.data.map((x) => x);
  }

  async fetchHeatpumpData(): Promise<Result<HeatpumpData, { reason: string }>> {
    if (!this.connected) {
      this.connect();
    }
    if (!this.connected) {
      throw new Error("Modbus client is not connected");
    }

    try {
      console.log("Starting individual field reads...");
      const hpData = await this.getHeatpumpData();
      const boilerData = await this.getBoilerData();
      const bufferData = await this.getBufferData();
      const heatingCircuitData = await this.getHeatingCurcuitData();
      const ambientData = await this.getAmbientData();

      let data: Partial<HeatpumpData> = {
        event_timestamp: new Date(),
        ...hpData,
        ...boilerData,
        ...bufferData,
        ...heatingCircuitData,
        ...ambientData,
      };
      return OkResult(data as HeatpumpData);
    } catch (error) {
      console.error("Error fetching heatpump data:", error);
      return ErrResult({ reason: "Failed to fetch heatpump data" });
    }
  }

  private async getAmbientData(): Promise<Partial<HeatpumpData>> {
    const partialData: Partial<HeatpumpData> = {};
    const modbusResult = await this.readRegister(1, 4);
    partialData.Ambient_State =
      ambient_state[modbusResult[0] as number] || "UNKNOWN";
    partialData.Ambient_TemperatureCalculated = convertToTemperature(
      modbusResult[3] as number,
    );
    return partialData;
  }

  private async getHeatpumpData(): Promise<Partial<HeatpumpData>> {
    const partialData: Partial<HeatpumpData> = {};
    const modbusResult = await this.readRegister(1000, 24);
    partialData.Heatpump_ErrorState =
      heatpump_errorstates[modbusResult[0] as number] || "UNKNOWN";
    partialData.Heatpump_ErrorNumber = modbusResult[1] as number;
    partialData.Heatpump_State =
      heatpump_states[modbusResult[2] as number] || "UNKNOWN";
    partialData.Heatpump_OperatingState =
      heatpump_operating_state[modbusResult[3] as number] || "UNKNOWN";
    partialData.Heatpump_FlowlineTemp = convertToTemperatureHigh(
      modbusResult[4] as number,
    );
    partialData.Heatpump_ReturnLineTemp = convertToTemperatureHigh(
      modbusResult[5] as number,
    );

    partialData.Heatpump_VolumeSink = modbusResult[6] as number;
    partialData.Heatpump_EnergySourceInletTemp = convertToTemperatureHigh(
      modbusResult[7] as number,
    );
    partialData.Heatpump_VolumeSourceFlow = convertToTemperatureHigh(
      modbusResult[9] as number,
    );
    partialData.Heatpump_CompressorRating = (modbusResult[10] as number) * 0.01;
    partialData.Heatpump_ActualHeatingCapacity = convertToTemperature(
      modbusResult[11] as number,
    );
    partialData.Heatpump_InverterActualPower = modbusResult[12] as number;
    partialData.Heatpump_CurrentCop = (modbusResult[13] as number) * 0.01;
    partialData.Heatpump_RequestType =
      heatpump_request_state[modbusResult[15] as number] || "UNKNOWN";
    partialData.Heatpump_RequestFlowTemp = convertToTemperature(
      modbusResult[16] as number,
    );
    partialData.Heatpump_RequestReturnTemp = convertToTemperature(
      modbusResult[17] as number,
    );
    partialData.Heatpump_RequestTempDiff = convertToTemperature(
      modbusResult[18] as number,
    );

    partialData.Heatpump_ElectricEnergy =
      int32ToNumber(modbusResult[21] as number, modbusResult[20] as number) /
      1000;
    partialData.Heatpump_HeatEnergy =
      int32ToNumber(modbusResult[23] as number, modbusResult[22] as number) /
      1000;
    return partialData;
  }

  private async getBoilerData(): Promise<Partial<HeatpumpData>> {
    const partialData: Partial<HeatpumpData> = {};
    const modbusResult = await this.readRegister(2001, 3);
    partialData.Boiler_State =
      boiler_state[modbusResult[0] as number] || "UNKNOWN";
    partialData.Boiler_HighTemp = convertToTemperature(
      modbusResult[1] as number,
    );
    partialData.Boiler_LowTemp = convertToTemperature(
      modbusResult[2] as number,
    );
    return partialData;
  }

  private async getBufferData(): Promise<Partial<HeatpumpData>> {
    const partialData: Partial<HeatpumpData> = {};
    const modbusResult = await this.readRegister(3001, 3);
    partialData.Buffer_State =
      buffer_state[modbusResult[0] as number] || "UNKNOWN";
    partialData.Buffer_HighTemp = convertToTemperature(
      modbusResult[1] as number,
    );
    partialData.Buffer_LowTemp = convertToTemperature(
      modbusResult[2] as number,
    );
    return partialData;
  }

  private async getHeatingCurcuitData(): Promise<Partial<HeatpumpData>> {
    const partialData: Partial<HeatpumpData> = {};
    const modbusResult_circ1 = await this.readRegister(5001, 2);
    const modbusResult_circ2 = await this.readRegister(5101, 2);
    partialData.HeatingCircuit_1_State =
      heating_circuit_state[modbusResult_circ1[0] as number] || "UNKNOWN";
    partialData.HeatingCircuit_1_FlowTemp = convertToTemperature(
      modbusResult_circ1[1] as number,
    );
    partialData.HeatingCircuit_2_State =
      heating_circuit_state[modbusResult_circ2[0] as number] || "UNKNOWN";
    partialData.HeatingCircuit_2_FlowTemp = convertToTemperature(
      modbusResult_circ2[1] as number,
    );
    return partialData;
  }
}

export default ModbusClient;
