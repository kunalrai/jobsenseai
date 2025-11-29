-- JobSense AI Database Schema

-- Users table (stores Google OAuth user information)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  picture TEXT,
  last_email_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table (stores job search profile information)
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  name VARCHAR(255),
  location VARCHAR(255),
  about_me TEXT,
  skills JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  resume_data TEXT,
  resume_mime_type VARCHAR(100),
  resume_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(user_email);

-- Create index on users email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- User emails table (stores job-related emails from Gmail)
CREATE TABLE IF NOT EXISTS user_emails (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  email_id VARCHAR(255) NOT NULL,
  sender VARCHAR(500),
  subject TEXT,
  body TEXT,
  date TIMESTAMP,
  is_read BOOLEAN DEFAULT false,
  category VARCHAR(50),
  priority VARCHAR(20),
  summary TEXT,
  suggested_action TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_email, email_id)
);

-- Create index on user_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_emails_user_email ON user_emails(user_email);

-- Create index on email_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_emails_email_id ON user_emails(email_id);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_user_emails_category ON user_emails(category);

-- Trigger to auto-update updated_at for emails
DROP TRIGGER IF EXISTS update_user_emails_updated_at ON user_emails;
CREATE TRIGGER update_user_emails_updated_at
  BEFORE UPDATE ON user_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- AI Usage Tracking table (stores Gemini API usage metrics)
CREATE TABLE IF NOT EXISTS ai_usage (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  operation_type VARCHAR(100) NOT NULL, -- 'parse_resume', 'search_jobs', 'generate_email', 'analyze_emails', 'smart_reply'
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  model_used VARCHAR(100),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_email ON ai_usage(user_email);

-- Create index on operation_type for filtering
CREATE INDEX IF NOT EXISTS idx_ai_usage_operation_type ON ai_usage(operation_type);

-- Create index on created_at for date range queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);

-- Sample queries
-- SELECT * FROM user_profiles WHERE user_email = 'user@example.com';
-- SELECT * FROM user_emails WHERE user_email = 'user@example.com' ORDER BY date DESC;
-- SELECT operation_type, SUM(total_tokens) as total, COUNT(*) as count FROM ai_usage WHERE user_email = 'user@example.com' GROUP BY operation_type;
