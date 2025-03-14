import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../services/db.js';
import { CONNECTOR_PATH, DEVICES_PATH } from '../app.js';
import { connectionCodeAuth, cryptoRandomString } from '../middleware/auth.js';

const router = express.Router();

router.use(connectionCodeAuth);

router.get('/', async (_req, res) => {
  const deviceList = await db.query(
    'SELECT name_id AS name, last_online IS NOT NULL as connected FROM device ORDER BY connected, name_id;'
  );
  const devices = [[], []];
  deviceList.forEach((d) => devices[d.connected].push(d));
  return res.render('connector', { devices });
});

router.post('/', async (req, res) => {
  const deviceName = req.body?.device;
  if (typeof deviceName !== 'string') {
    return res.status(400).send('Device name required');
  }

  const [deviceExists] = await db.query(
    'SELECT 1 FROM device WHERE name_id = ? LIMIT 1',
    [deviceName]
  );
  if (!deviceExists) return res.status(404).send('Device not found');

  const passkey = await cryptoRandomString(32);
  const hash = await bcrypt.hash(passkey, 10);
  await db.query(
    'UPDATE device SET passkey_hash = ?, last_online = NULL WHERE name_id = ?',
    [hash, deviceName]
  );

  const apiUrl = `${req.protocol}://${req.host}${DEVICES_PATH}`;
  const params = new URLSearchParams({
    code: req.auth.code,
    protokolibri: 'login',
    url: apiUrl,
    user: deviceName,
    password: passkey,
  });
  // 303 See Other: method is reset to GET and body is stripped
  return res.redirect(303, `${CONNECTOR_PATH}/redirect?${params}`);
});

router.get('/redirect', (_req, res) => {
  return res.render('connector/redirect');
});

export default router;
