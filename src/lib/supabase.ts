import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type QuotationItem = {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type Quotation = {
  id: string;
  user_id: string;
  quotation_number: string;
  client_name: string;
  client_company: string | null;
  client_address: string | null;
  client_email: string | null;
  client_phone: string | null;
  items: QuotationItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  valid_until: string;
  terms: string | null;
  created_at: string;
  updated_at: string;
};
