import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SignUp() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    gender: '',
    date_of_birth: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Basic validation
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim() || !form.confirm_password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Email is invalid');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
        // Save intended profile fields immediately for later patch (works even if email verification required)
        try {
          localStorage.setItem('pending_profile', JSON.stringify({
            full_name: form.full_name,
            gender: form.gender,
            date_of_birth: form.date_of_birth,
          }));
        } catch { /* ignore */ }
      // Always just create auth user and store pending profile; trigger will create base row.
  const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            gender: form.gender,
            date_of_birth: form.date_of_birth,
          }
        }
      });
      if (authError) throw authError;
      // Persist desired profile fields for patching after first verified login
      localStorage.setItem('pending_email', form.email);
  navigate('/verify');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/onboarding/occupation` }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <span className="flex justify-center text-3xl font-bold text-gray-900">SkillBridge</span>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="/signin" className="font-medium text-green-600 hover:text-green-500">
            sign in to your account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            <div>
              <button type="button" onClick={handleGoogle} className="w-full flex justify-center gap-2 items-center py-2 px-4 border rounded-md text-sm font-medium bg-white hover:bg-gray-50 border-gray-300 shadow-sm">
                <span>Continue with Google</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1">
                <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full Name" required className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm border-gray-300" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm border-gray-300" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input name="password" value={form.password} onChange={handleChange} placeholder="Password" type="password" required className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm border-gray-300" />
              </div>
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1">
                <input name="confirm_password" value={form.confirm_password} onChange={handleChange} placeholder="Confirm Password" type="password" required className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm border-gray-300" />
              </div>
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
              <div className="mt-1">
                <select name="gender" value={form.gender} onChange={handleChange} required className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm border-gray-300">
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <div className="mt-1">
                <input name="date_of_birth" value={form.date_of_birth} onChange={handleChange} type="date" required className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm border-gray-300" />
              </div>
            </div>
            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200">
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
