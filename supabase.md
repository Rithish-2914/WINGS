# Supabase Setup

To use Supabase with this project, run the following SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL, -- Login ID (e.g. 1001)
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'executive', -- 'executive' or 'admin'
  name TEXT NOT NULL
);

-- Create visits table
CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visit_type TEXT NOT NULL, -- 'First Visit' or 'Re-Visit'
  
  -- School Details
  school_name TEXT NOT NULL,
  school_type TEXT, -- Pre school, Kindergarten, Primary
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
  books_submitted JSONB, -- Array of book names
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial admin user
-- Password is 'admin123'
INSERT INTO users (username, password, role, name) 
VALUES ('admin', 'admin123', 'admin', 'System Admin');

-- Insert initial sales executive
-- Password is '123abc'
INSERT INTO users (username, password, role, name) 
VALUES ('1001', '123abc', 'executive', 'John Doe');
```

## Connection Configuration
Update your `.env` file with your Supabase PostgreSQL connection string:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
```
