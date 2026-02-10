import Database from "./database.js";
import type { HealthMonitor } from "./health.js";
import ModbusClient from "./modbus/modbus.js";
import type { ModbusConfig } from "./modbus/modbus-types.js";


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
