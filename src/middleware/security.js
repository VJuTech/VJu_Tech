const compression = require('compression');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many authentication attempts. Please try again later.'
});

function requireHttps(req, res, next) {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.get('host')}${req.originalUrl}`);
  }
  return next();
}

module.exports = { helmet, compression, generalRateLimit, authRateLimit, requireHttps };