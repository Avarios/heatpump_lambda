export const convertToTemperatureHigh = (rawValue: number): number => {
  return int16(rawValue) * 0.01;
};

export const convertToTemperature = (rawValue: number): number => {
  return int16(rawValue) * 0.1;
};

export const int32ToNumber = (highReg: number, lowReg: number): number => {
  // high first: highReg -> low 16 Bits, lowReg -> high 16 Bits
  return (lowReg << 16) | (highReg & 0xffff); // unsigned 32-bit
};

function int16(raw: number): number {
  return raw > 0x7fff ? raw - 0x10000 : raw;
}

export const heatpump_errorstates: { [key: number]: string } = {
  0: "NONE",
  1: "MESSAGE",
  2: "WARNING",
  3: "ALARM",
  4: "FAULT",
};

export const heatpump_states: { [key: number]: string } = {
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

export const heatpump_operating_state: { [key: number]: string } = {
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

export const heatpump_request_state: { [key: number]: string } = {
  0: "NO REQUEST",
  1: "FLOW PUMP CIRCULATION",
  2: "CENTRAL HEATING",
  3: "CENTRAL COOLING",
  4: "DOMESTIC HOT WATER",
};

export const ambient_state: { [key: number]: string } = {
  0: "OFF",
  1: "AUTOMATIK",
  2: "MANUAL",
  3: "ERROR",
};

export const boiler_state: { [key: number]: string } = {
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

export const buffer_state: { [key: number]: string } = {
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

export const heating_circuit_state: { [key: number]: string } = {
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
