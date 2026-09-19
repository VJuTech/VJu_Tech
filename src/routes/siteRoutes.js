const express = require('express');
const siteController = require('../controllers/siteController');
const contactController = require('../controllers/contactController');
const authController = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const portalController = require('../controllers/portalController');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/', siteController.renderHome);
router.get('/about', siteController.renderAbout);
router.get('/services', siteController.renderServices);
router.get('/portfolio', siteController.renderPortfolio);
router.get('/blog', siteController.renderBlog);
router.get('/contact', siteController.renderContact);
router.post('/contact', contactController.submitContactMessage);
router.get('/inquiry', siteController.renderInquiry);
router.post('/inquiry', contactController.submitInquiry);
router.get('/login', authController.renderLogin);
router.post('/login', authController.login);
router.get('/register', authController.renderRegister);
router.post('/register', authController.register);
router.get('/forgot-password', authController.renderForgotPassword);
router.post('/forgot-password', authController.requestPasswordReset);
router.get('/reset-password', authController.renderResetPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);
router.get('/dashboard', requireAuth, portalController.dashboard);
router.get('/dashboard/projects/:id', requireAuth, portalController.project);
router.post('/dashboard/projects/:id/messages', requireAuth, portalController.sendMessage);
router.get('/admin', requireAdmin, adminController.overview);
router.get('/admin/inquiries', requireAdmin, adminController.inquiries);
router.get('/admin/projects', requireAdmin, adminController.projects);
router.get('/admin/users', requireAdmin, adminController.users);
router.get('/admin/content', requireAdmin, adminController.content);
router.get('/admin/messages', requireAdmin, adminController.messages);

module.exports = router;