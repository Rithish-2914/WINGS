```sql
-- SQL Schema for Sales Field Reporting Application

-- 1. Orders Table Updates
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executive_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executive_dispatch_date TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executive_dispatch_info TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_mode TEXT;

-- 2. Dispatches Table (Proactive Admin Dispatch)
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
  status TEXT DEFAULT 'Not Delivered', -- 'Received' / 'Not Delivered'
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Packing Lists Table (Detailed items per dispatch)
CREATE TABLE IF NOT EXISTS packing_lists (
  id SERIAL PRIMARY KEY,
  dispatch_id INTEGER NOT NULL REFERENCES dispatches(id),
  items JSONB NOT NULL DEFAULT '[]', -- List of {category, qty}
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```