import express from 'express';
import devices from './devices.js';

const app = express();

app.use(express.json());

app.use('/api/v1/ingest', devices);

app.get('/', async (req, res) => {
  return res.send('Hello World!');
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
