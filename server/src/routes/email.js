const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const authMiddleware = require('../middleware/auth');
const tokenRefreshMiddleware = require('../middleware/tokenRefresh');

router.use(authMiddleware);
router.use(tokenRefreshMiddleware);

router.post('/sync', emailController.syncEmails);
router.get('/', emailController.getEmails);
router.patch('/:messageId', emailController.updateEmailMetadata);
router.post('/bulk-update', emailController.bulkUpdateCategory);
router.get('/stats', emailController.getEmailStats);

module.exports = router;