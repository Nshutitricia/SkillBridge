import { useEffect, useState } from 'react';
import { supabase, ensureUserProfile } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('pending_email');
    if (stored) setEmail(stored);
  }, []);

  const handleResend = async () => {
    if (!email) return;
    setSending(true); setMessage(''); setError('');
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
      if (resendError) throw resendError;
      setMessage('Verification email resent. Check your inbox (and spam).');
    } catch (e) {
      setError(e.message);
    }
    setSending(false);
  };

  const handleContinue = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Attempt profile patch using any pending local data
      let pending = null;
      try { pending = JSON.parse(localStorage.getItem('pending_profile') || 'null'); } catch { /* ignore */ }
      if (pending) {
        await ensureUserProfile(pending);
      } else {
        await ensureUserProfile({});
      }
      navigate('/');
    } else {
      setMessage('Still waiting for verification. After clicking the email link, refresh and click again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">Verify your email</h1>
        <p className="text-sm text-gray-600">We sent a verification link to:</p>
        <p className="font-medium text-center break-all">{email || '—'}</p>
        <p className="text-xs text-gray-500 text-center">Click the link in the email to activate your account. Once verified, return here or sign in.</p>
        {message && <div className="text-green-600 text-sm">{message}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex flex-col gap-3">
          <button onClick={handleResend} disabled={sending || !email} className="w-full py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50">
            {sending ? 'Resending...' : 'Resend Email'}
          </button>
          <button onClick={handleContinue} className="w-full py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50">I've Verified</button>
          <button onClick={() => navigate('/signin')} className="w-full py-2 rounded text-sm text-green-600 font-medium hover:underline">Go to Sign In</button>
        </div>
      </div>
    </div>
  );
}
