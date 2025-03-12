import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { connectionCodeAuth, cryptoRandomString, deviceAuth } from './auth.js';
import db, { EVENT_TYPES } from './db.js';

const validEvent = (event) =>
  typeof event === 'object' &&
  Number.isInteger(event.tabId) &&
  EVENT_TYPES.includes(event.type) &&
  Number.isInteger(event.time) &&
  !isNaN(new Date(event.time).getTime()) &&
  (!event.url || (typeof event.url === 'string' && event.url.length < 2083)) &&
  (!event.title ||
    (typeof event.title === 'string' && event.title.length < 1024));

const router = express.Router();

router.use(cors());

router.use((req, res, next) => {
  if (req.path.startsWith('/connect')) {
    connectionCodeAuth(req, res, next);
  } else {
    deviceAuth(req, res, next);
  }
});

router.get('/connect', (_req, res) => {
  return res.send(`
<h1>Temp Login Page</h1>
<form method="post">
<input type="test" name="device" value="device" />
<button type="submit">Login</button>
</form>
  `);
});

router.post('/connect', async (req, res) => {
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

  const apiUrl = `${req.protocol}://${req.host}${req.baseUrl}`;
  const params = new URLSearchParams({
    code: req.auth.code,
    protokolibri: 'login',
    url: apiUrl,
    user: deviceName,
    password: passkey,
  });
  // 303 See Other: method is reset to GET and body is stripped
  return res.redirect(303, `connect/redirect?${params}`);
});

router.get('/connect/redirect', (_req, res) => {
  return res.send('<h1>Temp extension redirect page</a>');
});

router.post('/heartbeat', async (req, res) => {
  await db.query('UPDATE device SET last_online = NOW(3) WHERE name_id = ?', [
    req.auth.user,
  ]);

  return res.status(201).send();
});

router.post('/event', async (req, res) => {
  if (!validEvent(req.body)) return res.status(400).send('Invalid event');

  const { tabId, type, time, url, title } = req.body;
  const deviceName = req.auth.user;

  await db.query(
    `INSERT
      INTO tab_event (device_name_id, tab_id, event_type, event_timestamp, tab_url, tab_title)
      VALUE (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE tab_id = tab_id
    `, // effectively ignore duplicates by updating with same value
    [deviceName, tabId, type, new Date(time), url, title]
  );

  return res.status(201).send();
});

router.post('/events', async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).send('Event list required');
  }

  const events = req.body.filter(validEvent); // ignoring invalid events

  const deviceName = req.auth.user;

  if (events.length > 0) {
    await db.batch(
      `INSERT
        INTO tab_event (device_name_id, tab_id, event_type, event_timestamp, tab_url, tab_title)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE tab_id = tab_id
      `, // effectively ignore duplicates by updating with same value
      events.map(({ tabId, type, time, url, title }) => [
        deviceName,
        tabId,
        type,
        new Date(time),
        url,
        title,
      ])
    );
  }

  return res.status(201).send();
});

export default router;
