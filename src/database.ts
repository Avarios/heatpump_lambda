import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import { type Result, type ResultError, ErrResult, OkResult} from "./result.js";

export class Database {
  private db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    const pool = new Pool({
      connectionString,
    });
    this.db = drizzle(pool, { schema });
  }

  async insertHeatpumpRecord(data: schema.HeatpumpRecord): Promise<Result<number,ResultError>> {
    try {
      const result = await this.db.insert(schema.heatpump).values(data);
      if(result.rowCount === undefined) {
        console.error("Unexpected result from database insert:", result);
        return ErrResult({ reason: "Failed to insert heatpump record into Database due to undefined result" });
      }
      return OkResult(result.rowCount ?? 0);
    } catch (error) {
      console.error("Error inserting heatpump record into Database:", error);
      return ErrResult({ reason: "Failed to insert heatpump record into Database" });
    }
  }
}

export default Database;
