import express from 'express';
import cors from 'cors';
import { deviceAuth } from '../middleware/auth.js';
import db, { EVENT_TYPES } from '../services/db.js';

export const HEARTBEAT_FREQUENCY = 30 * 1000; // 30 seconds

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

router.use(deviceAuth);

router.post('/heartbeat', async (req, res) => {
  await db.query(
    'UPDATE device SET last_online = CURRENT_TIMESTAMP() WHERE name_id = ?',
    [req.auth.user]
  );

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
    [deviceName, tabId, type, new Date(time).toISOString(), url, title]
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
        new Date(time).toISOString(),
        url,
        title,
      ])
    );
  }

  return res.status(201).send();
});

export default router;
