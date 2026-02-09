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

async function main(): Promise<void> {
  const config = loadConfiguration();
  initiateLogger();
  console.log(
    `Starting main function with ${config.intervalTime / 1000}-second interval...`,
  );
  console.log(`Modbus: ${config.modbusHost}:${config.modbusPort}`);
  console.log(`Shelly IP: ${config.shellyIP}`);

  const healthMonitor = new HealthMonitor(3000);
  healthMonitor.start();

  const modbus = new ModbusClient({
    host: config.modbusHost,
    port: config.modbusPort,
    unitId: 1,
    timeout: config.modbusTimeout,
  });

  modbus.onDisconnectOrError(
    async () => await handleModbusDisconnect(healthMonitor, modbus),
  );

  try {
    await modbus.connect();
    healthMonitor.updateModbusStatus(true);
  } catch (error) {
    console.error("Failed to connect to Modbus TCP server:", error);
    healthMonitor.updateModbusStatus(false);
    return;
  }
  let database = new Database(config.databaseConnectionString);
  database.handleError(
    async () => await handleDatabaseDisconnect(healthMonitor, database),
  );
  healthMonitor.updateDatabaseStatus(true);

  const intervalId = setInterval(async () => {
    try {
      if (modbus.isConnected) {
        //Execute only if connected, else retry progress in place
        const [actionErr] = await executeAction(
          modbus,
          database,
          healthMonitor,
          config,
        );
        if (actionErr) {
          console.error("Action execution failed:", actionErr.reason);
          switch (actionErr.affectedModule) {
            case "modbus":
              await handleModbusDisconnect(healthMonitor, modbus);
              break;
            case "database":
              await handleDatabaseDisconnect(healthMonitor, database);
              break;
            case "mapper":
              healthMonitor.updateLastFetch(false);
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

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing application");
    healthMonitor.stop();
    modbus.disconnect();
    clearInterval(intervalId);
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing application");
    healthMonitor.stop();
    modbus.disconnect();
    clearInterval(intervalId);
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
});
