import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '...' : str;
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const OccupationOnboarding = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

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

  // Instant search, limit to 3 results
  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    (async () => {
      const { data, error } = await supabase
        .from('occupations')
        .select('csv_id, preferred_label, description')
        .ilike('preferred_label', `%${search}%`)
        .order('preferred_label')
        .limit(3);
      if (error) {
        setResults([]);
        setError('Error fetching occupations');
      } else {
        setResults(data || []);
        setError('');
      }
      setSearching(false);
    })();
  }, [search]);

  const handleSelect = (occ) => {
    setSelected(occ);
    setSearch(occ.preferred_label);
    setResults([]);
    setError('');
  };

  const handleNext = () => {
    if (!selected) {
      setError('Please select your current occupation');
      return;
    }
    setLoading(true);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not found');
        setLoading(false);
        return;
      }
      // Update user_profiles with selected occupation's csv_id
      const { error: updErr } = await supabase
        .from('user_profiles')
        .update({ current_occupation_id: selected.csv_id })
        .eq('id', user.id);
      if (updErr) {
        setError('Failed to save occupation');
        setLoading(false);
        return;
      }
      setLoading(false);
      navigate('/onboarding/skills', { state: { occupationId: selected.csv_id } });
    })();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your career</h1>
        <p className="text-gray-600 text-base mb-6">This helps us create your personalized learning path</p>
        <div className="mb-4 text-left relative" style={{ zIndex: 10 }}>
          <label className="block text-sm font-medium text-gray-700 mb-1">What's your current job title?</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 border-gray-300"
            placeholder="e.g. Software Developer, Marketing Manager..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null); }}
            autoComplete="off"
          />
          {searching && <div className="text-xs text-gray-400 mt-1">Searching...</div>}
          {results.length > 0 && !selected && (
            <div
              className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-30"
              style={{ padding: '8px 0', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
            >
              {results.map(occ => (
                <div
                  key={occ.csv_id}
                  className="px-5 py-3 cursor-pointer hover:bg-green-100 transition-colors flex flex-col gap-1"
                  onClick={() => handleSelect(occ)}
                  style={{ fontSize: '15px', borderRadius: '8px', margin: '2px 8px', borderBottom: '1px solid #e5e7eb' }}
                >
                  <div className="font-semibold text-gray-900">{capitalize(occ.preferred_label)}</div>
                  <div className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {truncate(occ.description || '', 40)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
        </div>
        {selected && (
          <div className="mt-4 p-4 border rounded-lg bg-green-50 text-left">
            <div className="font-semibold text-green-700 mb-1">{capitalize(selected.preferred_label)}</div>
            <div className="text-xs text-gray-600 whitespace-pre-line">{selected.description || ''}</div>
          </div>
        )}
        <button
          className={`mt-8 w-full py-2 rounded bg-green-600 text-white font-medium text-lg ${!selected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
          disabled={!selected}
          onClick={handleNext}
        >
          Next
        </button>
        <div className="mt-4 text-right">
          <button className="text-xs text-green-600 hover:underline" onClick={() => alert('Suggest new occupation coming soon!')}>
            Can't find your role?
          </button>
        </div>
      </div>
    </div>
  );
}

export default OccupationOnboarding;
