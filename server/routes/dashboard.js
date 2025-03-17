import express from 'express';
import db from '../services/db.js';
import { STATIC_PATH, USERS_PATH } from '../app.js';
import { userAuth } from '../middleware/auth.js';
import { HEARTBEAT_FREQUENCY } from './devices.js';

const router = express.Router();

router.use(userAuth);

router.get('/', async (req, res) => {
  const devices = await db.query(
    'SELECT name_id AS name, FLOOR(UNIX_TIMESTAMP(last_online) * 1000) as lastOnline FROM device ORDER BY name_id'
  );
  const now = Date.now();
  devices.forEach(
    (device) => (device.online = now - device.lastOnline < HEARTBEAT_FREQUENCY)
  );
  const users = await db.query(
    'SELECT name_id AS name FROM user ORDER BY name_id = "admin" DESC, name_id ASC'
  );
  users.forEach((user) => (user.admin = user.name === 'admin'));
  const user = {
    name: req.auth.user,
    admin: req.auth.user === 'admin',
  };
  res.render('dashboard', { STATIC_PATH, USERS_PATH, user, devices, users });
});

export default router;
