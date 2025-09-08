"use client"

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export const useStats = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      const [skillsRes, occupationsRes, usersRes] = await Promise.all([
        supabase.from('skills').select('*', { count: 'exact', head: true }),
        supabase.from('occupations').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true })
      ]);
      if (skillsRes.error) console.error('Skills error:', skillsRes.error);
      if (occupationsRes.error) console.error('Occupations error:', occupationsRes.error);
      if (usersRes.error) console.error('UserProfiles error:', usersRes.error);
      setStats([
        { label: 'Skills ', value: skillsRes.count || 0 },
        { label: 'Occupations ', value: occupationsRes.count || 0 },
        { label: 'Users ', value: usersRes.count || 0 },
      ]);
    }
    fetchStats();
  }, []);

  return stats;
};
