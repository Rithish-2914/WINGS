
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

// Supabase/PostgreSQL connection configuration
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide your Supabase connection string.",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool, { schema });
