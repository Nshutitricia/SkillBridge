import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import CareerGoalDashboard from './CareerGoalDashboard';



export default function RecommendedOccupations({ userId, currentOccupationId, searchTerm, renderSearchBar = false, setSearchTerm }) {
  const [activeGoal, setActiveGoal] = useState(null);
  // Check for active career goal on mount
  useEffect(() => {
    async function fetchActiveGoal() {
      if (!userId) return;
      const { data: goalData } = await supabase
        .from('user_career_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      setActiveGoal(goalData);
    }
    fetchActiveGoal();
  }, [userId]);
  const [loading, setLoading] = useState(true);
  const [occupations, setOccupations] = useState([]);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  // Modal state/hooks
  const [selectedOcc, setSelectedOcc] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [occDetails, setOccDetails] = useState(null);
  const [occSkills, setOccSkills] = useState({ essentials: [], optionals: [] });
  const [userSkills, setUserSkills] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [confirmGoalOpen, setConfirmGoalOpen] = useState(false);
  const [goalLoading, setGoalLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showAllEssentials, setShowAllEssentials] = useState(false);
  const [showAllOptionals, setShowAllOptionals] = useState(false);

  // Fetch user skills for modal comparison
  useEffect(() => {
    async function fetchUserSkills() {
      if (!userId) return;
      const { data, error } = await supabase
        .from('user_skills')
        .select('skill_id')
        .eq('user_id', userId);
      if (data) setUserSkills(data.map(s => s.skill_id));
    }
    fetchUserSkills();
  }, [userId]);

  // Fetch occupation details and skills for modal
  // Open modal and fetch full details and skills
  const openModal = async occ => {
    setSelectedOcc(occ);
    setModalOpen(true);
    // Fetch occupation details
    const { data: occData, error: occError } = await supabase
      .from('occupations')
      .select('csv_id, preferred_label, occupation_group_code, description')
      .eq('csv_id', occ.csv_id)
      .single();
    let groupLabel = '';
    if (occData && occData.occupation_group_code) {
      const { data: groupData, error: groupError } = await supabase
        .from('occupation_groups')
        .select('csv_id, preferred_label')
        .eq('csv_id', occData.occupation_group_code)
        .single();
      if (groupData && groupData.preferred_label) {
        groupLabel = groupData.preferred_label;
      } else {
        console.warn('No group label found for code:', occData.occupation_group_code);
      }
    }
    if (!groupLabel && occData && occData.preferred_label) {
      groupLabel = occData.preferred_label;
    }
    if (occError) console.error('Occupation details error:', occError, occ);
    // Fetch essential/optional skills
    const { data: rels, error: relsError } = await supabase
      .from('occupation_to_skill_relations')
      .select('skill_id, relation_type')
      .eq('occupation_id', occ.csv_id);
    if (relsError) console.error('Occupation skills error:', relsError, occ);
    const essentials = rels ? rels.filter(r => r.relation_type === 'essential').map(r => r.skill_id) : [];
    const optionals = rels ? rels.filter(r => r.relation_type === 'optional').map(r => r.skill_id) : [];
    // Get skill labels (only if there are skills to fetch)
    let skillRows = [];
    if ([...essentials, ...optionals].length > 0) {
      console.log('Fetching skill labels for:', [...essentials, ...optionals]);
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('csv_id, preferred_label')
        .in('csv_id', [...essentials, ...optionals]);
      if (skillsError) console.error('Skill labels error:', skillsError, [...essentials, ...optionals]);
      skillRows = skillsData || [];
    } else {
      console.log('No skills to fetch for occupation', occ.csv_id);
    }
    const essentialsLabels = skillRows.filter(s => essentials.includes(s.csv_id));
    const optionalsLabels = skillRows.filter(s => optionals.includes(s.csv_id));
  setOccDetails({ ...occData, group_label: groupLabel });
    setOccSkills({ essentials: essentialsLabels, optionals: optionalsLabels });
  };

  const closeModal = () => {
    setModalOpen(false);
    setConfirmGoalOpen(false);
    setOccDetails(null);
    setOccSkills({ essentials: [], optionals: [] });
  };

  const handleSetGoal = () => {
    setConfirmGoalOpen(true);
  };

  const handleConfirmGoal = async () => {
    if (!occDetails || !userId) return;
    setGoalLoading(true);
    await supabase
      .from('user_career_goals')
      .update({ status: 'archived' })
      .eq('user_id', userId)
      .eq('status', 'active');
    const { data: newGoal } = await supabase
      .from('user_career_goals')
      .insert({
        user_id: userId,
        target_occupation_id: occDetails.csv_id,
        is_primary_goal: true,
        target_timeline: '1 year',
        status: 'active'
      })
      .select('*')
      .single();
    setGoalLoading(false);
    setConfirmGoalOpen(false);
    setModalOpen(false);
    setActiveGoal(newGoal);
    setToastMsg(`🎯 Your career goal has been set to ${occDetails.preferred_label}!`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      setError(null);
      try {
        const { data: hierarchyRows } = await supabase
          .from('occupation_hierarchy')
          .select('child_id')
          .eq('parent_id', currentOccupationId);
        const childIds = hierarchyRows ? hierarchyRows.map(row => row.child_id) : [];
        const { data: recommendations } = await supabase.rpc('match_occupations_for_user', {
          p_user: userId,
          p_min_pct: 30,
          p_limit: 20
        });
        let filtered = [];
        if (childIds.length > 0) {
          filtered = recommendations.filter(occ => childIds.includes(occ.csv_id));
        }
        if (filtered.length === 0) {
          filtered = recommendations
            .sort((a, b) => (b.match_percent || 0) - (a.match_percent || 0))
            .slice(0, 5);
        }
        filtered = filtered.filter(occ => occ.csv_id !== currentOccupationId);
        setOccupations(filtered);
      } catch (err) {
        setError(err.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    }
    if (userId && currentOccupationId && !searchTerm) fetchRecommendations();
  }, [userId, currentOccupationId, searchTerm]);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2 || !userId) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const fetchSearch = async () => {
      const { data: occs } = await supabase
        .from('occupations')
        .select('csv_id, preferred_label')
        .ilike('preferred_label', `%${searchTerm}%`)
        .limit(10);
      if (!occs || occs.length === 0) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      let results = [];
      for (const occ of occs) {
        const { data: matchData } = await supabase.rpc('match_occupations_for_user', {
          p_user: userId,
          p_min_pct: 0,
          p_limit: 1,
          p_occupation: occ.csv_id
        });
        let match_percent = null;
        let missing_essentials = [];
        if (matchData && matchData.length > 0) {
          match_percent = matchData[0].match_percent;
          missing_essentials = matchData[0].missing_essentials || [];
        }
        results.push({
          csv_id: occ.csv_id,
          preferred_label: occ.preferred_label,
          match_percent,
          missing_essentials
        });
      }
      const exact = results.find(r => r.preferred_label.toLowerCase() === searchTerm.toLowerCase());
      if (exact) {
        setSearchResults([exact]);
      } else {
        setSearchResults(results);
      }
      setSearchLoading(false);
    };
    fetchSearch();
  }, [searchTerm, userId]);

  // ...existing code...
  // Render search bar only if no active goal and renderSearchBar is true
  let mainContent;
  if (!activeGoal && renderSearchBar) {
    if (typeof setSearchTerm === 'function') {
      mainContent = (
        <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Search for your dream job..."
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      );
    }
  }
  // Render search results or recommended occupations
  let resultsContent;
  if (searchTerm && searchTerm.length >= 2) {
    if (searchLoading) resultsContent = <div className="py-8 text-center text-gray-500">Searching occupations...</div>;
    else if (searchResults.length === 0) resultsContent = <div className="py-8 text-center text-gray-500">No occupations found for "{searchTerm}".</div>;
    else resultsContent = (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-green-700 mb-4">Search Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map(occ => (
            <div key={occ.csv_id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-gray-100 cursor-pointer" onClick={() => openModal(occ)}>
              <div className="font-semibold text-lg text-gray-900">{occ.preferred_label ? occ.preferred_label.charAt(0).toUpperCase() + occ.preferred_label.slice(1) : ''}</div>
              <div className="text-sm text-gray-600 mb-2">Match: <span className="font-bold text-green-600">{occ.match_percent !== null ? `${occ.match_percent}%` : 'N/A'}</span></div>
              <div className="text-xs text-gray-500 mb-2">Missing essential skills: {occ.missing_essentials ? occ.missing_essentials.length : 0}</div>
              <button className="mt-auto py-2 px-4 bg-green-600 text-white rounded font-semibold hover:bg-green-700">Set as My Goal</button>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (loading) resultsContent = <div className="py-8 text-center text-gray-500">Loading recommended occupations...</div>;
  else if (error) resultsContent = <div className="py-8 text-center text-red-600">{error}</div>;
  else if (occupations.length === 0) resultsContent = <div className="py-8 text-center text-gray-500">No recommended occupations found. Try adding more skills to improve your matches.</div>;
  else resultsContent = (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-green-700 mb-4">Recommended Occupations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {occupations.map(occ => (
          <div key={occ.csv_id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-gray-100 cursor-pointer" onClick={() => openModal(occ)}>
            <div className="font-semibold text-lg text-gray-900">{occ.name ? occ.name.charAt(0).toUpperCase() + occ.name.slice(1) : ''}</div>
            <div className="text-sm text-gray-600 mb-2">Match: <span className="font-bold text-green-600">{occ.match_percent}%</span></div>
            <div className="text-xs text-gray-500 mb-2">Missing essential skills: {occ.missing_essentials ? occ.missing_essentials.length : 0}</div>
            <button className="mt-auto py-2 px-4 bg-green-600 text-white rounded font-semibold hover:bg-green-700">Set as My Goal</button>
          </div>
        ))}
      </div>
    </div>
  );
  if (loading) return <div className="py-8 text-center text-gray-500">Loading recommended occupations...</div>;
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>;
  if (occupations.length === 0) return <div className="py-8 text-center text-gray-500">No recommended occupations found. Try adding more skills to improve your matches.</div>;

  // If user has an active career goal, show the dashboard instead
  if (activeGoal) {
    return <CareerGoalDashboard userId={userId} />;
  }

  return (
    <>
      {mainContent}
      {resultsContent}
      {/* Modal Overlay for Occupation Details (always rendered) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur bg-black/10 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-2xl w-full relative animate-fadein overflow-y-auto max-h-[90vh]">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold" onClick={closeModal}>&times;</button>
            {!occDetails ? (
              <div className="text-center py-8 text-gray-500">Loading occupation details...</div>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-green-700 mb-2">{occDetails.preferred_label ? occDetails.preferred_label.charAt(0).toUpperCase() + occDetails.preferred_label.slice(1) : ''}</h2>
                <div className="text-base text-gray-500 mb-2">Group: {occDetails.group_label ? occDetails.group_label : 'N/A'}</div>
                <div className="mb-4 text-gray-700 text-base">{occDetails.description || 'No description available.'}</div>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Essential Skills</h3>
                  <ul className="flex flex-wrap gap-2">
                    {occSkills.essentials.length === 0 ? <li className="text-gray-400">None listed</li> :
                      (showAllEssentials ? occSkills.essentials : occSkills.essentials.slice(0,8)).map(skill => (
                        <li key={skill.csv_id} className={`px-3 py-1 rounded-full text-sm font-medium ${userSkills.includes(skill.csv_id) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {skill.preferred_label.charAt(0).toUpperCase() + skill.preferred_label.slice(1)} {userSkills.includes(skill.csv_id) ? '✅' : '❌'}
                        </li>
                      ))}
                  </ul>
                  {occSkills.essentials.length > 8 && (
                    <button className="mt-2 text-green-600 underline text-sm" onClick={() => setShowAllEssentials(v => !v)}>
                      {showAllEssentials ? 'See less' : `See all (${occSkills.essentials.length})`}
                    </button>
                  )}
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Optional Skills</h3>
                  <ul className="flex flex-wrap gap-2">
                    {occSkills.optionals.length === 0 ? <li className="text-gray-400">None listed</li> :
                      (showAllOptionals ? occSkills.optionals : occSkills.optionals.slice(0,8)).map(skill => (
                        <li key={skill.csv_id} className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 font-medium">
                          {skill.preferred_label.charAt(0).toUpperCase() + skill.preferred_label.slice(1)}
                        </li>
                      ))}
                  </ul>
                  {occSkills.optionals.length > 8 && (
                    <button className="mt-2 text-blue-600 underline text-sm" onClick={() => setShowAllOptionals(v => !v)}>
                      {showAllOptionals ? 'See less' : `See all (${occSkills.optionals.length})`}
                    </button>
                  )}
                </div>
                <button className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 mt-4" onClick={handleSetGoal}>Set as My Career Goal</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm Career Goal Modal */}
      {confirmGoalOpen && occDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur bg-black/10 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadein">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold" onClick={() => setConfirmGoalOpen(false)}>&times;</button>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Confirm Career Goal</h2>
            <div className="text-lg font-semibold text-gray-900 mb-1">{occDetails.preferred_label}</div>
            <div className="text-sm text-gray-500 mb-2">Group: {occDetails.group_label || 'N/A'}</div>
            <div className="mb-4 text-gray-700 text-base">{occDetails.description || 'No description available.'}</div>
            <button className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 mt-4" onClick={handleConfirmGoal} disabled={goalLoading}>
              {goalLoading ? 'Saving...' : 'Confirm Goal'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
