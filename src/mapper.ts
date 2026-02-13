import type { HeatpumpData } from "./modbus/modbus-types.js";
import type { ShellyEMStatus } from "./REST/types.js";
import { ErrResult, OkResult, type Result, type ResultError } from "./result.js";
import type { HeatpumpRecord } from "./schema.js";

export const mapData = (
  modbusData: HeatpumpData,
  shellyData: ShellyEMStatus | null,
): Result<HeatpumpRecord, ResultError> => {
  try {
    const record = {
      event_timestamp: modbusData.event_timestamp,
      ambient_state: modbusData.Ambient_State,
      ambient_temperature_calculated: modbusData.Ambient_TemperatureCalculated,
      boiler_high_temp: modbusData.Boiler_HighTemp,
      boiler_low_temp: modbusData.Boiler_LowTemp,
      boiler_state: modbusData.Boiler_State,
      buffer_high_temp: modbusData.Buffer_HighTemp,
      buffer_low_temp: modbusData.Buffer_LowTemp,
      buffer_state: modbusData.Buffer_State,
      heating_circuit_1_flow_temp: modbusData.HeatingCircuit_1_FlowTemp,
      heating_circuit_1_state: modbusData.HeatingCircuit_1_State,
      heating_circuit_2_flow_temp: modbusData.HeatingCircuit_2_FlowTemp,
      heating_circuit_2_state: modbusData.HeatingCircuit_2_State,
      heatpump_actual_heating_capacity:
        modbusData.Heatpump_ActualHeatingCapacity,
      heatpump_compressor_rating: modbusData.Heatpump_CompressorRating,
      heatpump_current_cop: modbusData.Heatpump_CurrentCop,
      heatpump_electric_energy: modbusData.Heatpump_ElectricEnergy,
      heatpump_energy_source_inlet_temp:
        modbusData.Heatpump_EnergySourceInletTemp,
      heatpump_error_number: modbusData.Heatpump_ErrorNumber,
      heatpump_error_state: modbusData.Heatpump_ErrorState,
      heatpump_flowline_temp: modbusData.Heatpump_FlowlineTemp,
      heatpump_heat_energy: modbusData.Heatpump_HeatEnergy,
      heatpump_inverter_actual_power: modbusData.Heatpump_InverterActualPower,
      heatpump_operating_state: modbusData.Heatpump_OperatingState,
      heatpump_request_flow_temp: modbusData.Heatpump_RequestFlowTemp,
      heatpump_request_return_temp: modbusData.Heatpump_RequestReturnTemp,
      heatpump_request_temp_diff: modbusData.Heatpump_RequestTempDiff,
      heatpump_request_type: modbusData.Heatpump_RequestType,
      heatpump_return_line_temp: modbusData.Heatpump_ReturnLineTemp,
      heatpump_state: modbusData.Heatpump_State,
      heatpump_volume_sink: modbusData.Heatpump_VolumeSink,
      heatpump_volume_source_flow: modbusData.Heatpump_VolumeSourceFlow,
      external_energy_data: shellyData
        ? (shellyData.total_act_power ?? 0)
        : 0,
    };
    return OkResult(record);
  } catch (error) {
    console.error("Error mapping data to HeatpumpRecord:", error);
    return ErrResult({ reason: "Failed to map data to HeatpumpRecord" });
  }
};