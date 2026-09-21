const adminModel = require('../models/adminModel');
const contentModel = require('../models/contentModel');
const projectModel = require('../models/projectModel');
const auditModel = require('../models/auditModel');

async function overview(req, res, next) {
  try {
    const [users, inquiries, projects, messages] = await Promise.all([adminModel.findUsers(), adminModel.findInquiries(), adminModel.findProjects(), adminModel.findMessages()]);
    return res.render('management/admin', { title: 'Admin dashboard', users, inquiries, projects, messages });
  } catch (error) { return next(error); }
}

async function inquiries(req, res, next) { try { return res.render('management/inquiries', { title: 'Manage inquiries', inquiries: await adminModel.findInquiries() }); } catch (error) { return next(error); } }
async function projects(req, res, next) { try { return res.render('management/projects', { title: 'Manage projects', projects: await adminModel.findProjects(), clients: await adminModel.findClients() }); } catch (error) { return next(error); } }
async function newProject(req, res, next) { try { return res.render('management/project-new', { title: 'Create project', clients: await adminModel.findClients(), project: null }); } catch (error) { return next(error); } }
async function createProject(req, res, next) {
  try {
    const { clientId, name, description, status, progress, dueDate } = req.body;
    if (!clientId || !name) return res.status(400).render('management/project-new', { title: 'Create project', clients: await adminModel.findClients(), project: { error: 'Client and project name are required.' } });
    const project = await projectModel.createProject({ clientId, name, description, status, progress: Number(progress || 0), dueDate });
    await auditModel.record({ actorId: req.user.id, action: 'project.created', entityType: 'project', entityId: project.id, req });
    return res.redirect('/admin/projects');
  } catch (error) { return next(error); }
}
async function users(req, res, next) { try { return res.render('management/users', { title: 'Manage users', users: await adminModel.findUsers() }); } catch (error) { return next(error); } }
async function content(req, res, next) { try { const [portfolio, posts] = await Promise.all([contentModel.findAllPortfolio(), contentModel.findAllPosts()]); return res.render('management/content', { title: 'Manage content', portfolio, posts }); } catch (error) { return next(error); } }
async function messages(req, res, next) { try { return res.render('management/messages', { title: 'Project messages', messages: await adminModel.findMessages() }); } catch (error) { return next(error); } }

module.exports = { overview, inquiries, projects, newProject, createProject, users, content, messages };