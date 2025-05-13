const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  picture: String,
  accessToken: String,
  refreshToken: String,
  tokenExpiresAt: {
    type: Date,
    default: new Date(Date.now() + 3600000)
  },
  lastSync: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

module.exports = mongoose.model('User', userSchema);