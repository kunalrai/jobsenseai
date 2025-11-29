# Email Database Sync - User Guide

## Overview

JobSense AI now automatically syncs your job-related emails to the PostgreSQL database, allowing you to:
- Access emails across multiple devices
- Keep historical email data
- Analyze email trends over time
- Never lose important job communications

---

## Features

✅ **Auto-Save on Scan**
- When you scan inbox, emails are automatically saved to database
- AI-analyzed emails (with category, priority, summary) are stored

✅ **Auto-Load on Visit**
- Previously scanned emails load automatically when you visit Email Assistant
- No need to reconnect to Gmail every time

✅ **Persistent Storage**
- Emails survive browser refresh
- Emails persist across sessions
- Emails accessible from any device (same account)

✅ **AI Analysis Preserved**
- Email categories (job_offer, interview, rejection, general)
- Priority levels (high, medium, low)
- AI-generated summaries
- Suggested actions

---

## How It Works

### First Time Setup

1. **Login to JobSense AI**
   - Sign in with Google OAuth
   - Your user account is created in database

2. **Visit Email Assistant**
   - Navigate to "Email Assistant" in sidebar
   - Click "Connect Gmail" or use Mock Mode

3. **Scan Inbox**
   - Click "Scan Inbox" button
   - Emails are fetched from Gmail (or mock data)
   - AI analyzes each email
   - All emails automatically saved to database

### Returning Users

1. **Login to JobSense AI**
   - Sign in with same Google account

2. **Visit Email Assistant**
   - Emails automatically load from database
   - See all previously scanned emails
   - Click "Scan Inbox" to refresh with new emails

---

## Database Schema

### `user_emails` Table

```sql
CREATE TABLE user_emails (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,     -- Your Google account email
  email_id VARCHAR(255) NOT NULL,        -- Gmail message ID
  sender VARCHAR(500),                   -- Email sender
  subject TEXT,                          -- Email subject
  body TEXT,                             -- Email content/snippet
  date TIMESTAMP,                        -- Email date/time
  is_read BOOLEAN DEFAULT false,         -- Read status
  category VARCHAR(50),                  -- AI category (job_offer, interview, etc.)
  priority VARCHAR(20),                  -- AI priority (high, medium, low)
  summary TEXT,                          -- AI-generated summary
  suggested_action TEXT,                 -- AI suggested action
  created_at TIMESTAMP,                  -- When saved to database
  updated_at TIMESTAMP,                  -- Last updated
  UNIQUE(user_email, email_id)           -- Prevent duplicates
);
```

---

## API Endpoints

### Get All User Emails
```
GET /api/emails/:email
```

**Response:**
```json
[
  {
    "id": "msg_123456",
    "from": "recruiter@company.com",
    "subject": "Interview Invitation",
    "snippet": "We'd like to schedule an interview...",
    "date": "2025-01-15T10:30:00Z",
    "category": "interview",
    "priority": "high",
    "summary": "Interview invitation for Senior Engineer role",
    "suggestedAction": "Reply within 24 hours to schedule"
  }
]
```

### Sync Emails (Bulk Save)
```
POST /api/emails/sync
```

**Request:**
```json
{
  "email": "user@example.com",
  "emails": [
    {
      "id": "msg_123",
      "from": "sender@example.com",
      "subject": "Job Opportunity",
      "snippet": "Email content...",
      "date": "2025-01-15T10:00:00Z",
      "category": "job_offer",
      "priority": "high",
      "summary": "Job offer for Software Engineer",
      "suggestedAction": "Review and respond"
    }
  ]
}
```

### Get Emails by Category
```
GET /api/emails/:email/category/:category
```

Categories: `job_offer`, `interview`, `rejection`, `general`, `newsletter`

### Delete Email
```
DELETE /api/emails/:email/:emailId
```

### Delete All Emails
```
DELETE /api/emails/:email
```

---

## Frontend Integration

### Auto-Load Emails

When EmailSection component mounts:

```typescript
useEffect(() => {
  const loadEmailsFromDatabase = async () => {
    if (user?.email) {
      const savedEmails = await emailStorage.getUserEmails(user.email);
      if (savedEmails.length > 0) {
        setEmails(savedEmails);
        console.log(`Loaded ${savedEmails.length} emails from database`);
      }
    }
  };

  loadEmailsFromDatabase();
}, [user]);
```

### Auto-Save After Scan

When scanning inbox:

```typescript
const scanInbox = async () => {
  // Fetch and analyze emails
  const analyzed = await analyzeEmails(rawEmails);
  setEmails(analyzed);

  // Save to database
  if (user?.email && analyzed.length > 0) {
    await emailStorage.syncEmails(user.email, analyzed);
    console.log(`Synced ${analyzed.length} emails to database`);
  }
};
```

---

## Data Flow

### Email Scan Flow
```
1. User clicks "Scan Inbox"
   ↓
2. Fetch emails from Gmail API (or mock data)
   ↓
3. Send emails to Gemini AI for analysis
   ↓
4. Receive analyzed emails (with category, priority, summary)
   ↓
5. Display in UI
   ↓
6. Save to database via POST /api/emails/sync
   ↓
7. Database stores with user_email association
   ↓
8. Console logs: "Synced X emails to database"
```

