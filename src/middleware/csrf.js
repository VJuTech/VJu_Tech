const crypto = require('node:crypto');

function csrfToken(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  return next();
}

function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.is('multipart/form-data')) return next();
  const submitted = req.body?._csrf;
  if (!submitted || submitted !== req.session.csrfToken) return res.status(403).render('management/error', { title: 'Invalid request', error: null });
  return next();
}

module.exports = { csrfToken, verifyCsrf };