import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, ensureUserProfile } from "../supabaseClient";

const SignIn = () => {

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    return newErrors
  }


  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Real Supabase authentication
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setErrors({ password: error.message });
      return;
    }

    // Ensure profile exists (first login after email confirmation)
    // Provide pending profile data if stored (after email signup)
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem('pending_profile') || 'null'); } catch { /* ignore */ }
    const result = await ensureUserProfile(pending || {});
    if (result?.updated || result?.created) {
      // fetch updated profile and optionally redirect to completion if still missing fields
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('user_profiles').select('full_name, gender, date_of_birth').eq('id', user.id).maybeSingle();
        if (prof && (!prof.full_name || !prof.gender || !prof.date_of_birth)) {
          navigate('/complete-profile');
          return;
        }
      }
    }
    if (result?.error) {
      console.warn('Profile ensure error', result.error);
    }
    // After profile ensure, check if skill assessment is completed
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('user_profiles').select('skill_assessment_completed, gender, date_of_birth').eq('id', user.id).maybeSingle();
      if (prof && (!prof.gender || !prof.date_of_birth)) {
        navigate('/complete-profile');
        return;
      }
      if (prof && prof.skill_assessment_completed) {
        navigate('/dashboard');
        return;
      }
    }
    navigate("/onboarding/occupation");
  };

  const handleGoogle = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/signin` }
    });
  };

  // On mount (e.g. after returning from Google OAuth), ensure profile exists
  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      // Fetch all needed fields in one query
      const { data: profile } = await supabase.from('user_profiles').select('id, skill_assessment_completed, gender, date_of_birth').eq('id', user.id).maybeSingle();
      if (!profile) {
        let pending = null; try { pending = JSON.parse(localStorage.getItem('pending_profile') || 'null'); } catch { /* ignore */ }
        await ensureUserProfile(pending || {});
        setLoading(false);
        return;
      }
      if (profile && (!profile.gender || !profile.date_of_birth)) {
        navigate('/complete-profile');
        setLoading(false);
        return;
      }
      if (profile && profile.skill_assessment_completed && profile.gender && profile.date_of_birth) {
        navigate('/dashboard');
        setLoading(false);
        return;
      }
      setLoading(false);
    })();
    return () => {};
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 z-50">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="mt-2 text-green-600 font-medium">Checking your profile...</span>
          </div>
        </div>
      )}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <span className="text-3xl font-bold text-gray-900">SkillBridge</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link to="/" className="font-medium text-green-600 hover:text-green-500">
            return to homepage
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full flex justify-center gap-2 items-center py-2 px-4 border rounded-md text-sm font-medium bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
              >
                <span>Sign in with Google</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />
                {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-green-600 hover:text-green-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                Sign In
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to SkillBridge?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/signup">
                <button type="button" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200">
                  Create an account
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn
