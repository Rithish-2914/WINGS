-- SQL for Supabase Editor to match your Replit Database Schema

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'executive',
  name TEXT NOT NULL
);

-- 2. Visits table
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
  photo_url TEXT NOT NULL,
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
  admin_follow_up_status TEXT DEFAULT 'pending',
  current_books_used TEXT,
  mode_of_books TEXT
);

-- 3. Targets table
CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  executive_id INTEGER NOT NULL REFERENCES users(id),
  target_visits INTEGER NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Sample Submissions table
CREATE TABLE IF NOT EXISTS sample_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  school_name TEXT NOT NULL,
  books_submitted JSONB DEFAULT '[]'::jsonb,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  school_code TEXT,
  school_name_office TEXT,
  place_office TEXT,
  mode_of_order TEXT,
  mode_of_supply TEXT,
  has_school_order_copy BOOLEAN DEFAULT FALSE,
  has_distributor_order_copy BOOLEAN DEFAULT FALSE,
  school_name TEXT NOT NULL,
  trust_name TEXT,
  board TEXT,
  school_type TEXT,
  address TEXT,
  pincode TEXT,
  state TEXT,
  email_id TEXT,
  school_phone TEXT,
  correspondent_name TEXT,
  correspondent_mobile TEXT,
  principal_name TEXT,
  principal_mobile TEXT,
  accounts_name TEXT,
  accounts_mobile TEXT,
  programme_in_charge_name TEXT,
  programme_in_charge_mobile TEXT,
  delivery_date TIMESTAMP WITH TIME ZONE,
  preferred_transport_1 TEXT,
  preferred_transport_2 TEXT,
  items JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_amount TEXT DEFAULT '0',
  total_discount TEXT DEFAULT '0',
  net_amount TEXT DEFAULT '0',
  advance_payment TEXT,
  first_instalment TEXT,
  second_instalment TEXT,
  dispatch_id TEXT,
  status TEXT DEFAULT 'pending',
  share_token TEXT UNIQUE,
  is_public_filled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Storage Policies (Run after creating buckets in Supabase UI)
-- Enable storage for public access
CREATE POLICY "Public View Samples" ON storage.objects FOR SELECT USING (bucket_id = 'samples');
CREATE POLICY "Public View Visits" ON storage.objects FOR SELECT USING (bucket_id = 'school-visit-photos');

-- Allow public uploads
CREATE POLICY "Public Insert Samples" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'samples');
CREATE POLICY "Public Insert Visits" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'school-visit-photos');
