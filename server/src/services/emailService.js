const { google } = require('googleapis');
const Email = require('../models/Email');

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

      const emailData = {
        userId,
        messageId,
        subject: headers.find(h => h.name === 'Subject')?.value || '',
        from: this.parseEmailAddress(headers.find(h => h.name === 'From')?.value),
        to: this.parseEmailAddresses(headers.find(h => h.name === 'To')?.value),
        date: new Date(headers.find(h => h.name === 'Date')?.value),
        snippet,
        labels: response.data.labelIds || []
      };

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

  parseEmailAddress(header) {
    if (!header) return { name: '', email: '' };
    const match = header.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
    return {
      name: match ? match[1] || '' : '',
      email: match ? match[2] || '' : header
    };
  }

  parseEmailAddresses(header) {
    if (!header) return [];
    return header.split(',').map(address => this.parseEmailAddress(address.trim()));
  }
}

module.exports = EmailService;