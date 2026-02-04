# Supabase Setup

To use Supabase with this project, run the following SQL in your Supabase SQL Editor:

```sql
-- Create roles enum
CREATE TYPE user_role AS ENUM ('admin', 'executive');

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'executive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial admin user
-- Password is 'admin123' (you should change this)
INSERT INTO users (username, password, role) 
VALUES ('admin', 'admin123', 'admin');

-- Insert initial sales executive
-- Password is '123abc'
INSERT INTO users (username, password, role) 
VALUES ('executive1', '123abc', 'executive');
```

## Connection Configuration
Update your `.env` file with your Supabase PostgreSQL connection string:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
```
