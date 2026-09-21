const reportModel = require('../models/reportModel');

async function index(req, res, next) {
  try {
    const [summary, activity] = await Promise.all([reportModel.summary(), reportModel.activity()]);
    return res.render('management/reports', { title: 'Operational reports', summary, activity });
  } catch (error) {
    return next(error);
  }
}

module.exports = { index };
