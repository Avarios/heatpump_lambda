import {
  pgTable,
  timestamp,
  varchar,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";

export const heatpump = pgTable(
  "heatpump",
  {
    event_timestamp: timestamp("event_timestamp", {
      withTimezone: true,
    })
      .primaryKey()
      .notNull(),
    ambient_state: varchar("ambient_state", { length: 50 }).notNull(),
    ambient_temperature_calculated: doublePrecision(
      "ambient_temperaturecalculated",
    ).notNull(),
    boiler_high_temp: doublePrecision("boiler_hightemp").notNull(),
    boiler_low_temp: doublePrecision("boiler_lowtemp").notNull(),
    boiler_state: varchar("boiler_state", { length: 50 }).notNull(),
    buffer_high_temp: doublePrecision("buffer_hightemp").notNull(),
    buffer_low_temp: doublePrecision("buffer_lowtemp").notNull(),
    buffer_state: varchar("buffer_state", { length: 50 }).notNull(),
    heating_circuit_1_flow_temp: doublePrecision(
      "heatingcircuit_1_flowtemp",
    ).notNull(),
    heating_circuit_1_state: varchar("heatingcircuit_1_state", {
      length: 50,
    }).notNull(),
    heating_circuit_2_flow_temp: doublePrecision(
      "heatingcircuit_2_flowtemp",
    ).notNull(),
    heating_circuit_2_state: varchar("heatingcircuit_2_state", {
      length: 50,
    }).notNull(),
    heatpump_actual_heating_capacity: doublePrecision(
      "heatpump_actualheatingcapacity",
    ).notNull(),
    heatpump_compressor_rating: doublePrecision(
      "heatpump_compressorrating",
    ).notNull(),
    heatpump_current_cop: doublePrecision("heatpump_currentcop").notNull(),
    heatpump_electric_energy: doublePrecision(
      "heatpump_electricenergy",
    ).notNull(),
    heatpump_energy_source_inlet_temp: doublePrecision(
      "heatpump_energysourceinlettemp",
    ).notNull(),
    heatpump_error_number: doublePrecision("heatpump_errornumber").notNull(),
    heatpump_error_state: varchar("heatpump_errorstate", {
      length: 50,
    }).notNull(),
    heatpump_flowline_temp: doublePrecision("heatpump_flowlinetemp").notNull(),
    heatpump_heat_energy: doublePrecision("heatpump_heatenergy").notNull(),
    heatpump_inverter_actual_power: doublePrecision(
      "heatpump_inverteractualpower",
    ).notNull(),
    heatpump_operating_state: varchar("heatpump_operatingstate", {
      length: 50,
    }).notNull(),
    heatpump_request_flow_temp: doublePrecision(
      "heatpump_requestflowtemp",
    ).notNull(),
    heatpump_request_return_temp: doublePrecision(
      "heatpump_requestreturntemp",
    ).notNull(),
    heatpump_request_temp_diff: doublePrecision(
      "heatpump_requesttempdiff",
    ).notNull(),
    heatpump_request_type: varchar("heatpump_requesttype", {
      length: 50,
    }).notNull(),
    heatpump_return_line_temp: doublePrecision(
      "heatpump_returnlinetemp",
    ).notNull(),
    heatpump_state: varchar("heatpump_state", { length: 50 }).notNull(),
    heatpump_volume_sink: doublePrecision("heatpump_volumesink").notNull(),
    heatpump_volume_source_flow: doublePrecision(
      "heatpump_volumesourceflow",
    ).notNull(),
    external_energy_data: doublePrecision("external_power"),
    // EMS core
    e3dc_power_pv: doublePrecision("e3dc_power_pv"),
    e3dc_power_bat: doublePrecision("e3dc_power_bat"),
    e3dc_power_home: doublePrecision("e3dc_power_home"),
    e3dc_power_grid: doublePrecision("e3dc_power_grid"),
    e3dc_bat_soc: doublePrecision("e3dc_bat_soc"),
    e3dc_autarky: doublePrecision("e3dc_autarky"),
    e3dc_self_consumption: doublePrecision("e3dc_self_consumption"),
    // EMS extended
    e3dc_power_add: doublePrecision("e3dc_power_add"),
    e3dc_power_wb_all: doublePrecision("e3dc_power_wb_all"),
    e3dc_power_wb_solar: doublePrecision("e3dc_power_wb_solar"),
    e3dc_coupling_mode: doublePrecision("e3dc_coupling_mode"),
    e3dc_status: doublePrecision("e3dc_status"),
    e3dc_bat_charge_limit: doublePrecision("e3dc_bat_charge_limit"),
    e3dc_bat_discharge_limit: doublePrecision("e3dc_bat_discharge_limit"),
    e3dc_remaining_bat_charge_power: doublePrecision("e3dc_remaining_bat_charge_power"),
    e3dc_remaining_bat_discharge_power: doublePrecision("e3dc_remaining_bat_discharge_power"),
    e3dc_emergency_power_status: doublePrecision("e3dc_emergency_power_status"),
    // PVI
    e3dc_pvi_on_grid: doublePrecision("e3dc_pvi_on_grid"),
    e3dc_pvi_state: varchar("e3dc_pvi_state", { length: 100 }),
    e3dc_pvi_temperature: doublePrecision("e3dc_pvi_temperature"),
    e3dc_pvi_ac_power_l1: doublePrecision("e3dc_pvi_ac_power_l1"),
    e3dc_pvi_ac_power_l2: doublePrecision("e3dc_pvi_ac_power_l2"),
    e3dc_pvi_ac_power_l3: doublePrecision("e3dc_pvi_ac_power_l3"),
    e3dc_pvi_ac_voltage_l1: doublePrecision("e3dc_pvi_ac_voltage_l1"),
    e3dc_pvi_ac_voltage_l2: doublePrecision("e3dc_pvi_ac_voltage_l2"),
    e3dc_pvi_ac_voltage_l3: doublePrecision("e3dc_pvi_ac_voltage_l3"),
    e3dc_pvi_ac_current_l1: doublePrecision("e3dc_pvi_ac_current_l1"),
    e3dc_pvi_ac_current_l2: doublePrecision("e3dc_pvi_ac_current_l2"),
    e3dc_pvi_ac_current_l3: doublePrecision("e3dc_pvi_ac_current_l3"),
    e3dc_pvi_ac_energy_all_l1: doublePrecision("e3dc_pvi_ac_energy_all_l1"),
    e3dc_pvi_ac_energy_all_l2: doublePrecision("e3dc_pvi_ac_energy_all_l2"),
    e3dc_pvi_ac_energy_all_l3: doublePrecision("e3dc_pvi_ac_energy_all_l3"),
    e3dc_pvi_ac_energy_day_l1: doublePrecision("e3dc_pvi_ac_energy_day_l1"),
    e3dc_pvi_ac_energy_day_l2: doublePrecision("e3dc_pvi_ac_energy_day_l2"),
    e3dc_pvi_ac_energy_day_l3: doublePrecision("e3dc_pvi_ac_energy_day_l3"),
    e3dc_pvi_ac_frequency_l1: doublePrecision("e3dc_pvi_ac_frequency_l1"),
    e3dc_pvi_dc_power_s1: doublePrecision("e3dc_pvi_dc_power_s1"),
    e3dc_pvi_dc_power_s2: doublePrecision("e3dc_pvi_dc_power_s2"),
    e3dc_pvi_dc_voltage_s1: doublePrecision("e3dc_pvi_dc_voltage_s1"),
    e3dc_pvi_dc_voltage_s2: doublePrecision("e3dc_pvi_dc_voltage_s2"),
    e3dc_pvi_dc_current_s1: doublePrecision("e3dc_pvi_dc_current_s1"),
    e3dc_pvi_dc_current_s2: doublePrecision("e3dc_pvi_dc_current_s2"),
    // BAT
    e3dc_bat_rsoc: doublePrecision("e3dc_bat_rsoc"),
    e3dc_bat_module_voltage: doublePrecision("e3dc_bat_module_voltage"),
    e3dc_bat_current: doublePrecision("e3dc_bat_current"),
    e3dc_bat_charge_cycles: doublePrecision("e3dc_bat_charge_cycles"),
    e3dc_bat_terminal_voltage: doublePrecision("e3dc_bat_terminal_voltage"),
    e3dc_bat_status_code: doublePrecision("e3dc_bat_status_code"),
    e3dc_bat_error_code: doublePrecision("e3dc_bat_error_code"),
    e3dc_bat_dcb_count: doublePrecision("e3dc_bat_dcb_count"),
    e3dc_bat_training_mode: doublePrecision("e3dc_bat_training_mode"),
    // PM
    e3dc_pm_power_l1: doublePrecision("e3dc_pm_power_l1"),
    e3dc_pm_power_l2: doublePrecision("e3dc_pm_power_l2"),
    e3dc_pm_power_l3: doublePrecision("e3dc_pm_power_l3"),
    e3dc_pm_voltage_l1: doublePrecision("e3dc_pm_voltage_l1"),
    e3dc_pm_voltage_l2: doublePrecision("e3dc_pm_voltage_l2"),
    e3dc_pm_voltage_l3: doublePrecision("e3dc_pm_voltage_l3"),
    e3dc_pm_energy_l1: doublePrecision("e3dc_pm_energy_l1"),
    e3dc_pm_energy_l2: doublePrecision("e3dc_pm_energy_l2"),
    e3dc_pm_energy_l3: doublePrecision("e3dc_pm_energy_l3"),
    e3dc_pm_active_phases: doublePrecision("e3dc_pm_active_phases"),
    e3dc_pm_mode: doublePrecision("e3dc_pm_mode"),
    e3dc_pm_error_code: doublePrecision("e3dc_pm_error_code"),
    e3dc_pm_type: doublePrecision("e3dc_pm_type"),
  },
  (t) => [index("idx_eventtime").on(t.event_timestamp)],
);


export type HeatpumpRecord = typeof heatpump.$inferInsert;
export type HeatpumpSelect = typeof heatpump.$inferSelect;
