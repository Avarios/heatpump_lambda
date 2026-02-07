import type Database from "./database.js";
import type { HealthMonitor } from "./health.js";
import type ModbusClient from "./modbus/modbus.js";
import { ErrActionResult, OkActionResult, type ActionResult, type ActioResultError } from "./result.js";
import { getShellyConsumptionData } from "./REST/shelly.js";
import { mapData } from "./mapper.js";
import type { Configuration } from "./configuration.js";

export const executeAction = async (
  modbus: ModbusClient,
  database: Database,
  healthMonitor: HealthMonitor,
  config:Configuration
): Promise<ActionResult<undefined, ActioResultError>> => {
  console.log(`Executing scheduled action...${new Date().toISOString()}`);
  console.log("Fetching data from Modbus and Shelly...");
  //TODO: external data curently only shelly: make it exchanngeable
  const [shellyErr, shellyData] = await getShellyConsumptionData(
    config.shellyIP,
  );
  //If Shelly fails, no worries, we can still insert the heatpump data. We just log the error and update the health status.
  if (shellyErr) {
    console.warn("Failed to fetch Shelly data:", shellyErr.reason);
    healthMonitor.updateShellyStatus(false);
  } else {
    healthMonitor.updateShellyStatus(true);
  }
  const [modbusErr, modbusData] = await modbus.fetchHeatpumpData();
  if (modbusErr) {
    console.error("Failed to fetch Modbus data:", modbusErr.reason);
    healthMonitor.updateModbusStatus(false);
    return [{ reason: modbusErr.reason, affectedModule: "modbus" }, null];
  } else {
    healthMonitor.updateModbusStatus(true);
  }
  console.log("Data fetched successfully");
  if (config.verboseLogging) {
    console.log("Fetched Modbus Data:", modbusData);
    console.log("Fetched Shelly Data:", shellyData);
  }
  const [mappErr, mapResult] = mapData(modbusData, shellyData);
  if (mappErr) {
    console.error("Failed to map data to HeatpumpRecord:", mappErr.reason);
    return ErrActionResult({
      reason: mappErr.reason,
      affectedModule: "mapper",
    });
  }
  console.log("Data mapped successfully");
  if (config.verboseLogging) {
    console.log("Mapped Data:", mapResult);
  }

  const [dbErr, dbResult] =
    await await database.insertHeatpumpRecord(mapResult);
  if (dbErr) {
    console.error("Failed to insert data into database:", dbErr.reason);
    healthMonitor.updateDatabaseStatus(false);
    return ErrActionResult({
      reason: dbErr.reason,
      affectedModule: "database",
    });
  }
  if (dbResult === 0) {
    console.warn(
      "No rows were inserted into the database. This might indicate an issue with the data or the database connection.",
    );
    return ErrActionResult({
      reason:
        "No rows were inserted into the database. This might indicate an issue with the data or the database connection.",
      affectedModule: "database",
    });
  }

  console.log("Data successfully inserted into database");
  healthMonitor.updateLastFetch(true);
  return OkActionResult(undefined);
};