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
