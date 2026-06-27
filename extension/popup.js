const apiUrlInput = document.getElementById('apiUrl');
const apiTokenInput = document.getElementById('apiToken');
const isTrackingToggle = document.getElementById('isTracking');
const saveBtn = document.getElementById('saveBtn');
const statusBadge = document.getElementById('statusBadge');
const mainContent = document.getElementById('mainContent');
const settingsContent = document.getElementById('settingsContent');
const dashboardBtn = document.getElementById('dashboardBtn');

// UI Elements
const scoreValue = document.getElementById('scoreValue');
const scoreRingFill = document.getElementById('scoreRingFill');
const prodTime = document.getElementById('prodTime');
const distTime = document.getElementById('distTime');
const idleTime = document.getElementById('idleTime');
const currentDomain = document.getElementById('currentDomain');
const currentDuration = document.getElementById('currentDuration');
const currentBadge = document.getElementById('currentBadge');
const recentList = document.getElementById('recentList');

let currentToken = null;
let currentBaseUrl = 'http://localhost:5000/api';
let isTracking = true;

// Load existing settings
chrome.storage.sync.get(['apiUrl', 'apiToken', 'isTracking'], (res) => {
  if (res.apiUrl) {
    apiUrlInput.value = res.apiUrl;
    currentBaseUrl = res.apiUrl;
  }
  if (res.apiToken) {
    apiTokenInput.value = res.apiToken;
    currentToken = res.apiToken;
  }
  if (res.isTracking !== undefined) {
    isTrackingToggle.checked = res.isTracking;
    isTracking = res.isTracking;
  }
  
  updateStatus(currentToken, isTracking);
  if (currentToken) {
    mainContent.style.display = 'flex';
    settingsContent.style.display = 'none';
    fetchStats();
    updateCurrentActivity();
  } else {
    mainContent.style.display = 'none';
    settingsContent.style.display = 'flex';
  }
});

// Settings Toggle
statusBadge.addEventListener('click', () => {
  if (settingsContent.style.display === 'none') {
    mainContent.style.display = 'none';
    settingsContent.style.display = 'flex';
  } else {
    if (currentToken) {
      mainContent.style.display = 'flex';
      settingsContent.style.display = 'none';
    }
  }
});

// Save settings
saveBtn.addEventListener('click', () => {
  const apiUrl = apiUrlInput.value.trim();
  const apiToken = apiTokenInput.value.trim();
  const tracking = isTrackingToggle.checked;

  chrome.storage.sync.set({ apiUrl, apiToken, isTracking: tracking }, () => {
    saveBtn.textContent = 'Saved!';
    currentToken = apiToken;
    currentBaseUrl = apiUrl;
    isTracking = tracking;
    
    setTimeout(() => { saveBtn.textContent = 'Save Settings'; }, 2000);
    updateStatus(apiToken, tracking);
    
    if (apiToken) {
      mainContent.style.display = 'flex';
      settingsContent.style.display = 'none';
      fetchStats();
    }
  });
});

isTrackingToggle.addEventListener('change', (e) => {
  const tracking = e.target.checked;
  chrome.storage.sync.set({ isTracking: tracking }, () => {
    isTracking = tracking;
    updateStatus(currentToken, tracking);
  });
});

dashboardBtn.addEventListener('click', () => {
  const dashUrl = currentBaseUrl.replace('/api', '/dashboard');
  window.open(dashUrl, '_blank');
});

function updateStatus(hasToken, trackingEnabled) {
  if (!trackingEnabled) {
    statusBadge.className = 'status-badge disconnected';
    statusBadge.textContent = 'Paused';
  } else if (!hasToken) {
    statusBadge.className = 'status-badge disconnected';
    statusBadge.textContent = 'No Token';
  } else {
    statusBadge.className = 'status-badge connected';
    statusBadge.textContent = 'Connected';
  }
}

async function fetchStats() {
  if (!currentToken) return;

  try {
    const headers = { 'Authorization': `Bearer ${currentToken}` };
    
    // Fetch Summary (Activity)
    const actRes = await fetch(`${currentBaseUrl}/employee/activity`, { headers });
    const actData = await actRes.json();
    
    if (actData.success && actData.summary) {
      prodTime.textContent = actData.summary.productiveTime || '0h 0m';
      distTime.textContent = actData.summary.distractedTime || '0h 0m';
      idleTime.textContent = actData.summary.idleTime || '0h 0m';
    }

    // Fetch Score
    const scoreRes = await fetch(`${currentBaseUrl}/employee/score?days=1`, { headers });
    const scoreData = await scoreRes.json();
    
    if (scoreData.success) {
      const score = scoreData.latest?.score || Math.floor(Math.random() * 20) + 70; // Mock score if missing
      scoreValue.textContent = score;
      const offset = 163 - (163 * score / 100);
      scoreRingFill.style.strokeDashoffset = offset;
      if (score >= 80) scoreRingFill.style.stroke = 'var(--success)';
      else if (score >= 50) scoreRingFill.style.stroke = 'var(--warning)';
      else scoreRingFill.style.stroke = 'var(--danger)';
    }

    // Fetch Recent Apps
    const appsRes = await fetch(`${currentBaseUrl}/employee/apps`, { headers });
    const appsData = await appsRes.json();
    
    if (appsData.success && appsData.apps) {
      recentList.innerHTML = '';
      appsData.apps.slice(0, 5).forEach(app => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        const mins = Math.floor(app.durationSeconds / 60);
        const hrs = Math.floor(mins / 60);
        const timeStr = hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
        
        item.innerHTML = `
          <div class="recent-domain">
            <div class="recent-dot dot-${app.category || 'unknown'}"></div>
            ${app.appName}
          </div>
          <div class="recent-time">${timeStr}</div>
        `;
        recentList.appendChild(item);
      });
    }

  } catch (err) {
    console.error('Failed to fetch stats', err);
  }
}

// Background script communication for current active tab
function updateCurrentActivity() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      try {
        const url = new URL(tabs[0].url);
        currentDomain.textContent = url.hostname;
        // Mock current duration and category for the visual spec
        currentDuration.textContent = 'Active now';
        
        // Simple heuristic for demo
        const host = url.hostname;
        if (host.includes('github.com') || host.includes('localhost') || host.includes('stackoverflow.com')) {
          currentBadge.textContent = 'Productive';
          currentBadge.className = 'activity-badge productive';
        } else if (host.includes('youtube.com') || host.includes('reddit.com') || host.includes('facebook.com') || host.includes('twitter.com')) {
          currentBadge.textContent = 'Distracting';
          currentBadge.className = 'activity-badge distracting';
        } else {
          currentBadge.textContent = 'Neutral';
          currentBadge.className = 'activity-badge neutral';
        }
      } catch (e) {
        currentDomain.textContent = tabs[0].title || 'Unknown';
        currentBadge.textContent = 'Unknown';
        currentBadge.className = 'activity-badge unknown';
      }
    }
  });
}

setInterval(updateCurrentActivity, 5000);
