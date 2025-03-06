'use strict';

browser.windows.onFocusChanged.addListener(async (windowId) => {
  console.debug(`WINDOW ${windowId}`);

  // event ACTIVATED
  const activated = {
    tabId: null,
    type: 'activated',
    time: Date.now(),
  };
  if (windowId !== browser.windows.WINDOW_ID_NONE) {
    const tabs = await browser.tabs.query({
      windowId,
      active: true,
    });
    if (tabs.length === 1) activated.tabId = tabs[0].id;
  }
  console.log(`${activated.tabId} was activated (window-event)`, activated);
  sendEvent(activated);
});

browser.tabs.onActivated.addListener(
  ({ tabId, previousTabId, windowId: _windowId }) => {
    console.debug(`TAB ${previousTabId} -> ${tabId}`);

    // ignore event, if no change was made; (happens for example when last tab in a window is removed)
    if (tabId === previousTabId) return;

    // event ACTIVATED
    const activated = {
      tabId,
      type: 'activated',
      time: Date.now(),
    };
    console.log(`${tabId} was activated (tabs-event)`, activated);
    sendEvent(activated);
  }
);

browser.tabs.onCreated.addListener((tab) => {
  // tab is background tab -> ignore event
  if (Number.isNaN(tab.index) || tab.windowId === -1) return;

  const time = Date.now();
  // event CREATED
  const created = {
    tabId: tab.id,
    type: 'created',
    time,
    url: tab.url,
    title: tab.status === 'complete' ? tab.title : null,
  };
  console.log(`${tab.id} was created`, created);
  sendEvent(created);

  if (tab.active) {
    // event ACTIVATED
    const activated = {
      tabId: tab.id,
      type: 'activated',
      time,
    };
    console.log(`${tab.id} was activated (creation-event)`, activated);
    sendEvent(activated);
  }
});

browser.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  // event REMOVED
  const removed = {
    tabId,
    type: 'removed',
    time: Date.now(),
  };
  console.log(`${tabId} was removed`, removed);
  sendEvent(removed);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.debug(`UPDATE: tab ${tabId} ${JSON.stringify(changeInfo)}`);

  // event UPDATED
  if (
    (changeInfo.hasOwnProperty('status') || changeInfo.hasOwnProperty('url')) &&
    tab.status === 'complete'
  ) {
    const updated = {
      tabId,
      type: 'updated',
      time: Date.now(),
      url: tab.url,
      title: tab.title, // title will always be loaded in this if-body
    };
    console.log(`${tabId} was updated`, updated);
    sendEvent(updated);
  }
});

const loadServerAccess = async () => {
  const { server } = await browser.storage.local.get('server');
  if (!server) {
    throw new TypeError('No server login data');
  }
  return server;
};

let SERVER_ACCESS = loadServerAccess();
let DEVICE_NAME = Promise.resolve('Test Device Name');

browser.storage.local.onChanged.addListener(async ({ server }) => {
  if (server) {
    if (server.newValue) {
      SERVER_ACCESS = Promise.resolve(server.newValue);
    } else {
      SERVER_ACCESS = Promise.reject(new TypeError('No server login data'));
    }
  }
});

const send = async (relative_url, init) => {
  if (relative_url.startsWith('/')) relative_url = relative_url.slice(1);

  const { url: server_url, user, password } = await SERVER_ACCESS;
  const url = new URL(server_url + relative_url);
  url.searchParams.set('device', await DEVICE_NAME);
  return await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      ...init.headers,
      Authorization: `Basic ${btoa(`${user}:${password}`)}`,
    },
  });
};

const sendEvent = async (event) => {
  try {
    const res = await send('/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (res.status !== 201) {
      throw new TypeError(`API error: ${res.status} ${res.statusText}`);
    }
  } catch (e) {
    console.error(e);
    // todo: cache event
  }
};

// heartbeat
browser.alarms.create('heartbeat', { periodInMinutes: 0.5 });
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'heartbeat') {
    send('/heartbeat', { method: 'POST' }).catch(() => {});
  }
});
