import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import * as geminiService from './geminiService.js';
import * as profileService from './profileService.js';
import * as emailService from './emailService.js';
import { initializeDatabase } from './initDb.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'JobSense AI Backend is running' });
});

// Database test endpoint
app.get('/api/db/test', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, timestamp: result.rows[0].now });
  } catch (error: any) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gemini API Proxy Endpoints

// Parse Resume
app.post('/api/gemini/parse-resume', async (req: Request, res: Response) => {
  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Missing base64Data or mimeType' });
    }

    const result = await geminiService.parseResume(base64Data, mimeType);
    res.json(result);
  } catch (error: any) {
    console.error('Parse resume error:', error);
    res.status(500).json({ error: 'Failed to parse resume', details: error.message });
  }
});

// Search Jobs
app.post('/api/gemini/search-jobs', async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Missing profile data' });
    }

    const result = await geminiService.searchJobs(profile);
    res.json(result);
  } catch (error: any) {
    console.error('Search jobs error:', error);
    res.status(500).json({ error: 'Failed to search jobs', details: error.message });
  }
});

// Generate Email
app.post('/api/gemini/generate-email', async (req: Request, res: Response) => {
  try {
    const { profile, jobDescription, type } = req.body;

    if (!profile || !jobDescription || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await geminiService.generateEmail(profile, jobDescription, type);
    res.json({ text: result });
  } catch (error: any) {
    console.error('Generate email error:', error);
    res.status(500).json({ error: 'Failed to generate email', details: error.message });
  }
});

// Analyze Emails
app.post('/api/gemini/analyze-emails', async (req: Request, res: Response) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Invalid emails data' });
    }

    const result = await geminiService.analyzeEmails(emails);
    res.json(result);
  } catch (error: any) {
    console.error('Analyze emails error:', error);
    res.status(500).json({ error: 'Failed to analyze emails', details: error.message });
  }
});

// Generate Smart Reply
app.post('/api/gemini/smart-reply', async (req: Request, res: Response) => {
  try {
    const { email, profile } = req.body;

    if (!email || !profile) {
      return res.status(400).json({ error: 'Missing email or profile data' });
    }

    const result = await geminiService.generateSmartReply(email, profile);
    res.json({ text: result });
  } catch (error: any) {
    console.error('Smart reply error:', error);
    res.status(500).json({ error: 'Failed to generate smart reply', details: error.message });
  }
});

// Profile API Endpoints

// Create or update user (from Google OAuth)
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { email, name, picture } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const user = await profileService.upsertUser({ email, name, picture });
    res.json(user);
  } catch (error: any) {
    console.error('Upsert user error:', error);
    res.status(500).json({ error: 'Failed to create/update user', details: error.message });
  }
});

// Get user profile
app.get('/api/profiles/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }

    const profile = await profileService.getUserProfile(email);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile', details: error.message });
  }
});

// Save user profile
app.post('/api/profiles', async (req: Request, res: Response) => {
  try {
    const { email, profile } = req.body;

    if (!email || !profile) {
      return res.status(400).json({ error: 'Missing email or profile data' });
    }

    const savedProfile = await profileService.upsertUserProfile(email, profile);
    res.json(savedProfile);
  } catch (error: any) {
    console.error('Save profile error:', error);
    res.status(500).json({ error: 'Failed to save profile', details: error.message });
  }
});

// Delete user profile
app.delete('/api/profiles/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }

    const deletedProfile = await profileService.deleteUserProfile(email);

    if (!deletedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ success: true, message: 'Profile deleted' });
  } catch (error: any) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete profile', details: error.message });
  }
});

// Email API Endpoints

// Get all user emails
app.get('/api/emails/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }

    const emails = await emailService.getUserEmails(email);
    res.json(emails);
  } catch (error: any) {
    console.error('Get emails error:', error);
    res.status(500).json({ error: 'Failed to get emails', details: error.message });
  }
});

// Get last email sync date
app.get('/api/emails/:email/last-sync', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }

    const lastSync = await emailService.getLastEmailSync(email);
    res.json({ lastSync });
  } catch (error: any) {
    console.error('Get last sync error:', error);
    res.status(500).json({ error: 'Failed to get last sync date', details: error.message });
  }
});

// Sync emails (bulk save)
app.post('/api/emails/sync', async (req: Request, res: Response) => {
  try {
    const { email, emails } = req.body;

    if (!email || !emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Missing email or emails array' });
    }

    const savedEmails = await emailService.syncEmails(email, emails);

    // Update last sync timestamp
    await emailService.updateLastEmailSync(email);

    res.json({ success: true, count: savedEmails.length, emails: savedEmails });
  } catch (error: any) {
    console.error('Sync emails error:', error);
    res.status(500).json({ error: 'Failed to sync emails', details: error.message });
  }
});

// Save single email
app.post('/api/emails', async (req: Request, res: Response) => {
  try {
    const { email, emailData } = req.body;

    if (!email || !emailData) {
      return res.status(400).json({ error: 'Missing email or emailData' });
    }

    const savedEmail = await emailService.upsertEmail(email, emailData);
    res.json(savedEmail);
  } catch (error: any) {
    console.error('Save email error:', error);
    res.status(500).json({ error: 'Failed to save email', details: error.message });
  }
});

// Get emails by category
app.get('/api/emails/:email/category/:category', async (req: Request, res: Response) => {
  try {
    const { email, category } = req.params;

    if (!email || !category) {
      return res.status(400).json({ error: 'Missing email or category parameter' });
    }

    const emails = await emailService.getEmailsByCategory(email, category);
    res.json(emails);
  } catch (error: any) {
    console.error('Get emails by category error:', error);
    res.status(500).json({ error: 'Failed to get emails by category', details: error.message });
  }
});

// Mark email as read
app.put('/api/emails/:email/:emailId/read', async (req: Request, res: Response) => {
  try {
    const { email, emailId } = req.params;

    if (!email || !emailId) {
      return res.status(400).json({ error: 'Missing email or emailId parameter' });
    }

    const updatedEmail = await emailService.markEmailAsRead(email, emailId);

    if (!updatedEmail) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(updatedEmail);
  } catch (error: any) {
    console.error('Mark email as read error:', error);
    res.status(500).json({ error: 'Failed to mark email as read', details: error.message });
  }
});

// Delete single email
app.delete('/api/emails/:email/:emailId', async (req: Request, res: Response) => {
  try {
    const { email, emailId } = req.params;

    if (!email || !emailId) {
      return res.status(400).json({ error: 'Missing email or emailId parameter' });
    }

    const deletedEmail = await emailService.deleteEmail(email, emailId);

    if (!deletedEmail) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ success: true, message: 'Email deleted' });
  } catch (error: any) {
    console.error('Delete email error:', error);
    res.status(500).json({ error: 'Failed to delete email', details: error.message });
  }
});

// Delete all user emails
app.delete('/api/emails/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }

    const count = await emailService.deleteAllUserEmails(email);
    res.json({ success: true, message: 'All emails deleted', count });
  } catch (error: any) {
    console.error('Delete all emails error:', error);
    res.status(500).json({ error: 'Failed to delete all emails', details: error.message });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database schema
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║   🚀 JobSense AI Backend Server          ║
║   📡 Port: ${PORT}                           ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}            ║
║   🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}       ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
