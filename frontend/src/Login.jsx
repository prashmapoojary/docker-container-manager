import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Lock, User } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">🐳 Docker Manager</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
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
