import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

// GET Detail: Mengambil user berdasarkan ID
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name, email FROM users WHERE id = ?', [id]);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan database.' }, { status: 500 });
  }
}

// PUT: Mengubah data user berdasarkan ID
export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { name, email } = await request.json();

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Data user berhasil diperbarui' }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan database.' }, { status: 500 });
  }
}

// DELETE: Menghapus user berdasarkan ID
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const [result] = await pool.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan database.' }, { status: 500 });
  }
}