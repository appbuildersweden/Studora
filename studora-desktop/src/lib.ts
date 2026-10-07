import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    STUDORA_CONFIG?: {
      supabaseUrl?: string;
      supabaseKey?: string;
    };
    electronAPI?: {
      getConfig: () => Promise<{ supabaseUrl?: string; supabaseKey?: string }>;
      getVersion: () => Promise<string>;
      onAppQuitting: (callback: () => void) => () => void;
      openExternal: (url: string) => Promise<void>;
      log: (message: string) => Promise<boolean>;
    };
  }
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = window.STUDORA_CONFIG;

  if (!config?.supabaseUrl || !config?.supabaseKey) {
    throw new Error('Supabase-konfiguration saknas. Kontrollera att SUPABASE_URL och SUPABASE_PUBLISHABLE_KEY är satta.');
  }

  supabaseClient = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}

export const roleLabel = (role: string | null | undefined): string => {
  const labels: Record<string, string> = {
    chef: 'Chef',
    lärare: 'Lärare',
    elev: 'Elev',
  };
  return labels[role || ''] || role || 'Okänd roll';
};

export type AppRole = 'chef' | 'lärare' | 'elev';

export function isChef(role: string | null | undefined): boolean {
  return role === 'chef';
}

export function isLarare(role: string | null | undefined): boolean {
  return role === 'chef' || role === 'lärare';
}

export async function getSession(): Promise<{ session: any; error?: string }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return { session: null, error: error.message };
  }

  return { session: data.session, error: undefined };
}

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

export async function fetchProfile(): Promise<{ profile?: any; error?: string }> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { profile: null, error: 'Ingen session' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data ?? null, error: undefined };
}

export function getConfigFromEnv(): Promise<{ supabaseUrl?: string; supabaseKey?: string }> {
  if (window.STUDORA_CONFIG) {
    return Promise.resolve(window.STUDORA_CONFIG);
  }

  if (window.electronAPI) {
    return window.electronAPI.getConfig();
  }

  return Promise.resolve({});
}
