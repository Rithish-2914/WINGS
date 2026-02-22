-- SQL Schema for recent changes

-- 1. Update Orders Table (Executive Dispatch Request & Admin Courier Mode)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executive_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executive_dispatch_date TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executive_dispatch_info TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_mode TEXT;

-- 2. Dispatch Table (Updated Status for Admin-Executive direct dispatch)
-- If the table doesn't exist yet, it will be created by drizzle-kit push
-- Here is the SQL representation of the current 'dispatches' table:
CREATE TABLE IF NOT EXISTS dispatches (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  executive_id INTEGER NOT NULL REFERENCES users(id),
  dispatch_date TIMESTAMP NOT NULL,
  book_type TEXT NOT NULL,
  mode_of_parcel TEXT NOT NULL,
  lr_no TEXT NOT NULL,
  no_of_box INTEGER NOT NULL,
  ref TEXT,
  remarks TEXT,
  status TEXT DEFAULT 'Not Delivered',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Packing Lists Table
CREATE TABLE IF NOT EXISTS packing_lists (
  id SERIAL PRIMARY KEY,
  dispatch_id INTEGER NOT NULL REFERENCES dispatches(id),
  items JSONB NOT NULL DEFAULT '[]',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
