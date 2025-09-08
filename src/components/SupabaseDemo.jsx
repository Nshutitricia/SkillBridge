import React, { useEffect, useState } from 'react';
import { fetchOccupations, fetchSkills, fetchUsers } from '../supabaseClient';

export default function SupabaseDemo() {
  const [occupations, setOccupations] = useState([]);
  const [skills, setSkills] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchOccupations().then(({ data }) => setOccupations(data || []));
    fetchSkills().then(({ data }) => setSkills(data || []));
    fetchUsers().then(({ data }) => setUsers(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Occupations</h2>
      <ul>
        {occupations.map(o => (
          <li key={o.id}>{o.preferred_label || o.code || o.id}</li>
        ))}
      </ul>
      <h2>Skills</h2>
      <ul>
        {skills.map(s => (
          <li key={s.id}>{s.preferred_label || s.skill_type || s.id}</li>
        ))}
      </ul>
      <h2>Users</h2>
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.full_name || u.email || u.id}</li>
        ))}
      </ul>
    </div>
  );
}
