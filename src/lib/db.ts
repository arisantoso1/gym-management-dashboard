import mysql from 'mysql2/promise';

const requiredEnvironment = ['DB_HOST', 'DB_USER', 'DB_DATABASE'] as const;
for (const key of requiredEnvironment) {
  if (!process.env[key]) throw new Error(`${key} wajib dikonfigurasi di .env.local`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;