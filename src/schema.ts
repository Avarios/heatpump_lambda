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
  },
  (t) => [index("idx_eventtime").on(t.event_timestamp)],
);


export type HeatpumpRecord = typeof heatpump.$inferInsert;
export type HeatpumpSelect = typeof heatpump.$inferSelect;
