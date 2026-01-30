import { createClient } from "@supabase/supabase-js";
import { env } from "@/app/config/env";
import { Database } from "@/types/database";

export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
);
