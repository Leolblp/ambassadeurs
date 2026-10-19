import { createClient } from "@supabase/supabase-js";

/**
 * Client avec la clé secrète : uniquement côté serveur, uniquement pour
 * les opérations que la session admin ne peut pas faire (création de comptes).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY manquante");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
