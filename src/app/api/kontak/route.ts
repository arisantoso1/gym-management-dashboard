import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

// GET: Mengambil semua data user
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name, email, created_at FROM users');
    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan database.' }, { status: 500 });
  }
}

// POST: Menambahkan user baru
export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    // Validasi sederhana
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Name dan Email wajib diisi' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );

    return NextResponse.json(
      { success: true, message: 'User berhasil dibuat', id: result.insertId },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan database.' }, { status: 500 });
  }
}