import express from 'express';
const app = express();

import { createPool } from 'mariadb';
const pool = createPool({
  host: process.env.MARIADB_HOST,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  connectionLimit: 5,
  trace: process.env.NODE_ENV === 'development',
});

app.get('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const data = await conn.query('SELECT CURRENT_TIMESTAMP');
    res.send(data);
  } catch (e) {
    console.error(e);
  } finally {
    conn.end();
  }
});

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`started server at ${HOST}:${PORT}`);
});
