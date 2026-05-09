import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactions, getInvestments, formatDate, formatCurrency, hasFeature } from '@/lib/store';

export default function AuditView() {
  const { session } = useAuth();
  const userId = session?.userId || '';
  const pkg = session?.package || 'BASIC';
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'revenue'>('all');

  const allTx = getTransactions(userId);
  const investments = getInvestments(userId);

  const filtered = useMemo(() => {
    return allTx.filter(t => {
      const d = new Date(t.date);
      if (d.getFullYear() !== yearFilter) return false;
      if (monthFilter !== 'all' && d.getMonth() !== monthFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTx, yearFilter, monthFilter, typeFilter]);

  const totalIncome = filtered.filter(t => t.type !== 'expense').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Group by month
  const byMonth = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(t => {
      const key = t.date.slice(0, 7);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const exportPDF = () => {
    if (!hasFeature(pkg, 'export_csv')) return;
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (KSh)'];
    const rows = filtered.map(t => [t.date, t.type, t.category, t.description, t.amount]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-${yearFilter}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const txTypeStyle = (type: string) => {
    if (type === 'income') return { icon: 'fa-arrow-down-left', color: '#25D366', bg: 'rgba(37,211,102,0.12)' };
    if (type === 'revenue') return { icon: 'fa-briefcase', color: '#00d4aa', bg: 'rgba(0,212,170,0.12)' };
    return { icon: 'fa-arrow-up-right', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  };

  return (
    <div className="p-5 lg:p-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">Audit & Records</h1>
          <p className="text-white/40 text-sm mt-1">Complete financial history & compliance</p>
        </div>
        {hasFeature(pkg, 'export_csv') && (
          <button onClick={exportPDF} className="glass-btn-secondary px-5 py-2.5 text-sm font-semibold flex items-center gap-2">
            <i className="fa-solid fa-file-export text-green" />
            Export Audit CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={yearFilter} onChange={e => setYearFilter(+e.target.value)} className="glass-input px-3 py-2 text-sm appearance-none">
          {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
        </select>
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value === 'all' ? 'all' : +e.target.value)} className="glass-input px-3 py-2 text-sm appearance-none">
          <option value="all" className="bg-gray-900">All Months</option>
          {MONTHS.map((m, i) => <option key={i} value={i} className="bg-gray-900">{m}</option>)}
        </select>
        <div className="flex glass rounded-xl p-1 gap-1">
          {(['all', 'income', 'expense', 'revenue'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${typeFilter === f ? 'glass-btn-primary text-white' : 'text-white/40 hover:text-white/70'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4 stat-card-income">
          <div className="text-white/50 text-xs mb-1">Total In</div>
          <div className="text-green font-black text-lg tabular-nums">KSh {totalIncome.toLocaleString()}</div>
          <div className="text-white/30 text-xs">{filtered.filter(t => t.type !== 'expense').length} entries</div>
        </div>
        <div className="glass-card rounded-2xl p-4 stat-card-expense">
          <div className="text-white/50 text-xs mb-1">Total Out</div>
          <div className="text-red-400 font-black text-lg tabular-nums">KSh {totalExpense.toLocaleString()}</div>
          <div className="text-white/30 text-xs">{filtered.filter(t => t.type === 'expense').length} entries</div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="text-white/50 text-xs mb-1">Net</div>
          <div className={`font-black text-lg tabular-nums ${totalIncome - totalExpense >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            KSh {(totalIncome - totalExpense).toLocaleString()}
          </div>
          <div className="text-white/30 text-xs">{filtered.length} total records</div>
        </div>
      </div>

      {/* Grouped by Month */}
      {byMonth.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <i className="fa-solid fa-folder-open text-white/15 text-5xl mb-4" />
          <div className="text-white/30 text-base font-medium">No records found</div>
          <div className="text-white/20 text-sm mt-1">Try changing the filters above</div>
        </div>
      ) : (
        <div className="space-y-5">
          {byMonth.map(([month, txs]) => {
            const mIncome = txs.filter(t => t.type !== 'expense').reduce((s, t) => s + t.amount, 0);
            const mExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const monthLabel = new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
            return (
              <div key={month} className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-calendar text-white/30 text-sm" />
                    <span className="text-white font-bold text-sm">{monthLabel}</span>
                    <span className="text-white/30 text-xs">{txs.length} records</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green font-semibold">+KSh {mIncome.toLocaleString()}</span>
                    <span className="text-red-400 font-semibold">-KSh {mExpense.toLocaleString()}</span>
                    <span className={`font-bold ${mIncome - mExpense >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      Net: KSh {(mIncome - mExpense).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-white/4">
                  {txs.map((tx, i) => {
                    const { icon, color, bg } = txTypeStyle(tx.type);
                    return (
                      <div key={tx.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-all">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                          <i className={`fa-solid ${icon} text-xs`} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{tx.description}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-white/25 text-xs">{tx.category}</span>
                            <span className="text-white/15 text-xs">·</span>
                            <span className="text-white/25 text-xs">{formatDate(tx.date)}</span>
                            {tx.recurring && <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full"><i className="fa-solid fa-rotate text-xs mr-1" />{tx.recurring}</span>}
                          </div>
                        </div>
                        <div className={`text-sm font-bold tabular-nums flex-shrink-0 ${tx.type === 'expense' ? 'text-red-400' : 'text-green'}`}>
                          {tx.type === 'expense' ? '-' : '+'}KSh {tx.amount.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Investment Audit */}
      <div className="glass-card rounded-2xl p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <i className="fa-solid fa-chart-line text-yellow-400" />
          <h3 className="text-white font-bold text-base">Investment Audit Trail</h3>
        </div>
        {investments.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">No investments recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-2 text-white/40 text-xs font-medium">Investment</th>
                  <th className="text-left py-3 px-2 text-white/40 text-xs font-medium">Type</th>
                  <th className="text-right py-3 px-2 text-white/40 text-xs font-medium">Invested</th>
                  <th className="text-right py-3 px-2 text-white/40 text-xs font-medium">Current</th>
                  <th className="text-right py-3 px-2 text-white/40 text-xs font-medium">Gain/Loss</th>
                  <th className="text-right py-3 px-2 text-white/40 text-xs font-medium">ROI</th>
                  <th className="text-left py-3 px-2 text-white/40 text-xs font-medium">Since</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv, i) => {
                  const gain = inv.currentValue - inv.amount;
                  const roi = inv.amount > 0 ? ((gain / inv.amount) * 100) : 0;
                  return (
                    <tr key={inv.id} className={`border-b border-white/4 ${i % 2 === 0 ? 'bg-white/1' : ''}`}>
                      <td className="py-3 px-2 text-white text-sm font-medium">{inv.name}</td>
                      <td className="py-3 px-2 text-white/50 text-xs capitalize">{inv.type.replace('_', ' ')}</td>
                      <td className="py-3 px-2 text-right text-white text-sm tabular-nums">KSh {inv.amount.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-white text-sm tabular-nums">KSh {inv.currentValue.toLocaleString()}</td>
                      <td className={`py-3 px-2 text-right text-sm font-semibold tabular-nums ${gain >= 0 ? 'text-green' : 'text-red-400'}`}>
                        {gain >= 0 ? '+' : ''}KSh {gain.toLocaleString()}
                      </td>
                      <td className={`py-3 px-2 text-right text-sm font-bold tabular-nums ${roi >= 0 ? 'text-green' : 'text-red-400'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                      </td>
                      <td className="py-3 px-2 text-white/30 text-xs">{formatDate(inv.startDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
