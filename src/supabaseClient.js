import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Expose for manual console debugging only in dev
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.supabase = supabase;
}

export async function fetchOccupations() {
  const { data, error } = await supabase
    .from('occupations')
    .select('*');
  return { data, error };
}

export async function fetchSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('*');
  return { data, error };
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*');
  return { data, error };
}

// Trigger-based profile assurance: ensure row exists & patch missing fields from pending_profile.
export async function ensureUserProfile(partial = {}) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { error: userErr };
  if (!user) return { reason: 'no-user' };

  // Load pending profile data if any
  let pending = null;
  if (typeof window !== 'undefined') {
    try { pending = JSON.parse(localStorage.getItem('pending_profile') || 'null'); } catch { /* ignore */ }
  }

  const { data: profile, error: profErr } = await supabase
    .from('user_profiles')
    .select('id, full_name, gender, date_of_birth')
    .eq('id', user.id)
    .maybeSingle();
  if (profErr) return { error: profErr };

  // If no profile (trigger failed), create minimal fallback
  if (!profile) {
    const base = {
      id: user.id,
      email: user.email,
      full_name: pending?.full_name || partial.full_name || '',
      gender: pending?.gender || partial.gender || null,
      date_of_birth: pending?.date_of_birth || partial.date_of_birth || null,
    };
    const { error: insErr } = await supabase.from('user_profiles').insert(base);
    if (insErr) return { error: insErr, created: false };
    if (typeof window !== 'undefined') localStorage.removeItem('pending_profile');
    return { created: true, fallback: true };
  }

  // Decide candidate data (priority: pending -> partial -> existing)
  const meta = user?.user_metadata || {};
  const candidate = {
    full_name: pending?.full_name || partial.full_name || meta.full_name || profile.full_name || '',
    gender: pending?.gender || partial.gender || meta.gender || profile.gender || null,
    date_of_birth: pending?.date_of_birth || partial.date_of_birth || meta.date_of_birth || profile.date_of_birth || null,
  };

  const shouldUpdate = (
    (candidate.full_name && candidate.full_name !== profile.full_name) ||
    (candidate.gender && candidate.gender !== profile.gender) ||
    (candidate.date_of_birth && candidate.date_of_birth !== profile.date_of_birth)
  );

  if (shouldUpdate) {
    const updatePayload = {};
    if (candidate.full_name && candidate.full_name !== profile.full_name) updatePayload.full_name = candidate.full_name;
    if (candidate.gender && candidate.gender !== profile.gender) updatePayload.gender = candidate.gender;
    if (candidate.date_of_birth && candidate.date_of_birth !== profile.date_of_birth) updatePayload.date_of_birth = candidate.date_of_birth;
    const { error: updErr } = await supabase.from('user_profiles').update(updatePayload).eq('id', user.id);
    if (updErr) {
      if (import.meta.env?.DEV) console.warn('ensureUserProfile update error', updErr);
      return { error: updErr, updated: false };
    }
    if (typeof window !== 'undefined' && pending) localStorage.removeItem('pending_profile');
    return { updated: true };
  }
  return { already: true, unchanged: true };
}
