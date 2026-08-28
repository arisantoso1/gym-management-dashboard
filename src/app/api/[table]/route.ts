import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { isTableName } from "@/lib/gym-db";

type RouteContext = { params: Promise<{ table: string }> };

async function getTable(context: RouteContext) {
  const { table } = await context.params;
  return isTableName(table) ? table : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: Request, context: RouteContext) {
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: "Nama tabel tidak valid." }, { status: 404 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    const [rows] = id
      ? await pool.query<RowDataPacket[]>("SELECT * FROM ?? WHERE id = ?", [table, id])
      : await pool.query<RowDataPacket[]>("SELECT * FROM ??", [table]);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Tabel tidak dapat dibaca." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: "Nama tabel tidak valid." }, { status: 404 });
  let record: unknown;
  try {
    record = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload harus berupa JSON yang valid." }, { status: 400 });
  }
  try {
    if (!isRecord(record) || !record.id) return NextResponse.json({ error: "Record wajib memiliki id." }, { status: 400 });
    await pool.query<ResultSetHeader>("INSERT INTO ?? SET ?", [table, record]);
    return NextResponse.json(record, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "ID record sudah digunakan." }, { status: 409 });
    }
    return NextResponse.json({ error: "Record tidak dapat disimpan." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: "Nama tabel tidak valid." }, { status: 404 });
  let record: unknown;
  try {
    record = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload harus berupa JSON yang valid." }, { status: 400 });
  }
  try {
    if (!isRecord(record) || !record.id) return NextResponse.json({ error: "Record wajib memiliki id." }, { status: 400 });
    const { id, ...changes } = record;
    const [result] = await pool.query<ResultSetHeader>("UPDATE ?? SET ? WHERE id = ?", [table, changes, id]);
    if (result.affectedRows === 0) return NextResponse.json({ error: "Record tidak ditemukan." }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Record tidak dapat diperbarui." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: "Nama tabel tidak valid." }, { status: 404 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Parameter id wajib diisi." }, { status: 400 });
  try {
    const [result] = await pool.query<ResultSetHeader>("DELETE FROM ?? WHERE id = ?", [table, id]);
    if (result.affectedRows === 0) return NextResponse.json({ error: "Record tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Record tidak dapat dihapus." }, { status: 500 });
  }
}
