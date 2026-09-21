const projectModel = require('../models/projectModel');
const auditModel = require('../models/auditModel');
const storage = require('../services/storage');

async function dashboard(req, res, next) {
  try {
    const projects = await projectModel.findByClientId(req.user.id);
    return res.render('management/dashboard', { title: 'Client dashboard', projects });
  } catch (error) { return next(error); }
}

async function project(req, res, next) {
  try {
    const project = await projectModel.findByIdForUser(req.params.id, req.user.id);
    if (!project) return res.status(404).render('management/error', { title: 'Project not found', error: null });
    const [messages, files] = await Promise.all([projectModel.findMessages(project.id), projectModel.findFiles(project.id)]);
    return res.render('management/project', { title: project.name, project, messages, files });
  } catch (error) { return next(error); }
}

async function sendMessage(req, res, next) {
  try {
    const project = await projectModel.findByIdForUser(req.params.id, req.user.id);
    if (!project || !req.body.body) return res.redirect(`/dashboard/projects/${req.params.id}`);
    await projectModel.createMessage(project.id, req.user.id, req.body.body);
    await auditModel.record({ actorId: req.user.id, action: 'message.created', entityType: 'project', entityId: project.id, req });
    return res.redirect(`/dashboard/projects/${project.id}`);
  } catch (error) { return next(error); }
}

async function uploadFile(req, res, next) {
  try {
    const project = await projectModel.findByIdForUser(req.params.id, req.user.id);
    if (!project || !req.file) return res.redirect(`/dashboard/projects/${req.params.id}?fileError=1`);
    const storageKey = await storage.save(req.file);
    await projectModel.createFile({ projectId: project.id, uploadedBy: req.user.id, fileName: req.file.originalname, storageKey, fileType: req.file.mimetype, fileSize: req.file.size });
    await auditModel.record({ actorId: req.user.id, action: 'file.uploaded', entityType: 'project', entityId: project.id, metadata: { fileName: req.file.originalname }, req });
    return res.redirect(`/dashboard/projects/${project.id}`);
  } catch (error) { return next(error); }
}

async function downloadFile(req, res, next) {
  try {
    const file = await projectModel.findFileForUser(req.params.fileId, req.params.id, req.user.id);
    if (!file) return res.status(404).render('management/error', { title: 'File not found', error: null });
    return res.download(storage.resolve(file.storage_key), file.file_name);
  } catch (error) { return next(error); }
}

module.exports = { dashboard, project, sendMessage, uploadFile, downloadFile };