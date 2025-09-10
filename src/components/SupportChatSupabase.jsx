import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SupportChat from './SupportChat';

export default function SupportChatSupabase() {
  const [userInfo, setUserInfo] = useState({ name: '', occupation: '', dreamJob: '' });
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);

  // Track auth state and refetch user data on change
  useEffect(() => {
    let mounted = true;
    async function fetchUserData(currentUser) {
      if (!currentUser) {
        setUser(null);
        setUserInfo({ name: '', occupation: '', dreamJob: '' });
        setMessages([]);
        return;
      }
      setUser(currentUser);
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, current_occupation_id, id')
        .eq('id', currentUser.id)
        .single();
      // Get occupation name
      let occupationName = '';
      let occ = null;
      if (profile?.current_occupation_id) {
        const occRes = await supabase
          .from('occupations')
          .select('preferred_label, csv_id')
          .eq('csv_id', profile.current_occupation_id)
          .single();
        occ = occRes.data;
        occupationName = occ?.preferred_label || '';
      }
      // Get career goal (dream job) - use only primary goal
      const { data: goals } = await supabase
        .from('user_career_goals')
        .select('target_occupation_id, is_primary_goal')
        .eq('user_id', currentUser.id)
        .eq('is_primary_goal', true)
        .limit(1);
      let dreamJob = '';
      let dreamOcc = null;
      if (goals && goals.length > 0 && goals[0].target_occupation_id) {
        const dreamOccRes = await supabase
          .from('occupations')
          .select('preferred_label, csv_id')
          .eq('csv_id', goals[0].target_occupation_id)
          .single();
        dreamOcc = dreamOccRes.data;
        dreamJob = dreamOcc?.preferred_label || '';
      }
      if (!mounted) return;
      setUserInfo({
        name: profile?.full_name || currentUser.email,
        occupation: occupationName,
        dreamJob: dreamJob
      });
      setMessages([
        {
          sender: 'bot',
          text: `Hi! Your current occupation is ${occupationName || 'Unknown'}. Do you want to see intermediary jobs to reach your dream job (${dreamJob || 'Unknown'})?`
        }
      ]);
    }
    // Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => fetchUserData(user));
    // Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      fetchUserData(session?.user || null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // Only show chat if user is logged in
  if (!user) return null;
  return (
    <SupportChat occupation={userInfo.occupation} dreamJob={userInfo.dreamJob} name={userInfo.name} initialMessages={messages} />
  );
}
