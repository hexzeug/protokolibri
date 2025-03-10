import basicAuth from 'express-basic-auth';
import bcrypt from 'bcryptjs';
import db from './db.js';

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
});
