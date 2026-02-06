# Heatpump Lambda

This application fetches 
## Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 1.29 or later)
- Network access to Modbus TCP server (port 502)
- Network access to Shelly device (REST API)

## Quick Start

### 1. Clone/Setup the Repository

```bash
cd heatpump_lambda
```

### 2. Create Environment Configuration

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Modbus Configuration
MODBUS_HOST=192.168.50.112      # Your Modbus TCP server IP
MODBUS_PORT=502                  # Modbus TCP port (default: 502)
MODBUS_TIMEOUT=2000              # Timeout in milliseconds

# Shelly Device
SHELLY_IP=192.168.50.134         # Your Shelly device IP

# PostgreSQL Database
DATABASE_CONNECTION_STRING=postgresql://USER:PASS@IPORDNS:5432/DATABASE

# Application Interval
INTERVAL_TIME=30              # Data fetch interval in seconds
```

### 3. Start the Application

```bash
docker-compose up -d
```

This will:
- Build the application Docker image
- Start the heatpump application container

### 4. Verify Everything is Running

```bash
docker-compose ps
```

You should see two containers running:
- `heatpump_app` - Application

### 5. Check Application Logs

```bash
docker-compose logs -f app
```

You should see messages like:
```
app_1  | Starting main function with 30-second interval...
app_1  | Modbus: 192.168.50.112:502
app_1  | Shelly IP: 192.168.50.134
app_1  | Executing scheduled action...
```

## Managing the Application

### Stop the Application

```bash
docker-compose down
```

### Stop and Remove Data (Clean Start)

```bash
docker-compose down -v
```


### Rebuild the Application Image

```bash
docker-compose build --no-cache
```

## Production Deployment

For production use:

1. **Use a Strong Database Password**: Change `DATABASE_CONNECTION_STRING` in `.env`
3. **Use Environment Variables**: Don't commit `.env` to version control
4. **Enable Logging**: Adjust Docker logging in `docker-compose.yml`
5. **Resource Limits**: Add CPU and memory constraints in `docker-compose.yml`

Example with resource limits:

```yaml
app:
  # ... other config ...
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 256M
      reservations:
        cpus: '0.25'
        memory: 128M
```

## Networking

The application uses a custom bridge network (`heatpump_network`) for internal communication:
- The Modbus and Shelly communication happens via your host network (requires network connectivity)

## Troubleshooting

### Database Connection Error

If you see `Failed to connect to PostgreSQL`:
1. Check if PostgreSQL is running
2. Verify `.env` file has correct credentials

### Cannot Connect to Modbus/Shelly

Make sure:
1. Network connectivity exists from the Docker container to those devices
2. IP addresses are correct in `.env`
3. Firewall allows connections to ports 502 (Modbus) and 80 (Shelly)

## Development

For local development without Docker:

```bash
# Install dependencies
npm install

# Set environment variables
export DATBASE_CONNECTION_STRING="postgresql://user:password@localhost:5432/database"
export MODBUS_HOST=192.168.50.112 
export MODBUS_PORT=502                  
export MODBUS_TIMEOUT=2000             
export SHELLY_IP=192.168.50.134       
export DATABASE_CONNECTION_STRING=postgresql://USER:PASS@IPORDNS:5432/DATABASE
export INTERVAL_TIME=30    
# Run the application
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────┐
│        Docker Host Machine                  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │     heatpump_network (bridge)         │  │
│  │                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │  heatpump    │  │  PostgreSQL  │ │  │
│  │  │  app         │──│  Database    │ │  │
│  │  └──────────────┘  └──────────────┘ │  │
│  │         │                           │  │
│  └─────────┼───────────────────────────┘  │
│            │                              │
│  ┌─────────┴──────────────────────────┐  │
│  │    External Network Access         │  │
│  │  - Modbus TCP (192.168.50.112)    │  │
│  │  - Shelly REST (192.168.50.134)   │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Files

- `Dockerfile` - Application container definition
- `docker-compose.yml` - Orchestration configuration
- `.dockerignore` - Files to exclude from Docker build
- `.env.example` - Environment variable template
- `.env` - Your local environment configuration (not committed to git)
