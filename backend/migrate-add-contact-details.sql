-- Migration: Add contact details to user_profiles table

-- Add contact detail columns if they don't exist
DO $$
BEGIN
  -- Add email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN contact_email VARCHAR(255);
  END IF;

  -- Add phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(50);
  END IF;

  -- Add linkedin column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'linkedin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN linkedin TEXT;
  END IF;

  -- Add github column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'github'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN github TEXT;
  END IF;

  -- Add portfolio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'portfolio'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN portfolio TEXT;
  END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('contact_email', 'phone', 'linkedin', 'github', 'portfolio')
ORDER BY column_name;
