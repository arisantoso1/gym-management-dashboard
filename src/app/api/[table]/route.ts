import { NextResponse } from "next/server";
import { getRecordId, isTableName, readDatabase, writeDatabase } from "@/lib/gym-db";

type RouteContext = { params: Promise<{ table: string }> };

async function getTable(context: RouteContext) {
  const { table } = await context.params;
  return isTableName(table) ? table : null;
}

export async function GET(request: Request, context: RouteContext) {
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: "Nama tabel tidak valid." }, { status: 404 });
  try {
    const database = await readDatabase();
    const id = new URL(request.url).searchParams.get("id");
    const rows = id ? database[table].filter((row) => getRecordId(row) === id) : database[table];
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
    if (!getRecordId(record)) return NextResponse.json({ error: "Record wajib memiliki id." }, { status: 400 });
    const database = await readDatabase();
    if (database[table].some((row) => getRecordId(row) === getRecordId(record))) return NextResponse.json({ error: "ID record sudah digunakan." }, { status: 409 });
    database[table].unshift(record);
    await writeDatabase(database);
    return NextResponse.json(record, { status: 201 });
  } catch {
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
    const id = getRecordId(record);
    if (!id) return NextResponse.json({ error: "Record wajib memiliki id." }, { status: 400 });
    const database = await readDatabase();
    const index = database[table].findIndex((row) => getRecordId(row) === id);
    if (index < 0) return NextResponse.json({ error: "Record tidak ditemukan." }, { status: 404 });
    database[table][index] = record;
    await writeDatabase(database);
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
    const database = await readDatabase();
    const originalLength = database[table].length;
    database[table] = database[table].filter((row) => getRecordId(row) !== id);
    if (database[table].length === originalLength) return NextResponse.json({ error: "Record tidak ditemukan." }, { status: 404 });
    await writeDatabase(database);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Record tidak dapat dihapus." }, { status: 500 });
  }
}
