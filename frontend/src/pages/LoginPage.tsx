import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      toast.success('Login successful');
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #00ff41 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full opacity-[0.03]"
        style={{ background: 'radial-gradient(circle, #00aaff 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center animate-glow"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,65,0.12), rgba(0,255,65,0.04))', border: '1px solid rgba(0,255,65,0.2)' }}>
            <Shield className="w-8 h-8 text-cyber-green" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[0.3em] mb-2"
            style={{ background: 'linear-gradient(135deg, #00ff41, #00cc33)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            IDS
          </h1>
          <p className="text-xs text-gray-500 tracking-[0.25em] uppercase">Intrusion Detection System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}
          className="glass-card p-8 space-y-6 animate-fade-up delay-1">

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,0,64,0.06)', border: '1px solid rgba(255,0,64,0.15)' }}>
              <AlertCircle className="w-4 h-4 text-cyber-red flex-shrink-0" />
              <span className="text-xs text-cyber-red">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] text-gray-400 tracking-wider uppercase font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="cyber-input pl-11" placeholder="analyst@ids.local" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-gray-400 tracking-wider uppercase font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="cyber-input pl-11" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="glow-btn w-full flex items-center justify-center gap-2 py-3.5">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-cyber-green/30 border-t-cyber-green rounded-full animate-spin" />
            ) : (
              <><span>Login</span><ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-center text-xs text-gray-500">
            No account?{' '}
            <Link to="/register" className="text-cyber-blue hover:text-cyber-blue/80 transition">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
