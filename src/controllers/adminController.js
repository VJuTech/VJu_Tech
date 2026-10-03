const adminModel = require('../models/adminModel');
const contentModel = require('../models/contentModel');
const projectModel = require('../models/projectModel');
const auditModel = require('../models/auditModel');

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function contentFormValues(body) {
  return {
    title: String(body.title || '').trim(), slug: slugify(body.slug || body.title), summary: String(body.summary || '').trim(),
    description: String(body.description || '').trim(), excerpt: String(body.excerpt || '').trim(), body: String(body.body || '').trim(),
    problem: String(body.problem || '').trim(), solution: String(body.solution || '').trim(), result: String(body.result || '').trim(),
    role: String(body.role || '').trim(), timeline: String(body.timeline || '').trim(), technologies: String(body.technologies || '').trim(),
    clientName: String(body.clientName || '').trim(), clientLogo: String(body.clientLogo || '').trim(),
    testimonial: String(body.testimonial || '').trim(), testimonialAuthor: String(body.testimonialAuthor || '').trim(),
    category: String(body.category || 'web-development').trim(), imageKey: String(body.imageKey || '').trim(), projectLink: String(body.projectLink || '').trim(),
    featured: body.featured === 'on', sortOrder: Math.max(0, Number.parseInt(body.sortOrder, 10) || 0), published: body.published === 'on'
  };
}

async function overview(req, res, next) {
  try {
    const [summary, inquiries, projects, checkouts, activity] = await Promise.all([
      adminModel.dashboardSummary(), adminModel.findInquiries(), adminModel.findProjects(), adminModel.recentCheckouts(), auditModel.recent(8)
    ]);
    return res.render('management/admin', { title: 'Admin dashboard', summary, inquiries, projects, checkouts, activity });
  } catch (error) { return next(error); }
}

async function updateInquiryStatus(req, res, next) {
  const allowedStatuses = new Set(['new', 'contacted', 'converted', 'closed']);
  const { status } = req.body;
  if (!allowedStatuses.has(status)) return res.status(400).render('management/error', { title: 'Invalid inquiry status', error: null });
  try {
    const inquiry = await adminModel.updateInquiryStatus(req.params.id, status);
    if (!inquiry) return res.status(404).render('management/error', { title: 'Inquiry not found', error: null });
    await auditModel.record({ actorId: req.user.id, action: 'inquiry.status_updated', entityType: 'inquiry', entityId: inquiry.id, metadata: { status }, req });
    return res.redirect('/admin/inquiries');
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
async function newContent(req, res) { return res.render('management/content-editor', { title: `New ${req.params.type}`, type: req.params.type, item: null, error: null }); }
async function editContent(req, res, next) {
  try {
    const item = req.params.type === 'portfolio' ? await contentModel.findPortfolioById(req.params.id) : await contentModel.findPostById(req.params.id);
    if (!item) return res.status(404).render('management/error', { title: 'Content not found', error: null });
    return res.render('management/content-editor', { title: `Edit ${req.params.type}`, type: req.params.type, item, error: null });
  } catch (error) { return next(error); }
}
async function saveContent(req, res, next) {
  const { type } = req.params;
  if (!['portfolio', 'blog'].includes(type)) return res.status(400).render('management/error', { title: 'Invalid content type', error: null });
  const values = contentFormValues(req.body);
  const required = type === 'portfolio' ? [values.title, values.slug, values.summary] : [values.title, values.slug, values.body];
  if (required.some((value) => !value)) return res.status(400).render('management/content-editor', { title: `Edit ${type}`, type, item: { ...values, published: req.body.published === 'on' }, error: 'Title, slug, and the required content fields must be completed.' });
  try {
        if (req.file) {
          values.imageData = req.file.buffer;
          values.imageMimeType = req.file.mimetype;
          values.imageKey = null;
        }
    const id = req.params.id;
    const saved = type === 'portfolio'
      ? (id ? await contentModel.updatePortfolio(id, values) : await contentModel.createPortfolio(values))
      : (id ? await contentModel.updatePost(id, { ...values, authorId: req.user.id }) : await contentModel.createPost({ ...values, authorId: req.user.id }));
    if (!saved) return res.status(404).render('management/error', { title: 'Content not found', error: null });
    await auditModel.record({ actorId: req.user.id, action: `${type}.${id ? 'updated' : 'created'}`, entityType: type, entityId: saved.id, metadata: { published: values.published }, req });
    return res.redirect('/admin/content');
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).render('management/content-editor', {
        title: `Edit ${type}`, type, item: { ...values, published: values.published },
        error: 'That URL slug is already in use. Choose a different slug and try again.'
      });
    }
    if (error.code === 'LIMIT_FILE_SIZE' || error.name === 'MulterError') {
      return res.status(400).render('management/content-editor', {
        title: `Edit ${type}`, type, item: { ...values, published: values.published },
        error: 'The image could not be uploaded. Use JPG, PNG, WebP, or GIF up to 5 MB and try again.'
      });
    }
    if (error.code && error.code.startsWith('23')) {
      return res.status(400).render('management/content-editor', {
        title: `Edit ${type}`, type, item: { ...values, published: values.published },
        error: 'The content could not be saved because one of the submitted values is invalid. Check the fields and try again.'
      });
    }
    return next(error);
  }
}
async function deleteContent(req, res, next) {
  try {
    const { type, id } = req.params;
    if (type === 'portfolio') await contentModel.deletePortfolio(id); else if (type === 'blog') await contentModel.deletePost(id); else return res.status(400).render('management/error', { title: 'Invalid content type', error: null });
    await auditModel.record({ actorId: req.user.id, action: `${type}.deleted`, entityType: type, entityId: id, req });
    return res.redirect('/admin/content');
  } catch (error) { return next(error); }
}
async function messages(req, res, next) { try { return res.render('management/messages', { title: 'Project messages', messages: await adminModel.findMessages() }); } catch (error) { return next(error); } }

module.exports = { overview, inquiries, updateInquiryStatus, projects, newProject, createProject, users, content, newContent, editContent, saveContent, deleteContent, messages };