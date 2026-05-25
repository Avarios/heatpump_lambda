import type { HeatpumpData } from "./modbus/modbus-types.js";
import type { ShellyEMStatus } from "./REST/types.js";
import type { E3dcData } from "./e3dc/e3dc-types.js";
import { ErrResult, OkResult, type Result, type ResultError } from "./result.js";
import type { HeatpumpRecord } from "./schema.js";

export const mapData = (
  modbusData: HeatpumpData,
  shellyData: ShellyEMStatus | null,
  e3dcData: E3dcData | null,
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
      // EMS core
      e3dc_power_pv: e3dcData?.power_pv ?? null,
      e3dc_power_bat: e3dcData?.power_bat ?? null,
      e3dc_power_home: e3dcData?.power_home ?? null,
      e3dc_power_grid: e3dcData?.power_grid ?? null,
      e3dc_bat_soc: e3dcData?.bat_soc ?? null,
      e3dc_autarky: e3dcData?.autarky ?? null,
      e3dc_self_consumption: e3dcData?.self_consumption ?? null,
      // EMS extended
      e3dc_power_add: e3dcData?.power_add ?? null,
      e3dc_power_wb_all: e3dcData?.power_wb_all ?? null,
      e3dc_power_wb_solar: e3dcData?.power_wb_solar ?? null,
      e3dc_coupling_mode: e3dcData?.coupling_mode ?? null,
      e3dc_status: e3dcData?.status ?? null,
      e3dc_bat_charge_limit: e3dcData?.bat_charge_limit ?? null,
      e3dc_bat_discharge_limit: e3dcData?.bat_discharge_limit ?? null,
      e3dc_remaining_bat_charge_power: e3dcData?.remaining_bat_charge_power ?? null,
      e3dc_remaining_bat_discharge_power: e3dcData?.remaining_bat_discharge_power ?? null,
      e3dc_emergency_power_status: e3dcData?.emergency_power_status ?? null,
      // PVI
      e3dc_pvi_on_grid: e3dcData?.pvi_on_grid != null ? (e3dcData.pvi_on_grid ? 1 : 0) : null,
      e3dc_pvi_state: e3dcData?.pvi_state ?? null,
      e3dc_pvi_temperature: e3dcData?.pvi_temperature ?? null,
      e3dc_pvi_ac_power_l1: e3dcData?.pvi_ac_power?.[0] ?? null,
      e3dc_pvi_ac_power_l2: e3dcData?.pvi_ac_power?.[1] ?? null,
      e3dc_pvi_ac_power_l3: e3dcData?.pvi_ac_power?.[2] ?? null,
      e3dc_pvi_ac_voltage_l1: e3dcData?.pvi_ac_voltage?.[0] ?? null,
      e3dc_pvi_ac_voltage_l2: e3dcData?.pvi_ac_voltage?.[1] ?? null,
      e3dc_pvi_ac_voltage_l3: e3dcData?.pvi_ac_voltage?.[2] ?? null,
      e3dc_pvi_ac_current_l1: e3dcData?.pvi_ac_current?.[0] ?? null,
      e3dc_pvi_ac_current_l2: e3dcData?.pvi_ac_current?.[1] ?? null,
      e3dc_pvi_ac_current_l3: e3dcData?.pvi_ac_current?.[2] ?? null,
      e3dc_pvi_ac_energy_all_l1: e3dcData?.pvi_ac_energy_all?.[0] ?? null,
      e3dc_pvi_ac_energy_all_l2: e3dcData?.pvi_ac_energy_all?.[1] ?? null,
      e3dc_pvi_ac_energy_all_l3: e3dcData?.pvi_ac_energy_all?.[2] ?? null,
      e3dc_pvi_ac_energy_day_l1: e3dcData?.pvi_ac_energy_day?.[0] ?? null,
      e3dc_pvi_ac_energy_day_l2: e3dcData?.pvi_ac_energy_day?.[1] ?? null,
      e3dc_pvi_ac_energy_day_l3: e3dcData?.pvi_ac_energy_day?.[2] ?? null,
      e3dc_pvi_ac_frequency_l1: e3dcData?.pvi_ac_frequency?.[0] ?? null,
      e3dc_pvi_dc_power_s1: e3dcData?.pvi_dc_power?.[0] ?? null,
      e3dc_pvi_dc_power_s2: e3dcData?.pvi_dc_power?.[1] ?? null,
      e3dc_pvi_dc_voltage_s1: e3dcData?.pvi_dc_voltage?.[0] ?? null,
      e3dc_pvi_dc_voltage_s2: e3dcData?.pvi_dc_voltage?.[1] ?? null,
      e3dc_pvi_dc_current_s1: e3dcData?.pvi_dc_current?.[0] ?? null,
      e3dc_pvi_dc_current_s2: e3dcData?.pvi_dc_current?.[1] ?? null,
      // BAT
      e3dc_bat_rsoc: e3dcData?.bat_rsoc ?? null,
      e3dc_bat_module_voltage: e3dcData?.bat_module_voltage ?? null,
      e3dc_bat_current: e3dcData?.bat_current ?? null,
      e3dc_bat_charge_cycles: e3dcData?.bat_charge_cycles ?? null,
      e3dc_bat_terminal_voltage: e3dcData?.bat_terminal_voltage ?? null,
      e3dc_bat_status_code: e3dcData?.bat_status_code ?? null,
      e3dc_bat_error_code: e3dcData?.bat_error_code ?? null,
      e3dc_bat_dcb_count: e3dcData?.bat_dcb_count ?? null,
      e3dc_bat_training_mode: e3dcData?.bat_training_mode ?? null,
      // PM
      e3dc_pm_power_l1: e3dcData?.pm_power_l1 ?? null,
      e3dc_pm_power_l2: e3dcData?.pm_power_l2 ?? null,
      e3dc_pm_power_l3: e3dcData?.pm_power_l3 ?? null,
      e3dc_pm_voltage_l1: e3dcData?.pm_voltage_l1 ?? null,
      e3dc_pm_voltage_l2: e3dcData?.pm_voltage_l2 ?? null,
      e3dc_pm_voltage_l3: e3dcData?.pm_voltage_l3 ?? null,
      e3dc_pm_energy_l1: e3dcData?.pm_energy_l1 ?? null,
      e3dc_pm_energy_l2: e3dcData?.pm_energy_l2 ?? null,
      e3dc_pm_energy_l3: e3dcData?.pm_energy_l3 ?? null,
      e3dc_pm_active_phases: e3dcData?.pm_active_phases ?? null,
      e3dc_pm_mode: e3dcData?.pm_mode ?? null,
      e3dc_pm_error_code: e3dcData?.pm_error_code ?? null,
      e3dc_pm_type: e3dcData?.pm_type ?? null,
    };
    return OkResult(record);
  } catch (error) {
    console.error("Error mapping data to HeatpumpRecord:", error);
    return ErrResult({ reason: "Failed to map data to HeatpumpRecord" });
  }
};
