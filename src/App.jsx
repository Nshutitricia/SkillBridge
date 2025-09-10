import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';
import { supabase, ensureUserProfile } from './supabaseClient';
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AnimatedStats from "./components/AnimatedStats";
import TrendingJobs from "./components/TrendingJobs";
import FeaturesGrid from "./components/FeaturesGrid";
import Footer from "./components/Footer";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import SignIn from "./components/SignIn";
import AuthDebug from "./components/AuthDebug";
import VerifyEmail from "./components/VerifyEmail";
import CompleteProfile from "./components/CompleteProfile";
import OccupationOnboarding from "./components/OccupationOnboarding";
import SkillAssessment from "./components/SkillAssessment";
import Dashboard from "./components/Dashboard";

import LearningPath from "./components/LearningPath";
import SupportChatSupabase from "./components/SupportChatSupabase";
import { useLocation } from "react-router-dom";

function App() {
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
        {/* Floating Support Chat - always visible, uses Supabase for real user data */}
        <SupportChatSupabase />
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
          <Route path="/learning-path" element={<><Navbar /><LearningPath /><Footer /></>} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

// Add wrapper to extract occupationId from navigation state
function SkillAssessmentWrapper() {
  const loc = useLocation();
  const occupationId = loc.state?.occupationId;
  return <SkillAssessment occupationId={occupationId} />;
}

export default App;
