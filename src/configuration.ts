export type E3dcConfiguration = {
  host: string;
  port: number;
  username: string;
  password: string;
  rscpKey: string;
};

export type Configuration = {
  modbusHost: string;
  modbusPort: number;
  modbusTimeout: number;
  shellyIP: string;
  databaseConnectionString: string;
  intervalTime: number;
  verboseLogging: boolean;
  e3dc: E3dcConfiguration | null;
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

  const e3dcHost = process.env["E3DC_HOST"];
  const e3dcPortStr = process.env["E3DC_PORT"];
  const e3dcUsername = process.env["E3DC_USERNAME"];
  const e3dcPassword = process.env["E3DC_PASSWORD"];
  const e3dcRscpKey = process.env["E3DC_RSCP_KEY"];

  let intervalTime: number = 0;
  let modbusPort: number = 0;
  let modbusTimeout: number = 0;
  let modHost: string = "";
  let shellyIp: string = "";
  let dbConnectionString: string = "";
  let verboseLogging: boolean = verboseLoggingStr === "true";
  let e3dcConfig: E3dcConfiguration | null = null;

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

  // E3DC is optional: enabled only when E3DC_HOST is set, but then all vars are required.
  if (e3dcHost) {
    const e3dcErrors: string[] = [];
    let e3dcPort = 5033;

    if (!e3dcUsername || e3dcUsername.trim() === "") {
      e3dcErrors.push("E3DC_USERNAME is required when E3DC_HOST is set");
    }
    if (!e3dcPassword || e3dcPassword.trim() === "") {
      e3dcErrors.push("E3DC_PASSWORD is required when E3DC_HOST is set");
    }
    if (!e3dcRscpKey || e3dcRscpKey.trim() === "") {
      e3dcErrors.push("E3DC_RSCP_KEY is required when E3DC_HOST is set");
    }
    if (e3dcPortStr !== undefined) {
      const parsed = parseInt(e3dcPortStr, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
        e3dcErrors.push("E3DC_PORT must be a valid port number between 1 and 65535 (default: 5033)");
      } else {
        e3dcPort = parsed;
      }
    }

    if (e3dcErrors.length > 0) {
      errors.push(...e3dcErrors);
    } else {
      e3dcConfig = {
        host: e3dcHost,
        port: e3dcPort,
        username: e3dcUsername as string,
        password: e3dcPassword as string,
        rscpKey: e3dcRscpKey as string,
      };
    }
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
    e3dc: e3dcConfig,
  };
};
