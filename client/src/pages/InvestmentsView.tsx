import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInvestments, saveInvestments, Investment, hasFeature, calcInvestmentROI, formatDate } from '@/lib/store';
import { nanoid } from 'nanoid';

const INV_TYPES = ['stocks', 'bonds', 'real_estate', 'crypto', 'mutual_funds', 'savings', 'other'] as const;
const INV_ICONS: Record<string, string> = {
  stocks: 'fa-chart-line', bonds: 'fa-file-contract', real_estate: 'fa-building',
  crypto: 'fa-bitcoin-sign', mutual_funds: 'fa-layer-group', savings: 'fa-piggy-bank', other: 'fa-briefcase',
};
const INV_COLORS: Record<string, string> = {
  stocks: '#25D366', bonds: '#63b3ed', real_estate: '#fbbf24',
  crypto: '#f97316', mutual_funds: '#a78bfa', savings: '#34d399', other: '#9ca3af',
};

const EMPTY: Omit<Investment, 'id' | 'userId'> = {
  name: '', type: 'stocks', amount: 0, currentValue: 0, expectedReturn: 10, startDate: new Date().toISOString().split('T')[0], notes: '',
};

export default function InvestmentsView() {
  const { session } = useAuth();
  const userId = session?.userId || '';
  const pkg = session?.package || 'BASIC';

  const [invs, setInvs] = useState<Investment[]>(() => getInvestments(userId));
  const [showModal, setShowModal] = useState(false);
  const [editInv, setEditInv] = useState<Investment | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const locked = !hasFeature(pkg, 'investments');

  const save = (updated: Investment[]) => { setInvs(updated); saveInvestments(userId, updated); };

  const openAdd = () => { setEditInv(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (inv: Investment) => {
    setEditInv(inv);
    setForm({ name: inv.name, type: inv.type, amount: inv.amount, currentValue: inv.currentValue, expectedReturn: inv.expectedReturn, startDate: inv.startDate, notes: inv.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editInv) save(invs.map(i => i.id === editInv.id ? { ...i, ...form } : i));
    else save([{ id: nanoid(), userId, ...form }, ...invs]);
    setShowModal(false);
  };

  const totalInvested = invs.reduce((s, i) => s + i.amount, 0);
  const totalCurrent = invs.reduce((s, i) => s + i.currentValue, 0);
  const totalGain = totalCurrent - totalInvested;
  const roi = calcInvestmentROI(invs);

  if (locked) {
    return (
      <div className="p-5 lg:p-8 relative z-10 flex items-center justify-center min-h-screen">
        <div className="glass-card rounded-3xl p-12 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(99,179,237,0.15)', border: '1px solid rgba(99,179,237,0.3)' }}>
            <i className="fa-solid fa-gem text-blue-400 text-3xl" />
          </div>
          <h2 className="text-white font-black text-2xl mb-3">Investments Locked</h2>
          <p className="text-white/50 text-sm mb-6">Upgrade to Diamond or higher to track your investment portfolio.</p>
          <div className="glass-btn-primary px-8 py-3 text-sm font-bold text-white inline-flex items-center gap-2">
            <i className="fa-solid fa-lock-open" />Upgrade to Diamond
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">Investments</h1>
          <p className="text-white/40 text-sm mt-1">Portfolio overview & ROI tracking</p>
        </div>
        <button onClick={openAdd} className="glass-btn-primary px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-plus" />Add Investment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5 stat-card-investment">
          <div className="text-white/50 text-xs mb-1">Total Invested</div>
          <div className="text-yellow-400 font-black text-xl tabular-nums">KSh {totalInvested.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-white/50 text-xs mb-1">Current Value</div>
          <div className="text-white font-black text-xl tabular-nums">KSh {totalCurrent.toLocaleString()}</div>
        </div>
        <div className={`glass-card rounded-2xl p-5 ${totalGain >= 0 ? 'stat-card-income' : 'stat-card-expense'}`}>
          <div className="text-white/50 text-xs mb-1">Total Gain/Loss</div>
          <div className={`font-black text-xl tabular-nums ${totalGain >= 0 ? 'text-green' : 'text-red-400'}`}>
            {totalGain >= 0 ? '+' : ''}KSh {totalGain.toLocaleString()}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-white/50 text-xs mb-1">Portfolio ROI</div>
          <div className={`font-black text-xl tabular-nums ${roi >= 0 ? 'text-green' : 'text-red-400'}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Investment Cards */}
      {invs.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <i className="fa-solid fa-chart-line text-white/15 text-5xl mb-4" />
          <div className="text-white/30 text-base font-medium mb-2">No investments yet</div>
          <button onClick={openAdd} className="glass-btn-primary px-6 py-2.5 text-sm font-bold text-white mt-2">
            <i className="fa-solid fa-plus mr-2" />Add First Investment
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {invs.map((inv, i) => {
            const gain = inv.currentValue - inv.amount;
            const gainPct = inv.amount > 0 ? ((gain / inv.amount) * 100) : 0;
            const color = INV_COLORS[inv.type] || '#9ca3af';
            const icon = INV_ICONS[inv.type] || 'fa-briefcase';
            return (
              <div key={inv.id} className={`glass-card rounded-2xl p-5 animate-fade-in-up`} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                      <i className={`fa-solid ${icon} text-base`} style={{ color }} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{inv.name}</div>
                      <div className="text-white/40 text-xs capitalize">{inv.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(inv)} className="w-7 h-7 rounded-lg glass flex items-center justify-center text-white/30 hover:text-white transition-colors">
                      <i className="fa-solid fa-pen text-xs" />
                    </button>
                    <button onClick={() => setDeleteConfirm(inv.id)} className="w-7 h-7 rounded-lg glass flex items-center justify-center text-white/30 hover:text-red-400 transition-colors">
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">Invested</span>
                    <span className="text-white text-sm font-semibold tabular-nums">KSh {inv.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">Current Value</span>
                    <span className="text-white text-sm font-semibold tabular-nums">KSh {inv.currentValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">Gain/Loss</span>
                    <span className={`text-sm font-bold tabular-nums ${gain >= 0 ? 'text-green' : 'text-red-400'}`}>
                      {gain >= 0 ? '+' : ''}KSh {gain.toLocaleString()} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">Expected Return</span>
                    <span className="text-yellow-400 text-sm font-semibold">{inv.expectedReturn}% p.a.</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, (inv.currentValue / (inv.amount * 1.5)) * 100))}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                  </div>
                  <div className="flex justify-between text-xs text-white/25">
                    <span>Since {formatDate(inv.startDate)}</span>
                    {inv.notes && <span className="truncate max-w-32">{inv.notes}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="glass-modal w-full max-w-lg p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-black text-xl">{editInv ? 'Edit Investment' : 'Add Investment'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/40 hover:text-white">
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Investment Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="glass-input w-full px-3 py-2.5 text-sm" placeholder="e.g. Safaricom PLC" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                    className="glass-input w-full px-3 py-2.5 text-sm appearance-none">
                    {INV_TYPES.map(t => <option key={t} value={t} className="bg-gray-900 capitalize">{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Expected Return (%)</label>
                  <input type="number" step="0.1" value={form.expectedReturn} onChange={e => setForm(f => ({ ...f, expectedReturn: +e.target.value }))}
                    className="glass-input w-full px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Amount Invested (KSh)</label>
                  <input type="number" min="0" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} required
                    className="glass-input w-full px-3 py-2.5 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Current Value (KSh)</label>
                  <input type="number" min="0" value={form.currentValue || ''} onChange={e => setForm(f => ({ ...f, currentValue: +e.target.value }))} required
                    className="glass-input w-full px-3 py-2.5 text-sm" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="glass-input w-full px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Notes (optional)</label>
                  <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="glass-input w-full px-3 py-2.5 text-sm" placeholder="Brief note" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 glass-btn-secondary py-3 text-sm font-semibold">Cancel</button>
                <button type="submit" className="flex-1 glass-btn-primary py-3 text-sm font-bold text-white">
                  {editInv ? 'Save Changes' : 'Add Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="glass-modal w-full max-w-sm p-6 text-center animate-scale-in">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-trash text-red-400 text-xl" />
            </div>
            <h3 className="text-white font-black text-lg mb-2">Remove Investment?</h3>
            <p className="text-white/40 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 glass-btn-secondary py-3 text-sm font-semibold">Cancel</button>
              <button onClick={() => { save(invs.filter(i => i.id !== deleteConfirm)); setDeleteConfirm(null); }}
                className="flex-1 py-3 text-sm font-bold text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
