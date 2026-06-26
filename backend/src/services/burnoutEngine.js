const cron = require('node-cron');
const User = require('../models/User');
const ActivitySession = require('../models/ActivitySession');
const ProductivityScoreSnapshot = require('../models/ProductivityScoreSnapshot');
const BurnoutFlag = require('../models/BurnoutFlag');

class BurnoutEngine {
  constructor() {
    this.task = null;
  }

  start() {
    if (this.task) return;
    console.log('✅ BurnoutEngine (Cron) started - running daily at 23:00');
    // Run at 11 PM every day
    this.task = cron.schedule('0 23 * * *', async () => {
      console.log('🔍 Running daily burnout detection job...');
      await this.runDetection();
    });
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }

  async runDetection() {
    try {
      const activeEmployees = await User.find({ isActive: true, role: 'employee' });
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      for (const emp of activeEmployees) {
        let reasons = [];
        let conditionsMet = 0;

        // a. Check if worked > 10 hours today
        const todaysSessions = await ActivitySession.find({
          userId: emp._id,
          startTime: { $gte: today }
        });
        const totalSecondsToday = todaysSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
        if (totalSecondsToday > 10 * 3600) {
          conditionsMet++;
          reasons.push('after_hours_work');
        }

        // b. Check if ProductivityScoreSnapshot declined for 3+ consecutive days
        const snapshots = await ProductivityScoreSnapshot.find({
          userId: emp._id,
          date: { $gte: threeDaysAgo }
        }).sort({ date: 1 });
        
        if (snapshots.length >= 3) {
          let declined = true;
          for (let i = 1; i < snapshots.length; i++) {
            if (snapshots[i].score >= snapshots[i-1].score) {
              declined = false;
              break;
            }
          }
          if (declined) {
            conditionsMet++;
            reasons.push('consecutive_low_scores');
          }
        }

        // c. Check if zero idle time periods > 5 min in last 3 days
        const last3DaysSessions = await ActivitySession.find({
          userId: emp._id,
          startTime: { $gte: threeDaysAgo }
        });
        const longBreaks = last3DaysSessions.filter(s => s.type === 'idle' && s.durationSeconds > 300);
        if (longBreaks.length === 0 && last3DaysSessions.length > 0) {
          conditionsMet++;
          reasons.push('no_breaks_detected');
        }

        if (conditionsMet >= 2) {
          const severity = conditionsMet === 3 ? 'high' : 'medium';
          await BurnoutFlag.create({
            userId: emp._id,
            managerId: emp.managerId,
            reasons,
            severity
          });
          
          // Emit socket event if io is available (optional via app.get('io'))
          // This requires passing the io instance or handling it via an event emitter
        }
      }
    } catch (err) {
      console.error('Error in BurnoutEngine runDetection:', err);
    }
  }
}

module.exports = new BurnoutEngine();
