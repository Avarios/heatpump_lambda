export interface E3dcConfig {
  host: string;
  port?: number; // default 5033
  username: string;
  password: string;
  rscpKey: string; // encryption key configured on the E3DC device
}

export interface E3dcData {
  // EMS core
  power_pv: number;           // Solar PV production (W), positive = producing
  power_bat: number;          // Battery power (W), positive = discharging, negative = charging
  power_home: number;         // House consumption (W)
  power_grid: number;         // Grid exchange (W), positive = consuming, negative = feeding
  bat_soc: number;            // Battery state of charge (0–100 %)
  autarky: number;            // Autarky percentage (0–100)
  self_consumption: number;   // Self-consumption percentage (0–100)

  // EMS extended
  power_add: number | null;                    // Additional power source (W)
  power_wb_all: number | null;                 // Wallbox total power (W)
  power_wb_solar: number | null;               // Wallbox solar share (W)
  coupling_mode: number | null;                // Coupling mode (UChar8 enum)
  status: number | null;                       // EMS status flags (UChar8 bitfield)
  bat_charge_limit: number | null;             // Max charge power (W)
  bat_discharge_limit: number | null;          // Max discharge power (W)
  remaining_bat_charge_power: number | null;   // Available charge headroom (W)
  remaining_bat_discharge_power: number | null; // Available discharge headroom (W)
  emergency_power_status: number | null;       // Emergency power status (UChar8)

  // PVI (per phase, index 0/1/2 = L1/L2/L3)
  pvi_on_grid: boolean | null;
  pvi_state: string | null;
  pvi_temperature: number | null;              // °C (phase 0)
  pvi_ac_power: number[] | null;               // W per phase [L1,L2,L3]
  pvi_ac_voltage: number[] | null;             // V per phase
  pvi_ac_current: number[] | null;             // A per phase
  pvi_ac_energy_all: number[] | null;          // kWh per phase (lifetime)
  pvi_ac_energy_day: number[] | null;          // kWh per phase (today)
  pvi_ac_frequency: number[] | null;           // Hz per phase
  pvi_dc_power: number[] | null;               // W per string [S1,S2,...]
  pvi_dc_voltage: number[] | null;             // V per string
  pvi_dc_current: number[] | null;             // A per string

  // BAT
  bat_rsoc: number | null;                     // Relative state of charge (%)
  bat_module_voltage: number | null;           // V
  bat_current: number | null;                  // A
  bat_charge_cycles: number | null;
  bat_terminal_voltage: number | null;         // V
  bat_status_code: number | null;              // Bitfield
  bat_error_code: number | null;               // Bitfield
  bat_dcb_count: number | null;
  bat_training_mode: number | null;

  // PM (power meter, per phase)
  pm_power_l1: number | null;                  // W
  pm_power_l2: number | null;
  pm_power_l3: number | null;
  pm_voltage_l1: number | null;                // V
  pm_voltage_l2: number | null;
  pm_voltage_l3: number | null;
  pm_energy_l1: number | null;                 // kWh
  pm_energy_l2: number | null;
  pm_energy_l3: number | null;
  pm_active_phases: number | null;             // Bitmask
  pm_mode: number | null;
  pm_error_code: number | null;
  pm_type: number | null;
}
