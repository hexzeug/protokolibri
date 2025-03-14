import express from 'express';
import qrcode from 'qrcode';
import db from '../services/db.js';
import {
  cryptoRandomString,
  MAX_CONNECTION_CODE_AGE,
  userAuth,
} from '../middleware/auth.js';
import { CONNECTOR_PATH } from '../app.js';

const router = express.Router();

router.use(userAuth);

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
  const color = req.body?.color;
  const qr = {
    svg: await qrcode.toString(url, {
      type: 'svg',
      color,
    }),
    png: await qrcode.toDataURL(url, { color }),
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

export default router;
