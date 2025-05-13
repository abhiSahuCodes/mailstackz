const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const SenderStats = require('../models/SenderStats');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async categorizeEmail(subject, snippet) {
    const prompt = `Categorize this email into one of these categories: Work, Shopping, Travel, Promotions, Other.
Subject: ${subject}
Content: ${snippet}
Provide only the category name as response.`;

    const result = await this.model.generateContent(prompt);
    const category = result.response.text().trim();
    return category;
  }

  async calculatePriority(email) {
    let priority = 3; // Default priority
    
    // Enhanced keyword matching with categories and weights
    const keywordWeights = {
      urgent: 2,
      asap: 2,
      important: 1.5,
      deadline: 1.5,
      reminder: 1,
      meeting: 1,
      review: 1,
      payment: 2,
      invoice: 1.5,
      interview: 2,
      offer: 1.5,
      critical: 2,
      emergency: 2
    };

    // Check subject and snippet for weighted keywords
    const text = `${email.subject} ${email.snippet}`.toLowerCase();
    let keywordScore = 0;
    for (const [keyword, weight] of Object.entries(keywordWeights)) {
      if (text.includes(keyword)) {
        keywordScore += weight;
      }
    }
    
    // Normalize keyword score (0-2 range)
    priority += Math.min(keywordScore, 2);

    // Check sender importance
    const senderStats = await SenderStats.findOne({
      userId: email.userId,
      senderEmail: email.from.email
    });

    if (senderStats) {
      // Add sender importance score (0-1 range)
      priority += Math.min(senderStats.importanceScore, 1);
    }

    // Recent unread emails get higher priority
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!email.isRead && email.date > oneHourAgo) {
      priority += 1;
    }

    // Ensure priority stays within bounds (1-5)
    return Math.min(Math.max(Math.round(priority), 1), 5);
  }

  async updateSenderStats(email) {
    const stats = await SenderStats.findOneAndUpdate(
      {
        userId: email.userId,
        senderEmail: email.from.email
      },
      {
        $inc: { messageCount: 1 },
        $set: { lastInteraction: new Date() },
        $setOnInsert: {
          responseRate: 0,
          averageResponseTime: 0,
          importanceScore: 0
        }
      },
      { upsert: true, new: true }
    );

    // Calculate importance score based on message frequency and response rate
    const importanceScore = (
      (stats.messageCount / 100) * 0.4 + // Message frequency (40%)
      (stats.responseRate * 0.4) + // Response rate (40%)
      (Math.min(stats.averageResponseTime, 24) / 24) * 0.2 // Response time (20%)
    );

    await stats.updateOne({ importanceScore });
    return stats;
  }
}

module.exports = new AIService();