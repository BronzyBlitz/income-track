import { useState } from 'react';
import { login, signUp, loginAsGuest, seedDemoData, AppSession } from '@/lib/store';

interface AuthModalProps {
  onSuccess: (session: AppSession) => void;
  onClose: () => void;
}

export default function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    const result = login(form.email, form.password);
    setLoading(false);
    if (!result.success) { setError(result.error || 'Login failed'); return; }
    const user = result.user!;
    onSuccess({ userId: user.id, username: user.username, package: user.package, currency: user.currency, loginTime: new Date().toISOString() });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1000));
    const result = signUp(form.username, form.email, form.password);
    setLoading(false);
    if (!result.success) { setError(result.error || 'Signup failed'); return; }
    const user = result.user!;
    seedDemoData(user.id);
    onSuccess({ userId: user.id, username: user.username, package: user.package, currency: user.currency, loginTime: new Date().toISOString() });
  };

  const handleGuest = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const session = loginAsGuest();
    setLoading(false);
    onSuccess(session);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      {/* Auth BG */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663642672073/RFHkd6Q6m9EgnCT5yZrWvB/auth-bg-7wKQKmhKgHsXQMk97MGmUt.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }}
      />

      <div className="glass-modal w-full max-w-md p-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                <i className="fa-solid fa-chart-line text-white text-xs" />
              </div>
              <span className="text-white font-black text-lg">Income<span className="text-green">Track</span></span>
            </div>
            <p className="text-white/40 text-sm">{mode === 'login' ? 'Welcome back!' : 'Create your account'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Tab Switch */}
        <div className="flex glass rounded-xl p-1 mb-6">
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === m ? 'glass-btn-primary text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 animate-scale-in">
            <i className="fa-solid fa-triangle-exclamation text-red-400 text-sm" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-white/50 text-xs font-medium mb-1.5 block">Username</label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
                <input
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="glass-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className="glass-input w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="glass-input w-full pl-10 pr-10 py-3 text-sm"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
              </button>
            </div>
          </div>
          {mode === 'signup' && (
            <div>
              <label className="text-white/50 text-xs font-medium mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <i className="fa-solid fa-shield-halved absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
                <input
                  name="confirm"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  className="glass-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="glass-btn-primary w-full py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 mt-2">
            {loading ? (
              <><div className="spinner-sm" /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
            ) : (
              <><i className={`fa-solid ${mode === 'login' ? 'fa-arrow-right-to-bracket' : 'fa-user-plus'}`} /> {mode === 'login' ? 'Sign In' : 'Create Account'}</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Guest Mode */}
        <button onClick={handleGuest} disabled={loading} className="glass-btn-secondary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
          {loading ? <div className="spinner-sm" /> : <><i className="fa-solid fa-user-secret text-green" /> Try as Guest (Demo Data)</>}
        </button>

        <p className="text-white/25 text-xs text-center mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
