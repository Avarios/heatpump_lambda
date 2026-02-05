-- Active: 1770300157041@@adfnas.local@5432@smarthome_test
-- Active: 1760614099605@@127.0.0.1@5432

CREATE TABLE heatpump (
    event_timestamp TIMESTAMP WITH TIME ZONE PRIMARY KEY NOT NULL,
    Ambient_State varchar(50) NOT NULL,
    Ambient_TemperatureCalculated double precision NOT NULL,
    Boiler_HighTemp double precision NOT NULL,
    Boiler_LowTemp double precision NOT NULL,
    Boiler_State varchar(50) NOT NULL,
    Buffer_HighTemp double precision NOT NULL,
    Buffer_LowTemp double precision NOT NULL,
    Buffer_State varchar(50) NOT NULL,
    HeatingCircuit_1_FlowTemp double precision NOT NULL,
    HeatingCircuit_1_State varchar(50) NOT NULL,
    HeatingCircuit_2_FlowTemp double precision NOT NULL,
    HeatingCircuit_2_State varchar(50) NOT NULL,
    Heatpump_ActualHeatingCapacity double precision NOT NULL,
    Heatpump_CompressorRating double precision NOT NULL,
    Heatpump_CurrentCop double precision NOT NULL,
    Heatpump_ElectricEnergy double precision NOT NULL,
    Heatpump_EnergySourceInletTemp double precision NOT NULL,
    Heatpump_ErrorNumber double precision NOT NULL,
    Heatpump_ErrorState varchar(50) NOT NULL,
    Heatpump_FlowlineTemp double precision NOT NULL,
    Heatpump_HeatEnergy double precision NOT NULL,
    Heatpump_InverterActualPower double precision NOT NULL,
    Heatpump_OperatingState varchar(50) NOT NULL,
    Heatpump_RequestFlowTemp double precision NOT NULL,
    Heatpump_RequestReturnTemp double precision NOT NULL,
    Heatpump_RequestTempDiff double precision NOT NULL,
    Heatpump_RequestType varchar(50) NOT NULL,
    Heatpump_ReturnLineTemp double precision NOT NULL,
    Heatpump_State varchar(50) NOT NULL,
    Heatpump_VolumeSink double precision NOT NULL,
    Heatpump_VolumeSourceFlow double precision NOT NULL,
    External_Power DOUBLE precision NOT NULL
);

-- Create index on heatpump table
CREATE INDEX IF NOT EXISTS idx_eventtime ON heatpump USING btree (
    event_timestamp ASC NULLS LAST
) INCLUDE (event_timestamp)
WITH (deduplicate_items = True) TABLESPACE pg_default;

CREATE OR REPLACE VIEW heatpump_current_electric AS
SELECT (
        SELECT heatpump.heatpump_electricenergy
        FROM heatpump
        WHERE (
                heatpump.event_timestamp >= date_trunc(
                    'year'::text,
                    CURRENT_TIMESTAMP
                )
            )
        ORDER BY heatpump.event_timestamp
        LIMIT 1
    ) AS start_value,
    (
        SELECT heatpump.heatpump_electricenergy
        FROM heatpump
        WHERE (
                heatpump.event_timestamp <= CURRENT_TIMESTAMP
            )
        ORDER BY heatpump.event_timestamp DESC
        LIMIT 1
    ) AS end_value,
    (
        (
            SELECT heatpump.heatpump_electricenergy
            FROM heatpump
            WHERE (
                    heatpump.event_timestamp <= CURRENT_TIMESTAMP
                )
            ORDER BY heatpump.event_timestamp DESC
            LIMIT 1
        ) - (
            SELECT heatpump.heatpump_electricenergy
            FROM heatpump
            WHERE (
                    heatpump.event_timestamp >= date_trunc(
                        'year'::text,
                        CURRENT_TIMESTAMP
                    )
                )
            ORDER BY heatpump.event_timestamp
            LIMIT 1
        )
    ) AS difference;

CREATE OR REPLACE VIEW heatpump_current_heat AS
SELECT (
        SELECT heatpump.heatpump_heatenergy
        FROM heatpump
        WHERE (
                heatpump.event_timestamp >= date_trunc(
                    'year'::text,
                    CURRENT_TIMESTAMP
                )
            )
        ORDER BY heatpump.event_timestamp
        LIMIT 1
    ) AS start_value,
    (
        SELECT heatpump.heatpump_heatenergy
        FROM heatpump
        WHERE (
                heatpump.event_timestamp <= CURRENT_TIMESTAMP
            )
        ORDER BY heatpump.event_timestamp DESC
        LIMIT 1
    ) AS end_value,
    (
        (
            SELECT heatpump.heatpump_heatenergy
            FROM heatpump
            WHERE (
                    heatpump.event_timestamp <= CURRENT_TIMESTAMP
                )
            ORDER BY heatpump.event_timestamp DESC
            LIMIT 1
        ) - (
            SELECT heatpump.heatpump_heatenergy
            FROM heatpump
            WHERE (
                    heatpump.event_timestamp >= date_trunc(
                        'year'::text,
                        CURRENT_TIMESTAMP
                    )
                )
            ORDER BY heatpump.event_timestamp
            LIMIT 1
        )
    ) AS heatpump_difference;

CREATE OR REPLACE VIEW heatpump_cop_current AS
SELECT
    e.difference AS electric_difference,
    h.heatpump_difference AS heat_difference,
    (
        h.heatpump_difference / e.difference
    ) AS cop_ratio,
    e.start_value AS electric_start,
    e.end_value AS electric_end,
    h.start_value AS heat_start,
    h.end_value AS heat_end
FROM (
        heatpump_current_electric e
        CROSS JOIN heatpump_current_heat h
    );


DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'fetcher'
   ) THEN
      CREATE ROLE fetcher LOGIN PASSWORD 'qwasyx';
   END IF;
END
$$;

GRANT DELETE, SELECT, INSERT ON heatpump TO fetcher;

GRANT DELETE, SELECT, INSERT ON temperature_data TO fetcher;