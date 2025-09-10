import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LearningPath from './LearningPath';

export default function CareerGoalDashboard({ userId }) {
  const [goal, setGoal] = useState(null);
  const [targetRole, setTargetRole] = useState(null);
  const [matchPercent, setMatchPercent] = useState(null);
  const [currentRole, setCurrentRole] = useState('');
  const [skillsMastered, setSkillsMastered] = useState(0);
  const [missingSkills, setMissingSkills] = useState(0);
  const [jobsAvailable, setJobsAvailable] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [topSkills, setTopSkills] = useState([]);
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchGoalData() {
      setLoading(true);
      // Fetch user current role
      const { data: userData } = await supabase.from('users').select('current_occupation_id').eq('id', userId).single();
      setCurrentRole(userData?.current_occupation_id || '');
      // Fetch active career goal
      const { data: goalData } = await supabase.from('user_career_goals').select('*').eq('user_id', userId).eq('status', 'active').single();
      setGoal(goalData);
      if (!goalData) return setLoading(false);
      // Fetch target role details
      const { data: occData } = await supabase.from('occupations').select('*').eq('csv_id', goalData.target_occupation_id).single();
      setTargetRole(occData);
      // Fetch match percent
      const { data: matchData } = await supabase.rpc('match_occupations_for_user', {
        p_user: userId,
        p_min_pct: 0,
        p_limit: 1,
        p_occupation: goalData.target_occupation_id
      });
      setMatchPercent(matchData?.[0]?.match_percent || 0);
      // Fetch skills and skill names
      const { data: rels } = await supabase.from('occupation_to_skill_relations').select('skill_id, relation_type').eq('occupation_id', goalData.target_occupation_id);
      const essentials = rels ? rels.filter(r => r.relation_type === 'essential').map(r => r.skill_id) : [];
  const { data: userSkills } = await supabase.from('user_skills').select('skill_id').eq('user_id', userId);
  const mastered = userSkills ? essentials.filter(s => userSkills.map(u => u.skill_id).includes(s)) : [];
      setSkillsMastered(mastered.length);
      setMissingSkills(essentials.length - mastered.length);
      // Fetch skill names for top 3 essential skills
      let topSkillNames = [];
      if (essentials.length > 0) {
        const { data: skillRows } = await supabase.from('skills').select('csv_id, preferred_label').in('csv_id', essentials.slice(0, 3));
        topSkillNames = skillRows ? skillRows.map(s => s.preferred_label) : [];
      }
      setTopSkills(topSkillNames);
      // Fetch jobs available
      const { data: jobs } = await supabase.from('job_postings').select('id').eq('occupation_id', goalData.target_occupation_id);
      setJobsAvailable(jobs?.length || 0);
      // Profile completion (dummy for now)
      setProfileCompletion(80);
      // Learning path (dummy)
      setLearningPath({ title: 'Recommended Course: SkillBridge Fundamentals', url: '#', description: 'Start mastering essential skills for your target role.' });
      setLoading(false);
    }
    if (userId) fetchGoalData();
  }, [userId]);

  if (loading) return <div className="py-8 text-center text-gray-500">Loading your career dashboard...</div>;
  if (!goal || !targetRole) return <div className="py-8 text-center text-gray-500">No career goal set. Please choose a goal to see your dashboard.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Banner Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-lg mt-2">🎯 You’ve set <span className="font-bold text-green-700">{targetRole.preferred_label}</span> as your career goal!</div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 text-gray-600">
            <span>Current Role: {currentRole}</span>
            <span className="hidden sm:inline mx-2">→</span>
            <span>Target Role: {targetRole.preferred_label}</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">Goal: 1 year</div>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 w-full sm:w-auto">Change Goal</button>
      </div>
      {/* Career Match Overview */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center w-full sm:w-1/3">
          <div className="text-5xl font-bold text-green-700">{matchPercent}%</div>
          <div className="text-gray-600 mt-2 text-center">You’re matched to <span className="font-bold">{targetRole.preferred_label}</span></div>
          <div className="w-full mt-4">
            <div className="h-3 bg-gray-200 rounded-full">
              <div className="h-3 bg-green-600 rounded-full" style={{ width: `${matchPercent}%` }}></div>
            </div>
          </div>
        </div>
        {/* Quick Stats Cards */}
        <div className="flex flex-row sm:flex-col gap-4 w-full sm:w-2/3">
          <div className="bg-green-50 rounded-xl p-4 flex justify-between items-center w-1/2 sm:w-full">
            <span className="font-semibold text-green-700">Skills Mastered</span>
            <span className="font-bold text-green-700">{skillsMastered}</span>
          </div>
          <div className="bg-red-50 rounded-xl p-4 flex justify-between items-center w-1/2 sm:w-full">
            <span className="font-semibold text-red-700">Missing Skills</span>
            <span className="font-bold text-red-700">{missingSkills}</span>
          </div>
        </div>
      </div>
      {/* Top Skills Needed */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-green-700 mb-2">Top Skills Needed</h2>
        <ul className="flex flex-wrap gap-2 sm:gap-4">
          {topSkills.map((skill, idx) => (
            <li key={skill} className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 flex items-center gap-2">
              {skill} {skillsMastered > idx ? '✅' : '❌'}
            </li>
          ))}
        </ul>
        <button className="mt-2 text-green-600 underline text-sm">View All Skills Needed</button>
      </div>
      {/* Learning Path Starter */}
      <div className="mb-6 bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-green-700 mb-2">Learning Path Starter</h2>
        <div className="mb-2">{learningPath?.title}</div>
        <div className="text-gray-600 mb-2">{learningPath?.description}</div>
        <Link
        to='/learning-path'
          className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 w-full sm:w-auto"
        >
          Start Learning
        </Link>
      </div>
      {/* Career Goal Management */}
      <div className="text-sm text-gray-500 text-right">Your progress will be saved in Career Journey</div>

    </div>
  );
}
