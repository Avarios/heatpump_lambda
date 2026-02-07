import { ErrResult, OkResult, type Result } from "../result.js";
import type { ShellyEMStatus } from "./types.js";

export const getShellyConsumptionData = async (
  ipAdress: string,
): Promise<Result<ShellyEMStatus, { reason: string }>> => {
  try {
    const url = `http://${ipAdress}/rpc/EM.GetStatus?id=0`;
    const response = await fetch(url);
    const data: ShellyEMStatus = await response.json();
    return OkResult(data);
  } catch (error) {
    console.error("Error fetching Shelly EM data:", error);
    return ErrResult({ reason: "Failed to fetch Shelly EM data" });
  }
};
