import React, { useState, useEffect } from 'react';
import RecommendedOccupations from './RecommendedOccupations';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Community from './Community';

// Navigation items configuration
const navItems = [
  { 
    name: 'Dashboard', 
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5v4M16 5v4" />
      </svg>
    ),
    active: true
  },
  { 
    name: 'Skills & Assessment', 
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  {
    name: 'Job Recommendations',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H6a2 2 0 00-2-2V4m16 0v2a2 2 0 01-2 2H4a2 2 0 01-2-2V4" />
      </svg>
    )
  },
  { 
    name: 'Job Search', 
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )
  },
  { 
    name: 'Learning Path', 
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    name: 'Community', 
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    name: 'Find Mentors', 
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  { 
    name: 'Settings', 
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
];

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCommunity, setShowCommunity] = useState(false);
  const navigate = useNavigate();

  const [user, setUser] = useState({
    avatar: '',
    name: '',
    occupationId: '',
    id: '',
  });
  const [occupationName, setOccupationName] = useState('');
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        console.log('🚀 Starting profile fetch...');
        setLoading(true);
        
        // Get the authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        console.log('Auth user:', authUser?.email || 'No user');
        

        if (!authUser) {
          console.log('No authenticated user found');
          // Set fallback and stop loading
          setUser({
            avatar: `https://ui-avatars.com/api/?name=User&background=10b981&color=fff`,
            name: 'User',
            occupationId: '',
            id: '',
          });
          setOccupationName('Please sign in');
          setLoading(false);
          return;
        }

        // Try to get user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name, avatar_url, current_occupation_id, email, id')
          .eq('id', authUser.id)
          .single();

        console.log('Profile data:', profile ? 'Found' : 'Not found');
        console.log('Profile error:', profileError?.message || 'None');

        let displayName = 'User';
        let occupationId = '';

        if (profile && !profileError) {
          // Profile exists in database
          if (profile.full_name && profile.full_name.trim()) {
            displayName = profile.full_name.trim();
          } else if (profile.email) {
            displayName = profile.email;
          } else if (authUser.email) {
            displayName = authUser.email;
          }

          occupationId = profile.current_occupation_id || '';

          setUser({
            avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`,
            name: displayName,
            occupationId,
            id: profile.id || authUser.id,
          });

          // Fetch occupation name if occupationId exists
          if (occupationId) {
            console.log('Fetching occupation for ID:', occupationId);
            try {
              const { data: occ, error: occError } = await supabase
                .from('occupations')
                .select('preferred_label')
                .eq('csv_id', occupationId)
                .single();
              
              if (occ && occ.preferred_label && !occError) {
                const label = occ.preferred_label;
                const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
                setOccupationName(capitalized);
              } else {
                console.log('Occupation not found or error:', occError?.message);
                setOccupationName('No occupation set');
              }
            } catch (occErr) {
              console.log('Error fetching occupation:', occErr);
              setOccupationName('No occupation set');
            }
          } else {
            setOccupationName('No occupation set');
          }
        } else {
          // No profile in database, use auth data
          console.log('Using auth data as fallback');
          const authName = authUser.user_metadata?.full_name || 
                           authUser.user_metadata?.name || 
                           authUser.email || 
                           'User';
          
          setUser({
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authName)}&background=10b981&color=fff`,
            name: authName,
            occupationId: '',
          });
          setOccupationName('Complete your profile');
        }
        
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        // Set fallback user data
        setUser({
          avatar: `https://ui-avatars.com/api/?name=User&background=10b981&color=fff`,
          name: 'User',
          occupationId: '',
        });
        setOccupationName('Error loading profile');
      } finally {
        console.log('✅ Profile fetch complete, stopping loading');
        setLoading(false);
      }
    }
    
    fetchUserProfile();
  }, []);

  useEffect(() => {
    async function fetchUserSkills() {
      try {
        const { data: session } = await supabase.auth.getSession();
        const authUser = session?.session?.user ?? (await supabase.auth.getUser()).data?.user;
        if (!authUser) return;

        const { data: userSkills, error: usErr } = await supabase
          .from('user_skills')
          .select('skill_id')
          .eq('user_id', authUser.id);
        if (usErr) {
          console.warn('Failed to load user skills', usErr);
          return;
        }
        if (!userSkills || userSkills.length === 0) {
          setSkills([]);
          return;
        }
        const skillIds = userSkills.map(s => s.skill_id);
        const { data: skillRows } = await supabase.from('skills').select('csv_id, preferred_label').in('csv_id', skillIds);
        setSkills(skillRows || []);
      } catch (e) {
        console.warn('Error fetching skills', e);
      }
    }
    fetchUserSkills();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/signin', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 relative">
      {/* Mobile Top Bar - hidden when sidebar is open */}
      {!sidebarOpen && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white shadow flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-extrabold text-xl text-green-600 tracking-tight">SkillBridge</span>
          <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
        </div>
      )}

  {/* Desktop Sidebar */}
  <aside className={`hidden md:flex h-screen flex-col justify-between fixed top-0 left-0 z-40 bg-white shadow-xl transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} rounded-r-3xl border-r border-gray-200 overflow-y-auto`}> 
        <div>
          {/* Logo */}
          <div className="flex items-center justify-center py-8 border-b border-gray-100">
            {collapsed ? (
              <span className="text-lg font-extrabold text-green-600 tracking-tight">SB</span>
            ) : (
              <span className="text-2xl font-extrabold text-green-600 tracking-tight">SkillBridge</span>
            )}
          </div>
          {/* User Mini-Profile */}
          <div className="flex flex-col items-center py-8 border-b border-gray-100">
            <img src={user.avatar} alt="avatar" className={`rounded-full mb-3 shadow transition-all duration-300 ${collapsed ? 'w-8 h-8' : 'w-16 h-16'}`} />
            {!collapsed && <span className="font-semibold text-gray-900 text-lg hidden md:inline">{user.name}</span>}
            {!collapsed && <span className="text-xs text-gray-500 mt-1 hidden md:inline">{occupationName}</span>}
          </div>
          {/* Navigation Menu */}
          <nav className="mt-8">
            {navItems.map((item, idx) => (
              <button
                key={item.name}
                className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-green-100 transition-colors text-left font-medium rounded-xl mb-2 ${idx === 0 ? 'bg-green-50 font-bold text-green-700' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                onClick={() => {
                  if (item.name === 'Community') setShowCommunity(true);
                }}
              >
                <span>{item.icon}</span>
                {!collapsed && <span className="ml-3 hidden md:inline">{item.name}</span>}
              </button>
            ))}
          </nav>
        </div>
        {/* Collapse Button & Sign Out */}
        <div className="flex flex-col items-center mb-8">
          <button onClick={() => setCollapsed(!collapsed)} className="mb-4 text-gray-400 hover:text-green-600 transition-colors rounded-full p-2 bg-gray-100">
            {collapsed ? <span className="text-lg">›</span> : <span className="text-lg">‹</span>}
          </button>
          <button onClick={handleSignOut} className={`flex items-center gap-2 px-5 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors ${collapsed ? 'justify-center px-2' : ''}`}>
            <span className={`flex items-center justify-center ${collapsed ? 'mx-auto' : ''}`}>
              <svg className={`h-5 w-5 md:h-4 md:w-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </span>
            {!collapsed && <span className="hidden md:inline">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex pointer-events-none">
          <aside className="pointer-events-auto relative w-64 max-w-full h-screen bg-white shadow-xl flex flex-col justify-between rounded-r-3xl border-r border-gray-200 animate-slidein overflow-y-auto">
            <div>
              {/* Logo & Close */}
              <div className="flex items-center justify-between py-6 px-4 border-b border-gray-100">
                <span className="text-2xl font-extrabold text-green-600 tracking-tight">SkillBridge</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-green-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* User Mini-Profile */}
              <div className="flex flex-col items-center py-6 border-b border-gray-100">
                <img src={user.avatar} alt="avatar" className="rounded-full mb-2 shadow w-12 h-12" />
                <span className="font-semibold text-gray-900 text-base">{user.name}</span>
                <span className="text-xs text-gray-500 mt-1">{occupationName}</span>
              </div>
              {/* Navigation Menu */}
              <nav className="mt-6">
                {navItems.map((item, idx) => (
                  <button
                    key={item.name}
                    className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-green-100 transition-colors text-left font-medium rounded-xl mb-2 ${idx === 0 ? 'bg-green-50 font-bold text-green-700' : ''}`}
                    onClick={() => {
                      if (item.name === 'Community') setShowCommunity(true);
                    }}
                  >
                    <span>{item.icon}</span>
                    <span className="ml-3">{item.name}</span>
                  </button>
                ))}
              </nav>
            </div>
            {/* Sign Out */}
            <div className="flex flex-col items-center mb-6">
              <button onClick={handleSignOut} className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors">
                <span><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg></span>
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
  <main className={`flex-1 min-h-screen h-screen overflow-auto flex flex-col pt-24 md:pt-12 ml-0 ${collapsed ? 'md:ml-16' : 'md:ml-64'} px-4 md:px-12 pb-4 md:pb-12 transition-all duration-300`}>
    {showCommunity ? (
      <>
        <button className="mb-4 px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-semibold w-fit" onClick={() => setShowCommunity(false)}>
          ← Back to Dashboard
        </button>
        <header className="mb-6 md:mb-10">
          <h1 className="text-xl md:text-4xl font-extrabold text-green-700 mb-2">Community</h1>
        </header>
        <div className="flex-1 flex flex-col">
          {/* Community page */}
          {/* @ts-ignore */}
          <React.Suspense fallback={<div>Loading Community...</div>}>
            {user.id && <Community userId={user.id} />}
          </React.Suspense>
        </div>
      </>
    ) : (
      <>
        <header className="mb-6 md:mb-10">
          <h1 className="text-xl md:text-4xl font-extrabold text-green-700 mb-2">
            Greetings{user.name && user.name !== 'User' ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-lg">Select your dream role from the recommendations below or search for another occupation.</p>
        </header>
        {/* Skills summary removed as requested */}
        {/* Recommended Occupations & Search bar only if dashboard is not shown */}
        <RecommendedOccupations
          userId={user.id}
          currentOccupationId={user.occupationId}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          renderSearchBar={true}
        />
      </>
    )}
  </main>
    </div>
  );
}