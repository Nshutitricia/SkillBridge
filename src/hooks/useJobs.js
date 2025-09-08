"use client"

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export const useJobs = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchJobs() {
      const { data, error } = await supabase.rpc('get_trending_occupations', { limit_rows: 10 });
  if (error) console.error('TrendingJobs error:', error);
      if (error) {
        if (!cancelled) setJobs([]);
        return;
      }
      if (!cancelled && Array.isArray(data)) {
        setJobs(data.map(row => ({
          title: row.title || 'Unknown',
          description: row.description || '',
          trending_score: row.trending_score || 0,
        })));
      }
    }
    fetchJobs();
    return () => { cancelled = true; };
  }, []);

  return jobs;
};
