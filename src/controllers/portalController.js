const projectModel = require('../models/projectModel');

async function dashboard(req, res, next) {
  try {
    const projects = await projectModel.findByClientId(req.user.id);
    return res.render('management/dashboard', { title: 'Client dashboard', projects });
  } catch (error) { return next(error); }
}

async function project(req, res, next) {
  try {
    const project = await projectModel.findById(req.params.id);
    if (!project) return res.status(404).render('management/error', { title: 'Project not found', error: null });
    const messages = await projectModel.findMessages(project.id);
    return res.render('management/project', { title: project.name, project, messages });
  } catch (error) { return next(error); }
}

async function sendMessage(req, res, next) {
  try {
    const project = await projectModel.findById(req.params.id);
    if (!project || !req.body.body) return res.redirect(`/dashboard/projects/${req.params.id}`);
    await projectModel.createMessage(project.id, req.user.id, req.body.body);
    return res.redirect(`/dashboard/projects/${project.id}`);
  } catch (error) { return next(error); }
}

module.exports = { dashboard, project, sendMessage };