### Email Load Flow
```
1. User logs in
   ↓
2. User navigates to Email Assistant
   ↓
3. Component calls GET /api/emails/:email
   ↓
4. Backend queries database
   ↓
5. Returns all saved emails for user
   ↓
6. Display in UI
   ↓
7. Console logs: "Loaded X emails from database"
```

---

## Usage Examples

### Scenario 1: First Time User

**Action:**
1. Login to JobSense AI
2. Go to Email Assistant
3. Click "Connect Gmail" (or use Mock Mode)
4. Click "Scan Inbox"

**Result:**
- Sees 4 mock emails (or real Gmail emails)
- Each email has AI analysis (category, priority, summary)
- All 4 emails saved to database
- Console: "Synced 4 emails to database"

### Scenario 2: Returning User

**Action:**
1. Login to JobSense AI
2. Go to Email Assistant

**Result:**
- Automatically sees 4 previously scanned emails
- No need to reconnect or rescan
- Console: "Loaded 4 emails from database"

### Scenario 3: Refresh Emails

**Action:**
1. Already have emails loaded
2. Click "Scan Inbox" again

**Result:**
- Fetches latest emails from Gmail
- AI analyzes new emails
- Updates database (adds new, updates existing)
- Shows refreshed email list

### Scenario 4: Multiple Devices

**Action:**
1. Scan emails on Device A
2. Login on Device B

**Result:**
- Device B shows same emails from database
- Both devices stay in sync
- Works across desktop, laptop, tablet

---

## Features by Mode

### Mock Mode (Default)
- Uses 4 predefined mock emails
- AI analyzes and categorizes
- Saves to database
- Perfect for testing/demo

### Real Gmail Mode
- Fetches actual Gmail messages
- Requires Google OAuth setup
- AI analyzes real emails
- Saves to database
- Production-ready

---

## Console Messages

### Success Messages
```
✅ Loaded 4 emails from database
✅ Synced 4 emails to database
```

### Error Messages
```
❌ Failed to load emails from database: [error]
❌ Failed to sync emails to database: [error]
```

---

## Database Operations

### View User Emails (SQL)
```sql
SELECT * FROM user_emails
WHERE user_email = 'user@example.com'
ORDER BY date DESC;
```

### View Email Categories
```sql
SELECT category, COUNT(*)
FROM user_emails
WHERE user_email = 'user@example.com'
GROUP BY category;
```

### View High Priority Emails
```sql
SELECT subject, sender, summary
FROM user_emails
WHERE user_email = 'user@example.com'
  AND priority = 'high'
ORDER BY date DESC;
```

### Delete Old Emails
```sql
DELETE FROM user_emails
WHERE user_email = 'user@example.com'
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## Security & Privacy

🔒 **Email Isolation**
- Emails linked to your Google account email
- You can only see your own emails
- No cross-user access

🔒 **Database Security**
- PostgreSQL credentials secure on backend
- No direct database access from frontend
- All operations via authenticated API

🔒 **Data Retention**
- Emails stored indefinitely
- Can be deleted via API endpoint
- Cascade delete when user account deleted

---

## Troubleshooting

### Emails Not Loading?

**Check:**
1. Logged in? (Check sidebar for user info)
2. Backend running? (http://localhost:3001/api/health)
3. Database connected? (Check backend logs)
4. Console errors? (Check browser DevTools)

**Solution:**
- Try logout and login again
- Click "Scan Inbox" to refresh
- Check backend is running: `cd backend && npm run dev`

### Emails Not Saving?

**Check:**
1. Console for errors after scanning
2. Backend logs for database errors
3. Database connection string in `backend/.env`

**Solution:**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` is correct
- Verify `user_emails` table exists:
  ```sql
  \dt user_emails
  ```

### Duplicate Emails?

**Won't Happen:**
- Database has `UNIQUE(user_email, email_id)` constraint
- Duplicate emails are updated, not duplicated
- Same email scanned twice = same database record

---

## Future Enhancements

- [ ] Email search by subject/sender
- [ ] Filter by category/priority
- [ ] Mark emails as read/unread
- [ ] Archive old emails
- [ ] Export emails to CSV/JSON
- [ ] Email analytics dashboard
- [ ] Smart notifications for high-priority emails
- [ ] Auto-reply suggestions based on history

---

## Files Updated

### Backend
- `backend/src/schema.sql` - Added `user_emails` table
- `backend/src/emailService.ts` - Email CRUD operations
- `backend/src/server.ts` - Email API endpoints

### Frontend
- `components/EmailSection.tsx` - Auto-load and auto-save
- `services/emailStorageService.ts` - Email API client

---

## Summary

Email sync is now fully integrated:

✅ **Auto-Save**: Emails automatically saved after scanning
✅ **Auto-Load**: Emails automatically loaded on visit
✅ **Persistent**: Data survives sessions and devices
✅ **Secure**: User-isolated, backend-protected storage
✅ **AI-Enhanced**: Categories, priorities, summaries preserved

Your job-related emails are now safely stored in the database and accessible anytime, anywhere!
