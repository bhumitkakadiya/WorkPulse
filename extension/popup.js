const apiUrlInput = document.getElementById('apiUrl');
const apiTokenInput = document.getElementById('apiToken');
const isTrackingToggle = document.getElementById('isTracking');
const saveBtn = document.getElementById('saveBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Load existing settings
chrome.storage.sync.get(['apiUrl', 'apiToken', 'isTracking'], (res) => {
  if (res.apiUrl) apiUrlInput.value = res.apiUrl;
  if (res.apiToken) apiTokenInput.value = res.apiToken;
  if (res.isTracking !== undefined) isTrackingToggle.checked = res.isTracking;
  
  updateStatus(res.apiToken, res.isTracking !== false);
});

// Save settings
saveBtn.addEventListener('click', () => {
  const apiUrl = apiUrlInput.value.trim();
  const apiToken = apiTokenInput.value.trim();
  const isTracking = isTrackingToggle.checked;

  chrome.storage.sync.set({ apiUrl, apiToken, isTracking }, () => {
    saveBtn.textContent = 'Saved!';
    setTimeout(() => { saveBtn.textContent = 'Save Settings'; }, 2000);
    updateStatus(apiToken, isTracking);
  });
});

function updateStatus(hasToken, trackingEnabled) {
  if (!trackingEnabled) {
    statusDot.className = 'status-indicator error';
    statusText.textContent = 'Tracking Disabled';
  } else if (!hasToken) {
    statusDot.className = 'status-indicator error';
    statusText.textContent = 'Missing Auth Token';
  } else {
    statusDot.className = 'status-indicator active';
    statusText.textContent = 'Tracking Active';
  }
}
