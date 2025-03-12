import express from 'express';
import devices from './devices.js';

const app = express();

app.set('trust proxy', 'loopback');

app.use(express.json(), express.urlencoded());

app.use('/api/ingest', devices);

app.get('/', (_req, res) => {
  return res.send(`
<h1>Temp homepage</h1>
<a href="/api/ingest/connect?code=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">Temp login</a>
  `);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).send(err);
  }
  res.status(500).send('Internal Server Error');
});

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`started server at ${HOST}:${PORT}`);
});
