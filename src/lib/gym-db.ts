export const tableNames = ["members", "transactions", "visits", "petugas", "personalTrainers", "paket"] as const;
export type TableName = (typeof tableNames)[number];

export function isTableName(value: string): value is TableName {
  return tableNames.includes(value as TableName);
}
