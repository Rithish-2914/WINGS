-- SQL for Supabase Editor: Orders Table Only

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Page 1: Office Use & Mode
  school_code TEXT,
  school_name_office TEXT,
  place_office TEXT,
  mode_of_order TEXT,
  mode_of_supply TEXT,
  has_school_order_copy BOOLEAN DEFAULT FALSE,
  has_distributor_order_copy BOOLEAN DEFAULT FALSE,
  
  -- Page 2: School Information
  school_name TEXT NOT NULL,
  trust_name TEXT,
  board TEXT,
  school_type TEXT,
  address TEXT,
  pincode TEXT,
  state TEXT,
  email_id TEXT,
  school_phone TEXT,
  
  -- Page 3: Contact Details
  correspondent_name TEXT,
  correspondent_mobile TEXT,
  principal_name TEXT,
  principal_mobile TEXT,
  accounts_name TEXT,
  accounts_mobile TEXT,
  programme_in_charge_name TEXT,
  programme_in_charge_mobile TEXT,
  
  -- Page 4: Dispatch Details
  delivery_date TIMESTAMP WITH TIME ZONE,
  preferred_transport_1 TEXT,
  preferred_transport_2 TEXT,
  
  -- Book Order Data (Pages 5-11)
  items JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Page 12: Estimated Invoice & Totals
  total_amount TEXT DEFAULT '0',
  total_discount TEXT DEFAULT '0',
  net_amount TEXT DEFAULT '0',
  advance_payment TEXT,
  first_instalment TEXT,
  second_instalment TEXT,
  
  -- Dispatch & Tracking
  dispatch_id TEXT,
  status TEXT DEFAULT 'pending',
  
  -- Shareable Link
  share_token TEXT UNIQUE,
  is_public_filled BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
