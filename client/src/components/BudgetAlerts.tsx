import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getBudgets, saveBudgets, getTransactions, hasFeature, EXPENSE_CATEGORIES, Budget } from '@/lib/store';
import { nanoid } from 'nanoid';

export default function BudgetAlerts() {
  const { session } = useAuth();
  const userId = session?.userId || '';
  const pkg = session?.package || 'BASIC';
  const locked = !hasFeature(pkg, 'budget_alerts');

  const [budgets, setBudgets] = useState<Budget[]>(() => getBudgets(userId));
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'Food & Groceries', limit: 0 });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const txs = getTransactions(userId);
  const monthTxs = txs.filter(t => t.date.startsWith(currentMonth) && t.type === 'expense');

  const save = (b: Budget[]) => { setBudgets(b); saveBudgets(userId, b); };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = budgets.find(b => b.category === form.category && b.month === currentMonth);
    if (existing) {
      save(budgets.map(b => b.id === existing.id ? { ...b, limit: form.limit } : b));
    } else {
      save([...budgets, { id: nanoid(), userId, category: form.category, limit: form.limit, month: currentMonth }]);
    }
    setShowAdd(false);
  };

  const monthBudgets = budgets.filter(b => b.month === currentMonth);

  if (locked) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <i className="fa-solid fa-bell text-white/30" />
          <h3 className="text-white/50 font-bold text-sm">Budget Alerts</h3>
          <span className="ml-auto text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">Premium+</span>
        </div>
        <div className="text-center py-6">
          <i className="fa-solid fa-lock text-white/15 text-2xl mb-2" />
          <div className="text-white/25 text-xs">Upgrade to Premium to set budget alerts</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-bell text-yellow-400" />
          <h3 className="text-white font-bold text-sm">Budget Alerts</h3>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="w-7 h-7 rounded-lg glass flex items-center justify-center text-white/40 hover:text-green transition-colors">
          <i className="fa-solid fa-plus text-xs" />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="glass rounded-xl p-3 mb-4 space-y-3 animate-scale-in">
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="glass-input w-full px-3 py-2 text-xs appearance-none">
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="number" min="0" value={form.limit || ''} onChange={e => setForm(f => ({ ...f, limit: +e.target.value }))}
              placeholder="Budget limit (KSh)" className="glass-input flex-1 px-3 py-2 text-xs" required />
            <button type="submit" className="glass-btn-primary px-3 py-2 text-xs font-semibold text-white">Set</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {monthBudgets.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-white/25 text-xs">No budgets set for this month</div>
          </div>
        ) : (
          monthBudgets.map(budget => {
            const spent = monthTxs.filter(t => t.category === budget.category).reduce((s, t) => s + t.amount, 0);
            const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
            const isOver = pct >= 100;
            const isWarning = pct >= 80 && !isOver;
            return (
              <div key={budget.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white/60 text-xs">{budget.category}</span>
                  <div className="flex items-center gap-2">
                    {isOver && <i className="fa-solid fa-triangle-exclamation text-red-400 text-xs" />}
                    {isWarning && <i className="fa-solid fa-circle-exclamation text-yellow-400 text-xs" />}
                    <span className={`text-xs font-semibold tabular-nums ${isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white/50'}`}>
                      KSh {spent.toLocaleString()} / {budget.limit.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min(100, pct)}%`,
                    background: isOver ? 'linear-gradient(90deg, #ef4444, #dc2626)' : isWarning ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : undefined
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
