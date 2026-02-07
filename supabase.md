# Supabase Database Migration SQL

Run this SQL in your Supabase SQL Editor to update your `visits` table:

```sql
-- Update visits table structure
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS principal_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS books_interested TEXT;

-- Update existing columns to be NOT NULL where required
-- Note: Providing default values for existing rows to avoid NOT NULL constraints failing
UPDATE visits SET school_type = 'Primary' WHERE school_type IS NULL;
ALTER TABLE visits ALTER COLUMN school_type SET NOT NULL;

UPDATE visits SET location_lat = '0' WHERE location_lat IS NULL;
ALTER TABLE visits ALTER COLUMN location_lat SET NOT NULL;

UPDATE visits SET location_lng = '0' WHERE location_lng IS NULL;
ALTER TABLE visits ALTER COLUMN location_lng SET NOT NULL;

UPDATE visits SET photo_url = '' WHERE photo_url IS NULL;
ALTER TABLE visits ALTER COLUMN photo_url SET NOT NULL;

UPDATE visits SET school_phone = '' WHERE school_phone IS NULL;
ALTER TABLE visits ALTER COLUMN school_phone SET NOT NULL;

UPDATE visits SET contact_person = '' WHERE contact_person IS NULL;
ALTER TABLE visits ALTER COLUMN contact_person SET NOT NULL;

UPDATE visits SET contact_mobile = '' WHERE contact_mobile IS NULL;
ALTER TABLE visits ALTER COLUMN contact_mobile SET NOT NULL;

UPDATE visits SET demo_given = false WHERE demo_given IS NULL;
ALTER TABLE visits ALTER COLUMN demo_given SET NOT NULL;

UPDATE visits SET mom = '' WHERE mom IS NULL;
ALTER TABLE visits ALTER COLUMN mom SET NOT NULL;

UPDATE visits SET sample_submitted = false WHERE sample_submitted IS NULL;
ALTER TABLE visits ALTER COLUMN sample_submitted SET NOT NULL;

-- Remove temporary default values after setting NOT NULL
ALTER TABLE visits ALTER COLUMN principal_name DROP DEFAULT;
ALTER TABLE visits ALTER COLUMN phone_number DROP DEFAULT;
```

# Supabase Storage Setup Guide

To enable image uploads to Supabase, follow these steps:

## 1. Create a Storage Bucket
1. Go to your [Supabase Dashboard](https://app.supabase.com/).
2. Select your project.
3. Navigate to **Storage** in the left sidebar.
4. Click **New Bucket**.
5. Name your bucket (e.g., `school-visit-photos`).
6. Toggle **Public** to "on" so images can be accessed via URL.
7. Click **Save**.

## 2. Set Up Access Policies
Even if the bucket is public, you need policies to allow uploads:
1. Click on your bucket name.
2. Go to **Policies**.
3. Under "Bucket Policies", click **New Policy**.
4. Choose **Get started quickly** (or "Full access for authenticated users").
5. Select **Allow access to all operations** for testing, or narrow it down to **Insert** and **Select**.
6. Set the "Target roles" to `authenticated` (or `anon` if you want public uploads).
7. Click **Review** and then **Save**.

## 3. Configure Environment Variables
Add these to your Replit Secrets (Tools -> Secrets):
- `SUPABASE_URL`: Your Supabase project URL (Settings -> API).
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key (Settings -> API).
- `SUPABASE_BUCKET_NAME`: The name of the bucket you created (e.g., `school-visit-photos`).
