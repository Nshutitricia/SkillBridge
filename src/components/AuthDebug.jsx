import { useEffect, useState } from 'react';
import { supabase, ensureUserProfile } from '../supabaseClient';

export default function AuthDebug() {
  const [state, setState] = useState({ loading: true, user: null, profile: null, ensure: null, error: null });

  useEffect(() => {
    (async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        let profile = null;
        if (user) {
          const { data, error: profErr } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle();
          if (profErr && profErr.code !== 'PGRST116') throw profErr; // ignore not found
          profile = data || null;
        }
        setState(s => ({ ...s, user, profile, loading: false }));
      } catch (e) {
        setState(s => ({ ...s, error: e.message, loading: false }));
      }
    })();
  }, []);

  const handleEnsure = async () => {
    const res = await ensureUserProfile();
    // refetch profile
    let profile = null;
    if (res.created || res.already) {
      const { data } = await supabase.from('user_profiles').select('*').eq('id', state.user.id).maybeSingle();
      profile = data || null;
    }
    setState(s => ({ ...s, ensure: res, profile }));
  };

  if (state.loading) return <div className="p-6">Loading...</div>;
  return (
    <div className="p-6 space-y-4 font-mono text-sm">
      <h1 className="text-lg font-bold">Auth Debug</h1>
      <pre className="bg-gray-100 p-3 rounded">User: {JSON.stringify(state.user, null, 2)}</pre>
      <pre className="bg-gray-100 p-3 rounded">Profile: {JSON.stringify(state.profile, null, 2)}</pre>
      <pre className="bg-gray-100 p-3 rounded">Last ensure result: {JSON.stringify(state.ensure, null, 2)}</pre>
      {state.error && <div className="text-red-600">Error: {state.error}</div>}
      <button onClick={handleEnsure} className="px-4 py-2 bg-green-600 text-white rounded">Run ensureUserProfile()</button>
      <p className="text-xs text-gray-500">Use this page to see why the profile row is missing. After logging in, come here.</p>
    </div>
  );
}
