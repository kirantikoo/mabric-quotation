/*
  # Mabric Quotation Generator Schema

  ## Overview
  Creates the database schema for the Mabric quotation generator system with user authentication and quotation management.

  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique, not null)
  - `full_name` (text)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  
  ### `quotations`
  - `id` (uuid, primary key, auto-generated)
  - `user_id` (uuid, references profiles, not null)
  - `quotation_number` (text, unique, not null)
  - `client_name` (text, not null)
  - `client_company` (text)
  - `client_address` (text)
  - `client_email` (text)
  - `client_phone` (text)
  - `items` (jsonb, not null) - Array of {name, quantity, unit_price, total}
  - `subtotal` (numeric, not null)
  - `tax_rate` (numeric, default 10)
  - `tax_amount` (numeric, not null)
  - `grand_total` (numeric, not null)
  - `valid_until` (date, not null)
  - `terms` (text)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ## Security
  
  ### RLS Policies
  - Users can only view and manage their own profile
  - Users can only create, view, update, and delete their own quotations
  - All tables have RLS enabled for security
  
  ## Notes
  1. Profile is automatically created via trigger when user signs up
  2. Quotation numbers are generated with format: QT-YYYYMMDD-XXXX
  3. Tax rate is configurable per quotation (default 10%)
  4. Items stored as JSON for flexibility
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quotation_number text UNIQUE NOT NULL,
  client_name text NOT NULL,
  client_company text,
  client_address text,
  client_email text,
  client_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  tax_rate numeric(5, 2) DEFAULT 10,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  grand_total numeric(12, 2) NOT NULL DEFAULT 0,
  valid_until date NOT NULL,
  terms text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quotations"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations"
  ON quotations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotations"
  ON quotations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create index for faster quotation lookups
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);