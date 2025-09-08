import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (loginError) throw loginError;
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required className="w-full mb-2 p-2 border rounded" />
      <input name="password" value={form.password} onChange={handleChange} placeholder="Password" type="password" required className="w-full mb-2 p-2 border rounded" />
      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded font-bold mt-4">
        {loading ? 'Logging In...' : 'Login'}
      </button>
    </form>
  );
}
