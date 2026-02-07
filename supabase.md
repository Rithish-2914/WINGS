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
-- 1. Create sample_submissions table
CREATE TABLE IF NOT EXISTS sample_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
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
