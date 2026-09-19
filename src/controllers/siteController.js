const contentModel = require('../models/contentModel');

function renderHome(req, res) {
  res.render('index', { title: 'Digital products with lasting value' });
}

function renderAbout(req, res) {
  res.render('page/about', { title: 'About VJU Tech Limited' });
}

function renderServices(req, res) {
  res.render('page/services', { title: 'Services that move business forward' });
}

async function renderPortfolio(req, res, next) {
  try { return res.render('management/portfolio', { title: 'Selected work', items: await contentModel.findPublishedPortfolio() }); } catch (error) { return next(error); }
}

function renderContact(req, res) {
  res.render('page/contact', { title: 'Contact VJU Tech', inquiry: null, contact: true });
}

function renderInquiry(req, res) {
  res.render('page/inquiry', { title: 'Start a project inquiry', inquiry: null });
}

async function renderBlog(req, res, next) {
  try { return res.render('management/blogs', { title: 'Insights', posts: await contentModel.findPublishedPosts() }); } catch (error) { return next(error); }
}

function renderLogin(req, res) {
  res.render('account/login', { title: 'Client login' });
}

function renderRegister(req, res) {
  res.render('account/register', { title: 'Create an account' });
}

module.exports = {
  renderHome, renderAbout, renderServices, renderPortfolio, renderContact, renderInquiry,
  renderBlog, renderLogin, renderRegister
};