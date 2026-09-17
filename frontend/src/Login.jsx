import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Lock, User } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE !== undefined
  ? import.meta.env.VITE_API_BASE
  : (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port !== '' && window.location.port !== '80'
      ? 'http://localhost:5000'
      : '/api');

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      toast.success('Login successful');
      onLogin();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">🐳 Docker Manager</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage containers</p>
        </div>

        {/* Portfolio Demo Credentials Quick Access */}
        <div className="mb-6 bg-primary/10 border border-primary/20 rounded-2xl p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <span>✨</span> Demo Access
            </span>
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('admin123');
              }}
              className="text-primary font-bold hover:underline cursor-pointer bg-primary/15 hover:bg-primary/25 px-2.5 py-1 rounded-lg transition"
            >
              Click to Auto-fill
            </button>
          </div>
          <p className="mt-2 text-muted-foreground flex flex-wrap items-center gap-2">
            <span>User: <code className="bg-background/80 px-1.5 py-0.5 rounded text-foreground font-mono">admin</code></span>
            <span>•</span>
            <span>Pass: <code className="bg-background/80 px-1.5 py-0.5 rounded text-foreground font-mono">admin123</code></span>
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-border pl-12 py-3 rounded-xl focus:outline-none focus:border-primary text-foreground"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border pl-12 py-3 rounded-xl focus:outline-none focus:border-primary text-foreground"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground py-3 rounded-xl transition font-medium disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
