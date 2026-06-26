const cron = require('node-cron');
const User = require('../models/User');
const ActivitySession = require('../models/ActivitySession');
const AIInsight = require('../models/AIInsight');

class InsightEngine {
  constructor() {
    this.task = null;
  }

  start() {
    if (this.task) return;
    console.log('✅ InsightEngine (Cron) started - running Sundays at 2:00 AM');
    // Run at 2 AM every Sunday
    this.task = cron.schedule('0 2 * * 0', async () => {
      console.log('🤖 Running weekly AI Insight generation...');
      await this.generateInsights();
    });
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }

  async generateInsights() {
    try {
      const activeEmployees = await User.find({ isActive: true, role: 'employee' });
      
      const today = new Date();
      const lastSunday = new Date(today);
      lastSunday.setDate(today.getDate() - today.getDay() - 7);
      lastSunday.setHours(0,0,0,0);
      
      const thisSunday = new Date(today);
      thisSunday.setDate(today.getDate() - today.getDay());
      thisSunday.setHours(0,0,0,0);

      for (const emp of activeEmployees) {
        // Fetch sessions for the previous week
        const sessions = await ActivitySession.find({
          userId: emp._id,
          startTime: { $gte: lastSunday, $lt: thisSunday }
        });

        // 1. Calculate Peak Hours
        const hourFocusMap = new Map();
        for (const s of sessions) {
          if (s.type === 'productive' || s.type === 'active') {
            const hour = new Date(s.startTime).getHours();
            hourFocusMap.set(hour, (hourFocusMap.get(hour) || 0) + s.durationSeconds);
          }
        }
        
        let peakHours = [];
        hourFocusMap.forEach((duration, hour) => {
          peakHours.push({ hour, focusScore: Math.min(100, Math.floor((duration / 3600) * 100)) });
        });
        peakHours.sort((a, b) => b.focusScore - a.focusScore);
        peakHours = peakHours.slice(0, 3); // top 3 peak hours

        // 2. Generate generic mock AI text based on simple heuristics
        // In reality, you'd send `sessions` data to OpenAI/Anthropic API here
        let suggestions = [];
        let summaryText = `Your peak productivity is around ${peakHours.length > 0 ? peakHours[0].hour + ':00' : 'mid-day'}. Keep it up!`;
        let burnoutRisk = 'low';

        const totalActiveSecs = sessions.filter(s => s.type !== 'idle').reduce((a, b) => a + b.durationSeconds, 0);
        const activeHours = totalActiveSecs / 3600;

        if (activeHours > 50) {
          burnoutRisk = 'high';
          suggestions.push('Consider delegating tasks; you logged over 50 hours last week.');
          summaryText = `You've been working extremely hard. Try to optimize your schedule to prevent burnout.`;
        } else if (activeHours > 40) {
          burnoutRisk = 'medium';
          suggestions.push('You had a solid week, but make sure to take breaks.');
        } else {
          suggestions.push('Great balance between focus time and breaks.');
        }

        if (peakHours.length > 0 && peakHours[0].hour < 12) {
          suggestions.push('You are a morning person. Schedule complex tasks before noon.');
        } else if (peakHours.length > 0 && peakHours[0].hour >= 15) {
          suggestions.push('You hit your stride in the afternoon. Guard this time from meetings.');
        }

        await AIInsight.create({
          userId: emp._id,
          weekStartDate: lastSunday,
          peakHours,
          suggestions,
          burnoutRisk,
          summaryText
        });
      }
    } catch (err) {
      console.error('Error in InsightEngine generateInsights:', err);
    }
  }
}

module.exports = new InsightEngine();
