const contentModel = require('../models/contentModel');
const { packages, addOnCatalog } = require('../config/packages');

function renderHome(req, res) {
  res.render('index', { title: 'Digital products with lasting value' });
}

function renderAbout(req, res) {
  res.render('page/about', { title: 'About VJU Tech Limited' });
}

function renderServices(req, res) {
  res.render('page/services', { title: 'Services that move business forward' });
}

function renderPackages(req, res) {
  res.render('page/packages', { title: 'Website packages and pricing', packages, addOns: addOnCatalog });
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
async function renderContentImage(req, res, next) {
  try {
    const image = await contentModel.findImage(req.params.type, req.params.id);
    if (!image?.image_data) return res.sendStatus(404);
    res.type(image.image_mime_type || 'application/octet-stream');
    return res.send(image.image_data);
  } catch (error) { return next(error); }
}

function renderLogin(req, res) {
  res.render('account/login', { title: 'Client login' });
}

function renderRegister(req, res) {
  res.render('account/register', { title: 'Create an account' });
}

module.exports = {
  renderHome, renderAbout, renderServices, renderPackages, renderPortfolio, renderContact, renderInquiry,
  renderBlog, renderContentImage, renderLogin, renderRegister
};