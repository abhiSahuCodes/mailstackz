const EmailService = require('../services/emailService');
const User = require('../models/User');
const Email = require('../models/Email');

const emailController = {
  async syncEmails(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const emailService = new EmailService(user.accessToken);
      const emails = await emailService.syncEmails(user._id);

      user.lastSync = new Date();
      await user.save();

      res.json({
        message: 'Emails synchronized successfully',
        count: emails.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Email sync failed' });
    }
  },

  async getEmails(req, res) {
    try {
      const { page = 1, limit = 20, category, priority } = req.query;
      const query = { userId: req.user.userId };

      if (category) query.category = category;
      if (priority) query.priority = priority;

      const emails = await Email.find(query)
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const count = await Email.countDocuments(query);

      res.json({
        emails,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalEmails: count
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch emails' });
    }
  }
};

module.exports = emailController;