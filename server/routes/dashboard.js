import express from 'express';
import db from '../services/db.js';
import { userAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(userAuth);

router.get('/', async (req, res) => {
  const devices = await db.query(
    'SELECT name_id AS name FROM device ORDER BY name_id'
  );
  const users = await db.query(
    'SELECT name_id AS name FROM user ORDER BY name_id = "admin" DESC, name_id ASC'
  );
  users.forEach((user) => (user.admin = user.name === 'admin'));
  const user = {
    name: req.auth.user,
    admin: req.auth.user === 'admin',
  };
  res.render('dashboard', { user, devices, users });
});

export default router;
