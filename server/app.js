import express from 'express';
import helmet from 'helmet';
import devices from './routes/devices.js';
import users from './routes/users.js';
import connector from './routes/connector.js';
import dashboard from './routes/dashboard.js';
import i18n from './middleware/i18n.js';
import pkg from './package.json' with { type: 'json' };

export const STATIC_PATH = '/resources';
export const DEVICES_PATH = '/api/ingest';
export const USERS_PATH = '/api/panel';
export const CONNECTOR_PATH = '/connect';
export const DASHBOARD_PATH = '/dashboard';

const PORT = process.env.PORT || '8080';
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
export const PUBLIC_HOST = process.env.PUBLIC_HOST || `${HOSTNAME}:${PORT}`;

const app = express();

app.set('trust proxy', 'loopback');
app.set('view engine', 'pug');

// security middleware
if (process.env.NODE_ENV !== 'development') {
  app.use(helmet());
  app.use((req, res, next) => {
    if (req.protocol !== 'https') {
      res.redirect(301, `https://${PUBLIC_HOST}${req.originalUrl}`);
    } else {
      next();
    }
  });
} else {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          upgradeInsecureRequests: null,
        },
      },
      strictTransportSecurity: false,
    })
  );
}

// request parsing middleware
app.use(express.json(), express.urlencoded());

// tools middleware
app.use(i18n);
app.use(async (_req, res, next) => {
  res.locals.pkg = pkg;
  res.locals.STATIC_PATH = STATIC_PATH;
  res.locals.DEVICES_PATH = DEVICES_PATH;
  res.locals.USERS_PATH = USERS_PATH;
  res.locals.CONNECTOR_PATH = CONNECTOR_PATH;
  res.locals.DASHBOARD_PATH = DASHBOARD_PATH;
  next();
});

// routes
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

// error handling middleware
app.use((_req, res) => {
  res.status(404).send('Not Found');
});
if (process.env.NODE_ENV === 'development') {
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).send(err);
  });
} else {
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
  });
}

console.log('starting server...');
app.listen(PORT, HOSTNAME, () => {
  console.log(`started server at ${HOSTNAME}:${PORT}`);
});
