import ModbusClient from "./modbus/modbus";
import { getShellyConsumptionData } from "./REST/shelly";
import { Database } from "./database";
import { mapHeatpumpDataToRecord } from "./mapper";

function loadConfig(): {
  modbusHost: string;
  modbusPort: number;
  modbusTimeout: number;
  shellyIP: string;
  databaseConnectionString: string;
  intervalTime: number;
} {
  const errors: string[] = [];

  const modbusHost = process.env["MODBUS_HOST"] || "192.168.50.112";
  const modbusPortStr = process.env["MODBUS_PORT"] || "502";
  const modbusTimeoutStr = process.env["MODBUS_TIMEOUT"] || "2000";
  const shellyIP = process.env["SHELLY_IP"] || "";
  const databaseConnectionString = process.env["DATBASE_CONNECTION_STRING"] || "";
  const intervalTimeStr = process.env["INTERVAL_TIME"] || "30";

  if (!modbusHost || typeof modbusHost !== "string" || modbusHost.trim() === "") {
    errors.push("MODBUS_HOST must be a non-empty string (default: 192.168.50.112)");
  }

  const modbusPort = parseInt(modbusPortStr, 10);
  if (isNaN(modbusPort) || modbusPort < 1 || modbusPort > 65535) {
    errors.push(
      "MODBUS_PORT must be a valid port number between 1 and 65535 (default: 502)",
    );
  }

  const modbusTimeout = parseInt(modbusTimeoutStr, 10);
  if (isNaN(modbusTimeout) || modbusTimeout < 100 || modbusTimeout > 30000) {
    errors.push(
      "MODBUS_TIMEOUT must be a number between 100 and 30000 milliseconds (default: 2000)",
    );
  }

  if (!shellyIP || typeof shellyIP !== "string" || shellyIP.trim() === "") {
    errors.push("SHELLY_IP must be a non-empty string (default: 192.168.50.134)");
  }

  if (!databaseConnectionString || typeof databaseConnectionString !== "string") {
    errors.push(
      "DATBASE_CONNECTION_STRING environment variable is required. Format: postgresql://username:password@host:port/database",
    );
  } else if (!databaseConnectionString.startsWith("postgresql://")) {
    errors.push(
      "DATBASE_CONNECTION_STRING must start with 'postgresql://' (PostgreSQL connection string)",
    );
  }

  const intervalTime = (parseInt(intervalTimeStr, 10)) * 1000;
  if (isNaN(intervalTime) || intervalTime < 30 || intervalTime > 3600) {
    errors.push(
      "INTERVAL_TIME must be a number between 30 and 3600 seconds",
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  return {
    modbusHost,
    modbusPort,
    modbusTimeout,
    shellyIP,
    databaseConnectionString,
    intervalTime,
  };
}

const config = loadConfig();

const executeAction = async (
  modbus: ModbusClient,
  database: Database,
): Promise<void> => {
  console.log(`Executing scheduled action...${new Date().toISOString()}`);
  const shellyData = await getShellyConsumptionData(config.shellyIP);
  const modbusData = await modbus.fetchHeatpumpData();
  console.log("Fetched Modbus Data:", modbusData);
  console.log("Fetched Shelly Data:", shellyData);

  // Map data and insert into database
  const heatpumpRecord = mapHeatpumpDataToRecord(modbusData, shellyData);
  await database.insertHeatpumpRecord(heatpumpRecord);
  console.log("Data successfully inserted into database");
};

async function main(): Promise<void> {
  console.log(
    `Starting main function with ${config.intervalTime / 1000}-second interval...`,
  );
  console.log(`Modbus: ${config.modbusHost}:${config.modbusPort}`);
  console.log(`Shelly IP: ${config.shellyIP}`);

  const modbus = new ModbusClient({
    host: config.modbusHost,
    port: config.modbusPort,
    unitId: 1,
    timeout: config.modbusTimeout,
  });

  try {
    await modbus.connect();
  } catch (error) {
    console.error("Failed to connect to Modbus TCP server:", error);
    return;
  }
  const database = new Database(config.databaseConnectionString);
  await executeAction(modbus, database);
  const intervalId = setInterval(async () => {
    try {
      await executeAction(modbus, database);
    } catch (error) {
      console.error("Error executing action:", error);
    }
  }, config.intervalTime);

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    clearInterval(intervalId);
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing HTTP server");
    clearInterval(intervalId);
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
});
