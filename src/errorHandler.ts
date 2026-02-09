import type Database from "./database";
import type { HealthMonitor } from "./health";
import type ModbusClient from "./modbus/modbus";

let isReconnecting = false;
//TODO: Externalise the reconnect timer and counter
export const handleModbusDisconnect = async (
  healthMonitor: HealthMonitor,
  modbus: ModbusClient,
): Promise<boolean> => {
  if (isReconnecting) {
    console.log("MODBUS: Reconnection to MODBUS already in progress, skipping...");
    return false;
  }
  isReconnecting = true;
  let retries = 10;
  while (retries >= 0) {
    console.log("MODBUS: connection lost");
    healthMonitor.updateModbusStatus(false);
    console.log(
      `MODBUS: reconnecting in try ${retries} but waiting 60 seks to do so...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    try {
      await modbus.connect();
      console.log("MODBUS: Reconnected to Modbus");
      healthMonitor.updateModbusStatus(true);
      isReconnecting = false;
      return true;
    } catch (error) {
      if (retries === 0) {
        console.error("MODBUS: reconnect failed, panic");
        process.exit(-1);
      }
      retries--;
      healthMonitor.updateModbusStatus(false);
    }
  }
  isReconnecting = false;
  return false;
};

export const handleDatabaseDisconnect = async (
  healthMonitor: HealthMonitor,
  database: Database,
): Promise<boolean> => {
  if (isReconnecting) {
    console.log("DATABASE: Reconnection to DB already in progress, skipping...");
    return false;
  }
  isReconnecting = true;
  let retries = 10;
  while (retries >= 0) {
    console.log("DATABASE: connection lost");
    healthMonitor.updateModbusStatus(false);
    console.log(
      `DATABASE: Reconnecting in try ${retries} but waiting 60 seks to do so...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    try {
      await database.connect();
      console.log("DATABASE: Reconnected");
      healthMonitor.updateModbusStatus(true);
      isReconnecting = false;
      return true;
    } catch (error) {
      if (retries === 0) {
        console.error("DATABASE: reconnect failed, panic");
        process.exit(-1);
      }
      retries--;
      healthMonitor.updateModbusStatus(false);
    }
  }
  isReconnecting = false;
  return false;
};
