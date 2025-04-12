const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Generate Google OAuth URL
router.get('/google/url', authController.getAuthUrl);

// Handle Google OAuth callback
router.get('/google/callback', authController.handleCallback);

// Verify JWT token
router.get('/verify', authMiddleware, authController.verifyToken);

module.exports = router;