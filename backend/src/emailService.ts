import pool from './db.js';
import { EmailMessage } from './types.js';

interface DatabaseEmail {
  id: number;
  user_email: string;
  email_id: string;
  sender: string;
  subject: string;
  body: string;
  date: Date;
  is_read: boolean;
  category: string;
  priority: string;
  summary: string;
  suggested_action: string;
  created_at: Date;
  updated_at: Date;
}

// Convert database email to EmailMessage type
function dbEmailToEmailMessage(dbEmail: DatabaseEmail): EmailMessage {
  return {
    id: dbEmail.email_id,
    from: dbEmail.sender,
    subject: dbEmail.subject,
    snippet: dbEmail.body,
    date: dbEmail.date.toISOString(),
    category: dbEmail.category as any,
    priority: dbEmail.priority as any,
    summary: dbEmail.summary,
    suggestedAction: dbEmail.suggested_action,
  };
}

// Get all emails for a user
export async function getUserEmails(userEmail: string): Promise<EmailMessage[]> {
  const query = `
    SELECT
      id,
      user_email,
      email_id,
      sender,
      subject,
      body,
      date,
      is_read,
      category,
      priority,
      summary,
      suggested_action,
      created_at,
      updated_at
    FROM user_emails
    WHERE user_email = $1
    ORDER BY date DESC
  `;

  const result = await pool.query(query, [userEmail]);
  return result.rows.map(dbEmailToEmailMessage);
}

// Save or update email
export async function upsertEmail(userEmail: string, email: EmailMessage) {
  const query = `
    INSERT INTO user_emails (
      user_email,
      email_id,
      sender,
      subject,
      body,
      date,
      is_read,
      category,
      priority,
      summary,
      suggested_action
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (user_email, email_id)
    DO UPDATE SET
      sender = EXCLUDED.sender,
      subject = EXCLUDED.subject,
      body = EXCLUDED.body,
      date = EXCLUDED.date,
      is_read = EXCLUDED.is_read,
      category = EXCLUDED.category,
      priority = EXCLUDED.priority,
      summary = EXCLUDED.summary,
      suggested_action = EXCLUDED.suggested_action,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  // Parse date safely
  let parsedDate = new Date();
  if (email.date) {
    const dateObj = new Date(email.date);
    parsedDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  }

  const result = await pool.query(query, [
    userEmail,
    email.id,
    email.from,
    email.subject,
    email.snippet,
    parsedDate,
    false, // is_read
    email.category || 'general',
    email.priority || 'medium',
    email.summary || '',
    email.suggestedAction || '',
  ]);

  return dbEmailToEmailMessage(result.rows[0]);
}

// Save multiple emails (bulk insert/update)
export async function syncEmails(userEmail: string, emails: EmailMessage[]): Promise<EmailMessage[]> {
  const savedEmails: EmailMessage[] = [];

  // Use a transaction for bulk insert
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const email of emails) {
      const query = `
        INSERT INTO user_emails (
          user_email,
          email_id,
          sender,
          subject,
          body,
          date,
          is_read,
          category,
          priority,
          summary,
          suggested_action
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_email, email_id)
        DO UPDATE SET
          sender = EXCLUDED.sender,
          subject = EXCLUDED.subject,
          body = EXCLUDED.body,
          date = EXCLUDED.date,
          category = EXCLUDED.category,
          priority = EXCLUDED.priority,
          summary = EXCLUDED.summary,
          suggested_action = EXCLUDED.suggested_action,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      // Parse date safely
      let parsedDate = new Date();
      if (email.date) {
        const dateObj = new Date(email.date);
        parsedDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
      }

      const result = await client.query(query, [
        userEmail,
        email.id,
        email.from,
        email.subject,
        email.snippet,
        parsedDate,
        false, // is_read
        email.category || 'general',
        email.priority || 'medium',
        email.summary || '',
        email.suggestedAction || '',
      ]);

      savedEmails.push(dbEmailToEmailMessage(result.rows[0]));
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return savedEmails;
}

// Delete email
export async function deleteEmail(userEmail: string, emailId: string) {
  const query = 'DELETE FROM user_emails WHERE user_email = $1 AND email_id = $2 RETURNING *';
  const result = await pool.query(query, [userEmail, emailId]);
  return result.rows[0] ? dbEmailToEmailMessage(result.rows[0]) : null;
}

// Delete all emails for a user
export async function deleteAllUserEmails(userEmail: string) {
  const query = 'DELETE FROM user_emails WHERE user_email = $1';
  const result = await pool.query(query, [userEmail]);
  return result.rowCount;
}

// Get emails by category
export async function getEmailsByCategory(userEmail: string, category: string): Promise<EmailMessage[]> {
  const query = `
    SELECT
      id,
      user_email,
      email_id,
      sender,
      subject,
      body,
      date,
      is_read,
      category,
      priority,
      summary,
      suggested_action,
      created_at,
      updated_at
    FROM user_emails
    WHERE user_email = $1 AND category = $2
    ORDER BY date DESC
  `;

  const result = await pool.query(query, [userEmail, category]);
  return result.rows.map(dbEmailToEmailMessage);
}

// Mark email as read
export async function markEmailAsRead(userEmail: string, emailId: string) {
  const query = `
    UPDATE user_emails
    SET is_read = true, updated_at = CURRENT_TIMESTAMP
    WHERE user_email = $1 AND email_id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [userEmail, emailId]);
  return result.rows[0] ? dbEmailToEmailMessage(result.rows[0]) : null;
}

// Get last email sync date for user
export async function getLastEmailSync(userEmail: string): Promise<Date | null> {
  const query = 'SELECT last_email_sync FROM users WHERE email = $1';
  const result = await pool.query(query, [userEmail]);
  return result.rows[0]?.last_email_sync || null;
}

// Update last email sync date for user
export async function updateLastEmailSync(userEmail: string): Promise<void> {
  const query = 'UPDATE users SET last_email_sync = CURRENT_TIMESTAMP WHERE email = $1';
  await pool.query(query, [userEmail]);
}
