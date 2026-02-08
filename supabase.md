# Supabase Setup for Sample Submissions

## 1. Create Storage Buckets
1. Go to **Storage** in your Supabase dashboard.
2. Click **New Bucket**.
3. Name it `samples`. Toggle **Public** to `ON`. Click **Save**.
4. Click **New Bucket**.
5. Name it `school-visit-photos`. Toggle **Public** to `ON`. Click **Save**.

## 2. SQL for Database Schema and Policies
Paste the following SQL into your Supabase **SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'executive',
  name TEXT NOT NULL
);

-- 1. Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  visit_type TEXT NOT NULL,
  school_name TEXT NOT NULL DEFAULT '',
  principal_name TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL DEFAULT '',
  school_type TEXT NOT NULL DEFAULT 'Primary',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  location_lat TEXT NOT NULL DEFAULT '0',
  location_lng TEXT NOT NULL DEFAULT '0',
  photo_url TEXT NOT NULL DEFAULT '',
  school_phone TEXT NOT NULL DEFAULT '',
  contact_person TEXT,
  contact_mobile TEXT,
  demo_given BOOLEAN DEFAULT FALSE,
  mom TEXT,
  remarks TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  books_interested TEXT,
  sample_submitted BOOLEAN DEFAULT FALSE,
  books_submitted JSONB DEFAULT '[]'::jsonb,
  sample_photo_url TEXT,
  products JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  visit_count INTEGER DEFAULT 1,
  photo_metadata JSONB,
  admin_follow_up TEXT,
  admin_follow_up_status TEXT DEFAULT 'pending'
);

-- 2. Create targets table
CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  executive_id INTEGER NOT NULL REFERENCES users(id),
  target_visits INTEGER NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create sample_submissions table
CREATE TABLE IF NOT EXISTS sample_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  school_name TEXT NOT NULL,
  books_submitted JSONB DEFAULT '[]'::jsonb,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable Storage for Public Access (Bucket Policies)
-- Allow public to view images in both buckets
CREATE POLICY "Public View Samples" ON storage.objects FOR SELECT USING (bucket_id = 'samples');
CREATE POLICY "Public View Visits" ON storage.objects FOR SELECT USING (bucket_id = 'school-visit-photos');

-- Allow public uploads for demo purposes (Optional: refine for production)
CREATE POLICY "Public Upload Samples" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'samples');
CREATE POLICY "Public Upload Visits" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'school-visit-photos');
```
