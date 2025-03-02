/**Please note:
 * Safari sometimes fires tab events for tabs that "do not exist". (I do not exactly know
 * how and why but I suspect some background pre-loading stuff). To make sure these events
 * are not propagated every event handler first calls tabs.get() for the tab id and ignores
 * the event if an error is returned. (If a real event is falsly ignored because the tab was
 * deleted before tabs.get() returned the event was not of big interest anyways.)
 */
browser.tabs.onActivated.addListener(
  ({ tabId, previousTabId, windowId: _windowId }) => {
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
  const updated = {
    tabId,
    type: 'updated',
    time: Date.now(),
    url: tab.url,
    title: tab.status === 'complete' ? tab.title : null,
  };
  if (
    (changeInfo.hasOwnProperty('status') || changeInfo.hasOwnProperty('url')) &&
    tab.status === 'complete'
  ) {
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
