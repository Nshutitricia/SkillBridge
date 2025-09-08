import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    gender: '',
    date_of_birth: '',
  });

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
    }
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/signin'); return; }
      const { data: profile, error: profErr } = await supabase
        .from('user_profiles')
        .select('id, full_name, gender, date_of_birth')
        .eq('id', user.id)
        .maybeSingle();
      if (profErr) { setError(profErr.message); setLoading(false); return; }
      setProfileId(user.id);
      // Try to prefill from existing or user metadata
      const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      setForm({
        full_name: profile?.full_name || metaName || '',
        gender: profile?.gender || '',
        date_of_birth: profile?.date_of_birth || '',
      });
      setLoading(false);
    })();
  }, [navigate]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim() || !form.gender || !form.date_of_birth) {
      setError('All fields required');
      return;
    }
    setSaving(true);
    const { error: updErr } = await supabase
      .from('user_profiles')
      .update({
        full_name: form.full_name.trim(),
        gender: form.gender,
        date_of_birth: form.date_of_birth,
      })
      .eq('id', profileId);
    if (updErr) {
      setError(updErr.message);
      setSaving(false);
      return;
    }
    navigate('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading profile...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">Complete your profile</h1>
        <p className="text-sm text-gray-500 text-center">We need a few more details to personalize your experience.</p>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500 border-gray-300" placeholder="Full Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500 border-gray-300">
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input type="date" name="date_of_birth" value={form.date_of_birth || ''} onChange={handleChange} className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500 border-gray-300" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-60">
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
