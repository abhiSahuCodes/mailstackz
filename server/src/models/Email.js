const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messageId: {
    type: String,
    required: true,
    unique: true,
  },
  subject: String,
  from: {
    name: String,
    email: String,
  },
  to: [{
    name: String,
    email: String,
  }],
  date: Date,
  snippet: String,
  category: {
    type: String,
    enum: ['Work', 'Shopping', 'Travel', 'Promotions', 'Other'],
    default: 'Other',
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  labels: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Email', emailSchema);