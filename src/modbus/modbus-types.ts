//TODO: make heating circutis configurable
export interface HeatpumpData {
  event_timestamp: Date;
  Ambient_State: string;
  Ambient_TemperatureCalculated: number;
  Boiler_HighTemp: number;
  Boiler_LowTemp: number;
  Boiler_State: string;
  Buffer_HighTemp: number;
  Buffer_LowTemp: number;
  Buffer_State: string;
  HeatingCircuit_1_FlowTemp: number;
  HeatingCircuit_1_State: string;
  HeatingCircuit_2_FlowTemp: number;
  HeatingCircuit_2_State: string;
  Heatpump_ActualHeatingCapacity: number;
  Heatpump_CompressorRating: number;
  Heatpump_CurrentCop: number;
  Heatpump_ElectricEnergy: number;
  Heatpump_EnergySourceInletTemp: number;
  Heatpump_ErrorNumber: number;
  Heatpump_ErrorState: string;
  Heatpump_FlowlineTemp: number;
  Heatpump_HeatEnergy: number;
  Heatpump_InverterActualPower: number;
  Heatpump_OperatingState: string;
  Heatpump_RequestFlowTemp: number;
  Heatpump_RequestReturnTemp: number;
  Heatpump_RequestTempDiff: number;
  Heatpump_RequestType: string;
  Heatpump_ReturnLineTemp: number;
  Heatpump_State: string;
  Heatpump_VolumeSink: number;
  Heatpump_VolumeSourceFlow: number
}

export interface ModbusConfig {
  host: string;
  port: number;
  timeout: number;
}
