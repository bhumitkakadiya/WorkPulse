const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  async init() {
    try {
      // Use Ethereal Email for zero-cost testing
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log('📧 Ethereal Email Service initialized for testing');
    } catch (err) {
      console.error('❌ Failed to initialize EmailService:', err.message);
    }
  }

  async sendReport(to, subject, htmlContent) {
    if (!this.transporter) await this.init();
    if (!this.transporter) return;

    try {
      const info = await this.transporter.sendMail({
        from: '"WorkPulse Reports" <reports@workpulse.dev>',
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Weekly Report sent to ${to}`);
      console.log(`🔍 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (err) {
      console.error('❌ Failed to send report email:', err.message);
    }
  }
}

module.exports = new EmailService();
