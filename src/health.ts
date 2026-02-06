import { createServer, IncomingMessage, ServerResponse } from "http";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  checks: {
    database: boolean;
    modbus: boolean;
    lastFetch: {
      success: boolean;
      timestamp: string | null;
      ageSeconds: number | null;
    };
  };
}

export class HealthMonitor {
  private lastFetchTime: Date | null = null;
  private lastFetchSuccess: boolean = false;
  private isDatabaseConnected: boolean = false;
  private isModbusConnected: boolean = false;
  private server: ReturnType<typeof createServer> | null = null;

  constructor(private port: number = 3000) {}

  start(): void {
    this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (req.url === "/health" && req.method === "GET") {
        const health = this.getHealthStatus();
        const statusCode = health.status === "healthy" ? 200 : 503;
        
        res.writeHead(statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify(health, null, 2));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });

    this.server.listen(this.port, () => {
      console.log(`Health check endpoint available at http://localhost:${this.port}/health`);
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
    }
  }

  updateDatabaseStatus(connected: boolean): void {
    this.isDatabaseConnected = connected;
  }

  updateModbusStatus(connected: boolean): void {
    this.isModbusConnected = connected;
  }

  updateLastFetch(success: boolean): void {
    this.lastFetchTime = new Date();
    this.lastFetchSuccess = success;
  }

  private getHealthStatus(): HealthStatus {
    const now = new Date();
    const ageSeconds = this.lastFetchTime
      ? Math.floor((now.getTime() - this.lastFetchTime.getTime()) / 1000)
      : null;

    const isHealthy =
      this.isDatabaseConnected &&
      this.isModbusConnected &&
      this.lastFetchSuccess &&
      (ageSeconds === null || ageSeconds < 120); 

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: now.toISOString(),
      checks: {
        database: this.isDatabaseConnected,
        modbus: this.isModbusConnected,
        lastFetch: {
          success: this.lastFetchSuccess,
          timestamp: this.lastFetchTime?.toISOString() || null,
          ageSeconds,
        },
      },
    };
  }
}
