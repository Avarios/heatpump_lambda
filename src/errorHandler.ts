import Database from "./database.js";
import type { HealthMonitor } from "./health.js";
import ModbusClient from "./modbus/modbus.js";
import type { ModbusConfig } from "./modbus/modbus-types.js";
import E3dcClient from "./e3dc/e3dc-client.js";
import type { E3dcConfiguration } from "./configuration.js";


//TODO: Externalise the reconnect timer and counter
export const handleModbusDisconnect = async (
  healthMonitor: HealthMonitor,
  modbusConfig: ModbusConfig,
): Promise<Result<ModbusClient, ErrorHandlerResult>> => {
  let retries = 10;
  while (retries >= 0) {
    console.log("MODBUS: connection lost");
    healthMonitor.updateModbusStatus(false);
    console.log(
      `MODBUS: reconnecting in try ${retries} but waiting 60 seks to do so...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    try {
      const modbusClient = new ModbusClient(modbusConfig);
      await modbusClient.connect();
      console.log("MODBUS: Reconnected to Modbus");
      healthMonitor.updateModbusStatus(true);
      retries = -1;
      return ModbusReconnectedResult(modbusClient);
    } catch (error) {
      if (retries === 0) {
        console.error("MODBUS: reconnect failed, panic");
        retries = -1;
      }
      retries--;
      healthMonitor.updateModbusStatus(false);
    }
  }
  return FailedResult("MODBUS: Modbus reconnect failed after 10 tries");
};

export const handleDatabaseDisconnect = async (
  healthMonitor: HealthMonitor,
  connectionString:string
): Promise<Result<Database, ErrorHandlerResult>> => {
  let retries = 10;
  while (retries >= 0) {
   let dbClient = new Database(connectionString);
    console.log("DATABASE: connection lost");
    healthMonitor.updateDatabaseStatus(false);
    console.log(
      `DATABASE: Reconnecting in try ${retries} but waiting 60 seks to do so...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    try {
      await dbClient.connect();
      console.log("DATABASE: Reconnected");
      healthMonitor.updateDatabaseStatus(true);
      return DataBaseReconnectedResult(dbClient);
    } catch (error) {
      if (retries === 0) {
        console.error("DATABASE: reconnect failed, panic");
        process.exit(-1);
      }
      retries--;
      healthMonitor.updateDatabaseStatus(false);
    }
  }
  return FailedResult("DATABASE: Database reconnect failed after 10 tries");
};

export const handleE3dcDisconnect = async (
  healthMonitor: HealthMonitor,
  e3dcConfig: E3dcConfiguration,
): Promise<Result<E3dcClient, ErrorHandlerResult>> => {
  let retries = 10;
  while (retries >= 0) {
    console.log("E3DC: connection lost");
    healthMonitor.updateE3dcStatus(false);
    console.log(
      `E3DC: reconnecting in try ${retries} but waiting 60 seks to do so...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    try {
      const e3dcClient = new E3dcClient(e3dcConfig);
      await e3dcClient.connect();
      console.log("E3DC: Reconnected");
      healthMonitor.updateE3dcStatus(true);
      retries = -1;
      return [null, e3dcClient];
    } catch (error) {
      if (retries === 0) {
        console.error("E3DC: reconnect failed, panic");
        retries = -1;
      }
      retries--;
      healthMonitor.updateE3dcStatus(false);
    }
  }
  return FailedResult("E3DC: reconnect failed after 10 tries");
};

export type ErrorHandlerResult = {  reason: string; };
export type Result<S, E extends ErrorHandlerResult> = [E, null] | [null, S];

export const FailedResult = (reason: string): Result<
  never,
  ErrorHandlerResult
> => [{ reason }, null];

export const ModbusReconnectedResult = (
  modbus: ModbusClient,
): Result<ModbusClient, ErrorHandlerResult> => [
  null,
  modbus,
];

export const DataBaseReconnectedResult = (
  database: Database,
): Result<Database, ErrorHandlerResult> => [
  null,
  database,
];
