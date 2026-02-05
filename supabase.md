# Supabase Setup

To use Supabase with this project, run the following SQL in your Supabase SQL Editor:

```sql
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL, -- Login ID (e.g. 1001)
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'executive', -- 'executive' or 'admin'
  name TEXT NOT NULL
);

-- Ensure 'name' column exists in 'users' table (in case table already exists without it)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
    ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT 'User';
  END IF;
END $$;

-- Create visits table if it doesn't exist
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visit_type TEXT NOT NULL, -- 'First Visit' or 'Re-Visit'
  
  -- School Details
  school_name TEXT NOT NULL,
  school_type TEXT, -- Pre school, Kindergarten, Primary, High School
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  
  -- Location & Photo
  location_lat TEXT,
  location_lng TEXT,
  photo_url TEXT, -- Path to uploaded photo
  
  -- Contact Details
  school_phone TEXT,
  contact_person TEXT,
  contact_mobile TEXT,
  
  -- Meeting Details
  demo_given BOOLEAN DEFAULT FALSE,
  mom TEXT, -- Minutes of Meeting
  remarks TEXT,
  
  -- Samples
  sample_submitted BOOLEAN DEFAULT FALSE,
  books_submitted JSONB DEFAULT '[]'::jsonb, -- Array of book names
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure the session store table exists for connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Row Level Security (RLS)
-- This ensures data isolation at the database level
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Note: The policies below are templates. If you are using Supabase Auth, 
-- you would typically link a 'supabase_auth_id' UUID to your users table.

-- Policy: Allow admins to see everything, and executives to see only their own
DROP POLICY IF EXISTS "Data isolation policy" ON visits;
CREATE POLICY "Data isolation policy" ON visits
  FOR ALL
  USING (
    -- This is a simplified check; in a real Supabase Auth setup, 
    -- you'd compare against auth.uid()
    TRUE 
  );

-- Insert initial admin user if not exists
-- Password is 'admin123'
INSERT INTO users (username, password, role, name) 
SELECT 'admin', 'admin123', 'admin', 'System Admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Insert initial sales executive if not exists
-- Password is '123abc'
INSERT INTO users (username, password, role, name) 
SELECT '1001', '123abc', 'executive', 'John Doe'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = '1001');
```

## Connection Configuration
Update your `.env` file with your Supabase PostgreSQL connection string:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
```
