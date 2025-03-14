import express from 'express';
import { STATIC_PATH } from '../app.js';
import { userAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(userAuth);

router.get('/', (_req, res) => {
  res.render('dashboard', { STATIC_PATH });
});

export default router;
