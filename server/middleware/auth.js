import basicAuth from 'express-basic-auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { promisify } from 'util';
import db from '../services/db.js';

export const MAX_CONNECTION_CODE_AGE = 30 * 60 * 1000; // 30 min

const cryptoRandomBytesAsync = promisify(crypto.randomBytes);

export const cryptoRandomString = async (length) =>
  (await cryptoRandomBytesAsync(Math.ceil((length * 8) / 6)))
    .toString('base64url')
    .slice(0, length);

const authDevice = async (username, passkey, callback) => {
  try {
    const [user] = await db.query(
      'SELECT passkey_hash FROM device WHERE name_id = ? LIMIT 1',
      [username]
    );
    if (user === undefined || typeof user.passkey_hash !== 'string') {
      return callback(null, false);
    }
    const correct = await bcrypt.compare(passkey, user.passkey_hash);
    return callback(null, correct);
  } catch (e) {
    return callback(e);
  }
};

export const deviceAuth = basicAuth({
  authorizer: authDevice,
  authorizeAsync: true,
  challenge: true,
  realm: 'protokolibri device interface',
  unauthorizedResponse: 'Unauthorized',
});

export const connectionCodeAuth = async (req, res, next) => {
  const unauthorized = () => res.status(401).send('Unauthorized');
  const code = req.query.code;
  if (typeof code !== 'string') return unauthorized();

  const expiration = new Date(Date.now() - MAX_CONNECTION_CODE_AGE);
  const codes = await db.query(
    'SELECT * FROM connection_code WHERE code = ? AND created_at > ? LIMIT 1',
    [code, expiration.toISOString()]
  );
  if (!codes.length) return unauthorized();

  req.auth = { code };

  return next();
};

const initDefaultUser = async () => {
  const defaultAdminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (typeof defaultAdminPassword !== 'string') return;
  const [{ admin }] = await db.query(
    'SELECT COUNT(*) AS admin FROM user WHERE name_id = "admin"'
  );
  if (admin) return;
  const hash = await bcrypt.hash(defaultAdminPassword, 10);
  await db.query(
    'INSERT INTO user (name_id, password_hash) VALUE ("admin", ?)',
    [hash]
  );
};

const authUser = async (username, password, callback) => {
  try {
    const [user] = await db.query(
      'SELECT password_hash FROM user WHERE name_id = ? LIMIT 1',
      [username]
    );
    if (user === undefined || typeof user.password_hash !== 'string') {
      return callback(null, false);
    }
    const correct = await bcrypt.compare(password, user.password_hash);
    return callback(null, correct);
  } catch (e) {
    return callback(e);
  }
};

export const userAuth = basicAuth({
  authorizer: authUser,
  authorizeAsync: true,
  challenge: true,
  realm: 'protokolibri',
  unauthorizedResponse: 'Unauthorized',
});

initDefaultUser();
