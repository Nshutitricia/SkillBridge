import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        navigate('/signin');
        return;
      }
      setUser(user);
      // Fetch user's full name from user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      console.log('Fetched user_profiles:', profile);
      if (profile && profile.full_name && profile.full_name.trim()) {
        setFullName(profile.full_name);
      } else {
        setFullName('');
      }
      // Fetch user's skills
      const { data: userSkills, error: skillErr } = await supabase
        .from('user_skills')
        .select('skill_id')
        .eq('user_id', user.id);
      if (skillErr) {
        setError('Failed to fetch skills');
        setLoading(false);
        return;
      }
      // Fetch skill details
      const skillIds = userSkills.map(us => us.skill_id);
      let skillsData = [];
      if (skillIds.length > 0) {
        const { data: skills, error: skillsErr } = await supabase
          .from('skills')
          .select('preferred_label')
          .in('csv_id', skillIds);
        if (skillsErr) {
          setError('Failed to fetch skill details');
          setLoading(false);
          return;
        }
        skillsData = skills;
      }
      setSkills(skillsData);
      setLoading(false);
    }
    fetchData();
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-10 w-10 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="mt-2 text-green-600 font-medium">Populating your home page...</span>
      </div>
    </div>
  );
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center bg-white rounded-xl shadow-lg p-8">
  <h1 className="text-3xl font-bold text-green-700 mb-4">Welcome, {fullName || user?.email}!</h1>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Skills:</h2>
        {skills.length === 0 ? (
          <div className="text-gray-500">No skills saved yet.</div>
        ) : (
          <ul className="list-disc list-inside text-left mx-auto max-w-xs">
            {skills.map((skill, idx) => (
              <li key={idx} className="text-gray-800">{skill.preferred_label}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
