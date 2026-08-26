import { NextResponse } from "next/server";
import { readDatabase, writeDatabase } from "@/lib/gym-db";

export async function GET() {
  try {
    return NextResponse.json(await readDatabase());
  } catch {
    return NextResponse.json({ error: "Database gym tidak dapat dibaca." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const database = await request.json();
    if (!database || typeof database !== "object") return NextResponse.json({ error: "Payload database tidak valid." }, { status: 400 });
    await writeDatabase(database);
    return NextResponse.json(database);
  } catch {
    return NextResponse.json({ error: "Database gym tidak dapat disimpan." }, { status: 500 });
  }
}
