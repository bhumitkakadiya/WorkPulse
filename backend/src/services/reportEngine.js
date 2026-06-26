const cron = require('node-cron');
const User = require('../models/User');
const ProductivityScoreSnapshot = require('../models/ProductivityScoreSnapshot');
const emailService = require('./emailService');

class ReportEngine {
  start() {
    // Run every Friday at 5:00 PM
    cron.schedule('0 17 * * 5', () => {
      console.log('⏰ Running weekly report generation job...');
      this.generateWeeklyReports();
    });
    console.log('📈 Weekly Report CRON scheduled (Fridays at 5PM)');
  }

  async generateWeeklyReports() {
    try {
      // Find all managers
      const managers = await User.find({ role: 'manager' });
      
      for (const manager of managers) {
        // Find employees for this manager
        const employees = await User.find({ role: 'employee', orgId: manager.orgId });
        if (employees.length === 0) continue;

        let teamHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2 style="color: #1e293b;">WorkPulse Weekly Summary</h2>
            <p style="color: #64748b;">Here is the productivity overview for your team this week.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background: #3b82f6; color: white;">
                <th style="padding: 10px; text-align: left;">Employee</th>
                <th style="padding: 10px; text-align: center;">Avg Score</th>
                <th style="padding: 10px; text-align: right;">Status</th>
              </tr>
        `;

        for (const emp of employees) {
          // Get last 5 days of snapshots
          const snapshots = await ProductivityScoreSnapshot.find({ userId: emp._id })
            .sort({ date: -1 }).limit(5);

          let avgScore = 0;
          if (snapshots.length > 0) {
            avgScore = Math.round(snapshots.reduce((acc, s) => acc + s.score, 0) / snapshots.length);
          }

          const statusColor = avgScore >= 70 ? '#10b981' : avgScore >= 50 ? '#f59e0b' : '#ef4444';
          
          teamHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; color: #334155; font-weight: bold;">${emp.name}</td>
              <td style="padding: 10px; text-align: center; color: ${statusColor}; font-weight: bold;">${avgScore}%</td>
              <td style="padding: 10px; text-align: right; color: #64748b;">${snapshots.length} days logged</td>
            </tr>
          `;
        }

        teamHtml += `
            </table>
            <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
              Powered by WorkPulse • <a href="http://localhost:5173" style="color: #3b82f6;">Open Dashboard</a>
            </p>
          </div>
        `;

        // Send to manager
        await emailService.sendReport(manager.email, '📊 WorkPulse Team Weekly Report', teamHtml);
      }
    } catch (err) {
      console.error('❌ Failed to generate weekly reports:', err.message);
    }
  }
}

module.exports = new ReportEngine();
