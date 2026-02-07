# Supabase Setup for Sample Submissions

## 1. Create Storage Bucket
1. Go to **Storage** in your Supabase dashboard.
2. Click **New Bucket**.
3. Name it `samples`.
4. Toggle **Public** to `ON`.
5. Click **Save**.

## 2. SQL for Database Schema
Paste the following SQL into your Supabase **SQL Editor** to create the `sample_submissions` table:

```sql
-- Create sample_submissions table
CREATE TABLE IF NOT EXISTS sample_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  school_name TEXT NOT NULL,
  books_submitted JSONB DEFAULT '[]'::jsonb,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (optional but recommended)
-- ALTER TABLE sample_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to sample images (if needed)
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'samples');
```
