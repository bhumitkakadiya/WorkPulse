// background.js

let apiToken = null;
let apiUrl = 'http://localhost:5000/api';
let isTracking = true;

let currentTabId = null;
let currentUrl = null;
let currentTitle = null;
let startTime = null;

let websiteBuffer = [];

// Load config from storage
chrome.storage.sync.get(['apiToken', 'apiUrl', 'isTracking'], (res) => {
  if (res.apiToken) apiToken = res.apiToken;
  if (res.apiUrl) apiUrl = res.apiUrl;
  if (res.isTracking !== undefined) isTracking = res.isTracking;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiToken) apiToken = changes.apiToken.newValue;
  if (changes.apiUrl) apiUrl = changes.apiUrl.newValue;
  if (changes.isTracking) {
    isTracking = changes.isTracking.newValue;
    if (!isTracking) finalizeCurrentSession();
    else startSessionForCurrentTab();
  }
});

function getDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return 'unknown';
  }
}

function finalizeCurrentSession() {
  if (!currentUrl || !startTime || !isTracking) return;

  const now = Date.now();
  const durationSeconds = Math.floor((now - startTime) / 1000);
  
  if (durationSeconds > 1 && !currentUrl.startsWith('chrome://')) {
    const domain = getDomain(currentUrl);
    websiteBuffer.push({
      url: currentUrl,
      domain,
      title: currentTitle,
      durationSeconds,
      visitStart: new Date(startTime).toISOString(),
      visitEnd: new Date(now).toISOString(),
      date: new Date(startTime).toISOString().slice(0, 10),
    });
  }

  currentUrl = null;
  currentTitle = null;
  startTime = null;
}

function startSession(url, title, tabId) {
  if (!isTracking) return;
  finalizeCurrentSession();

  if (url && !url.startsWith('chrome://')) {
    currentUrl = url;
    currentTitle = title;
    currentTabId = tabId;
    startTime = Date.now();
  }
}

function startSessionForCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      startSession(tabs[0].url, tabs[0].title, tabs[0].id);
    }
  });
}

// Track active tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab) startSession(tab.url, tab.title, tab.id);
  });
});

// Track URL changes in the active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    startSession(changeInfo.url, tab.title, tabId);
  }
});

// Window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    finalizeCurrentSession();
  } else {
    startSessionForCurrentTab();
  }
});

// Sync data to backend
async function syncData() {
  if (!apiToken || websiteBuffer.length === 0) return;
  
  // Finalize current so we don't miss the ongoing session
  finalizeCurrentSession();
  startSessionForCurrentTab();

  if (websiteBuffer.length === 0) return;

  const logsToSync = [...websiteBuffer];
  websiteBuffer = [];

  try {
    const res = await fetch(`${apiUrl}/agent/website-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({ logs: logsToSync })
    });

    if (!res.ok) throw new Error('Sync failed');
    console.log(`Synced ${logsToSync.length} website logs.`);
    // Update badge to show successful sync
    chrome.action.setBadgeText({ text: '✓' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
  } catch (err) {
    console.error('Failed to sync website logs', err);
    // Put them back
    websiteBuffer = [...logsToSync, ...websiteBuffer];
    chrome.action.setBadgeText({ text: 'ERR' });
  }
}

// Sync every 1 minute
chrome.alarms.create('syncWebsiteLogs', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncWebsiteLogs') syncData();
});
