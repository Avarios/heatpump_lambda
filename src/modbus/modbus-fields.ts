import type { ModBusField } from "./modbus-types.js";

const convertToTemperatureHigh = (rawValue: number): number => {
  return int16(rawValue) * 0.01;
};

const convertToTemperature = (rawValue: number): number => {
  return int16(rawValue) * 0.1;
};

function int16(raw: number): number {
  return raw > 0x7FFF ? raw - 0x10000 : raw;
}

export const ambient_state: ModBusField<string> = {
  adress: 1,
  convert: function (this: ModBusField<string>) {
    const states: { [key: number]: string } = {
      0: "OFF",
      1: "AUTOMATIK",
      2: "MANUAL",
      3: "ERROR",
    };
    return states[this.rawValue as number] || "UNKNOWN";
  },
};

export const ambient_calculated: ModBusField<number> = {
  adress: 2, //Using acutal temperature register
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const heatpump_error_state: ModBusField<string> = {
  adress: 1000,
  convert: function (this: ModBusField<string>) {
    const states: { [key: number]: string } = {
      0: "NONE",
      1: "MESSAGE",
      2: "WARNING",
      3: "ALARM",
      4: "FAULT",
    };
    return states[this.rawValue as number] || "UNKNOWN";
  },
};

export const heatpump_error_number: ModBusField<number> = {
  adress: 1001,
  convert: function (this: ModBusField<number>) {
    return this.rawValue as number;
  },
};

export const heatpump_state: ModBusField<string> = {
  adress: 1002,
  convert: function (this: ModBusField<string>) {
    const states: { [key: number]: string } = {
      0: "INIT",
      1: "REFERENCE",
      2: "RESTART-BLOCK",
      3: "READY",
      4: "START PUMPS",
      5: "START COMPRESSOR",
      6: "PRE-REGULATION",
      7: "REGULATION",
      9: "COOLING",
      10: "DEFROSTING",
      20: "STOPPING",
      30: "FAULT-LOCK",
      31: "ALARM-BLOCK",
      40: "ERROR-RESET",
    };
    return states[this.rawValue as number] || "UNKNOWN";
  },
};

export const heatpump_operating_state: ModBusField<string> = {
  adress: 1003,
  convert: function (this: ModBusField<string>) {
    const states: { [key: number]: string } = {
      0: "STBY",
      1: "CH",
      2: "DHW",
      3: "CC",
      4: "CIRCULATE",
      5: "DEFROST",
      6: "OFF",
      7: "FROST",
      8: "STBY-FROST",
      10: "SUMMER",
      11: "HOLIDAY",
      12: "ERROR",
      13: "WARNING",
      14: "INFO-MESSAGE",
      15: "TIME-BLOCK",
      16: "RELEASE-BLOCK",
      17: "MINTEMP-BLOCK",
      18: "FIRMWARE-DOWNLOAD",
    };
    return states[this.rawValue as number] || "UNKNOWN";
  },
};

export const heatpump_t_flow: ModBusField<number> = {
  adress: 1004,
  convert: function (this: ModBusField<number>) {
    return convertToTemperatureHigh(this.rawValue as number);
  },
};

export const heatpump_t_return: ModBusField<number> = {
  adress: 1005,
  convert: function (this: ModBusField<number>) {
    return convertToTemperatureHigh(this.rawValue as number);
  },
};

export const heatpump_vol_sink: ModBusField<number> = {
  adress: 1006,
  convert: function (this: ModBusField<number>) {
    return (this.rawValue as number);
  },
};

export const heatpump_t_eq_in: ModBusField<number> = {
  adress: 1007,
  convert: function (this: ModBusField<number>) {
    return convertToTemperatureHigh(int16(this.rawValue as number));
  },
};

export const heatpump_t_eq_out: ModBusField<number> = {
  adress: 1008,
  convert: function (this: ModBusField<number>) {
    return convertToTemperatureHigh(this.rawValue as number);
  },
};

export const heatpump_vol_source: ModBusField<number> = {
  adress: 1009,
  convert: function (this: ModBusField<number>) {
    return convertToTemperatureHigh(this.rawValue as number);
  },
};

export const heatpump_compressor_rating: ModBusField<number> = {
  adress: 1010,
  convert: function (this: ModBusField<number>) {
    return (this.rawValue as number) * 0.01;
  },
};

export const heatpump_qp_heating: ModBusField<number> = {
  adress: 1011,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const heatpump_fi_power: ModBusField<number> = {
  adress: 1012,
  convert: function (this: ModBusField<number>) {
    return this.rawValue as number;
  },
};

export const heatpump_cop: ModBusField<number> = {
  adress: 1013,
  convert: function (this: ModBusField<number>) {
    return (this.rawValue as number) * 0.01;
  },
};

export const heatpump_request_type: ModBusField<string> = {
  adress: 1015,
  convert: function (this: ModBusField<string>) {
    const types: { [key: number]: string } = {
      0: "NO REQUEST",
      1: "FLOW PUMP CIRCULATION",
      2: "CENTRAL HEATING",
      3: "CENTRAL COOLING",
      4: "DOMESTIC HOT WATER",
    };
    return types[this.rawValue as number] || "UNKNOWN";
  },
};

export const heatpump_request_flow_temp: ModBusField<number> = {
  adress: 1016,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const heatpump_request_return_temp: ModBusField<number> = {
  adress: 1017,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const heatpump_request_temp_diff: ModBusField<number> = {
  adress: 1018,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const heatpump_electric_energy: ModBusField<number> = {
  adress: 1020,
  length: 2,
  convert: function (this: ModBusField<number>) {
    return (this.rawValue as number)  / 1000;
  },
};

export const heatpump_heat_energy: ModBusField<number> = {
  adress: 1022,
  length: 2,
  convert: function (this: ModBusField<number>) {
    return (this.rawValue as number) / 1000;
  },
};

export const boiler_state: ModBusField<string> = {
  adress: 2001,
  convert: function (this: ModBusField<string>) {
    const states: { [key: number]: string } = {
      0: "STBY",
      1: "DHW",
      2: "LEGIO",
      3: "SUMMER",
      4: "FROST",
      5: "HOLIDAY",
      6: "PRIO-STOP",
      7: "ERROR",
      8: "OFF",
      9: "PROMPT-DHW",
      10: "TRAILING-STOP",
      11: "TEMP-LOCK",
      12: "STBY-FROST",
    };
    return states[this.rawValue as number] || "UNKNOWN";
  },
};

export const boiler_high_temp: ModBusField<number> = {
  adress: 2002,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const boiler_low_temp: ModBusField<number> = {
  adress: 2003,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const buffer_state: ModBusField<string> = {
  adress: 3001,
  convert: function (this: ModBusField<string>) {
    const states: { [key: number]: string } = {
      0: "STBY",
      1: "HEATING",
      2: "COOLING",
      3: "SUMMER",
      4: "FROST",
      5: "HOLIDAY",
      6: "PRIO-STOP",
      7: "ERROR",
      8: "OFF",
      9: "STBY-FROST",
    };
    return states[this.rawValue as number] || "UNKNOWN";
  },
};

export const buffer_high_temp: ModBusField<number> = {
  adress: 3002,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const buffer_low_temp: ModBusField<number> = {
  adress: 3003,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const heating_circuit_1_state: ModBusField<string> = {
  adress: 5001,
  convert: function (this: ModBusField<string>) {
    const states: { [key: number]: string } = {
      0: "HEATING",
      1: "ECO",
      2: "COOLING",
      3: "FLOORDRY",
      4: "FROST",
      5: "MAX-TEMP",
      6: "ERROR",
      7: "SERVICE",
      8: "HOLIDAY",
      9: "CH-SUMMER",
      10: "CC-WINTER",
      11: "PRIO-STOP",
      12: "OFF",
      13: "RELEASE-OFF",
      14: "TIME-OFF",
      15: "STBY",
      16: "STBY-HEATING",
      17: "STBY-ECO",
      18: "STBY-COOLING",
      19: "STBY-FROST",
      20: "STBY-FLOORDRY",
    };
    return states[this.rawValue as number] || "UNKNOWN";
  },
};

export const heating_circuit_1_flow_temp: ModBusField<number> = {
  adress: 5002,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};

export const heating_circuit_2_state: ModBusField<string> = {
  adress: 5101,
  convert: function (this: ModBusField<string>) {
    const states: { [key: number]: string } = {
      0: "HEATING",
      1: "ECO",
      2: "COOLING",
      3: "FLOORDRY",
      4: "FROST",
      5: "MAX-TEMP",
      6: "ERROR",
      7: "SERVICE",
      8: "HOLIDAY",
      9: "CH-SUMMER",
      10: "CC-WINTER",
      11: "PRIO-STOP",
      12: "OFF",
      13: "RELEASE-OFF",
      14: "TIME-OFF",
      15: "STBY",
      16: "STBY-HEATING",
      17: "STBY-ECO",
      18: "STBY-COOLING",
      19: "STBY-FROST",
      20: "STBY-FLOORDRY",
    };
    return states[this.rawValue as number] || "UNKNOWN";
  },
};

export const heating_circuit_2_flow_temp: ModBusField<number> = {
  adress: 5102,
  convert: function (this: ModBusField<number>) {
    return convertToTemperature(this.rawValue as number);
  },
};