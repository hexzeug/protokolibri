browser.windows.onFocusChanged.addListener(async (windowId) => {
  console.debug(`WINDOW ${windowId}`);
  const tabs = await browser.tabs.query({
    lastFocusedWindow: true,
    active: true,
  });
  console.debug(`ACTIVE TAB ${tabs.map((tab) => tab.id)}`);
});

browser.tabs.onActivated.addListener(
  ({ tabId, previousTabId, windowId: _windowId }) => {
    console.debug(`TAB ${previousTabId} -> ${tabId}`);
    return;
    // ignore event, if no change was made; (happens for example when last tab in a window is removed)
    if (tabId === previousTabId) return;

    // events DEACTIVATED & ACTIVATED
    const time = Date.now();
    const deactivated = { tabId: previousTabId, type: 'deactivated', time };
    const activated = { tabId, type: 'activated', time };

    // check if tabs exist -> only send event if tab exists
    browser.tabs
      .get(previousTabId)
      .then(() => {
        console.log(`${previousTabId} was deactivated`, deactivated);
      })
      .catch(() => {
        console.error(`${previousTabId} was deactivated`);
      });
    browser.tabs
      .get(tabId)
      .then(() => {
        console.log(`${tabId} was activated`, activated);
      })
      .catch(() => {
        console.error(`${tabId} was activated`);
      });
  }
);

browser.tabs.onCreated.addListener((tab) => {
  // tab is background tab -> ignore event
  if (Number.isNaN(tab.index) || tab.windowId === -1) return;

  // event CREATED
  const created = {
    tabId: tab.id,
    type: 'created',
    time: Date.now(),
    url: tab.url,
    title: tab.status === 'complete' ? tab.title : null,
  };
  console.log(`${tab.id} was created`, created);
});

browser.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  // event REMOVED
  const removed = {
    tabId,
    type: 'removed',
    time: Date.now(),
  };
  console.log(`${tabId} was removed`, removed);
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
  }
});

// heartbeat
browser.alarms.create('heartbeat', { periodInMinutes: 0.5 });
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'heartbeat') {
    // console.log('heartbeat');
  }
});
