import { createClient } from '@supabase/supabase-js';
const {
  SNOWPACK_PUBLIC_SUPABASE_URL,
  SNOWPACK_PUBLIC_SUPABASE_ANON_KEY,
} = import.meta.env;

export const supabase = createClient(
  SNOWPACK_PUBLIC_SUPABASE_URL,
  SNOWPACK_PUBLIC_SUPABASE_ANON_KEY,
);
