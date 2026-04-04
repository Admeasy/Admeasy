import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeacherSetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing invite link');
      navigate('/school-login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teachers/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to set password');
      toast.success('Password set! You can now log in.');
      setDone(true);
      setTimeout(() => navigate('/school-login'), 2000);
    } catch (err) {
      toast.error(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border p-8 text-center">
          <p className="text-green-600 font-medium">Password set successfully!</p>
          <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Set Your Password</h1>
        <p className="text-gray-600 text-sm mb-6">
          Create a password to access your teacher account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
                required
                minLength={6}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
                required
                minLength={6}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#9f3562] text-white rounded-xl font-medium hover:bg-[#b14270] disabled:opacity-70"
          >
            {loading ? 'Setting...' : 'Set Password'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          <a href="/school-login" className="text-[#9f3562] hover:underline">← Back to login</a>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default TeacherSetPassword;
