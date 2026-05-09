import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSavingsGoals, saveSavingsGoals, SavingsGoal, formatDate } from '@/lib/store';
import { nanoid } from 'nanoid';

const GOAL_ICONS = ['fa-house', 'fa-car', 'fa-plane', 'fa-graduation-cap', 'fa-ring', 'fa-baby', 'fa-laptop', 'fa-heart', 'fa-star', 'fa-trophy'];
const GOAL_COLORS = ['#25D366', '#63b3ed', '#fbbf24', '#a78bfa', '#f87171', '#34d399', '#fb923c', '#e879f9', '#22d3ee', '#f59e0b'];

const EMPTY: Omit<SavingsGoal, 'id' | 'userId'> = {
  name: '', targetAmount: 0, currentAmount: 0, deadline: '', icon: 'fa-star', color: '#25D366', notes: '',
};

export default function SavingsView() {
  const { session } = useAuth();
  const userId = session?.userId || '';
  const [goals, setGoals] = useState<SavingsGoal[]>(() => getSavingsGoals(userId));
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [depositModal, setDepositModal] = useState<{ goal: SavingsGoal; amount: string } | null>(null);

  const save = (g: SavingsGoal[]) => { setGoals(g); saveSavingsGoals(userId, g); };

  const openAdd = () => { setEditGoal(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (g: SavingsGoal) => {
    setEditGoal(g);
    setForm({ name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: g.deadline || '', icon: g.icon, color: g.color, notes: g.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editGoal) save(goals.map(g => g.id === editGoal.id ? { ...g, ...form } : g));
    else save([{ id: nanoid(), userId, ...form }, ...goals]);
    setShowModal(false);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModal) return;
    const amount = +depositModal.amount;
    if (amount <= 0) return;
    save(goals.map(g => g.id === depositModal.goal.id ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g));
    setDepositModal(null);
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completed = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  return (
    <div className="p-5 lg:p-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">Savings Goals</h1>
          <p className="text-white/40 text-sm mt-1">Track your financial milestones</p>
        </div>
        <button onClick={openAdd} className="glass-btn-primary px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-plus" />New Goal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5 stat-card-savings">
          <div className="text-white/50 text-xs mb-1">Total Saved</div>
          <div className="text-blue-400 font-black text-xl tabular-nums">KSh {totalSaved.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-white/50 text-xs mb-1">Total Target</div>
          <div className="text-white font-black text-xl tabular-nums">KSh {totalTarget.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-5 stat-card-income">
          <div className="text-white/50 text-xs mb-1">Goals Completed</div>
          <div className="text-green font-black text-xl tabular-nums">{completed}/{goals.length}</div>
        </div>
      </div>

      {/* Overall Progress */}
      {totalTarget > 0 && (
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-white font-semibold text-sm">Overall Progress</span>
            <span className="text-green font-bold text-sm">{((totalSaved / totalTarget) * 100).toFixed(1)}%</span>
          </div>
          <div className="progress-bar h-3">
            <div className="progress-fill h-3" style={{ width: `${Math.min(100, (totalSaved / totalTarget) * 100)}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-white/30 text-xs">
            <span>KSh {totalSaved.toLocaleString()} saved</span>
            <span>KSh {(totalTarget - totalSaved).toLocaleString()} remaining</span>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <i className="fa-solid fa-piggy-bank text-white/15 text-5xl mb-4" />
          <div className="text-white/30 text-base font-medium mb-2">No savings goals yet</div>
          <button onClick={openAdd} className="glass-btn-primary px-6 py-2.5 text-sm font-bold text-white mt-2">
            <i className="fa-solid fa-plus mr-2" />Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal, i) => {
            const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const isDone = pct >= 100;
            const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;
            return (
              <div key={goal.id} className={`glass-card rounded-2xl p-5 animate-fade-in-up ${isDone ? 'ring-2 ring-green/30' : ''}`} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${goal.color}20`, border: `1px solid ${goal.color}30` }}>
                      <i className={`fa-solid ${goal.icon} text-lg`} style={{ color: goal.color }} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{goal.name}</div>
                      {isDone && <div className="text-green text-xs font-semibold flex items-center gap-1"><i className="fa-solid fa-check text-xs" />Completed!</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(goal)} className="w-7 h-7 rounded-lg glass flex items-center justify-center text-white/30 hover:text-white transition-colors">
                      <i className="fa-solid fa-pen text-xs" />
                    </button>
                    <button onClick={() => save(goals.filter(g => g.id !== goal.id))} className="w-7 h-7 rounded-lg glass flex items-center justify-center text-white/30 hover:text-red-400 transition-colors">
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-white/50 text-xs">Progress</span>
                    <span className="font-bold text-xs" style={{ color: goal.color }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar h-2.5">
                    <div className="progress-fill h-2.5" style={{ width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg, ${goal.color}, ${goal.color}88)` }} />
                  </div>
                </div>

                <div className="flex justify-between text-sm mb-3">
                  <div>
                    <div className="text-white/30 text-xs">Saved</div>
                    <div className="text-white font-bold tabular-nums">KSh {goal.currentAmount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/30 text-xs">Target</div>
                    <div className="text-white font-bold tabular-nums">KSh {goal.targetAmount.toLocaleString()}</div>
                  </div>
                </div>

                {goal.deadline && (
                  <div className={`flex items-center gap-1.5 text-xs mb-3 ${daysLeft !== null && daysLeft < 30 ? 'text-yellow-400' : 'text-white/30'}`}>
                    <i className="fa-solid fa-calendar text-xs" />
                    {daysLeft !== null && daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today!' : 'Overdue'} · {formatDate(goal.deadline)}
                  </div>
                )}

                {!isDone && (
                  <button onClick={() => setDepositModal({ goal, amount: '' })} className="w-full py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90" style={{ background: `${goal.color}25`, border: `1px solid ${goal.color}35`, color: goal.color }}>
                    <i className="fa-solid fa-plus mr-1.5" />Add Deposit
                  </button>
                )}
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
              <h2 className="text-white font-black text-xl">{editGoal ? 'Edit Goal' : 'New Savings Goal'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/40 hover:text-white">
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Goal Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="glass-input w-full px-3 py-2.5 text-sm" placeholder="e.g. New Car Fund" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Target Amount (KSh)</label>
                  <input type="number" min="0" value={form.targetAmount || ''} onChange={e => setForm(f => ({ ...f, targetAmount: +e.target.value }))} required
                    className="glass-input w-full px-3 py-2.5 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Current Saved (KSh)</label>
                  <input type="number" min="0" value={form.currentAmount || ''} onChange={e => setForm(f => ({ ...f, currentAmount: +e.target.value }))}
                    className="glass-input w-full px-3 py-2.5 text-sm" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Deadline (optional)</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="glass-input w-full px-3 py-2.5 text-sm" />
              </div>
              {/* Icon Picker */}
              <div>
                <label className="text-white/50 text-xs mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${form.icon === icon ? 'ring-2 ring-green/50' : ''}`}
                      style={{ background: form.icon === icon ? 'rgba(37,211,102,0.15)' : 'rgba(255,255,255,0.05)' }}>
                      <i className={`fa-solid ${icon} text-sm ${form.icon === icon ? 'text-green' : 'text-white/40'}`} />
                    </button>
                  ))}
                </div>
              </div>
              {/* Color Picker */}
              <div>
                <label className="text-white/50 text-xs mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm(f => ({ ...f, color }))}
                      className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-white/50 scale-110' : ''}`}
                      style={{ background: color }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 glass-btn-secondary py-3 text-sm font-semibold">Cancel</button>
                <button type="submit" className="flex-1 glass-btn-primary py-3 text-sm font-bold text-white">
                  {editGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="glass-modal w-full max-w-sm p-6 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: `${depositModal.goal.color}20`, border: `1px solid ${depositModal.goal.color}30` }}>
                <i className={`fa-solid ${depositModal.goal.icon} text-xl`} style={{ color: depositModal.goal.color }} />
              </div>
              <h3 className="text-white font-black text-lg">{depositModal.goal.name}</h3>
              <p className="text-white/40 text-sm">Add deposit to this goal</p>
            </div>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Deposit Amount (KSh)</label>
                <input type="number" min="1" value={depositModal.amount} onChange={e => setDepositModal(d => d ? { ...d, amount: e.target.value } : null)}
                  required className="glass-input w-full px-3 py-3 text-base text-center font-bold" placeholder="0" autoFocus />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDepositModal(null)} className="flex-1 glass-btn-secondary py-3 text-sm font-semibold">Cancel</button>
                <button type="submit" className="flex-1 glass-btn-primary py-3 text-sm font-bold text-white">Add Deposit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
