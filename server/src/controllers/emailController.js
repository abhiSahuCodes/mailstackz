const EmailService = require("../services/emailService");
const User = require("../models/User");
const Email = require("../models/Email");

const emailController = {
  async syncEmails(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const emailService = new EmailService(user.accessToken);
      const emails = await emailService.syncEmails(user._id);

      user.lastSync = new Date();
      await user.save();

      res.json({
        message: "Emails synchronized successfully",
        count: emails.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Email sync failed" });
    }
  },

  async getEmails(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        priority,
        age,
        readStatus,
      } = req.query;
      const query = { userId: req.user.userId };

      if (category) query.category = category;
      if (priority) query.priority = priority;
      if (readStatus) query.isRead = readStatus === "read";

      // Add age-based filtering
      if (age) {
        const now = new Date();
        switch (age) {
          case "recent": // last 24 hours
            query.date = { $gte: new Date(now - 24 * 60 * 60 * 1000) };
            break;
          case "thisWeek":
            query.date = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
            break;
          case "thisMonth":
            query.date = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
            break;
        }
      }

      const emails = await Email.find(query)
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const count = await Email.countDocuments(query);

      res.json({
        emails,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalEmails: count,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  },

  async updateEmailMetadata(req, res) {
    try {
      const { messageId } = req.params;
      const { category, priority } = req.body;

      const email = await Email.findOneAndUpdate(
        { messageId, userId: req.user.userId },
        { category, priority },
        { new: true }
      );

      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      res.json(email);
    } catch (error) {
      res.status(500).json({ error: "Failed to update email metadata" });
    }
  },

  async bulkUpdateCategory(req, res) {
    try {
      const { messageIds, category } = req.body;

      const result = await Email.updateMany(
        {
          messageId: { $in: messageIds },
          userId: req.user.userId,
        },
        { category }
      );

      res.json({
        message: "Bulk update successful",
        updatedCount: result.modifiedCount,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to perform bulk update" });
    }
  },

  async getEmailStats(req, res) {
    try {
      const stats = await Email.aggregate([
        { $match: { userId: req.user.userId } },
        {
          $group: {
            _id: null,
            totalEmails: { $sum: 1 },
            categoryStats: {
              $push: {
                k: "$category",
                v: 1,
              },
            },
            priorityStats: {
              $push: {
                k: "$priority",
                v: 1,
              },
            },
            unreadCount: {
              $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalEmails: 1,
            unreadCount: 1,
            categoryStats: { $arrayToObject: "$categoryStats" },
            priorityStats: { $arrayToObject: "$priorityStats" },
          },
        },
      ]);

      res.json(
        stats[0] || {
          totalEmails: 0,
          unreadCount: 0,
          categoryStats: {},
          priorityStats: {},
        }
      );
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email statistics" });
    }
  },
};

module.exports = emailController;
