import ModbusClient from "./modbus/modbus.js";
import { Database } from "./database.js";
import { HealthMonitor } from "./health.js";
import { executeAction } from "./actionExecuter.js";
import { loadConfiguration } from "./configuration.js";
import { initiateLogger } from "./logger.js";
import {
  handleModbusDisconnect,
  handleDatabaseDisconnect,
} from "./errorHandler.js";
import type { Configuration } from "./configuration.js";
import type { ModbusConfig } from "./modbus/modbus-types.js";

let modbus: ModbusClient;
let database: Database;
let healthMonitor: HealthMonitor;
let config: Configuration;
let modbusConfig: ModbusConfig;
let intervalId: NodeJS.Timeout | null = null;

const handleModbusReconnect = async () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  const [modbusErr, newModbus] = await handleModbusDisconnect(healthMonitor, modbusConfig);
  if (!modbusErr && newModbus) {
    modbus = newModbus;
    modbus.onDisconnectOrError(handleModbusReconnect);
    intervalId = startTimer();
  } 
  if(modbusErr) {
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
  initiateLogger();
  console.log(
    `Starting main function with ${config.intervalTime / 1000}-second interval...`,
  );
  console.log(`Modbus: ${config.modbusHost}:${config.modbusPort}`);
  console.log(`Shelly IP: ${config.shellyIP}`);

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

  intervalId = startTimer();

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing application");
    healthMonitor.stop();
    modbus.disconnect();
    if (intervalId) clearInterval(intervalId);
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing application");
    healthMonitor.stop();
    modbus.disconnect();
    if (intervalId) clearInterval(intervalId);
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
});
