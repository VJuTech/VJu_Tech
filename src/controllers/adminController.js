const adminModel = require('../models/adminModel');
const contentModel = require('../models/contentModel');

async function overview(req, res, next) {
  try {
    const [users, inquiries, projects, messages] = await Promise.all([adminModel.findUsers(), adminModel.findInquiries(), adminModel.findProjects(), adminModel.findMessages()]);
    return res.render('management/admin', { title: 'Admin dashboard', users, inquiries, projects, messages });
  } catch (error) { return next(error); }
}

async function inquiries(req, res, next) { try { return res.render('management/inquiries', { title: 'Manage inquiries', inquiries: await adminModel.findInquiries() }); } catch (error) { return next(error); } }
async function projects(req, res, next) { try { return res.render('management/projects', { title: 'Manage projects', projects: await adminModel.findProjects() }); } catch (error) { return next(error); } }
async function users(req, res, next) { try { return res.render('management/users', { title: 'Manage users', users: await adminModel.findUsers() }); } catch (error) { return next(error); } }
async function content(req, res, next) { try { const [portfolio, posts] = await Promise.all([contentModel.findAllPortfolio(), contentModel.findAllPosts()]); return res.render('management/content', { title: 'Manage content', portfolio, posts }); } catch (error) { return next(error); } }
async function messages(req, res, next) { try { return res.render('management/messages', { title: 'Project messages', messages: await adminModel.findMessages() }); } catch (error) { return next(error); } }

module.exports = { overview, inquiries, projects, users, content, messages };