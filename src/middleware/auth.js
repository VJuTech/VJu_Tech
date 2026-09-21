const userModel = require('../models/userModel');

async function loadUser(req, res, next) {
  try {
    if (req.session.userId && req.session.lastActivityAt && Date.now() - req.session.lastActivityAt > require('../config/env').sessionIdleTimeoutMs) {
      return req.session.destroy(() => res.redirect('/login?expired=1'));
    }
    if (req.session.userId) req.session.lastActivityAt = Date.now();
    req.user = req.session.userId ? await userModel.findById(req.session.userId) : null;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) return res.redirect('/login');
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (!['admin', 'staff'].includes(req.user.role)) return res.status(403).render('management/error', { title: 'Access denied', error: null });
  return next();
}

module.exports = { loadUser, requireAuth, requireAdmin };