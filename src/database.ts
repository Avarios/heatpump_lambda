import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import {
  type Result,
  type ResultError,
  ErrResult,
  OkResult,
} from "./result.js";

export class Database {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
    });
    this.db = drizzle(this.pool, { schema });
  }

  handleError(callback: () => void) {
    this.pool.on("error", (err) => {
      console.error("Unexpected database pool error:", err);
      callback();
    });
  }

  async connect() {
    return await this.pool.connect();
  }



  async insertHeatpumpRecord(
    data: schema.HeatpumpRecord,
  ): Promise<Result<number, ResultError>> {
    try {
      const result = await this.db.insert(schema.heatpump).values(data);
      if (result.rowCount === undefined) {
        console.error("Unexpected result from database insert:", result);
        return ErrResult({
          reason:
            "Failed to insert heatpump record into Database due to undefined result",
        });
      }
      return OkResult(result.rowCount ?? 0);
    } catch (error) {
      console.error("Error inserting heatpump record into Database:", error);
      return ErrResult({
        reason: "Failed to insert heatpump record into Database",
      });
    }
  }
}

export default Database;
