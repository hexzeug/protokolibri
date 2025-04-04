import express from 'express';
import qrcode from 'qrcode';
import bcrypt from 'bcryptjs';
import db from '../services/db.js';
import {
  cryptoRandomString,
  MAX_CONNECTION_CODE_AGE,
  userAuth,
} from '../middleware/auth.js';
import { CONNECTOR_PATH, DASHBOARD_PATH } from '../app.js';
import { HEARTBEAT_FREQUENCY } from './devices.js';

const router = express.Router();

router.use(userAuth);

router.get('/devices', async (_req, res) => {
  const devices = await db.query(
    'SELECT name_id AS name, last_online AS lastOnline FROM device ORDER BY name_id'
  );
  const lastHeartbeat = Date.now() - HEARTBEAT_FREQUENCY - 5000; // 5s tolerance
  devices.forEach((device) => {
    if (device.lastOnline === null) {
      device.online = false;
      return;
    }
    device.lastOnline = Date.parse(device.lastOnline);
    device.online = device.lastOnline >= lastHeartbeat;
  });
  res.json(devices);
});

router.post('/devices', async (req, res) => {
  if (req.auth.user !== 'admin') {
    return res.status(403).send('Forbidden');
  }
  const devicesString = req.body.deviceList;
  if (typeof devicesString !== 'string') {
    return res.status(400).send('deviceList required');
  }
  const deviceNames = devicesString
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length);
  await db.query('DELETE FROM device WHERE name_id NOT IN (?)', [deviceNames]);
  await db.batch(
    `INSERT
      INTO device (name_id)
      VALUES (?)
      ON DUPLICATE KEY UPDATE name_id = name_id
    `,
    deviceNames
  );
  return res.redirect(303, DASHBOARD_PATH);
});

router.get('/devices/code', async (req, res) => {
  const [codeObj] = await db.query(
    'SELECT code, created_at FROM connection_code ORDER BY created_at DESC LIMIT 1'
  );
  let code = codeObj?.code;

  if (
    typeof codeObj === 'object' &&
    Date.now() - Date.parse(codeObj.created_at) > MAX_CONNECTION_CODE_AGE
  ) {
    await db.query('DELETE FROM connection_code WHERE code = ?', [code]);
    code = null;
  }

  if (typeof code !== 'string') {
    code = await cryptoRandomString(64);
    await db.query('INSERT INTO connection_code (code) VALUE (?)', [code]);
  }

  const url = `${req.protocol}://${req.host}${CONNECTOR_PATH}?code=${code}`;
  const qr = {
    svg: await qrcode.toString(url, {
      type: 'svg',
    }),
    png: await qrcode.toDataURL(url),
  };

  res.json({ code, url, qr });
});
router.delete('/devices/code', async (req, res) => {
  const code = req.query.code;
  if (typeof code !== 'string') {
    return res.status(400).send('Missing code');
  }
  await db.query('DELETE FROM connection_code WHERE code = ?', [code]);
  return res.status(204).send();
});

router.post('/password', async (req, res) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  if (typeof oldPassword !== 'string') {
    return res.status(400).send('oldPassword required');
  }
  if (typeof newPassword !== 'string') {
    return res.status(400).send('newPassword required');
  }
  // normal string compare is okay for old password
  // timing attacks are very unlikely at this point because you need to be logged in anyways:
  //    the comparison is between the password from the AUTH header and from the POST body
  // checking the old password is only a light protection against other people using your computer (if you leave it unlocked for example)
  if (oldPassword !== req.auth.password) {
    return res.status(403).send('Wrong current password');
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE user SET password_hash = ? WHERE name_id = ?', [
    hash,
    req.auth.user,
  ]);
  return res.redirect(303, DASHBOARD_PATH);
});

export default router;
