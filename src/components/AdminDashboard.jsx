import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Admin Dashboard Component
export default function AdminDashboard() {
  const { user, isAdmin, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userActions, setUserActions] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [occupations, setOccupations] = useState([]);
  const [occupationSearchTerm, setOccupationSearchTerm] = useState('');
  const [loadingOccupations, setLoadingOccupations] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [occupationUsers, setOccupationUsers] = useState([]);
  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [loadingOccupationUsers, setLoadingOccupationUsers] = useState(false);

  // Fetch admin data
  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
      fetchOccupations();
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch user statistics
      const { data: userStats, error: userError } = await supabase
        .from('user_profiles')
        .select('id, created_at, skill_assessment_completed, onboarding_completed, role')
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('Error fetching user stats:', userError);
        setStats({
          totalUsers: 0,
          completedAssessments: 0,
          completedOnboarding: 0,
          todayUsers: 0,
          adminUsers: 0,
          assessmentRate: 0,
          onboardingRate: 0
        });
      } else {
        const totalUsers = userStats.length;
        const completedAssessments = userStats.filter(u => u.skill_assessment_completed).length;
        const completedOnboarding = userStats.filter(u => u.onboarding_completed).length;
        const adminUsers = userStats.filter(u => u.role === 'admin').length;
        const today = new Date().toISOString().split('T')[0];
        const todayUsers = userStats.filter(u => u.created_at.startsWith(today)).length;
        
        setStats({
          totalUsers,
          completedAssessments,
          completedOnboarding,
          todayUsers,
          adminUsers,
          assessmentRate: totalUsers > 0 ? Math.round((completedAssessments / totalUsers) * 100) : 0,
          onboardingRate: totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0
        });
      }

      // Fetch all users for management
      const { data: allUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, created_at, skill_assessment_completed, onboarding_completed, role')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      setUsers(allUsers || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setStats({
        totalUsers: 0,
        completedAssessments: 0,
        completedOnboarding: 0,
        todayUsers: 0,
        adminUsers: 0,
        assessmentRate: 0,
        onboardingRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupations = async () => {
    try {
      setLoadingOccupations(true);
      
      // Fetch all occupations with pagination to get all 3000+
      let allOccupations = [];
      let from = 0;
      const limit = 1000; // Supabase default limit
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error: batchError } = await supabase
          .from('occupations')
          .select('*')
          .order('preferred_label', { ascending: true })
          .range(from, from + limit - 1);

        if (batchError) throw batchError;

        if (batch && batch.length > 0) {
          allOccupations = [...allOccupations, ...batch];
          from += limit;
          hasMore = batch.length === limit; // If we got less than limit, we're done
        } else {
          hasMore = false;
        }
      }

      console.log(`Fetched ${allOccupations.length} occupations from Supabase`);
      setOccupations(allOccupations);
    } catch (error) {
      console.error('Error fetching occupations:', error);
    } finally {
      setLoadingOccupations(false);
    }
  };

  const fetchOccupationUsers = async (occupationId) => {
    try {
      setLoadingOccupationUsers(true);
      
      // Fetch users who have this occupation as their current occupation or career goal
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_career_goals!inner(
            target_occupation_id,
            status,
            occupations!inner(csv_id, preferred_label)
          )
        `)
        .or(`current_occupation_id.eq.${occupationId},user_career_goals.target_occupation_id.eq.${occupationId}`);

      if (usersError) throw usersError;

      setOccupationUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching occupation users:', error);
      setOccupationUsers([]);
    } finally {
      setLoadingOccupationUsers(false);
    }
  };

  const handleOccupationClick = async (occupation) => {
    setSelectedOccupation(occupation);
    setShowOccupationModal(true);
    await fetchOccupationUsers(occupation.csv_id);
  };

  const fetchUserDetails = async (userId) => {
    try {
      // Fetch detailed user data
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user skills
      const { data: userSkills, error: skillsError } = await supabase
        .from('user_skills')
        .select(`
          skill_id,
          skills(preferred_label, skill_group)
        `)
        .eq('user_id', userId);

      // Fetch user career goals
      const { data: careerGoals, error: goalsError } = await supabase
        .from('user_career_goals')
        .select(`
          target_occupation_id,
          status,
          created_at,
          occupations(preferred_label)
        `)
        .eq('user_id', userId);

      // Fetch user's current occupation
      let currentOccupation = null;
      if (userProfile.current_occupation_id) {
        const { data: occupation } = await supabase
          .from('occupations')
          .select('preferred_label, description')
          .eq('csv_id', userProfile.current_occupation_id)
          .single();
        currentOccupation = occupation;
      }

      // Fetch user activity (recent logins, actions, etc.)
      const { data: userActivity, error: activityError } = await supabase
        .from('user_profiles')
        .select('created_at, updated_at, last_login')
        .eq('id', userId)
        .single();

      setUserDetails({
        profile: userProfile,
        skills: userSkills || [],
        careerGoals: careerGoals || [],
        currentOccupation,
        activity: userActivity
      });

    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Error loading user details: ' + error.message);
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    await fetchUserDetails(user.id);
  };

  const handleUserAction = async (action, userId) => {
    try {
      switch (action) {
        case 'delete':
          if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const { error } = await supabase
              .from('user_profiles')
              .delete()
              .eq('id', userId);
            
            if (error) throw error;
            
            setUsers(users.filter(u => u.id !== userId));
            setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
            setShowUserModal(false);
            alert('User deleted successfully');
          }
          break;
          
        case 'toggle_admin':
          const user = users.find(u => u.id === userId);
          const newRole = user.role === 'admin' ? 'user' : 'admin';
          
          const { error } = await supabase
            .from('user_profiles')
            .update({ role: newRole })
            .eq('id', userId);
          
          if (error) throw error;
          
          setUsers(users.map(u => 
            u.id === userId ? { ...u, role: newRole } : u
          ));
          
          // Update user details if modal is open
          if (selectedUser && selectedUser.id === userId) {
            setSelectedUser({ ...selectedUser, role: newRole });
            if (userDetails) {
              setUserDetails({
                ...userDetails,
                profile: { ...userDetails.profile, role: newRole }
              });
            }
          }
          
          alert(`User role changed to ${newRole}`);
          break;
          
        case 'suspend':
          // Implement suspend logic here
          console.log('Suspending user:', userId);
          alert('Suspend functionality coming soon');
          break;
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      alert('Error performing action: ' + error.message);
    }
  };

  const generateUserReportHTML = () => {
    const completedAssessments = users.filter(user => user.skill_assessment_completed).length;
    const completedOnboarding = users.filter(user => user.onboarding_completed).length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const regularUsers = users.length - adminUsers;
    const assessmentRate = users.length > 0 ? Math.round((completedAssessments / users.length) * 100) : 0;
    const onboardingRate = users.length > 0 ? Math.round((completedOnboarding / users.length) * 100) : 0;
    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });

    const tableRows = users.map(user => `
      <tr>
        <td class="user-name">${user.full_name || 'No name'}</td>
        <td class="user-email">${user.email}</td>
        <td class="text-center">
          <span class="role-badge ${user.role === 'admin' ? 'admin' : 'user'}">
            ${user.role === 'admin' ? 'Admin' : 'User'}
          </span>
        </td>
        <td class="text-center">
          <span class="status-indicator ${user.skill_assessment_completed ? 'completed' : 'pending'}">
            ${user.skill_assessment_completed ? '✓' : '○'}
          </span>
        </td>
        <td class="text-center">
          <span class="status-indicator ${user.onboarding_completed ? 'completed' : 'pending'}">
            ${user.onboarding_completed ? '✓' : '○'}
          </span>
        </td>
        <td class="text-center">${new Date(user.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Q${Math.ceil((today.getMonth() + 1) / 3)} ${today.getFullYear()} Platform Performance Report | SkillBridge Analytics</title>
        <style>
          @page { margin: 0.5in; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: white; 
            color: #333; 
            line-height: 1.6;
          }
          .report-container { 
            max-width: 8.5in; 
            margin: 0 auto; 
            background: white; 
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .report-header { 
            background: #1a1a1a; 
            color: white; 
            padding: 30px 40px; 
            border-bottom: 4px solid #22c55e;
          }
          .report-title { 
            font-size: 28px; 
            font-weight: 700; 
            margin: 0 0 8px 0; 
            letter-spacing: -0.5px;
          }
          .report-subtitle { 
            font-size: 16px; 
            margin: 0 0 20px 0; 
            opacity: 0.9; 
            font-weight: 400;
          }
          .report-meta { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            font-size: 14px; 
            opacity: 0.8;
          }
          .report-content { 
            padding: 40px; 
          }
          .executive-summary { 
            background: #f8fafc; 
            padding: 30px; 
            border-left: 4px solid #22c55e; 
            margin-bottom: 40px; 
            border-radius: 0 8px 8px 0;
          }
          .summary-title { 
            font-size: 20px; 
            font-weight: 600; 
            color: #1a1a1a; 
            margin: 0 0 20px 0;
          }
          .summary-text { 
            font-size: 16px; 
            color: #4a5568; 
            margin: 0 0 15px 0;
          }
          .kpi-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 30px; 
            margin: 40px 0; 
          }
          .kpi-card { 
            background: white; 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 25px; 
            text-align: center; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .kpi-value { 
            font-size: 36px; 
            font-weight: 700; 
            color: #1a1a1a; 
            margin: 0 0 8px 0; 
            line-height: 1;
          }
          .kpi-label { 
            font-size: 14px; 
            color: #6b7280; 
            font-weight: 500; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            margin: 0;
          }
          .kpi-change { 
            font-size: 12px; 
            margin-top: 8px; 
            font-weight: 500;
          }
          .positive { color: #059669; }
          .section-header { 
            font-size: 22px; 
            font-weight: 600; 
            color: #1a1a1a; 
            margin: 50px 0 25px 0; 
            padding-bottom: 10px; 
            border-bottom: 2px solid #e2e8f0;
          }
          .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0; 
            font-size: 14px;
          }
          .data-table th { 
            background: #f7fafc; 
            padding: 15px 12px; 
            text-align: left; 
            font-weight: 600; 
            color: #4a5568; 
            border-bottom: 2px solid #e2e8f0; 
            font-size: 12px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
          }
          .data-table td { 
            padding: 15px 12px; 
            border-bottom: 1px solid #e2e8f0; 
            vertical-align: middle;
          }
          .data-table tr:hover { 
            background: #f8fafc; 
          }
          .user-name { 
            font-weight: 600; 
            color: #1a1a1a;
          }
          .user-email { 
            color: #6b7280; 
            font-size: 13px;
          }
          .role-badge { 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: 600; 
            text-transform: uppercase;
          }
          .role-badge.admin { 
            background: #fef2f2; 
            color: #dc2626; 
          }
          .role-badge.user { 
            background: #eff6ff; 
            color: #2563eb; 
          }
          .status-indicator { 
            font-size: 16px; 
            font-weight: bold;
          }
          .status-indicator.completed { 
            color: #059669; 
          }
          .status-indicator.pending { 
            color: #d97706; 
          }
          .text-center { 
            text-align: center; 
          }
          .report-footer { 
            background: #f8fafc; 
            padding: 25px 40px; 
            border-top: 1px solid #e2e8f0; 
            font-size: 12px; 
            color: #6b7280; 
            text-align: center;
          }
          .footer-logo { 
            font-weight: 600; 
            color: #22c55e; 
            margin-bottom: 5px;
          }
          .page-break { 
            page-break-before: always; 
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <h1 class="report-title">Platform Performance Report</h1>
            <p class="report-subtitle">Q${Math.ceil((today.getMonth() + 1) / 3)} ${today.getFullYear()} • SkillBridge Analytics</p>
            <div class="report-meta">
              <span>Generated: ${new Date().toLocaleString()}</span>
              <span>Report ID: SB-${Date.now().toString().slice(-6)}</span>
            </div>
          </div>
          
          <div class="report-content">
            <div class="executive-summary">
              <h2 class="summary-title">Executive Summary</h2>
              <p class="summary-text">
                This report provides a comprehensive overview of SkillBridge platform performance for ${currentMonth}. 
                The platform currently serves <strong>${users.length} registered users</strong> with a 
                <strong>${assessmentRate}% assessment completion rate</strong> and 
                <strong>${onboardingRate}% onboarding completion rate</strong>.
              </p>
              <p class="summary-text">
                Key highlights include ${completedAssessments} completed skill assessments and 
                ${completedOnboarding} completed onboarding processes, demonstrating strong user engagement 
                and platform adoption.
              </p>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-value">${users.length}</div>
                <div class="kpi-label">Total Users</div>
                <div class="kpi-change positive">+${stats.todayUsers || 0} this week</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value">${assessmentRate}%</div>
                <div class="kpi-label">Assessment Rate</div>
                <div class="kpi-change positive">${completedAssessments} completed</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value">${onboardingRate}%</div>
                <div class="kpi-label">Onboarding Rate</div>
                <div class="kpi-change positive">${completedOnboarding} completed</div>
              </div>
            </div>

            <h2 class="section-header">Platform Statistics</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin: 30px 0;">
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #22c55e;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a1a;">User Distribution</h3>
                <p style="margin: 5px 0; color: #4a5568;"><strong>Regular Users:</strong> ${regularUsers}</p>
                <p style="margin: 5px 0; color: #4a5568;"><strong>Admin Users:</strong> ${adminUsers}</p>
                <p style="margin: 5px 0; color: #4a5568;"><strong>Total Platform Users:</strong> ${users.length}</p>
              </div>
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a1a;">Completion Metrics</h3>
                <p style="margin: 5px 0; color: #4a5568;"><strong>Skill Assessments:</strong> ${completedAssessments} of ${users.length}</p>
                <p style="margin: 5px 0; color: #4a5568;"><strong>Onboarding Process:</strong> ${completedOnboarding} of ${users.length}</p>
                <p style="margin: 5px 0; color: #4a5568;"><strong>Overall Completion:</strong> ${Math.round(((completedAssessments + completedOnboarding) / (users.length * 2)) * 100)}%</p>
              </div>
            </div>
          </div>
          
          <div class="report-footer">
            <div class="footer-logo">SkillBridge Platform Analytics</div>
            <div>Confidential Report - Generated on ${new Date().toLocaleString()}</div>
            <div style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
              This report contains sensitive platform data and should be treated as confidential.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const downloadUserReport = () => {
    const htmlContent = generateUserReportHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillbridge-admin-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewUserReport = () => {
    const htmlContent = generateUserReportHTML();
    const newWindow = window.open('', '_blank');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  const generateDetailedUserReportHTML = (user) => {
    const skillsList = userDetails?.skills ? userDetails.skills.map(skill => 
      `<li>${skill.skills?.preferred_label || skill.skill_id}</li>`
    ).join('') : '<li>No skills recorded</li>';

    const careerGoalsList = userDetails?.careerGoals ? userDetails.careerGoals.map(goal => 
      `<li>${goal.occupations?.preferred_label || 'Unknown'} (${goal.status})</li>`
    ).join('') : '<li>No career goals recorded</li>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>User Report - ${user.full_name || user.email}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: white; }
          .header { color: #22c55e; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .subheader { color: #22c55e; font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
          .info-section { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .info-section div { margin: 8px 0; }
          .skills-list, .goals-list { margin: 10px 0; }
          .skills-list li, .goals-list li { margin: 5px 0; padding: 5px; background: #f0fdf4; border-radius: 4px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">User Detailed Report</div>
        <div>Generated on: ${new Date().toLocaleString()}</div>
        
        <div class="subheader">User Information</div>
        <div class="info-section">
          <div><strong>Name:</strong> ${user.full_name || 'No name'}</div>
          <div><strong>Email:</strong> ${user.email}</div>
          <div><strong>User ID:</strong> ${user.id}</div>
          <div><strong>Role:</strong> ${user.role}</div>
          <div><strong>Joined:</strong> ${new Date(user.created_at).toLocaleString()}</div>
          <div><strong>Last Updated:</strong> ${new Date(user.updated_at || user.created_at).toLocaleString()}</div>
        </div>
        
        <div class="subheader">Skills (${userDetails?.skills?.length || 0})</div>
        <div class="skills-list">
          <ul>${skillsList}</ul>
        </div>
        
        <div class="subheader">Career Goals</div>
        <div class="goals-list">
          <ul>${careerGoalsList}</ul>
        </div>
        
        <div class="footer">
          <div>SkillBridge User Report - Generated on ${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>
    `;
  };

  const downloadDetailedUserReport = () => {
    if (!selectedUser) return;
    const htmlContent = generateDetailedUserReportHTML(selectedUser);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-report-${selectedUser.email.split('@')[0]}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewDetailedUserReport = () => {
    if (!selectedUser) return;
    const htmlContent = generateDetailedUserReportHTML(selectedUser);
    const newWindow = window.open('', '_blank');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {userProfile?.full_name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'occupations', name: 'Occupations', icon: '💼' },
              { id: 'analytics', name: 'Analytics', icon: '📈' },
              { id: 'settings', name: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed Assessments</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completedAssessments}</p>
                    <p className="text-sm text-gray-500">{stats.assessmentRate}% completion rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's New Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.todayUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Admin Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.adminUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex space-x-2 mt-1">
                          {user.skill_assessment_completed && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Assessment Done
                            </span>
                          )}
                          {user.role === 'admin' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={viewUserReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View Report</span>
                  </button>
                  <button 
                    onClick={downloadUserReport}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Report</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Users ({filteredUsers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleUserClick(user)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {user.role === 'admin' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                User
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {user.skill_assessment_completed && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Assessment Done
                              </span>
                            )}
                            {user.onboarding_completed && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                ✓ Onboarding Done
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserAction('toggle_admin', user.id);
                              }}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                user.role === 'admin'
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserAction('delete', user.id);
                              }}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Occupations Tab */}
        {activeTab === 'occupations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Occupation Management</h2>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Add New Occupation
              </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search occupations..."
                  value={occupationSearchTerm}
                  onChange={(e) => setOccupationSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Occupations List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Occupations ({occupations.filter(occ => 
                    occ.preferred_label?.toLowerCase().includes(occupationSearchTerm.toLowerCase())
                  ).length})
                </h3>
              </div>
              
              {loadingOccupations ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading occupations...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Occupation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users Pursuing
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {occupations
                        .filter(occ => 
                          occ.preferred_label?.toLowerCase().includes(occupationSearchTerm.toLowerCase())
                        )
                        .map((occupation) => (
                        <tr 
                          key={occupation.csv_id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleOccupationClick(occupation)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {occupation.preferred_label || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {occupation.description || 'No description available'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Click to view users
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {occupations.filter(occ => 
                    occ.preferred_label?.toLowerCase().includes(occupationSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      {occupationSearchTerm ? 'No occupations found matching your search.' : 'No occupations available.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="text-2xl font-bold text-green-600">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New This Week</span>
                    <span className="text-lg font-semibold text-gray-900">{stats.todayUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Admin Users</span>
                    <span className="text-lg font-semibold text-red-600">{stats.adminUsers}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Skill Assessment Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-gray-900">{stats.completedAssessments}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${stats.assessmentRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-green-600">{stats.assessmentRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="text-sm font-medium text-gray-900">{stats.totalUsers - stats.completedAssessments}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Onboarding Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-gray-900">{stats.completedOnboarding}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${stats.onboardingRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-blue-600">{stats.onboardingRate}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Occupations</span>
                    <span className="text-sm font-medium text-gray-900">{occupations.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="text-sm font-medium text-gray-900">{stats.totalUsers - stats.adminUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Assessment Rate</span>
                    <span className="text-sm font-medium text-green-600">{stats.assessmentRate}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent User Activity</h3>
              <div className="space-y-3">
                {users.slice(0, 10).map((user, index) => (
                  <div key={user.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user.full_name || 'No name'} 
                        {user.skill_assessment_completed ? ' completed skill assessment' : ' joined the platform'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {user.skill_assessment_completed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Assessment Done
                        </span>
                      )}
                      {user.onboarding_completed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✓ Onboarding Done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">System Settings</h3>
              
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">User Management</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Allow User Registration</p>
                        <p className="text-sm text-gray-500">Allow new users to sign up</p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Require Email Verification</p>
                        <p className="text-sm text-gray-500">Users must verify email before access</p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Send email updates to admins</p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Danger Zone</h4>
                  <div className="space-y-4">
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                      Reset All User Data
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                      Delete All Users
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-600">
                      {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedUser.full_name || 'No name'}
                    </h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex space-x-2 mt-2">
                      {selectedUser.role === 'admin' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          User
                        </span>
                      )}
                      {selectedUser.skill_assessment_completed && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Assessment Complete
                        </span>
                      )}
                      {selectedUser.onboarding_completed && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          Onboarded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Profile Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900">{selectedUser.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">User ID</label>
                        <p className="text-gray-900 font-mono text-sm">{selectedUser.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Joined</label>
                        <p className="text-gray-900">{new Date(selectedUser.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="text-gray-900">{new Date(selectedUser.updated_at || selectedUser.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* User Skills */}
                  {userDetails?.skills && userDetails.skills.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Skills ({userDetails.skills.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {userDetails.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {skill.skills?.preferred_label || skill.skill_id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career Goals */}
                  {userDetails?.careerGoals && userDetails.careerGoals.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Career Goals</h4>
                      <div className="space-y-2">
                        {userDetails.careerGoals.map((goal, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="text-sm font-medium text-gray-900">
                              {goal.occupations?.preferred_label || 'Unknown Occupation'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              goal.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {goal.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Activity & Actions */}
                <div className="space-y-6">
                  {/* Current Occupation */}
                  {userDetails?.currentOccupation && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Current Occupation</h4>
                      <div className="p-3 bg-white rounded border">
                        <h5 className="font-medium text-gray-900">{userDetails.currentOccupation.preferred_label}</h5>
                        {userDetails.currentOccupation.description && (
                          <p className="text-sm text-gray-600 mt-1">{userDetails.currentOccupation.description}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* User Activity */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Account Created</p>
                          <p className="text-xs text-gray-500">{new Date(selectedUser.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      {selectedUser.skill_assessment_completed && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Skill Assessment Completed</p>
                            <p className="text-xs text-gray-500">Assessment finished</p>
                          </div>
                        </div>
                      )}
                      {selectedUser.onboarding_completed && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Onboarding Completed</p>
                            <p className="text-xs text-gray-500">User fully onboarded</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Reports */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">User Reports</h4>
                    <div className="space-y-3">
                      <button
                        onClick={viewDetailedUserReport}
                        className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View User Report</span>
                      </button>
                      
                      <button
                        onClick={downloadDetailedUserReport}
                        className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download User Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleUserAction('toggle_admin', selectedUser.id)}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedUser.role === 'admin'
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {selectedUser.role === 'admin' ? 'Remove Admin Privileges' : 'Grant Admin Privileges'}
                      </button>
                      
                      <button
                        onClick={() => handleUserAction('suspend', selectedUser.id)}
                        className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition-colors"
                      >
                        Suspend User
                      </button>
                      
                      <button
                        onClick={() => handleUserAction('delete', selectedUser.id)}
                        className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                      >
                        Delete User
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Occupation Users Modal */}
      {showOccupationModal && selectedOccupation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedOccupation.preferred_label || 'Unknown Occupation'}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Users pursuing this occupation ({occupationUsers.length})
                  </p>
                </div>
                <button
                  onClick={() => setShowOccupationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-6">
                {loadingOccupationUsers ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : occupationUsers.length > 0 ? (
                  <div className="space-y-4">
                    {occupationUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-600">
                              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {user.full_name || 'No name'}
                            </h4>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex space-x-2">
                            {user.skill_assessment_completed ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                ✓ Skill Assessment Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                ⏳ Skill Assessment Pending
                              </span>
                            )}
                            
                            {user.onboarding_completed ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                ✓ Onboarding Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                ⏳ Onboarding Pending
                              </span>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                            {user.role === 'admin' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-500">No users are currently pursuing this occupation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}