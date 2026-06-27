const AppUsageLog = require('../models/AppUsageLog');
const ActivitySession = require('../models/ActivitySession');
const ProductivityScoreSnapshot = require('../models/ProductivityScoreSnapshot');
const AppCategory = require('../models/AppCategory');
const WebsiteLog = require('../models/WebsiteLog');

// Default category rules (app name patterns)
const DEFAULT_PRODUCTIVE = ['code', 'vscode', 'visual studio', 'intellij', 'webstorm', 'github', 'gitlab', 'figma', 'notion', 'slack', 'teams', 'zoom', 'excel', 'word', 'docs', 'sheets', 'jira', 'confluence', 'postman', 'terminal', 'cmd', 'powershell'];
const DEFAULT_DISTRACTING = ['youtube', 'netflix', 'facebook', 'instagram', 'twitter', 'tiktok', 'reddit', 'twitch', 'discord', 'whatsapp', 'telegram', 'snapchat'];

function categorize(appName, categoryRules = []) {
  const lower = appName.toLowerCase();
  // Check admin-configured rules first
  for (const rule of categoryRules) {
    if (lower.includes(rule.pattern.toLowerCase())) return rule.category;
  }
  // Fall back to defaults
  if (DEFAULT_PRODUCTIVE.some(p => lower.includes(p))) return 'productive';
  if (DEFAULT_DISTRACTING.some(p => lower.includes(p))) return 'distracting';
  return 'neutral';
}

/**
 * Compute and save a productivity score for a given user and date.
 * Score formula (v1):
 *   score = (productiveSeconds / totalTrackedSeconds) * 100 * (1 - distractingRatio * 0.5)
 *   Clamped to 0–100.
 */
async function computeAndSave(userId, date) {
  try {
    const categoryRules = await AppCategory.find({ orgId: 'default_org' });

    const appLogs = await AppUsageLog.find({ userId, date });
    const websiteLogs = await WebsiteLog.find({ userId, date });
    const sessions = await ActivitySession.find({ userId, date });

    // Assign categories
    let productiveSeconds = 0;
    let neutralSeconds = 0;
    let distractingSeconds = 0;

    const appTotals = {};
    
    // Process App logs
    for (const log of appLogs) {
      if (!log || !log.appName) continue;
      const cat = log.category && log.category !== 'neutral' ? log.category : categorize(log.appName, categoryRules);
      const duration = Number(log.durationSeconds) || 0;
      
      if (cat === 'productive') productiveSeconds += duration;
      else if (cat === 'distracting') distractingSeconds += duration;
      else neutralSeconds += duration;

      if (!appTotals[log.appName]) appTotals[log.appName] = { appName: log.appName, durationSeconds: 0, category: cat };
      appTotals[log.appName].durationSeconds += duration;
    }

    // Process Website logs
    for (const log of websiteLogs) {
      if (!log || !log.domain) continue;
      const cat = log.category && log.category !== 'neutral' ? log.category : categorize(log.domain, categoryRules);
      const duration = Number(log.durationSeconds) || 0;

      if (cat === 'productive') productiveSeconds += duration;
      else if (cat === 'distracting') distractingSeconds += duration;
      else neutralSeconds += duration;

      const name = log.domain;
      if (!appTotals[name]) appTotals[name] = { appName: name, durationSeconds: 0, category: cat };
      appTotals[name].durationSeconds += duration;
    }

    const totalActiveSeconds = sessions.filter(s => s && s.type === 'active').reduce((a, s) => a + (Number(s.durationSeconds) || 0), 0);
    const totalIdleSeconds = sessions.filter(s => s && s.type === 'idle').reduce((a, s) => a + (Number(s.durationSeconds) || 0), 0);
    const focusSessionSeconds = sessions.filter(s => s && s.isFocusSession).reduce((a, s) => a + (Number(s.durationSeconds) || 0), 0);
    const trackedSeconds = productiveSeconds + neutralSeconds + distractingSeconds;

    let score = 0;
    if (trackedSeconds > 0) {
      const productiveRatio = productiveSeconds / trackedSeconds;
      const distractingRatio = distractingSeconds / trackedSeconds;
      score = Math.round(productiveRatio * 100 * (1 - distractingRatio * 0.5));
      score = Math.max(0, Math.min(100, score));
    }

    const topApps = Object.values(appTotals).sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 5);
    const total = trackedSeconds || 1;

    await ProductivityScoreSnapshot.findOneAndUpdate(
      { userId, date },
      {
        score, totalActiveSeconds, totalIdleSeconds,
        productiveSeconds, neutralSeconds, distractingSeconds, focusSessionSeconds,
        topApps,
        breakdown: {
          productivePercent: Math.round(productiveSeconds / total * 100),
          neutralPercent: Math.round(neutralSeconds / total * 100),
          distractingPercent: Math.round(distractingSeconds / total * 100),
          idlePercent: Math.round(totalIdleSeconds / (total + totalIdleSeconds || 1) * 100),
        },
      },
      { upsert: true, new: true }
    );
    return score;
  } catch (err) {
    console.error('Scoring engine error:', err.message);
    return null;
  }
}

module.exports = { computeAndSave, categorize };
