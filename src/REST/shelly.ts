interface ShellyEMStatus {
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

export const getShellyConsumptionData = async (
  ipAdress: string,
): Promise<ShellyEMStatus> => {
  try {
    const url = `http://${ipAdress}/rpc/EM.GetStatus?id=0`;
    const response = await fetch(url);
    const data: ShellyEMStatus = await response.json();
    console.log("Fetched Shelly EM Data:", data);

    return data;
  } catch (error) {
    throw new Error("Fehler beim Abrufen der Shelly EM-Daten: " + error);
  }
};
