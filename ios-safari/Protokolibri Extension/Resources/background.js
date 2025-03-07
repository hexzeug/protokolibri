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

  // ignore unless a page finished loading
  if (
    (!changeInfo.hasOwnProperty('status') &&
      !changeInfo.hasOwnProperty('url')) ||
    tab.status !== 'complete'
  ) {
    return;
  }

  // ignore if page is of extension
  if (tab.url.startsWith(browser.runtime.getURL(''))) return;

  // redirect to login page if ?protokolibri=login
  if (URL.canParse(tab.url)) {
    const url = new URL(tab.url);
    if (url.searchParams.has('protokolibri', 'login')) {
      url.searchParams.delete('protokolibri');
      const loginUrl = browser.runtime.getURL('login.html') + url.search;
      console.log(`redirecting to ${loginUrl}`);
      browser.tabs.update(tab.id, {
        url: loginUrl,
      });
      return;
    }
  }

  // event UPDATED
  const updated = {
    tabId,
    type: 'updated',
    time: Date.now(),
    url: tab.url,
    title: tab.title, // title will always be loaded in this if-body
  };
  console.log(`${tabId} was updated`, updated);
  sendEvent(updated);
});

class NoServerError extends Error {
  name = 'NoServerError';

  constructor(options) {
    super('No server login data', options);
  }
}

const loadServerAccess = async () => {
  const { server } = await browser.storage.local.get('server');
  if (!server) {
    throw new NoServerError();
  }
  return server;
};

browser.storage.local.onChanged.addListener(({ server }) => {
  if (server) {
    if (server.newValue) {
      SERVER_ACCESS = Promise.resolve(server.newValue);
    } else {
      SERVER_ACCESS = Promise.reject(new NoServerError());
      eventBag.throwOut(Infinity);
    }
  }
});

let SERVER_ACCESS = loadServerAccess();

const send = async (relative_url, init) => {
  if (relative_url.startsWith('/')) relative_url = relative_url.slice(1);

  const { url: server_url, user, password, device } = await SERVER_ACCESS;
  const url = new URL(server_url + relative_url);
  url.searchParams.set('device', device);
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
    if (e.name === 'NoServerError') {
      throw new Error('event sending failed', { cause: e });
    } else {
      console.warn(
        'Server connection failed. Event will be stored locally until reconnect.'
      );
      await eventBag.putIn(event);
    }
  }
};

class PersistentBag {
  #bag;
  #mutex = Promise.resolve();
  key;

  constructor(key) {
    this.key = key;
    this.#bag = browser.storage.local.get(this.key).then(
      ({ [this.key]: bag }) => (Array.isArray(bag) ? bag : []),
      () => []
    );
  }

  async #write() {
    const bag = await this.#bag;
    const { promise: lockedMutex, resolve: unlock } = Promise.withResolvers();
    await this.#mutex;
    this.#mutex = lockedMutex;
    try {
      await browser.storage.local.set({ [this.key]: bag });
    } finally {
      unlock();
    }
  }

  async getCopy() {
    const bag = await this.#bag;
    return [...bag];
  }

  async putIn(element) {
    const bag = await this.#bag;
    bag.push(element);
    await this.#write();
  }

  async throwOut(amount) {
    if (!Number.isInteger(amount) || amount <= 0) return;
    const bag = await this.#bag;
    if (bag.length === 0) return;
    bag.splice(0, amount);
    await this.#write();
  }
}

const eventBag = new PersistentBag('event_bag');

// heartbeat
const heartbeat = async () => {
  // send hearbeat
  try {
    await send('/hearbeat', { method: 'POST' });
  } catch (e) {
    throw new Error('heartbeat failed', { cause: e });
  }

  // heartbeat was successfull -> check if bag contains events
  const bag = await eventBag.getCopy();
  if (bag.length === 0) return;

  // bag contains items -> send bag
  try {
    await send('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bag),
    });
  } catch {
    console.warn('Event bag sending failed. Local event storage is persisted.');
    return;
  }

  // bag was sent successful -> clear bag
  await eventBag.throwOut(bag.length);
};

browser.alarms.create('heartbeat', { periodInMinutes: 0.5 });
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'heartbeat') {
    heartbeat();
  }
});

const devLogin = () => {
  browser.tabs.update({
    url: 'http://192.168.178.30/?protokolibri=login&url=http://192.168.178.30/api/&user=device&password=test&device=developer',
  });
};
