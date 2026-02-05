import ModbusRTU from "modbus-serial";
import {
  type HeatpumpData,
  type ModbusConfig,
  type ModBusField,
} from "./modbus-types";
import {
  ambient_state,
  ambient_calculated,
  boiler_high_temp,
  boiler_low_temp,
  boiler_state,
  buffer_high_temp,
  buffer_low_temp,
  buffer_state,
  heating_circuit_1_flow_temp,
  heating_circuit_1_state,
  heating_circuit_2_flow_temp,
  heating_circuit_2_state,
  heatpump_qp_heating,
  heatpump_compressor_rating,
  heatpump_cop,
  heatpump_electric_energy,
  heatpump_t_eq_in,
  heatpump_error_number,
  heatpump_error_state,
  heatpump_t_flow,
  heatpump_heat_energy,
  heatpump_fi_power,
  heatpump_operating_state,
  heatpump_request_flow_temp,
  heatpump_request_return_temp,
  heatpump_request_temp_diff,
  heatpump_request_type,
  heatpump_t_return,
  heatpump_state,
  heatpump_vol_sink,
  heatpump_vol_source,
} from "./modbus-fields";

export class ModbusClient {
  private client: ModbusRTU;
  private config: ModbusConfig;
  private connected: boolean = false;

  constructor(config: ModbusConfig) {
    this.client = new ModbusRTU();
    this.config = {
      ...{
        unitId: 1,
        timeout: 5000,
      },
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await this.client.connectTCP(this.config.host, {
      port: this.config.port,
    });

    this.client.setID(this.config.unitId);
    this.connected = true;
    console.log(
      `Connected to Modbus TCP server at ${this.config.host}:${this.config.port}`,
    );
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.client.close(() => {});
    this.connected = false;
    console.log("Disconnected from Modbus TCP server");
  }

  private async readField(field: ModBusField<any>): Promise<void> {
    try {
      const result = await this.client.readHoldingRegisters(
        field.adress,
        field.length ?? 1,
      );
      let modbusResult;
      if (
        field.length &&
        result.data.length > 1 &&
        field.length > 1 &&
        result.data[0] &&
        result.data[1]
      ) {
        const value = (result.data[0] << 16) | result.data[1];
        modbusResult = value >> 0;
      } else {
        modbusResult = result.data[0] ?? 0;
      }

      field.rawValue = modbusResult;
    } catch (error) {
      console.error(`Error reading field ${field.adress}:`, error);
      throw error;
    }
  }

  async fetchHeatpumpData(): Promise<HeatpumpData> {
    if (!this.connected) {
      this.connect();
    }
    if (!this.connected) {
      throw new Error("Modbus client is not connected");
    }

    try {
      console.log("Starting individual field reads...");

      try {
        await this.readField(ambient_state);
        await this.readField(ambient_calculated);
        await this.readField(boiler_high_temp);
        await this.readField(boiler_low_temp);
        await this.readField(boiler_state);
        await this.readField(buffer_high_temp);
        await this.readField(buffer_low_temp);
        await this.readField(buffer_state);
        await this.readField(heating_circuit_1_flow_temp);
        await this.readField(heating_circuit_1_state);
        await this.readField(heating_circuit_2_flow_temp);
        await this.readField(heating_circuit_2_state);
        await this.readField(heatpump_qp_heating);
        await this.readField(heatpump_compressor_rating);
        await this.readField(heatpump_cop);
        await this.readField(heatpump_electric_energy);
        await this.readField(heatpump_t_eq_in);
        await this.readField(heatpump_error_number);
        await this.readField(heatpump_error_state);
        await this.readField(heatpump_t_flow);
        await this.readField(heatpump_heat_energy);
        await this.readField(heatpump_fi_power);
        await this.readField(heatpump_operating_state);
        await this.readField(heatpump_request_flow_temp);
        await this.readField(heatpump_request_return_temp);
        await this.readField(heatpump_request_temp_diff);
        await this.readField(heatpump_request_type);
        await this.readField(heatpump_t_return);
        await this.readField(heatpump_state);
        await this.readField(heatpump_vol_sink);
        await this.readField(heatpump_vol_source);
        console.log("All fields read successfully");
      } catch (error) {
        console.error("Error in fetching data:", error);
        throw error;
      }

      // Now use the convert methods from fields
      const data: HeatpumpData = {
        event_timestamp: new Date(),
        Ambient_State: ambient_state.convert(),
        Ambient_TemperatureCalculated: ambient_calculated.convert(),
        Boiler_HighTemp: boiler_high_temp.convert(),
        Boiler_LowTemp: boiler_low_temp.convert(),
        Boiler_State: boiler_state.convert(),
        Buffer_HighTemp: buffer_high_temp.convert(),
        Buffer_LowTemp: buffer_low_temp.convert(),
        Buffer_State: buffer_state.convert(),
        HeatingCircuit_1_FlowTemp: heating_circuit_1_flow_temp.convert(),
        HeatingCircuit_1_State: heating_circuit_1_state.convert(),
        HeatingCircuit_2_FlowTemp: heating_circuit_2_flow_temp.convert(),
        HeatingCircuit_2_State: heating_circuit_2_state.convert(),
        Heatpump_ActualHeatingCapacity: heatpump_qp_heating.convert(),
        Heatpump_CompressorRating: heatpump_compressor_rating.convert(),
        Heatpump_CurrentCop: heatpump_cop.convert(),
        Heatpump_ElectricEnergy: heatpump_electric_energy.convert(),
        Heatpump_EnergySourceInletTemp: heatpump_t_eq_in.convert(),
        Heatpump_ErrorNumber: heatpump_error_number.convert(),
        Heatpump_ErrorState: heatpump_error_state.convert(),
        Heatpump_FlowlineTemp: heatpump_t_flow.convert(),
        Heatpump_HeatEnergy: heatpump_heat_energy.convert(),
        Heatpump_InverterActualPower: heatpump_fi_power.convert(),
        Heatpump_OperatingState: heatpump_operating_state.convert(),
        Heatpump_RequestFlowTemp: heatpump_request_flow_temp.convert(),
        Heatpump_RequestReturnTemp: heatpump_request_return_temp.convert(),
        Heatpump_RequestTempDiff: heatpump_request_temp_diff.convert(),
        Heatpump_RequestType: heatpump_request_type.convert(),
        Heatpump_ReturnLineTemp: heatpump_t_return.convert(),
        Heatpump_State: heatpump_state.convert(),
        Heatpump_VolumeSink: heatpump_vol_sink.convert(),
        Heatpump_VolumeSourceFlow: heatpump_vol_source.convert(),
      };
      return data;
    } catch (error) {
      console.error("Error fetching heatpump data:", error);
      throw error;
    }
  }
}

export default ModbusClient;
