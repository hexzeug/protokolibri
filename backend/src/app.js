import express from 'express';
import devices from './devices.js';

const app = express();

app.use(express.json());

app.use('/api/v1/ingest', devices);

app.get('/', (_req, res) => {
  return res.send('<a href="/login">Temp login</a>');
});

app.get('/login', (_req, res) => {
  res.redirect(
    'http://192.168.178.108:8080/?protokolibri=login&url=http%3A%2F%2F192.168.178.108:8080%2Fapi%2Fv1%2Fingest%2F&user=device&password=test'
  );
});

if (process.env.NODE_ENV === 'development') {
  app.use((err, _req, res, _next) => {
    console.error(err);
    return res.status(500).send(err);
  });
}

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`started server at ${HOST}:${PORT}`);
});
