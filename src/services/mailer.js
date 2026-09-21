const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

function getTransporter() {
  if (transporter || !env.smtp.host || !env.smtp.user || !env.smtp.password) return transporter;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.password }
  });
  return transporter;
}

async function send({ to, subject, text, html }) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.warn('SMTP is not configured; email was not sent:', subject);
    return false;
  }
  await mailTransporter.sendMail({ from: env.smtp.from, to, subject, text, html });
  return true;
}

async function sendPasswordReset({ to, token }) {
  const link = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return send({
    to,
    subject: 'Reset your VJU Tech password',
    text: `Use this link within one hour to reset your password: ${link}`,
    html: `<p>Use this link within one hour to reset your password:</p><p><a href="${link}">${link}</a></p>`
  });
}

module.exports = { send, sendPasswordReset };
