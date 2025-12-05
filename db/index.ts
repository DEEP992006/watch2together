import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (!client || !db) {
    const connectionString = process.env.DATABASE_URL;
    client = postgres(connectionString, { max: 1 });
    db = drizzle(client, { schema });
  }

  return db;
}
