import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from 'react';
import { supabase, ensureUserProfile } from './supabaseClient';
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import AnimatedStats from "./components/AnimatedStats"
import TrendingJobs from "./components/TrendingJobs"
import FeaturesGrid from "./components/FeaturesGrid"
import Footer from "./components/Footer"

import SignUp from "./components/SignUp";
import Login from "./components/Login";
import SignIn from "./components/SignIn";
import AuthDebug from "./components/AuthDebug";
import VerifyEmail from "./components/VerifyEmail";
import CompleteProfile from "./components/CompleteProfile";
import OccupationOnboarding from "./components/OccupationOnboarding";
import SkillAssessment from "./components/SkillAssessment";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import UserRoute from "./components/UserRoute";
import { useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Role-based redirect component
function RoleRedirect() {
  const { user, isAdmin, loading, getRedirectPath } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const redirectPath = getRedirectPath();
  return <Navigate to={redirectPath} replace />;
}

// Home component for regular users
function Home() {
  return <Dashboard />;
}

function AppContent() {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Try to patch immediately using pending + metadata
        let pending = null; try { pending = JSON.parse(localStorage.getItem('pending_profile') || 'null'); } catch { /* ignore */ }
        await ensureUserProfile(pending || {});
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route
            path="/"
            element={
                <>
                  <Navbar />
                  <main>
                    <Hero />
                    <AnimatedStats />
                    <TrendingJobs />
                    <FeaturesGrid />
                  </main>
                  <Footer />
                </>
            }
          />
          <Route path="/signin" element={<><Navbar /><SignIn /><Footer /></>} />
          <Route path="/signup" element={<><Navbar /><SignUp /><Footer /></>} />
          <Route path="/login" element={<><Navbar /><Login /><Footer /></>} />
          <Route path="/verify" element={<><Navbar /><VerifyEmail /><Footer /></>} />
          <Route path="/complete-profile" element={<><Navbar /><CompleteProfile /><Footer /></>} />
          <Route path="/onboarding/occupation" element={<><Navbar /><OccupationOnboarding /><Footer /></>} />
          <Route path="/debug/auth" element={<><Navbar /><AuthDebug /><Footer /></>} />
          <Route
            path="/jobs"
            element={<><Navbar /><div className="pt-20 p-8 text-center"><h1 className="text-2xl font-bold">Jobs Page - Coming Soon</h1></div><Footer /></>}
          />
          <Route
            path="/courses"
            element={<><Navbar /><div className="pt-20 p-8 text-center"><h1 className="text-2xl font-bold">Courses Page - Coming Soon</h1></div><Footer /></>}
          />
          <Route
            path="/community"
            element={<><Navbar /><div className="pt-20 p-8 text-center"><h1 className="text-2xl font-bold">Community Page - Coming Soon</h1></div><Footer /></>}
          />
          <Route path="/onboarding/skills" element={<><Navbar /><SkillAssessmentWrapper /><Footer /></>} />
          
          {/* Role-based redirects */}
          <Route path="/dashboard" element={<RoleRedirect />} />
          
          {/* User routes */}
          <Route path="/home" element={
            <UserRoute>
              <Home />
            </UserRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/occupations" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/analytics" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
        </Routes>
      </div>
    </Router>
  )
}

function App() {
  return <AppContent />;
}

// Add wrapper to extract occupationId from navigation state
function SkillAssessmentWrapper() {
  const loc = useLocation();
  const occupationId = loc.state?.occupationId;
  return <SkillAssessment occupationId={occupationId} />;
}

export default App
