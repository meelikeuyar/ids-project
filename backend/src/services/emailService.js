const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.enabled = !!(config.email.user && config.email.pass);

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
      logger.info('Email service initialized');
    } else {
      logger.warn('Email service disabled — SMTP credentials not configured');
    }
  }

  async sendAlertEmail({ attackType, ipAddress, confidence, riskScore, model, timestamp }) {
    if (!this.enabled) {
      logger.info('Email alert skipped (not configured)', { attackType, ipAddress });
      return false;
    }

    const severityColor = riskScore >= 80 ? '#ff0040' : riskScore >= 50 ? '#ff8c00' : '#00aaff';
    const severityLabel = riskScore >= 80 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : 'MEDIUM';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, ${severityColor}22, ${severityColor}08); border-bottom: 2px solid ${severityColor}; padding: 24px 30px;">
          <h1 style="margin: 0; font-size: 20px; color: ${severityColor}; letter-spacing: 2px;">
            ⚠ IDS ALERT — ${severityLabel}
          </h1>
          <p style="margin: 6px 0 0; font-size: 12px; color: #888;">Network Intrusion Detection System</p>
        </div>
        <div style="padding: 24px 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #1a2030;">Attack Type</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 14px; color: ${severityColor}; border-bottom: 1px solid #1a2030; text-align: right;">${attackType}</td></tr>
            <tr><td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #1a2030;">Source IP</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 14px; color: #ff4060; border-bottom: 1px solid #1a2030; text-align: right;">${ipAddress}</td></tr>
            <tr><td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #1a2030;">Confidence</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 14px; color: #e0e0e0; border-bottom: 1px solid #1a2030; text-align: right;">${confidence.toFixed(1)}%</td></tr>
            <tr><td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #1a2030;">Risk Score</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 14px; color: ${severityColor}; border-bottom: 1px solid #1a2030; text-align: right;">${riskScore}/100</td></tr>
            <tr><td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #1a2030;">Model</td>
                <td style="padding: 10px 0; font-size: 14px; color: #00aaff; border-bottom: 1px solid #1a2030; text-align: right;">${model}</td></tr>
            <tr><td style="padding: 10px 0; color: #888; font-size: 13px;">Detected At</td>
                <td style="padding: 10px 0; font-size: 13px; color: #aaa; text-align: right;">${new Date(timestamp || Date.now()).toLocaleString('tr-TR')}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 14px; background: ${severityColor}11; border-left: 3px solid ${severityColor}; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #ccc;">
              ${riskScore >= 80 ? `IP ${ipAddress} has been automatically blocked.` : `This alert requires manual review. Consider blocking IP ${ipAddress}.`}
            </p>
          </div>
        </div>
        <div style="padding: 16px 30px; background: #060a12; text-align: center; font-size: 11px; color: #555;">
          IDS — Intrusion Detection System | Automated Alert
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"IDS Alert System" <${config.email.user}>`,
        to: config.email.alertRecipient || config.email.user,
        subject: `[IDS ${severityLabel}] ${attackType} detected from ${ipAddress}`,
        html,
      });
      logger.info('Alert email sent', { attackType, ipAddress, to: config.email.alertRecipient });
      return true;
    } catch (error) {
      logger.error('Failed to send alert email', { error: error.message, attackType, ipAddress });
      return false;
    }
  }
}

module.exports = new EmailService();
