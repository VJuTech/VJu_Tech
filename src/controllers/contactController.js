const inquiryModel = require('../models/inquiryModel');
const db = require('../database/connect');

async function submitInquiry(req, res, next) {
  try {
    const { name, email, company, projectDescription, budget } = req.body;

    if (!name || !email || !projectDescription) {
      return res.status(400).render('page/inquiry', {
        title: 'Start a project inquiry',
        inquiry: { error: 'Name, email, and project description are required.' }
      });
    }

    await inquiryModel.createInquiry({ name, email, company, projectDescription, budget });
    return res.render('page/inquiry', {
      title: 'Start a project inquiry',
      inquiry: { success: 'Thanks. Our team will be in touch shortly.' }
    });
  } catch (error) {
    return next(error);
  }
}

async function submitContactMessage(req, res, next) {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).render('page/contact', { title: 'Contact VJU Tech', inquiry: { error: 'Name, email, and message are required.' }, contact: true });
    await db.query('INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)', [name, email, subject || null, message]);
    return res.render('page/contact', { title: 'Contact VJU Tech', inquiry: { success: 'Your message has been received.' }, contact: true });
  } catch (error) { return next(error); }
}

module.exports = { submitInquiry, submitContactMessage };