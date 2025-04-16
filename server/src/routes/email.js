const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/sync', emailController.syncEmails);
router.get('/', emailController.getEmails);

module.exports = router;