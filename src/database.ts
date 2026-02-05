import { heatpump, type HeatpumpRecord } from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema"; // Deine

export class Database {
  private db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    const pool = new Pool({
      connectionString,
    });
    this.db = drizzle(pool, { schema });
  }

  async insertHeatpumpRecord(data: HeatpumpRecord): Promise<void> {
    await this.db.insert(heatpump).values(data);
  }

  async insertHeatpumpRecords(data: HeatpumpRecord[]): Promise<void> {
    if (data.length === 0) return;
    await this.db.insert(heatpump).values(data);
  }
}

export default Database;
