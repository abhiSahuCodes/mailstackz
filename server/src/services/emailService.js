const { google } = require('googleapis');
const Email = require('../models/Email');
const AIService = require('./aiService');

class EmailService {
  constructor(accessToken) {
    this.gmail = google.gmail({
      version: 'v1',
      auth: new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      )
    });
    this.gmail.context._options.auth.setCredentials({
      access_token: accessToken
    });
  }

  async syncEmails(userId, maxResults = 100) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults
      });

      const messages = response.data.messages || [];
      const emailPromises = messages.map(msg => this.processEmail(msg.id, userId));
      return await Promise.all(emailPromises);
    } catch (error) {
      console.error('Email sync error:', error);
      throw error;
    }
  }

  async processEmail(messageId, userId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date']
      });

      const { payload, snippet } = response.data;
      const headers = payload.headers;

      // Inside processEmail method, update the emailData object:
      const emailData = {
        userId,
        messageId,
        subject: headers.find(h => h.name === 'Subject')?.value || '',
        from: this.parseEmailAddress(headers.find(h => h.name === 'From')?.value),
        to: this.parseEmailAddresses(headers.find(h => h.name === 'To')?.value),
        date: new Date(headers.find(h => h.name === 'Date')?.value),
        snippet,
        labels: response.data.labelIds || [],
        category: await AIService.categorizeEmail(
          headers.find(h => h.name === 'Subject')?.value || '',
          snippet
        ),
        priority: await AIService.calculatePriority({
          subject: headers.find(h => h.name === 'Subject')?.value || '',
          date: new Date(headers.find(h => h.name === 'Date')?.value),
          isRead: response.data.labelIds?.includes('UNREAD') || false
        })
      };

      // Update sender stats before calculating priority
      await AIService.updateSenderStats(emailData);

      // Calculate priority with enhanced logic
      emailData.priority = await AIService.calculatePriority(emailData);

      return await Email.findOneAndUpdate(
        { messageId, userId },
        emailData,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Email processing error:', error);
      throw error;
    }
  }
}

module.exports = EmailService;