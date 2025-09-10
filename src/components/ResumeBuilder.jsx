import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function ResumeBuilder({ userId }) {
  // Multiple entries for education, experience, and professions
  const [professions, setProfessions] = useState(['']);
  const [educationList, setEducationList] = useState(['']);
  const [experienceList, setExperienceList] = useState(['']);
  const resumeRef = useRef(null);
  const [profile, setProfile] = useState({ full_name: '', email: '', summary: '' });
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileAndSkills() {
      setLoading(true);
      // Fetch user profile
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();
      if (userData) setProfile(p => ({ ...p, ...userData }));
      // Fetch user skills
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select('skill_id')
        .eq('user_id', userId);
      let skillIds = userSkills ? userSkills.map(s => s.skill_id) : [];
      // Fetch skill labels
      let skillRows = [];
      if (skillIds.length > 0) {
        const { data: skillsData } = await supabase
          .from('skills')
          .select('csv_id, preferred_label')
          .in('csv_id', skillIds);
        skillRows = skillsData || [];
      }
      // Limit to top 10 skills by default
      setSkills(skillRows.slice(0, 10));
      setSelectedSkills(skillRows.slice(0, 5).map(s => s.csv_id));
      setLoading(false);
    }
    if (userId) fetchProfileAndSkills();
  }, [userId]);

  const handleSkillToggle = skillId => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleChange = e => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading resume builder...</div>;

  // PDF download handler
  const handleDownloadPDF = () => {
    if (!resumeRef.current || !window.html2pdf) return;
    window.html2pdf(resumeRef.current, {
      margin: 0.5,
      filename: `${profile.full_name || 'resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-white rounded shadow flex flex-col gap-6">
      <h2 className="text-2xl font-bold mb-2 text-green-700">Resume Builder</h2>
      <div className="flex flex-col gap-4">
        <input
          name="full_name"
          value={profile.full_name}
          onChange={handleChange}
          placeholder="Full Name"
          className="w-full p-2 border rounded"
        />
        <input
          name="email"
          value={profile.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
        <textarea
          name="summary"
          value={profile.summary}
          onChange={handleChange}
          placeholder="Professional Summary"
          className="w-full p-2 border rounded min-h-[60px]"
        />
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Professions</label>
          {professions.map((prof, idx) => (
            <div key={idx} className="flex gap-2 mb-1">
              <input
                type="text"
                value={prof}
                onChange={e => {
                  const arr = [...professions];
                  arr[idx] = e.target.value;
                  setProfessions(arr);
                }}
                placeholder="Profession (e.g. Software Engineer)"
                className="w-full p-2 border rounded"
              />
              <button type="button" className="px-2 py-1 bg-red-100 text-red-600 rounded" onClick={() => setProfessions(professions.filter((_, i) => i !== idx))}>Remove</button>
            </div>
          ))}
          <button type="button" className="px-3 py-1 bg-green-100 text-green-700 rounded font-semibold w-fit" onClick={() => setProfessions([...professions, ''])}>Add Profession</button>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <label className="font-semibold">Education</label>
          {educationList.map((edu, idx) => (
            <div key={idx} className="flex gap-2 mb-1">
              <input
                type="text"
                value={edu}
                onChange={e => {
                  const arr = [...educationList];
                  arr[idx] = e.target.value;
                  setEducationList(arr);
                }}
                placeholder="Education (e.g. University, Degree, Years)"
                className="w-full p-2 border rounded"
              />
              <button type="button" className="px-2 py-1 bg-red-100 text-red-600 rounded" onClick={() => setEducationList(educationList.filter((_, i) => i !== idx))}>Remove</button>
            </div>
          ))}
          <button type="button" className="px-3 py-1 bg-green-100 text-green-700 rounded font-semibold w-fit" onClick={() => setEducationList([...educationList, ''])}>Add Education</button>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <label className="font-semibold">Experience</label>
          {experienceList.map((exp, idx) => (
            <div key={idx} className="flex gap-2 mb-1">
              <input
                type="text"
                value={exp}
                onChange={e => {
                  const arr = [...experienceList];
                  arr[idx] = e.target.value;
                  setExperienceList(arr);
                }}
                placeholder="Experience (e.g. Company, Role, Years)"
                className="w-full p-2 border rounded"
              />
              <button type="button" className="px-2 py-1 bg-red-100 text-red-600 rounded" onClick={() => setExperienceList(experienceList.filter((_, i) => i !== idx))}>Remove</button>
            </div>
          ))}
          <button type="button" className="px-3 py-1 bg-green-100 text-green-700 rounded font-semibold w-fit" onClick={() => setExperienceList([...experienceList, ''])}>Add Experience</button>
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Select Skills to Include</h3>
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <label key={skill.csv_id} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSkills.includes(skill.csv_id)}
                onChange={() => handleSkillToggle(skill.csv_id)}
              />
              <span className="text-sm">{skill.preferred_label}</span>
            </label>
          ))}
        </div>
      </div>
      <div
        ref={resumeRef}
        style={{
          marginTop: '2rem',
          padding: '2.5rem',
          background: '#fff',
          borderRadius: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          fontFamily: 'Georgia, Times, Times New Roman, serif',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto',
          border: '1px solid #e5e7eb',
          color: '#222'
        }}
      >
        {/* Header: Name & Title */}
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 'bold', fontSize: '2.2rem', color: '#1e3a8a', letterSpacing: '1px', marginBottom: '0.2rem' }}>{profile.full_name || 'Your Name'}</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#374151', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{professions.filter(p => p.trim()).join(' | ') || 'Your Profession'}</div>
        </div>
        {/* Contact Info */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', fontSize: '0.95rem', color: '#374151', marginBottom: '1.2rem' }}>
          <span>{profile.email}</span>
          {/* Add more contact fields as needed */}
        </div>
        {/* Summary */}
        <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '1rem', color: '#374151', marginBottom: '2rem', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
          {profile.summary || 'Professional summary goes here.'}
        </div>
        {/* Experience Section */}
  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e3a8a', marginBottom: '0.2rem', letterSpacing: '1px' }}>PROFESSIONAL EXPERIENCE</div>
  <div style={{ borderBottom: '2px solid #1e3a8a', marginBottom: '0.7rem' }}></div>
        {experienceList.filter(e => e.trim()).length > 0 ? (
          <div style={{ marginBottom: '1.5rem' }}>
            {experienceList.filter(e => e.trim()).map((exp, idx) => (
              <div key={idx} style={{ marginBottom: '0.7rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#222' }}>{exp.split('|')[0] || 'Company Name'}</span>
                  <span style={{ fontSize: '0.95rem', color: '#374151', fontStyle: 'italic' }}>{exp.split('|')[2] || ''}</span>
                </div>
                <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '0.98rem', marginBottom: '0.2rem' }}>{exp.split('|')[1] || 'Job Title'}</div>
                {/* Bullets: allow user to enter multiple lines separated by ; */}
                {exp.split('|')[3] && (
                  <ul style={{ marginLeft: '1.2rem', marginTop: '0.2rem' }}>
                    {exp.split('|')[3].split(';').map((b, i) => b.trim() && (
                      <li key={i} style={{ fontSize: '0.95rem', color: '#374151', marginBottom: '0.15rem' }}>{b.trim()}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Add your professional experience above.</div>
        )}
        {/* Education Section */}
  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e3a8a', marginBottom: '0.2rem', letterSpacing: '1px' }}>EDUCATION</div>
  <div style={{ borderBottom: '2px solid #1e3a8a', marginBottom: '0.7rem' }}></div>
        {educationList.filter(e => e.trim()).length > 0 ? (
          <div style={{ marginBottom: '1.5rem' }}>
            {educationList.filter(e => e.trim()).map((edu, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.7rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#222' }}>{edu.split('|')[0] || 'Degree & University'}</span>
                <span style={{ fontSize: '0.95rem', color: '#374151', fontStyle: 'italic' }}>{edu.split('|')[1] || ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Add your education above.</div>
        )}
        {/* Skills Section */}
  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e3a8a', marginBottom: '0.2rem', letterSpacing: '1px' }}>SKILLS</div>
  <div style={{ borderBottom: '2px solid #1e3a8a', marginBottom: '0.7rem' }}></div>
  <ul style={{ fontSize: '1rem', color: '#374151', marginBottom: '0.5rem', paddingLeft: '2rem', listStyleType: 'disc' }}>
          {skills.filter(s => selectedSkills.includes(s.csv_id)).map((s, idx) => {
            const label = s.preferred_label ? s.preferred_label.charAt(0).toUpperCase() + s.preferred_label.slice(1) : '';
            return (
              <li key={idx} style={{ marginBottom: '0.15rem' }}>{label}</li>
            );
          })}
        </ul>
      </div>
      <button
        className="mt-4 px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition-colors"
        onClick={handleDownloadPDF}
      >
        Download PDF
      </button>
    </div>
  );
}
