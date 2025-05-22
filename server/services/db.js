import { createPool } from 'mariadb';

export const EVENT_TYPES = ['created', 'activated', 'updated', 'removed'];

const MARIADB_HOST = process.env.MARIADB_HOST;
const MARIADB_PORT = parseInt(process.env.MARIADB_PORT) || 3306;
const MARIADB_USER = process.env.MARIADB_USER;
const MARIADB_PASSWORD = process.env.MARIADB_PASSWORD;
const MARIADB_DATABASE = process.env.MARIADB_DATABASE;

if (
  typeof MARIADB_HOST != 'string' ||
  typeof MARIADB_USER != 'string' ||
  typeof MARIADB_PASSWORD != 'string' ||
  typeof MARIADB_DATABASE != 'string'
) {
  throw new Error('Database credentials missing');
}

const SSL = process.env.MARIADB_SSL === '1';
const TRUST_SERVER = process.env.MARIADB_SSL_TRUST_SERVER_UNSAFE === '1';

console.log(
  `connecting to database '${MARIADB_DATABASE}' as '${MARIADB_USER}' at '${MARIADB_HOST}:${MARIADB_PORT}' (encrypted: ${SSL}${TRUST_SERVER ? ', unsafely trusted' : ''})`
);
const pool = createPool({
  host: MARIADB_HOST,
  port: MARIADB_PORT,
  user: MARIADB_USER,
  password: MARIADB_PASSWORD,
  database: MARIADB_DATABASE,
  connectionLimit: 5,
  trace: process.env.NODE_ENV === 'development',
  ssl: SSL && {
    rejectUnauthorized: !TRUST_SERVER,
  },
  timezone: process.env.TZ ?? 'local',
});

await pool.importFile({ file: './schema.sql' });

console.log('database setup completed');

export default pool;
