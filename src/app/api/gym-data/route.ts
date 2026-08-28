import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { tableNames } from "@/lib/gym-db";

export async function GET() {
  try {
    const entries = await Promise.all(tableNames.map(async (table) => {
      const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM ??", [table]);
      return [table, rows] as const;
    }));
    const data = Object.fromEntries(entries);
    return NextResponse.json({ ...data, checkIns: data.visits.length, revenue: [] });
  } catch {
    return NextResponse.json({ error: "Database gym tidak dapat dibaca." }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ error: "Gunakan endpoint tabel untuk mengubah data." }, { status: 405, headers: { Allow: "GET" } });
}
