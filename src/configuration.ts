export type Configuration = {
  modbusHost: string;
  modbusPort: number;
  modbusTimeout: number;
  shellyIP: string;
  databaseConnectionString: string;
  intervalTime: number;
  verboseLogging: boolean;
};

export const loadConfiguration = (): Configuration => {
  const errors: string[] = [];

  const modbusHost = process.env["MODBUS_HOST"];
  const modbusPortStr = process.env["MODBUS_PORT"];
  const modbusTimeoutStr = process.env["MODBUS_TIMEOUT"];
  const shellyIP = process.env["SHELLY_IP"];
  const databaseConnectionString = process.env["DATBASE_CONNECTION_STRING"];
  const intervalTimeStr = process.env["INTERVAL_TIME"];
  const verboseLoggingStr = process.env["VERBOSE_LOGGING"] || "false";

  let intervalTime: number = 0;
  let modbusPort: number = 0;
  let modbusTimeout: number = 0;
  let modHost: string = "";
  let shellyIp: string = "";
  let dbConnectionString: string = "";
  let verboseLogging: boolean = verboseLoggingStr === "true";

  if (
    !modbusHost ||
    typeof modbusHost !== "string" ||
    modbusHost.trim() === ""
  ) {
    errors.push(
      "MODBUS_HOST must be a non-empty string (default: 192.168.50.112)",
    );
  } else {
    modHost = modbusHost;
  }

  if (!modbusPortStr || typeof modbusPortStr !== "string") {
    errors.push(
      "MODBUS_PORT must be a valid port number between 1 and 65535 (default: 502)",
    );
  } else {
    modbusPort = parseInt(modbusPortStr, 10);
    if (isNaN(modbusPort) || modbusPort < 1 || modbusPort > 65535) {
      errors.push(
        "MODBUS_PORT must be a valid port number between 1 and 65535 (default: 502)",
      );
    }
  }

  if (!modbusTimeoutStr || typeof modbusTimeoutStr !== "string") {
    errors.push(
      "MODBUS_TIMEOUT must be a number between 100 and 30000 milliseconds (default: 2000)",
    );
  } else {
    modbusTimeout = parseInt(modbusTimeoutStr, 10);
    if (isNaN(modbusTimeout) || modbusTimeout < 100 || modbusTimeout > 30000) {
      errors.push(
        "MODBUS_TIMEOUT must be a number between 100 and 30000 milliseconds (default: 2000)",
      );
    }
  }

  if (!shellyIP || typeof shellyIP !== "string" || shellyIP.trim() === "") {
    errors.push(
      "SHELLY_IP must be a non-empty string (default: 192.168.50.134)",
    );
  } else {
    shellyIp = shellyIP;
  }

  if (
    !databaseConnectionString ||
    typeof databaseConnectionString !== "string"
  ) {
    errors.push(
      "DATBASE_CONNECTION_STRING environment variable is required. Format: postgresql://username:password@host:port/database",
    );
  } else if (!databaseConnectionString.startsWith("postgresql://")) {
    errors.push(
      "DATBASE_CONNECTION_STRING must start with 'postgresql://' (PostgreSQL connection string)",
    );
  } else {
    dbConnectionString = databaseConnectionString;
  }

  if (!intervalTimeStr || typeof intervalTimeStr !== "string") {
    errors.push(
      "INTERVAL_TIME must be a number between 30 and 3600 seconds (default: 300)",
    );
  } else {
    intervalTime = parseInt(intervalTimeStr);
    if (isNaN(intervalTime) || intervalTime < 30 || intervalTime > 3600) {
      errors.push("INTERVAL_TIME must be a number between 30 and 3600 seconds");
    }
    intervalTime = intervalTime * 1000;
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  return {
    modbusHost: modHost,
    modbusPort,
    modbusTimeout,
    shellyIP: shellyIp,
    databaseConnectionString: dbConnectionString,
    intervalTime,
    verboseLogging,
  };
};
