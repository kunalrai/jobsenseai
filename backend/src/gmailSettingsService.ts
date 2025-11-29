import pool from './db.js';

export interface GmailSettings {
  user_email: string;
  is_connected: boolean;
  connected_gmail?: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: Date;
  last_sync?: Date;
}

// Get Gmail settings for a user
export async function getGmailSettings(userEmail: string): Promise<GmailSettings | null> {
  const query = `
    SELECT
      user_email,
      is_connected,
      connected_gmail,
      access_token,
      refresh_token,
      token_expiry,
      last_sync
    FROM gmail_settings
    WHERE user_email = $1
  `;

  const result = await pool.query(query, [userEmail]);
  return result.rows[0] || null;
}

// Save or update Gmail settings
export async function upsertGmailSettings(settings: GmailSettings): Promise<GmailSettings> {
  const query = `
    INSERT INTO gmail_settings (
      user_email,
      is_connected,
      connected_gmail,
      access_token,
      refresh_token,
      token_expiry,
      last_sync
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_email)
    DO UPDATE SET
      is_connected = EXCLUDED.is_connected,
      connected_gmail = EXCLUDED.connected_gmail,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expiry = EXCLUDED.token_expiry,
      last_sync = EXCLUDED.last_sync,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const result = await pool.query(query, [
    settings.user_email,
    settings.is_connected,
    settings.connected_gmail || null,
    settings.access_token || null,
    settings.refresh_token || null,
    settings.token_expiry || null,
    settings.last_sync || null,
  ]);

  return result.rows[0];
}

// Disconnect Gmail (mark as not connected)
export async function disconnectGmail(userEmail: string): Promise<void> {
  const query = `
    UPDATE gmail_settings
    SET
      is_connected = false,
      access_token = NULL,
      refresh_token = NULL,
      token_expiry = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_email = $1
  `;

  await pool.query(query, [userEmail]);
}

// Update last sync time
export async function updateLastGmailSync(userEmail: string): Promise<void> {
  const query = `
    UPDATE gmail_settings
    SET last_sync = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE user_email = $1
  `;

  await pool.query(query, [userEmail]);
}

// Check if token is expired
export function isTokenExpired(settings: GmailSettings): boolean {
  if (!settings.token_expiry) return true;
  return new Date() >= new Date(settings.token_expiry);
}
