import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById, CURRENCIES, updateUserPackage, PackageTier } from '@/lib/store';

export default function ProfileView() {
  const { session, setSession, logout } = useAuth();
  const user = getUserById(session?.userId || '');
  const [currency, setCurrency] = useState(session?.currency || 'KES');

  const handleCurrencyChange = (c: string) => {
    setCurrency(c);
    if (session) setSession({ ...session, currency: c });
  };

  return (
    <div className="p-5 lg:p-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black text-white">Profile</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
            {session?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-white font-black text-2xl">{session?.username}</h2>
            <p className="text-white/40 text-sm">{user?.email || 'guest@incometrack.app'}</p>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold badge-${session?.package?.toLowerCase()}`}>
              <i className="fa-solid fa-crown text-xs" />
              {session?.package} Plan
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-3">
            <div className="text-white/40 text-xs mb-1">Member Since</div>
            <div className="text-white text-sm font-semibold">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) : 'Today'}
            </div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-white/40 text-xs mb-1">Account Type</div>
            <div className="text-white text-sm font-semibold">{session?.userId === 'guest' ? 'Guest' : 'Registered'}</div>
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="glass-card rounded-2xl p-6 mb-5">
        <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
          <i className="fa-solid fa-coins text-yellow-400" />
          Currency Settings
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              className={`p-3 rounded-xl text-left transition-all ${currency === c.code ? 'ring-2 ring-green/50' : ''}`}
              style={currency === c.code ? { background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-white font-bold text-sm">{c.symbol} {c.code}</div>
              <div className="text-white/40 text-xs">{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="glass-card rounded-2xl p-6 mb-5">
        <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
          <i className="fa-solid fa-shield-halved text-blue-400" />
          Security
        </h3>
        <div className="space-y-3">
          {[
            { icon: 'fa-lock', label: 'Change Password', desc: 'Update your account password' },
            { icon: 'fa-bell', label: 'Notifications', desc: 'Manage budget alerts & reminders' },
            { icon: 'fa-trash', label: 'Delete Account', desc: 'Permanently delete your data', danger: true },
          ].map((item, i) => (
            <button key={i} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${item.danger ? 'hover:bg-red-500/10' : 'hover:bg-white/5'}`}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.danger ? 'bg-red-500/15' : 'bg-white/8'}`}>
                <i className={`fa-solid ${item.icon} text-sm ${item.danger ? 'text-red-400' : 'text-white/50'}`} />
              </div>
              <div className="text-left">
                <div className={`text-sm font-semibold ${item.danger ? 'text-red-400' : 'text-white'}`}>{item.label}</div>
                <div className="text-white/30 text-xs">{item.desc}</div>
              </div>
              <i className="fa-solid fa-chevron-right text-white/20 text-xs ml-auto" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button onClick={logout} className="w-full glass-card rounded-2xl p-4 flex items-center justify-center gap-3 text-red-400 hover:bg-red-500/10 transition-all font-semibold">
        <i className="fa-solid fa-right-from-bracket" />
        Sign Out
      </button>
    </div>
  );
}
