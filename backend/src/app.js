import express from 'express';
import { deviceAuth } from './auth.js';

const app = express();

app.use(deviceAuth);

app.get('/', async (req, res) => {
  res.json(req.auth);
});

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`started server at ${HOST}:${PORT}`);
});
