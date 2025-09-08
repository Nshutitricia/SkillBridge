import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function SkillAssessment({ occupationId }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [skillGroups, setSkillGroups] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tooltip, setTooltip] = useState({ show: false, desc: '', idx: null, pos: { x: 0, y: 0 } });
  const [finishing, setFinishing] = useState(false);
  const groupKeys = Object.keys(skillGroups);
  const totalSteps = groupKeys.length;
  const currentGroup = groupKeys[currentStep];
  const currentSkills = skillGroups[currentGroup] || [];
  const progressPercent = totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0;

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
    async function fetchSkills() {
      setLoading(true);
      // 1. Get all skill_ids for this occupation
      const { data: occSkills, error: occSkillErr } = await supabase
        .from('occupation_to_skill_relations')
        .select('skill_id')
        .eq('occupation_id', occupationId);
      if (occSkillErr) {
        setError('Failed to fetch occupation skills: ' + occSkillErr.message);
        setLoading(false);
        return;
      }
      if (!occSkills || occSkills.length === 0) {
        setError('No skills found for this occupation.');
        setLoading(false);
        return;
      }
      const skillIds = occSkills.map(rel => rel.skill_id);
      // 2. Get skill details
      const { data: skills, error: skillErr } = await supabase
        .from('skills')
        .select('csv_id, preferred_label, description')
        .in('csv_id', skillIds);
      if (skillErr) {
        setError('Failed to fetch skills: ' + skillErr.message);
        setLoading(false);
        return;
      }
      // 3. Get skill group mapping
      const { data: hier, error: hierErr } = await supabase
        .from('skill_hierarchy')
        .select('parent_id, child_id, parent_object_type, child_object_type')
        .in('child_id', skillIds)
        .eq('parent_object_type', 'skillgroup')
        .eq('child_object_type', 'skill');
      if (hierErr) {
        setError('Failed to fetch skill hierarchy: ' + hierErr.message);
        setLoading(false);
        return;
      }
      // 4. Get skill group details
      const groupIds = [...new Set(hier.map(h => h.parent_id))];
      const { data: groups, error: groupErr } = await supabase
        .from('skill_groups')
        .select('csv_id, preferred_label')
        .in('csv_id', groupIds);
      if (groupErr) {
        setError('Failed to fetch skill groups: ' + groupErr.message);
        setLoading(false);
        return;
      }
      // 5. Group skills by skill group label
      const groupMap = {};
      groups.forEach(g => { groupMap[g.csv_id] = g.preferred_label; });
      const skillsByGroup = {};
      skills.forEach(skill => {
        const hierEntry = hier.find(h => h.child_id === skill.csv_id);
        const groupLabel = hierEntry ? groupMap[hierEntry.parent_id] : 'Other';
        if (!skillsByGroup[groupLabel]) skillsByGroup[groupLabel] = [];
        skillsByGroup[groupLabel].push(skill);
      });
      setSkillGroups(skillsByGroup);
      setLoading(false);
    }
    if (occupationId) fetchSkills();
  }, [occupationId]);

  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleNextGroup = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevGroup = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('User not found');
      setFinishing(false);
      return;
    }
    // Save selected skills to user_skills table
    const inserts = selectedSkills.map(skillId => ({ user_id: user.id, skill_id: skillId }));
    const { error: insErr } = await supabase.from('user_skills').insert(inserts);
    if (insErr) {
      setError('Failed to save skills: ' + insErr.message);
      setFinishing(false);
      return;
    }
    // Mark skill assessment and onboarding as completed
    const { error: updErr } = await supabase
      .from('user_profiles')
      .update({ skill_assessment_completed: true, onboarding_completed: true })
      .eq('id', user.id);
    if (updErr) {
      setError('Failed to update profile: ' + updErr.message);
      setFinishing(false);
      return;
    }
  setFinishing(false);
  // After completing the assessment, go straight to the dashboard
  navigate('/dashboard', { replace: true });
  };

  const handleIconEnter = (desc, idx, e) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({ show: true, desc, idx, pos: { x: rect.left + rect.width / 2, y: rect.top } });
  };
  const handleIconLeave = () => setTooltip({ show: false, desc: '', idx: null, pos: { x: 0, y: 0 } });

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading skills...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4">
      <div className="max-w-xl w-full mx-auto text-center mb-10 bg-white rounded-xl shadow-lg p-8">
        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full mb-6">
          <div
            className="h-3 bg-green-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Skill Assessment</h1>
        <p className="text-gray-600 text-base mb-2">Step {currentStep + 1} of {totalSteps}</p>
        <h2 className="text-lg font-semibold text-green-700 mb-4">{capitalize(currentGroup)}</h2>
        <div className="max-h-64 overflow-y-auto flex flex-col items-center mb-6 border border-gray-100 rounded-lg bg-gray-50 p-4">
          {currentSkills.map((skill, idx) => (
            <div key={skill.csv_id} className="flex items-center gap-2 w-full mb-2 relative">
              <label className="flex items-center gap-2 w-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill.csv_id)}
                  onChange={() => handleSkillToggle(skill.csv_id)}
                />
                <span className="text-gray-800 text-left">{capitalize(skill.preferred_label)}</span>
              </label>
              <span
                className="ml-2 text-gray-400 hover:text-green-600 cursor-pointer flex items-center relative"
                tabIndex={0}
                onMouseEnter={e => handleIconEnter(skill.description, idx, e)}
                onMouseLeave={handleIconLeave}
                onTouchStart={e => handleIconEnter(skill.description, idx, e)}
                onTouchEnd={handleIconLeave}
                aria-label="Show skill description"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text></svg>
                {tooltip.show && tooltip.idx === idx && (
                  <div
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-xs text-gray-700 min-w-[180px] max-w-[260px]"
                    style={{ whiteSpace: 'normal', textAlign: 'left', pointerEvents: 'auto' }}
                  >
                    {tooltip.desc || 'No description available.'}
                  </div>
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-8">
          <button
            className="py-2 px-4 rounded bg-gray-200 text-gray-700 font-medium mr-2"
            onClick={handlePrevGroup}
            disabled={currentStep === 0}
          >
            Previous
          </button>
          {currentStep < totalSteps - 1 ? (
            <button
              className="py-2 px-4 rounded bg-green-600 text-white font-medium hover:bg-green-700"
              onClick={handleNextGroup}
            >
              Next
            </button>
          ) : (
            <button
              className="py-2 px-4 rounded bg-green-600 text-white font-medium hover:bg-green-700"
              onClick={handleFinish}
              disabled={selectedSkills.length === 0 || finishing}
            >
              {finishing ? 'Saving...' : 'Finish'}
            </button>
          )}
        </div>
        {error && <div className="text-xs text-red-600 mt-4">{error}</div>}
      </div>
      {finishing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="text-green-700 text-xl font-bold mb-2">Analyzing your skills...</div>
            <div className="text-gray-600">Please wait while we process your assessment.</div>
          </div>
        </div>
      )}
    </div>
  );
}
