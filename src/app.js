const path = require('node:path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const db = require('./database/connect');
const env = require('./config/env');
const siteRoutes = require('./routes/siteRoutes');
const errorHandler = require('./middleware/errorHandler');
const { loadUser } = require('./middleware/auth');
const { helmet, compression, generalRateLimit, authRateLimit, requireHttps } = require('./middleware/security');
const { csrfToken, verifyCsrf } = require('./middleware/csrf');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(requireHttps);
app.use(helmet());
app.use(compression());
app.use(generalRateLimit);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));
app.use('/login', authRateLimit);
app.use('/register', authRateLimit);
app.use('/forgot-password', authRateLimit);
app.use('/reset-password', authRateLimit);
app.use(session({
	store: new pgSession({ pool: db.pool, tableName: 'session', createTableIfMissing: true }),
	secret: env.sessionSecret,
	resave: false,
	saveUninitialized: false,
	cookie: { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: 1000 * 60 * 60 * 8 }
}));
app.use(csrfToken);
app.use(verifyCsrf);
app.use(loadUser);
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1d', immutable: false }));
app.use(siteRoutes);
app.use((req, res) => res.status(404).render('management/error', { title: 'Page not found', error: null }));
app.use(errorHandler);

module.exports = app;