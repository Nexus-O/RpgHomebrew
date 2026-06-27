import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltam as variáveis NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Confira o .env.local (dev) ou as Environment Variables do projeto na Vercel (produção)."
  );
}

/**
 * Client do Supabase para uso no navegador (client components).
 * Cuida de login/registro/sessão (email+senha, Google, Discord).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
