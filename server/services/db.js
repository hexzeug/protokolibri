import { createPool } from 'mariadb';

export const EVENT_TYPES = ['created', 'activated', 'updated', 'removed'];

const pool = createPool({
  host: process.env.MARIADB_HOST,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  connectionLimit: 5,
  trace: process.env.NODE_ENV === 'development',
  timezone: process.env.TZ,
});

await pool.importFile({ file: './schema.sql' });

export default pool;
