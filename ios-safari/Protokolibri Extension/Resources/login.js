'use strict';

const t = (...args) => browser.i18n.getMessage(...args);

window.addEventListener('load', () => {
  document.documentElement.lang = t('@@ui_locale');
  document.querySelectorAll('[data-i18n]').forEach((elm) => {
    elm.innerHTML = t(elm.getAttribute('data-i18n'));
  });
  document.querySelector('#retry').addEventListener('click', login);

  // wait for the dom to update
  setTimeout(login);
});

const login = async () => {
  const box = document.querySelector('#statusBox');
  const status = document.querySelector('#status');
  const message = document.querySelector('#message');
  const retry = document.querySelector('#retry');
  retry.classList.add('hidden');

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
    box.classList.remove('hidden');
    status.innerHTML = t('login_status_failed');
    message.innerHTML = t('login_message_bad_data');
    return;
  }

  // normalize url
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.search = '';

  // user confirms login
  if (!confirm(t('login_confirm', [url.href, user, device]))) {
    box.classList.remove('hidden');
    status.innerHTML = t('login_status_failed');
    message.innerHTML = t('login_message_canceled');
    retry.classList.remove('hidden');
    return;
  }

  // check login data against server
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { Authorization: `Basic ${btoa(`${user}:${password}`)}` },
    });
    if (!res.ok) {
      box.classList.remove('hidden');
      status.innerHTML = t('login_status_failed');
      message.innerHTML = t('login_message_unauthorized');
      return;
    }
  } catch {
    box.classList.remove('hidden');
    status.innerHTML = t('login_status_failed');
    message.innerHTML = t('login_message_network_error');
    retry.classList.remove('hidden');
    return;
  }

  // store login data
  try {
    await browser.storage.local.set({
      server: { url: url.href, user, password, device },
    });
  } catch {
    box.classList.remove('hidden');
    status.innerHTML = t('login_status_failed');
    message.innerHTML = t('login_message_internal_error');
    retry.classList.remove('hidden');
    return;
  }

  // success message
  box.classList.remove('hidden');
  status.innerHTML = t('login_status_success');
  message.innerHTML = t('login_message_success', [url.href, user, device]);
};
