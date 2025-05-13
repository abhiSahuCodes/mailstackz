const User = require('../models/User');
const GoogleService = require('../services/googleService');
const logger = require('../utils/logger');

const tokenRefreshMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      logger.error('Token refresh failed: User not found', {
        userId: req.user.userId
      });
      return res.status(404).json({ error: 'User not found' });
    }

    const tokenExpired = Date.now() >= user.tokenExpiresAt;
    
    if (tokenExpired && user.refreshToken) {
      logger.info('Attempting token refresh', {
        userId: user._id,
        email: user.email
      });

      try {
        const newCredentials = await GoogleService.refreshAccessToken(user.refreshToken);
        
        user.accessToken = newCredentials.access_token;
        user.tokenExpiresAt = Date.now() + (newCredentials.expiry_date || 3600000);
        await user.save();

        logger.info('Token refresh successful', {
          userId: user._id,
          expiresAt: user.tokenExpiresAt
        });
      } catch (refreshError) {
        logger.error('Token refresh failed', {
          userId: user._id,
          error: refreshError.message,
          stack: refreshError.stack
        });
        throw refreshError;
      }
    }

    next();
  } catch (error) {
    logger.error('Token refresh middleware failed', {
      error: error.message,
      stack: error.stack
    });
    res.status(401).json({ error: 'Token refresh failed' });
  }
};

module.exports = tokenRefreshMiddleware;