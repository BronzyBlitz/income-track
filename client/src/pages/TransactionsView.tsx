import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getTransactions, saveTransactions, Transaction, PACKAGE_LIMITS,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatDate, formatCurrency, hasFeature
} from '@/lib/store';
import { nanoid } from 'nanoid';

type TxType = 'all' | 'income' | 'expense' | 'revenue';

const EMPTY_FORM: Omit<Transaction, 'id' | 'userId'> = {
  type: 'income', category: 'Salary', amount: 0, description: '', date: new Date().toISOString().split('T')[0], recurring: null,
};

export default function TransactionsView() {
  const { session } = useAuth();
  const userId = session?.userId || '';
  const pkg = session?.package || 'BASIC';
  const currency = session?.currency || 'KES';
  const limit = PACKAGE_LIMITS[pkg].transactionLimit;

  const [txs, setTxs] = useState<Transaction[]>(() => getTransactions(userId));
  const [filter, setFilter] = useState<TxType>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const save = (updated: Transaction[]) => {
    setTxs(updated);
    saveTransactions(userId, updated);
  };

  const openAdd = () => {
    setEditTx(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setForm({ type: tx.type, category: tx.category, amount: tx.amount, description: tx.description, date: tx.date, recurring: tx.recurring || null });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTx) {
      const updated = txs.map(t => t.id === editTx.id ? { ...t, ...form } : t);
      save(updated);
    } else {
      if (txs.length >= limit) return;
      const newTx: Transaction = { id: nanoid(), userId, ...form };
      save([newTx, ...txs]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    save(txs.filter(t => t.id !== id));
    setDeleteConfirm(null);
  };

  const filtered = useMemo(() => {
    return txs
      .filter(t => filter === 'all' || t.type === filter)
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [txs, filter, search]);

  const totalIncome = txs.filter(t => t.type === 'income' || t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const categories = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const exportCSV = () => {
    if (!hasFeature(pkg, 'export_csv')) return;
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = txs.map(t => [t.date, t.type, t.category, t.description, t.amount]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const txIcon = (type: string) => {
    if (type === 'income') return { icon: 'fa-arrow-down-left', color: '#25D366', bg: 'rgba(37,211,102,0.12)' };
    if (type === 'revenue') return { icon: 'fa-briefcase', color: '#00d4aa', bg: 'rgba(0,212,170,0.12)' };
    return { icon: 'fa-arrow-up-right', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  };

  return (
    <div className="p-5 lg:p-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">Transactions</h1>
          <p className="text-white/40 text-sm mt-1">{txs.length}/{limit === Infinity ? '∞' : limit} entries used</p>
        </div>
        <div className="flex items-center gap-3">
          {hasFeature(pkg, 'export_csv') && (
            <button onClick={exportCSV} className="glass-btn-secondary px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
              <i className="fa-solid fa-file-export text-green" />
              Export CSV
            </button>
          )}
          <button
            onClick={openAdd}
            disabled={txs.length >= limit}
            className="glass-btn-primary px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2"
          >
            <i className="fa-solid fa-plus" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4 stat-card-income">
          <div className="text-white/50 text-xs mb-1">Total Income</div>
          <div className="text-green font-black text-xl tabular-nums">KSh {totalIncome.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-4 stat-card-expense">
          <div className="text-white/50 text-xs mb-1">Total Expenses</div>
          <div className="text-red-400 font-black text-xl tabular-nums">KSh {totalExpense.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-4 stat-card-savings">
          <div className="text-white/50 text-xs mb-1">Net Balance</div>
          <div className={`font-black text-xl tabular-nums ${totalIncome - totalExpense >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            KSh {(totalIncome - totalExpense).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex glass rounded-xl p-1 gap-1">
          {(['all', 'income', 'expense', 'revenue'] as TxType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${filter === f ? 'glass-btn-primary text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <i className="fa-solid fa-receipt text-white/15 text-4xl mb-3" />
            <div className="text-white/30 text-sm font-medium">No transactions found</div>
            <button onClick={openAdd} className="mt-4 glass-btn-primary px-5 py-2 text-sm font-semibold text-white">
              <i className="fa-solid fa-plus mr-2" />Add First Transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((tx, i) => {
              const { icon, color, bg } = txIcon(tx.type);
              return (
                <div key={tx.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-all group animate-fade-in-up`} style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <i className={`fa-solid ${icon} text-sm`} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold truncate">{tx.description}</span>
                      {tx.recurring && (
                        <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full flex-shrink-0">
                          <i className="fa-solid fa-rotate mr-1 text-xs" />{tx.recurring}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{tx.category}</span>
                      <span className="text-white/25 text-xs">{formatDate(tx.date)}</span>
                    </div>
                  </div>
                  <div className={`text-sm font-bold tabular-nums flex-shrink-0 ${tx.type === 'expense' ? 'text-red-400' : 'text-green'}`}>
                    {tx.type === 'expense' ? '-' : '+'}KSh {tx.amount.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(tx)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
                      <i className="fa-solid fa-pen text-xs" />
                    </button>
                    <button onClick={() => setDeleteConfirm(tx.id)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/40 hover:text-red-400 transition-colors">
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== ADD/EDIT MODAL ====== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="glass-modal w-full max-w-lg p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-black text-xl">{editTx ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/40 hover:text-white">
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div className="flex glass rounded-xl p-1 gap-1">
                {(['income', 'expense', 'revenue'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t, category: t === 'expense' ? 'Food & Groceries' : 'Salary' }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${form.type === t ? 'glass-btn-primary text-white' : 'text-white/40 hover:text-white/70'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="glass-input w-full px-3 py-2.5 text-sm appearance-none">
                    {categories.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Amount (KSh)</label>
                  <input type="number" min="0" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))}
                    required className="glass-input w-full px-3 py-2.5 text-sm" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required className="glass-input w-full px-3 py-2.5 text-sm" placeholder="e.g. Monthly salary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required className="glass-input w-full px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">
                    Recurring {!hasFeature(pkg, 'recurring') && <span className="text-yellow-400 text-xs">(Gold+)</span>}
                  </label>
                  <select value={form.recurring || ''} onChange={e => setForm(f => ({ ...f, recurring: (e.target.value as any) || null }))}
                    disabled={!hasFeature(pkg, 'recurring')}
                    className="glass-input w-full px-3 py-2.5 text-sm appearance-none disabled:opacity-40">
                    <option value="" className="bg-gray-900">None</option>
                    <option value="daily" className="bg-gray-900">Daily</option>
                    <option value="weekly" className="bg-gray-900">Weekly</option>
                    <option value="monthly" className="bg-gray-900">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 glass-btn-secondary py-3 text-sm font-semibold">Cancel</button>
                <button type="submit" className="flex-1 glass-btn-primary py-3 text-sm font-bold text-white">
                  {editTx ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="glass-modal w-full max-w-sm p-6 text-center animate-scale-in">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-trash text-red-400 text-xl" />
            </div>
            <h3 className="text-white font-black text-lg mb-2">Delete Transaction?</h3>
            <p className="text-white/40 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 glass-btn-secondary py-3 text-sm font-semibold">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 text-sm font-bold text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
