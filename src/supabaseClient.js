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

// Admin functions
export async function checkAdminRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role_name')
    .eq('user_id', userId)
    .eq('role_name', 'admin')
    .eq('is_active', true)
    .single();
  
  return { isAdmin: !!data, error };
}

export async function getAdminStats() {
  const { data, error } = await supabase.rpc('get_admin_stats');
  return { data, error };
}

export async function getAllUsers(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id, 
      full_name, 
      email, 
      created_at, 
      current_occupation_id,
      skill_assessment_completed,
      onboarding_completed,
      occupations(preferred_label)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  return { data, error };
}

export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      occupations(preferred_label),
      user_skills(skill_id, skills(preferred_label))
    `)
    .eq('id', userId)
    .single();
  
  return { data, error };
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select();
  
  return { data, error };
}

export async function assignAdminRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_name: 'admin',
      is_active: true
    });
  
  return { data, error };
}

export async function removeAdminRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('role_name', 'admin');
  
  return { data, error };
}

export async function logAdminAction(actionType, targetUserId, details = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('admin_actions')
    .insert({
      admin_id: user.id,
      action_type: actionType,
      target_user_id: targetUserId,
      details: details
    });
  
  return { data, error };
}