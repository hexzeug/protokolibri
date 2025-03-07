'use strict';

const t = (...args) => browser.i18n.getMessage(...args);

window.addEventListener('load', () => {
  document.documentElement.lang = t('@@ui_locale');
  document.querySelectorAll('[data-i18n]').forEach((elm) => {
    elm.innerHTML = t(elm.getAttribute('data-i18n'));
  });
  document.querySelector('#retry').addEventListener('click', login);
  document
    .querySelector('#close')
    .addEventListener('click', async () =>
      browser.tabs.remove((await browser.tabs.getCurrent()).id)
    );

  // wait for the dom to update
  setTimeout(login);
});

const setStatus = (success, message, retry = false) => {
  document.querySelector('#statusBox').classList.remove('hidden');
  document.querySelector('#status').innerHTML = success
    ? t('login_status_success')
    : t('login_status_failed');
  document.querySelector('#message').innerHTML = message;
  document.querySelector('#retry').classList.toggle('hidden', !retry);
  document.querySelector('#close').classList.toggle('hidden', !success);
};

let confirmed = false;

const login = async () => {
  document.querySelector('#statusBox').classList.add('hidden');

  // wait for the dom to update
  const { promise, resolve } = Promise.withResolvers();
  setTimeout(resolve, 1);
  await promise;

  // extract login data from get parameters
  const params = new URLSearchParams(document.location.search);
  const url = URL.parse(params.get('url'));
  const user = params.get('user');
  const password = params.get('password');
  const device = params.get('device');

  // cancel if data is malformed
  if (
    url === null ||
    user === null ||
    password === null ||
    device === null ||
    !/^[a-zA-Z][a-zA-Z0-9\-\.]*$/.test(user) ||
    !/^[\x21-\x7e]+$/.test(password) ||
    !/^[a-zA-Z0-9_\-\.]+$/.test(device)
  ) {
    setStatus(false, t('login_message_bad_data'));
    return;
  }

  // normalize url
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.search = '';

  // user confirms login
  if (!confirmed && !confirm(t('login_confirm', [url.href, user, device]))) {
    setStatus(false, t('login_message_canceled'), true);
    return;
  }
  confirmed = true;

  // check login data against server
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { Authorization: `Basic ${btoa(`${user}:${password}`)}` },
    });
    if (res.status === 401) {
      setStatus(false, t('login_message_unauthorized'));
      return;
    } else if (!res.ok) {
      setStatus(
        false,
        t('login_message_server_error', [res.status, res.statusText]),
        true
      );
      return;
    }
  } catch (e) {
    setStatus(false, t('login_message_network_error', e.toString()), true);
    return;
  }

  // store login data
  try {
    await browser.storage.local.set({
      server: { url: url.href, user, password, device },
    });
  } catch (e) {
    setStatus(false, t('login_message_internal_error', e.toString()), true);
    return;
  }

  // success message
  setStatus(true, t('login_message_success', [url.href, user, device]));
};
