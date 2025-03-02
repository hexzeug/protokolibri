// WARNING: this probably is vurnable to race conditions
const eventQueue = {
  get: async () =>
    (
      await browser.storage.session.get({
        eventQueue: [],
      })
    ).eventQueue,
  set: async (q) => {
    await browser.storage.session.set({ eventQueue: q });
  },
  add: async (event) => {
    const q = await eventQueue.get();
    q.push({ verified: false, ...event });
    await eventQueue.set(q);
  },
  verify: async (tabId) => {
    const q = await eventQueue.get();
    q.forEach((event) => {
      if (event.tabId === tabId) event.verified = true;
    });
    await eventQueue.set(q);
  },
  cancel: async (tabId) => {
    const q = await eventQueue.get();
    await eventQueue.set(
      q.filter((event) => !event.verified && event.tabId != tabId)
    );
  },
};

/**Please note:
 * Safari sometimes fires tab events for tabs that "do not exist". (I do not exactly know
 * how and why but I suspect some background pre-loading stuff). To make sure these events
 * are not propagated every event handler first calls tabs.get() for the tab id and ignores
 * the event if an error is returned. (If a real event is falsly ignored because the tab was
 * deleted before tabs.get() returned the event was not of big interest anyways.)
 */
browser.tabs.onActivated.addListener(
  ({ tabId, previousTabId, windowId: _windowId }) => {
    // ignore event, if no change was made; (happens for example when last tab in a window is removed)
    if (tabId === previousTabId) return;

    // events DEACTIVATED & ACTIVATED
    const time = Date.now();
    eventQueue.add({ tabId: previousTabId, type: 'deactivated', time });
    eventQueue.add({ tabId, type: 'activated', time });

    // check if tabs exist -> verify or cancel event
    browser.tabs
      .get(previousTabId)
      .then(() => {
        eventQueue.verify(previousTabId);
        console.log(`${previousTabId} was deactivated`);
      })
      .catch(() => {
        eventQueue.cancel(previousTabId);
      });
    browser.tabs
      .get(tabId)
      .then(() => {
        eventQueue.verify(tabId);
        console.log(`${tabId} was activated`);
      })
      .catch(() => {
        eventQueue.cancel(tabId);
      });
  }
);

browser.tabs.onCreated.addListener(async (tab) => {
  // event CREATED
  const event = {
    tabId: tab.id,
    type: 'created',
    time: Date.now(),
    active: tab.active,
    url: tab.url,
  };
  if (tab.status === 'complete') {
    event.title = tab.title;
    console.log(
      `${tab.id} was created (window: ${tab.windowId}, tab: ${tab.index}, active: ${tab.active})`
    );
  }
  await eventQueue.add(event);

  // check if tab exist -> verify or cancel event
  try {
    await browser.tabs.get(tab.id);
    await eventQueue.verify(tab.id);
  } catch {
    await eventQueue.cancel(tab.id);
  }
});

browser.tabs.onRemoved.addListener(async (tabId, _removeInfo) => {
  // event REMOVED
  await eventQueue.add({
    tabId,
    type: 'removed',
    time: Date.now(),
    verified: true,
  });
  console.log(`${tabId} was removed`);
  // tabs never exist after removal -> no check for existance here
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log(`${tabId} was updated ${JSON.stringify(changeInfo)}`);

  if (changeInfo.hasOwnProperty('url')) {
    // event UPDATED
    const event = {
      tabId,
      type: 'updated',
      time: Date.now(),
      url: tab.url,
    };
    if (tab.status === 'complete') {
      console.log(`${tabId} opened ${tab.title} (${tab.url})`);
      event.title = tab.title;
    }
    await eventQueue.add(event);

    // check if tab exist -> verify or cancel event
    try {
      await browser.tab.get(tabId);
      await eventQueue.verify(tabId);
    } catch {
      await eventQueue.cancel(tabId);
    }
  } else if (
    changeInfo.hasOwnProperty('status') &&
    changeInfo.status === 'complete'
  ) {
    // add page title to events (after their creation)
    const q = await eventQueue.get();
    q.forEach((event) => {
      if (
        event.tabId === tabId &&
        event.hasOwnProperty('url') &&
        !event.hasOwnProperty('title')
      ) {
        if (event.url !== tab.url) {
          event.outdated = true;
        } else {
          event.title === tab.title;
        }
      }
    });
    await eventQueue.set(q.filter((event) => !event['outdated']));
  }
});

// heartbeat
browser.alarms.create('heartbeat', { periodInMinutes: 0.5 });
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'heartbeat') {
    heartbeat();
    // console.log('heartbeat');
  }
});

const heartbeat = async () => {
  const q = await eventQueue.get();
  const send = [];
  const keep = [];
  q.forEach((event) => {
    if (
      event.verified &&
      event.hasOwnProperty('url') === event.hasOwnProperty('title')
    ) {
      delete event.verified;
      send.push(event);
    } else {
      keep.push(event);
    }
  });
  await eventQueue.set(keep);

  send.forEach(console.log);
};
