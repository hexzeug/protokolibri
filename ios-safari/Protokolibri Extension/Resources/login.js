'use strict';

const t = (...args) => browser.i18n.getMessage(...args);

window.addEventListener('load', () => {
  document.querySelectorAll('[data-i18n]').forEach((elm) => {
    elm.innerHTML = t(elm.getAttribute('data-i18n'));
  });

  // wait for the dom to update
  setTimeout(login(), 1);
});

const login = async () => {
  const status = document.querySelector('#status');
  const message = document.querySelector('#message');

  const params = new URLSearchParams(document.location.search);
  const url = URL.parse(params.get('url'));
  const user = params.get('user');
  const password = params.get('password');

  // cancel if data is malformed
  if (
    url === null ||
    user === null ||
    password === null ||
    !/^[a-zA-Z][a-zA-Z0-9\-\.]*$/.test(user) ||
    !/^[\x21-\x7e]+$/.test(password)
  ) {
    status.innerHTML = t('login_status_failed');
    message.innerHTML = t('login_message_bad_data');
    return;
  }

  // normalize url
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.search = '';

  // user confirms login
  if (!confirm(t('login_confirm', [url.href, user]))) {
    status.innerHTML = t('login_status_failed');
    message.innerHTML = t('login_message_canceled');
  }

  // check login data against server
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { Authorization: `Basic ${btoa(`${user}:${password}`)}` },
    });
    if (!res.ok) {
      status.innerHTML = t('login_status_failed');
      message.innerHTML = t('login_message_unauthorized');
      return;
    }
  } catch {
    status.innerHTML = t('login_status_failed');
    message.innerHTML = t('login_message_network_error');
  }

  // store login data
  try {
    await browser.storage.local.set({
      server: { url: url.href, user, password },
    });
    status.innerHTML = t('login_status_success');
    message.innerHTML = t('login_message_success', [url.href, user]);
  } catch {
    status.innerHTML = t('login_status_failed');
    message.innerHTML = t('login_message_internal_error');
  }
};
