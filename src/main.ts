import ModbusClient from "./modbus/modbus.js";
// import E3dcClient from "./e3dc/e3dc-client.js";
import { Database } from "./database.js";
import { HealthMonitor } from "./health.js";
import { executeAction } from "./actionExecuter.js";
import { loadConfiguration } from "./configuration.js";
import { initiateLogger } from "./logger.js";
import {
  handleModbusDisconnect,
  handleDatabaseDisconnect,
  // handleE3dcDisconnect,
} from "./errorHandler.js";
import type { Configuration } from "./configuration.js";
import type { ModbusConfig } from "./modbus/modbus-types.js";

let modbus: ModbusClient;
// let e3dc: E3dcClient | null = null;
let database: Database;
let healthMonitor: HealthMonitor;
let config: Configuration;
let modbusConfig: ModbusConfig;
let intervalId: NodeJS.Timeout | null = null;
let isReconnecting = false;
//let isE3dcReconnecting = false;

/* const handleE3dcReconnect = async () => {
  if (isE3dcReconnecting || !config.e3dc) return;
  isE3dcReconnecting = true;
  const [err, newE3dc] = await handleE3dcDisconnect(healthMonitor, config.e3dc);
  isE3dcReconnecting = false;
  if (!err && newE3dc) {
    e3dc = newE3dc;
    e3dc.onDisconnectOrError(handleE3dcReconnect);
  }
  // E3DC failure is non-fatal: the interval keeps running with e3dc data absent.
}; */

const handleModbusReconnect = async () => {
  if (isReconnecting) {
    console.log("MODBUS: reconnect already in progress, ignoring duplicate trigger");
    return;
  }
  isReconnecting = true;

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  const [modbusErr, newModbus] = await handleModbusDisconnect(healthMonitor, modbusConfig);
  isReconnecting = false;
  if (!modbusErr && newModbus) {
    modbus = newModbus;
    modbus.onDisconnectOrError(handleModbusReconnect);
    intervalId = startTimer();
  }
  if (modbusErr) {
    process.exit(-1);
  }
};

const startTimer = (): NodeJS.Timeout => {
  const id = setInterval(async () => {
    try {
      if (modbus.isConnected) {
        const [actionErr] = await executeAction(
          modbus,
          database,
          healthMonitor,
          config,
           // e3dc,
        );
        if (actionErr) {
          console.error("Action execution failed:", actionErr.reason);

          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          
          switch (actionErr.affectedModule) {
            case "modbus":
              await handleModbusReconnect();
              break;
            case "database":
              const [dbError,dbClient] = await handleDatabaseDisconnect(healthMonitor,config.databaseConnectionString);
              if (dbClient && !dbError) {
                database = new Database(config.databaseConnectionString);
                intervalId = startTimer();
              }
              break;
            case "mapper":
              healthMonitor.updateLastFetch(false);
              intervalId = startTimer();
              break;
          }
        }
      } else {
        console.error("Modbus is disconnected, retry in progress or failed");
      }
    } catch (error) {
      console.error("Error executing action:", error);
    }
  }, config.intervalTime);
  return id;
};

async function main(): Promise<void> {
  config = loadConfiguration();
  initiateLogger(config.verboseLogging);
  console.info(
    `Starting main function with ${config.intervalTime / 1000}-second interval...`,
  );
  console.info(`Modbus: ${config.modbusHost}:${config.modbusPort}`);
  console.info(`Shelly IP: ${config.shellyIP}`);
  //console.info(`E3DC: ${config.e3dc ? `${config.e3dc.host}:${config.e3dc.port}` : "disabled"}`);

  healthMonitor = new HealthMonitor(3000);
  healthMonitor.start();
  
  modbusConfig = {
    host: config.modbusHost,
    port: config.modbusPort,
    timeout: config.modbusTimeout,
  };
  modbus = new ModbusClient(modbusConfig);

  modbus.onDisconnectOrError(handleModbusReconnect);

  try {
    await modbus.connect();
    healthMonitor.updateModbusStatus(true);
  } catch (error) {
    console.error("Failed to connect to Modbus TCP server:", error);
    healthMonitor.updateModbusStatus(false);
    return;
  }
  
  database = new Database(config.databaseConnectionString);
  healthMonitor.updateDatabaseStatus(true);

   /* if (config.e3dc) {
    e3dc = new E3dcClient(config.e3dc);
    e3dc.onDisconnectOrError(handleE3dcReconnect);
    try {
      await e3dc.connect();
      healthMonitor.updateE3dcStatus(true);
    } catch (error) {
      console.error("Failed to connect to E3DC, continuing without it:", error);
      healthMonitor.updateE3dcStatus(false);
      e3dc = null;
    } 
  } */

  intervalId = startTimer();

  const shutdown = (signal: string) => {
    console.info(`${signal} signal received: closing application`);
    healthMonitor.stop();
    modbus.disconnect();
    // e3dc?.disconnect();
    if (intervalId) clearInterval(intervalId);
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
});
