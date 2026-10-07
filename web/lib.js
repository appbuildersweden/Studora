// Delad hjälpfil för Studoras testlogin (Steg 2).
// Rollkontroll i frontend är EN VISNING – det verkliga skyddet är RLS i databasen.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabase = createClient(
  window.STUDORA_CONFIG.supabaseUrl,
  window.STUDORA_CONFIG.supabaseKey,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

export const roleLabel = (role) =>
  ({ chef: 'Chef', 'lärare': 'Lärare', elev: 'Elev' }[role] || role || 'okänd roll');

// Skyddad sida: ingen giltig session → tillbaka till login
export async function requireSession() {
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session;
  if (error || !session) {
    location.replace('login.html');
    return null;
  }
  return session;
}

// Hämta egen profil. Filtrera alltid på eget id: chef ser alla rader via RLS,
// så utan filtret skulle flera rader returneras.
export async function fetchProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { profile: null, error: { message: 'Ingen session' } };
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, role')
    .eq('id', session.user.id)
    .maybeSingle();
  return { profile: data ?? null, error };
}
