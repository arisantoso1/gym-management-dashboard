import { promises as fs } from "node:fs";
import path from "node:path";

export const tableNames = ["members", "transactions", "visits", "petugas", "personalTrainers", "paket"] as const;
export type TableName = (typeof tableNames)[number];

type GymDatabase = Record<TableName, unknown[]> & { checkIns: number; revenue: { month: string; value: number }[] };

const databasePath = path.join(process.cwd(), "public", "data", "gym-data.json");

export async function readDatabase(): Promise<GymDatabase> {
  const content = await fs.readFile(databasePath, "utf8");
  return JSON.parse(content) as GymDatabase;
}

export async function writeDatabase(database: GymDatabase) {
  const content = `${JSON.stringify(database, null, 2)}\n`;
  await fs.writeFile(databasePath, content, "utf8");
}

export function isTableName(value: string): value is TableName {
  return tableNames.includes(value as TableName);
}

export function getRecordId(record: unknown) {
  return typeof record === "object" && record !== null && "id" in record && typeof record.id === "string" ? record.id : undefined;
}
