import express from 'express';
import devices from './devices.js';
import users from './users.js';

export const DEVICES_PATH = '/api/ingest';
export const USERS_PATH = '/api/panel';

const app = express();

app.set('trust proxy', 'loopback');

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'development' && req.protocol !== 'https') {
    res.status(400).send('HTTP is not allowed. Use HTTPS');
  } else {
    next();
  }
});
app.use(express.json(), express.urlencoded());
app.use(DEVICES_PATH, devices);
app.use(USERS_PATH, users);

app.get('/', (_req, res) => {
  return res.send(`
<h1>Temp homepage</h1>
<p><a href="javascript:void(0);">Temp login</a></p>
<img src="">
<div style="width: 20%"></div>
<p>
<button onClick="load();">load connection code</button>
<button onClick="revoke();">revoke connection code</button>
</p>
<script>
var code;
async function load() {
    const data = await (await fetch('${USERS_PATH}/devices/code')).json();
    code = data.code;
    document.querySelector('a').href = data.url;
    document.querySelector('img').src = data.qr.png;
    document.querySelector('div').innerHTML = data.qr.svg;
}
async function revoke() {
    await fetch('${USERS_PATH}/devices/code?code=' + code, {method:'DELETE'});
}
</script>
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
