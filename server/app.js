import express from 'express';
import devices from './routes/devices.js';
import users from './routes/users.js';
import connector from './routes/connector.js';
import dashboard from './routes/dashboard.js';
import i18n from './middleware/i18n.js';

export const STATIC_PATH = '/resources';
export const DEVICES_PATH = '/api/ingest';
export const USERS_PATH = '/api/panel';
export const CONNECTOR_PATH = '/connect';
export const DASHBOARD_PATH = '/dashboard';

const app = express();

app.set('trust proxy', 'loopback');
app.set('view engine', 'pug');

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'development' && req.protocol !== 'https') {
    res.status(400).send('HTTP is not allowed. Use HTTPS');
  } else {
    next();
  }
});
app.use(express.json(), express.urlencoded());
app.use(i18n);
app.use(
  STATIC_PATH,
  express.static('public'),
  express.static('node_modules/bootstrap/dist'),
  express.static('node_modules/bootstrap-icons/font')
);
app.use(DASHBOARD_PATH, dashboard);
app.use(DEVICES_PATH, devices);
app.use(USERS_PATH, users);
app.use(CONNECTOR_PATH, connector);

app.get('/', (_req, res) => {
  return res.send(`
<h1>Temp homepage</h1>
<a href="${DASHBOARD_PATH}">Dashboard</a>
  `);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (process.env.NODE_ENV === 'development') {
    res.status(500).send(err);
  } else {
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`started server at ${HOST}:${PORT}`);
});
