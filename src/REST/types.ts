export interface ShellyEMStatus {
  id: number;
  a_current?: number;
  a_act_power?: number;
  b_current?: number;
  b_act_power?: number;
  c_current?: number;
  c_act_power?: number;
  total_act_power?: number; // Gesamtleistung in W
  total_current?: number;
  errors?: string[];
}