# Supabase Setup

To use Supabase with this project, run the following SQL in your Supabase SQL Editor. This script creates all necessary tables, including the missing `targets` table and the `photo_metadata` column that were causing errors.

```sql
-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'executive',
  name TEXT NOT NULL
);

-- 2. Create Visits Table
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  visit_type TEXT NOT NULL,
  school_name TEXT NOT NULL,
  school_type TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  location_lat TEXT,
  location_lng TEXT,
  photo_url TEXT,
  school_phone TEXT,
  contact_person TEXT,
  contact_mobile TEXT,
  demo_given BOOLEAN DEFAULT FALSE,
  mom TEXT,
  remarks TEXT,
  sample_submitted BOOLEAN DEFAULT FALSE,
  books_submitted JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  photo_metadata JSONB DEFAULT '{}'::jsonb
);

-- Ensure photo_metadata column exists (Fix for "column photo_metadata does not exist" error)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='photo_metadata') THEN
    ALTER TABLE visits ADD COLUMN photo_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 3. Create Targets Table (Fix for "relation targets does not exist" error)
CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  executive_id INTEGER NOT NULL REFERENCES users(id),
  target_visits INTEGER NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Session Table (For Authentication)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
) WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- 5. Insert Initial Data (Optional)
-- Password: admin123
INSERT INTO users (username, password, role, name) 
SELECT 'admin', 'admin123', 'admin', 'System Admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Password: 123abc
INSERT INTO users (username, password, role, name) 
SELECT '1001', '123abc', 'executive', 'John Doe'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = '1001');
```

## Connection Configuration
Update your `DATABASE_URL` in the Secrets tab (or `.env` file) with your Supabase connection string:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
```
