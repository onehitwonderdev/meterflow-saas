import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";

let db: any;

export function setDb(database: any) {
  db = database;
}

export function getDb(): any {
  if (!db) {
    throw new Error("Database not initialized. Call setDb() first.");
  }
  return db;
}

export { db };