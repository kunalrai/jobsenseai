import pool from './db.js';
import { UserProfile } from './types.js';

interface User {
  email: string;
  name: string;
  picture: string;
}

// Create or update user from Google OAuth
export async function upsertUser(user: User) {
  const query = `
    INSERT INTO users (email, name, picture)
    VALUES ($1, $2, $3)
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      picture = EXCLUDED.picture,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const result = await pool.query(query, [user.email, user.name, user.picture]);
  return result.rows[0];
}

// Get user profile by email
export async function getUserProfile(email: string): Promise<UserProfile | null> {
  const query = `
    SELECT
      name,
      location,
      about_me as "aboutMe",
      skills,
      experience,
      education,
      contact_email as "email",
      phone,
      linkedin,
      github,
      portfolio,
      resume_data as "resumeData",
      resume_mime_type as "resumeMimeType",
      resume_name as "resumeName"
    FROM user_profiles
    WHERE user_email = $1
  `;

  const result = await pool.query(query, [email]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

// Create or update user profile
export async function upsertUserProfile(email: string, profile: UserProfile) {
  const query = `
    INSERT INTO user_profiles (
      user_email,
      name,
      location,
      about_me,
      skills,
      experience,
      education,
      contact_email,
      phone,
      linkedin,
      github,
      portfolio,
      resume_data,
      resume_mime_type,
      resume_name
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (user_email)
    DO UPDATE SET
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      about_me = EXCLUDED.about_me,
      skills = EXCLUDED.skills,
      experience = EXCLUDED.experience,
      education = EXCLUDED.education,
      contact_email = EXCLUDED.contact_email,
      phone = EXCLUDED.phone,
      linkedin = EXCLUDED.linkedin,
      github = EXCLUDED.github,
      portfolio = EXCLUDED.portfolio,
      resume_data = EXCLUDED.resume_data,
      resume_mime_type = EXCLUDED.resume_mime_type,
      resume_name = EXCLUDED.resume_name,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const result = await pool.query(query, [
    email,
    profile.name || null,
    profile.location || null,
    profile.aboutMe || null,
    JSON.stringify(profile.skills || []),
    JSON.stringify(profile.experience || []),
    JSON.stringify(profile.education || []),
    profile.email || null,
    profile.phone || null,
    profile.linkedin || null,
    profile.github || null,
    profile.portfolio || null,
    profile.resumeData || null,
    profile.resumeMimeType || null,
    profile.resumeName || null,
  ]);

  return result.rows[0];
}

// Delete user profile
export async function deleteUserProfile(email: string) {
  const query = 'DELETE FROM user_profiles WHERE user_email = $1 RETURNING *';
  const result = await pool.query(query, [email]);
  return result.rows[0];
}
