const mongoose = require('mongoose');

const senderStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderEmail: {
    type: String,
    required: true,
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  lastInteraction: Date,
  responseRate: {
    type: Number,
    default: 0,
  },
  averageResponseTime: {
    type: Number,
    default: 0,
  },
  importanceScore: {
    type: Number,
    default: 0,
  }
});

// Compound index for efficient queries
senderStatsSchema.index({ userId: 1, senderEmail: 1 }, { unique: true });

module.exports = mongoose.model('SenderStats', senderStatsSchema);