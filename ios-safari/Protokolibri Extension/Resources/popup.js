'use strict';

const t = (...args) => browser.i18n.getMessage(...args);
const textEncoder = new TextEncoder();

window.addEventListener('DOMContentLoaded', async () => {
  const h = document.querySelector('h3');
  h.innerHTML = t('extension_name');
  const p = document.querySelector('p');
  const { server } = await browser.storage.local.get('server');

  if (!server) {
    p.innerHTML = t('popup_unpaired');
    return;
  }
  p.innerHTML = t('popup_data', [server.url, server.user]);

  try {
    const res = await fetch(server.url + 'heartbeat', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Basic ${textEncoder
          .encode(`${server.user}:${server.password}`)
          .toBase64()}`,
      },
    });
    if (res.ok) {
      p.innerHTML += t('popup_status', 'OK');
    } else {
      p.innerHTML += t('popup_status', `${res.status} ${res.statusText}`);
    }
  } catch (e) {
    p.innerHTML += t('popup_status', `Network Error: ${e.message}`);
  }
});
