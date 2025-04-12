const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const authController = {
  // Generate Google OAuth URL
  getAuthUrl: (req, res) => {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ url });
  },

  // Handle Google OAuth callback
  async handleCallback(req, res) {
    try {
      const { code } = req.query;
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const userInfo = await oauth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo'
      });

      // Find or create user
      let user = await User.findOne({ googleId: userInfo.data.sub });
      
      if (!user) {
        user = await User.create({
          googleId: userInfo.data.sub,
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token
        });
      } else {
        user.accessToken = tokens.access_token;
        if (tokens.refresh_token) {
          user.refreshToken = tokens.refresh_token;
        }
        await user.save();
      }

      // Generate JWT
      const jwtToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  // Verify JWT token
  async verifyToken(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture
        }
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

module.exports = authController;