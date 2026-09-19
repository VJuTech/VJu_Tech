const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

function renderRegister(req, res) { res.render('account/register', { title: 'Create an account', account: null }); }
function renderLogin(req, res) { res.render('account/login', { title: 'Client login', account: null }); }
function renderForgotPassword(req, res) { res.render('account/forgot-password', { title: 'Reset your password', account: null }); }
function renderResetPassword(req, res) { res.render('account/reset-password', { title: 'Choose a new password', token: req.query.token, account: null }); }

async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password || password.length < 8 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).render('account/register', { title: 'Create an account', account: { error: 'Enter a valid email and a password of at least 8 characters.' } });
    }
    if (await userModel.findByEmail(email)) {
      return res.status(409).render('account/register', { title: 'Create an account', account: { error: 'An account with that email already exists.' } });
    }
    const user = await userModel.createUser({ fullName, email, passwordHash: await bcrypt.hash(password, 12) });
    req.session.userId = user.id;
    await userModel.recordActivity(user.id, 'register', req);
    return res.redirect('/dashboard');
  } catch (error) { return next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findByEmail(email || '');
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).render('account/login', { title: 'Client login', account: { error: 'Email or password is incorrect.' } });
    }
    await userModel.updateLogin(user.id);
    await userModel.recordActivity(user.id, 'login', req);
    await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
    req.session.userId = user.id;
    return res.redirect(['admin', 'staff'].includes(user.role) ? '/admin' : '/dashboard');
  } catch (error) { return next(error); }
}

async function logout(req, res, next) {
  try {
    if (req.user) { await userModel.updateLogout(req.user.id); await userModel.recordActivity(req.user.id, 'logout', req); }
    return req.session.destroy((error) => error ? next(error) : res.redirect('/'));
  } catch (error) { return next(error); }
}

async function requestPasswordReset(req, res, next) {
  try {
    const user = await userModel.findByEmail(req.body.email || '');
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await userModel.createResetToken(user.id, crypto.createHash('sha256').update(token).digest('hex'), new Date(Date.now() + 60 * 60 * 1000));
    }
    return res.render('account/forgot-password', { title: 'Reset your password', account: { success: 'If that email is registered, reset instructions have been sent.' } });
  } catch (error) { return next(error); }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) return res.status(400).render('account/reset-password', { title: 'Choose a new password', token, account: { error: 'Use a valid token and password of at least 8 characters.' } });
    const reset = await userModel.consumeResetToken(crypto.createHash('sha256').update(token).digest('hex'));
    if (!reset) return res.status(400).render('account/reset-password', { title: 'Choose a new password', token, account: { error: 'This reset link is invalid or expired.' } });
    await userModel.updatePassword(reset.user_id, await bcrypt.hash(password, 12));
    return res.redirect('/login');
  } catch (error) { return next(error); }
}

module.exports = { renderRegister, renderLogin, renderForgotPassword, renderResetPassword, register, login, logout, requestPasswordReset, resetPassword };