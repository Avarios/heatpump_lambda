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
    External_Power DOUBLE precision
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

CREATE OR REPLACE VIEW heatpump_external_power AS
SELECT 
  COALESCE(
    SUM(external_power * 30.0 / 3600000.0),  -- Deine SUMME (falls Daten)
    0
  ) + 
  (  -- Deine funktionierende Delta-Query
    (SELECT heatpump_electricenergy
     FROM heatpump
     WHERE event_timestamp <= CURRENT_TIMESTAMP 
     AND external_power IS NULL
     ORDER BY event_timestamp DESC LIMIT 1
    ) - (
     SELECT heatpump_electricenergy
     FROM heatpump
     WHERE event_timestamp >= DATE_TRUNC('year', CURRENT_TIMESTAMP)
	 AND external_power IS NULL
     ORDER BY event_timestamp ASC LIMIT 1
    )
  ) AS total_ext_power
FROM heatpump 
WHERE event_timestamp >= DATE_TRUNC('year', CURRENT_TIMESTAMP)
  AND event_timestamp < DATE_TRUNC('year', CURRENT_TIMESTAMP) + INTERVAL '1 year'
  AND external_power IS NOT NULL;


CREATE OR REPLACE FUNCTION heatpump_heatenergy_function(
  start_timestamp timestamptz DEFAULT DATE_TRUNC('year', CURRENT_TIMESTAMP),
  end_timestamp timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  start_value double precision,
  end_value double precision,
  heatpump_difference double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT heatpump_heatenergy
     FROM heatpump
     WHERE event_timestamp >= start_timestamp
     ORDER BY event_timestamp ASC
     LIMIT 1) AS start_value,
    
    (SELECT heatpump_heatenergy
     FROM heatpump
     WHERE event_timestamp <= end_timestamp
     ORDER BY event_timestamp DESC
     LIMIT 1) AS end_value,
    
    COALESCE(
      (SELECT heatpump_heatenergy
       FROM heatpump
       WHERE event_timestamp <= end_timestamp
       ORDER BY event_timestamp DESC LIMIT 1
      ), 0
    ) - COALESCE(
      (SELECT heatpump_heatenergy
       FROM heatpump
       WHERE event_timestamp >= start_timestamp
       ORDER BY event_timestamp ASC LIMIT 1
      ), 0
    ) AS heatpump_difference;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION heatpump_external_function(
  start_timestamp timestamptz DEFAULT DATE_TRUNC('year', CURRENT_TIMESTAMP),
  end_timestamp timestamptz DEFAULT DATE_TRUNC('year', CURRENT_TIMESTAMP) + INTERVAL '1 year'
)
RETURNS double precision AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(external_power * 30.0 / 3600000.0)
     FROM heatpump 
     WHERE event_timestamp >= start_timestamp
       AND event_timestamp < end_timestamp
       AND external_power IS NOT NULL),
    0
  ) + 
  COALESCE(
    (SELECT heatpump_electricenergy
     FROM heatpump
     WHERE event_timestamp <= end_timestamp 
       AND external_power IS NULL
     ORDER BY event_timestamp DESC LIMIT 1
    ), 0
  ) - 
  COALESCE(
    (SELECT heatpump_electricenergy
     FROM heatpump
     WHERE event_timestamp >= start_timestamp
     ORDER BY event_timestamp ASC LIMIT 1
    ), 0
  );
END;
$$ LANGUAGE plpgsql;


-- FUNCTION: public.calculate_real_cop(timestamp with time zone, timestamp with time zone)

DROP FUNCTION IF EXISTS calculate_real_cop(timestamp with time zone, timestamp with time zone);

CREATE OR REPLACE FUNCTION calculate_real_cop(
	p_start timestamp with time zone,
	p_end timestamp with time zone)
    RETURNS TABLE(period_start timestamp with time zone, period_end timestamp with time zone, duration_minutes numeric, heat_energy_kwh numeric, internal_electric_kwh numeric, real_electric_kwh numeric, internal_cop numeric, real_cop numeric, sample_count bigint) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
    DECLARE
      v_heat_start    DOUBLE PRECISION;
      v_heat_end      DOUBLE PRECISION;
      v_elec_start    DOUBLE PRECISION;
      v_elec_end      DOUBLE PRECISION;
      v_real_wh       DOUBLE PRECISION := 0;
      v_samples       BIGINT;
    BEGIN
      -- Get cumulative energy counters at the boundary closest to p_start and p_end
      SELECT heatpump_heatenergy, heatpump_electricenergy
        INTO v_heat_start, v_elec_start
        FROM heatpump
       WHERE event_timestamp >= p_start
       ORDER BY event_timestamp ASC
       LIMIT 1;

      SELECT heatpump_heatenergy, heatpump_electricenergy
        INTO v_heat_end, v_elec_end
        FROM heatpump
       WHERE event_timestamp <= p_end
       ORDER BY event_timestamp DESC
       LIMIT 1;

      -- Trapezoidal integration of external_power (W) over time -> Wh
      SELECT
        SUM(
          (w_curr + w_next) / 2.0
          * EXTRACT(EPOCH FROM (t_next - t_curr)) / 3600.0
        ),
        COUNT(*)
      INTO v_real_wh, v_samples
      FROM (
        SELECT
          event_timestamp                                            AS t_curr,
          external_power                                            AS w_curr,
          LEAD(event_timestamp) OVER (ORDER BY event_timestamp)    AS t_next,
          LEAD(external_power)  OVER (ORDER BY event_timestamp)    AS w_next
        FROM heatpump
        WHERE event_timestamp BETWEEN p_start AND p_end
          AND external_power IS NOT NULL
      ) pairs
      WHERE t_next IS NOT NULL;

      RETURN QUERY SELECT
        p_start,
        p_end,
        ROUND(EXTRACT(EPOCH FROM (p_end - p_start)) / 60.0, 1)::NUMERIC,
        ROUND((v_heat_end - v_heat_start)::NUMERIC, 4),
        ROUND((v_elec_end - v_elec_start)::NUMERIC, 4),
        ROUND((v_real_wh / 1000.0)::NUMERIC, 4),
        CASE WHEN (v_elec_end - v_elec_start) > 0
             THEN ROUND(((v_heat_end - v_heat_start) / (v_elec_end - v_elec_start))::NUMERIC, 3)
             ELSE NULL END,
        CASE WHEN v_real_wh > 0
             THEN ROUND(((v_heat_end - v_heat_start) / (v_real_wh / 1000.0))::NUMERIC, 3)
             ELSE NULL END,
        v_samples;
    END;
    
$BODY$;

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