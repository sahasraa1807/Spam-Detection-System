import { useState } from 'react';
import api from '../utils/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import '../App.css';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { activeTheme, isDark } = useTheme();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`${import.meta.env.VITE_API_URI}/api/auth/register`, form);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-all duration-500 ${
      isDark ? activeTheme.dark : activeTheme.light
    }`}>
      <div className={`w-full max-w-md backdrop-blur-xl border rounded-3xl shadow-2xl p-8 sm:p-10 transition-all duration-500 ${
        isDark ? activeTheme.cardDark : activeTheme.card
      }`}>
        <h2 className="text-3xl font-extrabold text-center mb-2">📩 Spam Detector</h2>
        <p className="text-center opacity-70 mb-8 text-sm font-semibold">Create your account</p>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/15 border border-green-500/30 text-green-500 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 opacity-80">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="johndoe"
              className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all ${
                isDark ? activeTheme.inputDark : activeTheme.input
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 opacity-80">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all ${
                isDark ? activeTheme.inputDark : activeTheme.input
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 opacity-80">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all ${
                isDark ? activeTheme.inputDark : activeTheme.input
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold transition-all active:scale-95 shadow-md ${
              activeTheme.accent
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm opacity-70 font-medium">
          Already have an account?{' '}
          <Link to="/" className="text-blue-600 dark:text-blue-450 hover:underline font-semibold ml-1">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
