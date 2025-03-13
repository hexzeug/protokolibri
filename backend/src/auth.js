import basicAuth from 'express-basic-auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { promisify } from 'util';
import db from './db.js';

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
    if (user?.passkey_hash === undefined) return callback(null, false);
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
  if (code === undefined) return unauthorized();
  const [codeObj] = await db.query(
    'SELECT code, created_at FROM connection_code WHERE code = ? LIMIT 1',
    [code]
  );
  if (codeObj === undefined) return unauthorized();

  if (Date.now() - Date.parse(codeObj.created_at) > MAX_CONNECTION_CODE_AGE) {
    await db.query('DELETE FROM connection_code WHERE code = ?', [code]);
    return unauthorized();
  }

  req.auth = { code };

  return next();
};

export const userAuth = (_req, _res, next) => next();
