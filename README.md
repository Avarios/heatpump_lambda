# 🌡️ Lambda Heatpump Data Collector

> A TypeScript-based data acquisition system that monitors Lambda heat pump performance via MODBUS TCP and tracks power consumption through Shelly 3EM Pro, storing comprehensive metrics in PostgreSQL for analysis and optimization.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Database Schema](#-database-schema)
- [Monitoring & Analytics](#-monitoring--analytics)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🎯 Overview

This application continuously monitors your Lambda heat pump system by:

- **Reading MODBUS data** from the heat pump controller (temperatures, states, energy consumption)
- **Fetching power metrics** from Shelly 3EM Pro energy meter
- **Storing time-series data** in PostgreSQL for historical analysis
- **Calculating COP** (Coefficient of Performance) and energy efficiency metrics

Perfect for homeowners, energy consultants, and smart home enthusiasts who want to optimize their heat pump performance and track energy consumption patterns.

---

## ✨ Features

- 🔄 **Real-time Data Collection** - Configurable polling intervals (30-3600 seconds)
- 📊 **Comprehensive Metrics** - 30+ data points per reading including temperatures, states, and energy values
- ⚡ **External Power Tracking** - Integration with Shelly 3EM Pro for accurate power consumption
- 🧮 **COP Calculation** - Automatic coefficient of performance tracking via SQL views
- 🐳 **Docker Ready** - Containerized deployment with docker-compose
- 🔒 **Production Hardened** - Non-root user, health checks, signal handling
- 🏥 **Health Monitoring** - HTTP endpoint for external monitoring of application status
- 📈 **Time-Series Optimized** - Indexed PostgreSQL schema for fast queries
- 🛡️ **Error Resilient** - Automatic reconnection with retry logic (10 attempts @ 60s intervals)
- 🎯 **Robust Error Handling** - Type-safe Result patterns with timer stop/restart on failures
- 🔌 **Smart Reconnection** - Prevents concurrent reconnection attempts with state management
- 🔄 **Self-Healing** - Automatic timer restart after successful reconnection
- 🎨 **Color Logger** - Enhanced console output with color-coded timestamps for better log readability

---

## 🏗️ Architecture

```
┌─────────────────┐         MODBUS TCP          ┌──────────────────────────────┐
│  Lambda Heat    │◄────────(Port 502)──────────┤                              │
│  Pump           │                              │   Application Container      │
└─────────────────┘                              │   (TypeScript)               │
                                                 │                              │
┌─────────────────┐         HTTP REST           │  ┌────────────────────────┐  │
│  Shelly 3EM     │◄────────(Port 80)───────────┤  │  Interval Timer        │  │
│  Pro            │                              │  │  (30-3600s)            │  │
└─────────────────┘                              │  └──────────┬─────────────┘  │
                                                 │             │                │
                                                 │             ▼                │
                                                 │  ┌────────────────────────┐  │
                                                 │  │  Action Executer       │  │
                                                 │  │  - Fetch MODBUS        │  │
                                                 │  │  - Fetch Shelly        │  │
                                                 │  │  - Map & Validate      │  │
                                                 │  └──────────┬─────────────┘  │
                                                 │             │                │
                                                 │             ▼                │
                                                 │  ┌────────────────────────┐  │
                                                 │  │  Error Handler         │  │
                                                 │  │  - Stop Timer          │  │
                                                 │  │  - Reconnect (10x)     │  │
                                                 │  │  - Restart Timer       │  │
                                                 │  └────────────────────────┘  │
                                                 └──────────────┬───────────────┘
                                                                │ SQL Insert
                                                                ▼
                                                 ┌──────────────────────────────┐
                                                 │   PostgreSQL Database        │
                                                 │   - Time-series data         │
                                                 │   - COP calculations         │
                                                 └──────────────────────────────┘
```

**Data Flow:**
1. **Timer triggers** - Application polls every N seconds (configurable 30-3600s)
2. **Action Executer runs** - Fetches data from Lambda heat pump (MODBUS TCP) and Shelly 3EM Pro (REST API)
3. **Data mapping** - Validates and transforms raw data according to schema
4. **Database insert** - Stores timestamped record in PostgreSQL
5. **Error handling** - On connection failure:
   - Timer stops immediately
   - Error handler attempts reconnection (10 retries with 60s wait)
   - New connection instances created
   - Timer restarts with fresh connections
6. **Health monitoring** - HTTP endpoint reports system status
7. **SQL views** - Automatically calculate COP and energy deltas

**Error Recovery Flow:**
```
Error Detected → Stop Timer → Reconnect (10x @ 60s) → Success? → Restart Timer
                                                    → Failure? → Exit Process
```

---

## 📦 Prerequisites

### Hardware Requirements
- Lambda heat pump with MODBUS TCP interface enabled
- Check your heating circuits ! If you have only one, please change init.sql and the code
- Shelly 3EM Pro energy meter (or compatible device)
- Network connectivity between application and devices

### Software Requirements
- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **PostgreSQL** (v12+) - can be external or containerized
- **Node.js** (v20+) - only for local development

### Network Requirements
- Heat pump MODBUS TCP accessible
- Shelly device HTTP accessible
- PostgreSQL accessible from application container

---

## 🚀 Installation

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd heatpump_lambda
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` with your configuration**
   ```bash
   nano .env  # or use your preferred editor
   ```

4. **Initialize the database**
   
   Connect to your PostgreSQL instance and run:
   ```bash
   psql -h <your-db-host> -U <your-db-user> -d <your-db-name> -f docs/init.sql
   ```

5. **Start the application**
   ```bash
   docker-compose up -d
   ```

6. **Verify it's running**
   ```bash
   docker logs -f heatpump_fetcher
   ```

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Initialize database** (same as above)

4. **Run in development mode**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# MODBUS Configuration
MODBUS_HOST=192.168.50.112        # IP address of Lambda heat pump
MODBUS_PORT=502                   # MODBUS TCP port (default: 502)
MODBUS_TIMEOUT=2000               # Connection timeout in ms (100-30000)

# Shelly 3EM Pro Configuration
SHELLY_IP=192.168.50.134          # IP address of Shelly energy meter

# Health Check Configuration
HEALTH_PORT=3000                  # HTTP health check endpoint port (default: 3000)

# PostgreSQL Database
DATABASE_CONNECTION_STRING=postgresql://YOURUSER:PASS@DNS_OR_IP:PORT/YOURDATABASE

# Data Collection Interval
INTERVAL_TIME=30                  # Polling interval in seconds (30-3600)

# Logging
VERBOSE_LOGGING=false             # Enable verbose logging (true/false)
```

### Configuration Validation

The application validates all configuration on startup:
- ✅ MODBUS host must be valid IP or hostname
- ✅ Ports must be between 1-65535
- ✅ Timeout must be 100-30000ms
- ✅ Interval must be 30-3600 seconds
- ✅ Database connection string must be valid PostgreSQL format

---

## 🎮 Usage

### Starting the Service

**With Docker Compose:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker logs -f heatpump_fetcher
```

**Stop the service:**
```bash
docker-compose down
```

### Monitoring

**Check application health via HTTP endpoint:**
```bash
curl http://localhost:3000/health
```

**Health response (200 OK when healthy):**
```json
{
  "status": "healthy",
  "isHealthy": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": true,
    "modbus": true,
    "lastFetch": {
      "success": true,
      "timestamp": "2024-01-15T10:29:45.000Z",
      "ageSeconds": 15
    }
  }
}
```

**Unhealthy response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "isHealthy": false,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": true,
    "modbus": false,
    "lastFetch": {
      "success": false,
      "timestamp": "2024-01-15T10:25:00.000Z",
      "ageSeconds": 300
    }
  }
}
```

The application is considered unhealthy if:
- Database connection is lost
- MODBUS connection is lost
- Last data fetch failed
- Last successful fetch is older than 2 minutes

**Check Docker container health:**
```bash
docker inspect --format='{{.State.Health.Status}}' heatpump_fetcher
```

**View recent data:**
```sql
SELECT 
  event_timestamp,
  heatpump_flowline_temp,
  heatpump_return_line_temp,
  heatpump_current_cop,
  external_power
FROM heatpump
ORDER BY event_timestamp DESC
LIMIT 10;
```

**Check current COP:**
```sql
SELECT * FROM heatpump_cop_current;
```

---

## 🗄️ Database Schema

### Main Table: `heatpump`

Stores time-series data with 30+ metrics:

| Column | Type | Description |
|--------|------|-------------|
| `event_timestamp` | TIMESTAMPTZ | Primary key, data collection timestamp |
| `heatpump_flowline_temp` | DOUBLE | Heat pump flow line temperature (°C) |
| `heatpump_return_line_temp` | DOUBLE | Return line temperature (°C) |
| `heatpump_current_cop` | DOUBLE | Current coefficient of performance |
| `heatpump_electric_energy` | DOUBLE | Cumulative electric energy (kWh) |
| `heatpump_heat_energy` | DOUBLE | Cumulative heat energy (kWh) |
| `external_power` | DOUBLE | External power consumption (W) |
| ... | ... | 25+ additional fields |

### Views & Functions

**`heatpump_cop_current`** - Real-time COP calculation for current year
```sql
SELECT * FROM heatpump_cop_current;
```

**`heatpump_external_power`** - Total external power consumption
```sql
SELECT * FROM heatpump_external_power;
```

**`heatpump_heatenergy_function(start, end)`** - Heat energy delta for date range
```sql
SELECT * FROM heatpump_heatenergy_function(
  '2024-01-01'::timestamptz,
  '2024-12-31'::timestamptz
);
```

**`heatpump_external_function(start, end)`** - External power for date range
```sql
SELECT heatpump_external_function(
  '2024-01-01'::timestamptz,
  '2024-12-31'::timestamptz
);
```

---

## 📊 Monitoring & Analytics

### Example Queries

**Daily energy consumption:**
```sql
SELECT 
  DATE(event_timestamp) as date,
  MAX(heatpump_electric_energy) - MIN(heatpump_electric_energy) as daily_kwh,
  AVG(heatpump_current_cop) as avg_cop
FROM heatpump
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(event_timestamp)
ORDER BY date DESC;
```

**Temperature trends:**
```sql
SELECT 
  event_timestamp,
  heatpump_flowline_temp,
  heatpump_return_line_temp,
  ambient_temperaturecalculated
FROM heatpump
WHERE event_timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY event_timestamp;
```

**Operating state distribution:**
```sql
SELECT 
  heatpump_operating_state,
  COUNT(*) as occurrences,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM heatpump
WHERE event_timestamp >= CURRENT_DATE
GROUP BY heatpump_operating_state
ORDER BY occurrences DESC;
```

---

## 🔧 Troubleshooting

### Common Issues

**❌ Cannot connect to MODBUS device**
```
Error: Failed to connect to Modbus TCP server
```
**Solution:**
- Verify heat pump IP address and port
- Check network connectivity: `ping 192.168.50.112`
- Ensure MODBUS TCP is enabled on heat pump
- Check firewall rules

**❌ Database connection failed**
```
Error: DATBASE_CONNECTION_STRING environment variable is required
```
**Solution:**
- Verify `.env` file exists and is loaded
- Check PostgreSQL connection string format
- Test connection: `psql postgresql://user:pass@host:5432/db`
- Ensure database user has INSERT permissions

**❌ Shelly device unreachable**
```
Error: ECONNREFUSED connecting to Shelly
```
**Solution:**
- Verify Shelly IP address
- Check Shelly is powered on and connected to network
- Test HTTP endpoint: `curl http://192.168.50.134/status`

**❌ Container keeps restarting**
```bash
docker logs heatpump_fetcher
```
Check logs for configuration errors or missing environment variables.

### Debug Mode

Enable verbose logging in `.env`:
```bash
VERBOSE_LOGGING=true
```

View logs:
```bash
docker-compose logs -f --tail=100 app
```

### Health Check

The container includes an HTTP health check that runs every 30 seconds:
```bash
# Check container health status
docker inspect heatpump_fetcher | grep -A 10 Health

# Test health endpoint directly
curl http://localhost:3000/health

# Use with monitoring tools (Prometheus, Nagios, etc.)
wget --spider http://localhost:3000/health
```

---

## 🛠️ Development

### Project Structure
```
heatpump_lambda/
├── src/
│   ├── modbus/
│   │   ├── modbus.ts           # MODBUS client implementation
│   │   ├── modbus-types.ts     # Type definitions
│   │   └── lambda-states.ts    # State mappings
│   ├── REST/
│   │   ├── shelly.ts           # Shelly API client
│   │   └── types.ts            # Shelly type definitions
│   ├── actionExecuter.ts       # Action execution logic
│   ├── configuration.ts        # Configuration loading and validation
│   ├── database.ts             # Database operations with error handling
│   ├── errorHandler.ts         # Reconnection logic with retry mechanism
│   ├── health.ts               # Health monitoring endpoint
│   ├── logger.ts               # Color logger implementation
│   ├── mapper.ts               # Data transformation
│   ├── result.ts               # Result and ActionResult types
│   ├── schema.ts               # Drizzle ORM schema
│   └── main.ts                 # Application entry point with timer management
├── docs/
│   ├── init.sql                # Database initialization
│   └── modbus.md               # MODBUS documentation
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Container definition
└── package.json                # Dependencies
```

### Tech Stack
- **Runtime:** Node.js 20 (Alpine Linux)
- **Language:** TypeScript 5.9
- **MODBUS:** modbus-serial
- **Database:** PostgreSQL with Drizzle ORM
- **HTTP Client:** Native fetch API

### Building

```bash
# Build TypeScript
npm run build

# Build Docker image
docker build -t heatpump-fetcher .

# Run tests (if available)
npm test
```

---

## 📝 License
Under GPL-2.0 see [GPL-2.0](https://opensource.org/license/gpl-2-0)
This project is provided as-is for personal and educational use.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review MODBUS documentation: `docs/modbus.md`

---

## 🙏 Acknowledgments

- Lambda heat pump MODBUS protocol documentation
- Shelly API documentation
- PostgreSQL time-series optimization techniques

---

**Made with ❤️ for smart home automation**
