import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactions, calcTax, hasFeature, formatCurrency } from '@/lib/store';

export default function TaxView() {
  const { session } = useAuth();
  const userId = session?.userId || '';
  const pkg = session?.package || 'BASIC';
  const locked = !hasFeature(pkg, 'tax_calculator');

  const [taxRate, setTaxRate] = useState(15);
  const [year, setYear] = useState(new Date().getFullYear());

  const allTx = getTransactions(userId);
  const yearTx = allTx.filter(t => new Date(t.date).getFullYear() === year);
  const income = yearTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const revenue = yearTx.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
  const expenses = yearTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = income + revenue;
  const taxableIncome = Math.max(0, totalIncome - expenses * 0.3); // 30% deductible
  const estimatedTax = calcTax(taxableIncome, taxRate);
  const netAfterTax = totalIncome - expenses - estimatedTax;

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthTx = yearTx.filter(t => new Date(t.date).getMonth() === i);
      const inc = monthTx.filter(t => t.type !== 'expense').reduce((s, t) => s + t.amount, 0);
      const exp = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const tax = calcTax(Math.max(0, inc - exp * 0.3), taxRate);
      return { month: new Date(year, i).toLocaleString('default', { month: 'short' }), income: inc, expenses: exp, tax };
    });
    return months;
  }, [yearTx, taxRate, year]);

  if (locked) {
    return (
      <div className="p-5 lg:p-8 relative z-10 flex items-center justify-center min-h-screen">
        <div className="glass-card rounded-3xl p-12 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(99,179,237,0.15)', border: '1px solid rgba(99,179,237,0.3)' }}>
            <i className="fa-solid fa-file-invoice-dollar text-blue-400 text-3xl" />
          </div>
          <h2 className="text-white font-black text-2xl mb-3">Tax Calculator Locked</h2>
          <p className="text-white/50 text-sm mb-6">Upgrade to Diamond or higher to access the tax calculator and manage your tax liability.</p>
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
          <h1 className="text-2xl lg:text-3xl font-black text-white">Tax Management</h1>
          <p className="text-white/40 text-sm mt-1">Estimated tax liability & planning</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={year} onChange={e => setYear(+e.target.value)} className="glass-input px-3 py-2 text-sm appearance-none">
            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tax Rate Control */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-base">Tax Rate Configuration</h3>
            <p className="text-white/40 text-xs mt-1">Adjust your effective tax rate</p>
          </div>
          <div className="text-green font-black text-3xl tabular-nums">{taxRate}%</div>
        </div>
        <input
          type="range" min="5" max="45" step="0.5"
          value={taxRate} onChange={e => setTaxRate(+e.target.value)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(90deg, #25D366 ${((taxRate - 5) / 40) * 100}%, rgba(255,255,255,0.1) ${((taxRate - 5) / 40) * 100}%)` }}
        />
        <div className="flex justify-between text-white/25 text-xs mt-2">
          <span>5% (Min)</span>
          <span>15% (Default)</span>
          <span>30% (Corp)</span>
          <span>45% (Max)</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5 stat-card-income">
          <div className="text-white/50 text-xs mb-1">Gross Income</div>
          <div className="text-green font-black text-xl tabular-nums">KSh {totalIncome.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-5 stat-card-expense">
          <div className="text-white/50 text-xs mb-1">Deductible Expenses</div>
          <div className="text-red-400 font-black text-xl tabular-nums">KSh {Math.round(expenses * 0.3).toLocaleString()}</div>
          <div className="text-white/30 text-xs mt-1">30% of KSh {expenses.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="text-white/50 text-xs mb-1">Taxable Income</div>
          <div className="text-yellow-400 font-black text-xl tabular-nums">KSh {taxableIncome.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.08))', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="text-white/50 text-xs mb-1">Estimated Tax</div>
          <div className="text-red-400 font-black text-xl tabular-nums">KSh {estimatedTax.toLocaleString()}</div>
          <div className="text-white/30 text-xs mt-1">@ {taxRate}% rate</div>
        </div>
      </div>

      {/* Net After Tax */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ background: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(0,212,170,0.04))', border: '1px solid rgba(37,211,102,0.15)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/50 text-sm mb-1">Net Income After Tax & Expenses</div>
            <div className="text-green font-black text-4xl tabular-nums">KSh {netAfterTax.toLocaleString()}</div>
          </div>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
            <i className="fa-solid fa-check-circle text-green text-2xl" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">Tax Burden</div>
            <div className="text-white font-bold text-lg">{totalIncome > 0 ? ((estimatedTax / totalIncome) * 100).toFixed(1) : 0}%</div>
          </div>
          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">Take-Home Rate</div>
            <div className="text-green font-bold text-lg">{totalIncome > 0 ? ((netAfterTax / totalIncome) * 100).toFixed(1) : 0}%</div>
          </div>
          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">Monthly Tax</div>
            <div className="text-yellow-400 font-bold text-lg">KSh {Math.round(estimatedTax / 12).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-white font-bold text-base mb-5">Monthly Tax Breakdown – {year}</h3>
        <div className="space-y-3">
          {monthlyData.filter(m => m.income > 0 || m.expenses > 0).map((m, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
              <div className="text-white/40 text-sm font-medium w-10">{m.month}</div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/40">Income: <span className="text-green">KSh {m.income.toLocaleString()}</span></span>
                  <span className="text-white/40">Tax: <span className="text-red-400">KSh {m.tax.toLocaleString()}</span></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, (m.income / (totalIncome / 12 * 1.5)) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
          {monthlyData.every(m => m.income === 0) && (
            <div className="text-center py-8 text-white/30 text-sm">No income data for {year}</div>
          )}
        </div>
      </div>

      {/* Tax Tips */}
      <div className="glass-card rounded-2xl p-5 mt-5">
        <div className="flex items-center gap-2 mb-4">
          <i className="fa-solid fa-lightbulb text-yellow-400" />
          <h3 className="text-white font-bold text-base">Tax Optimization Tips</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { icon: 'fa-piggy-bank', tip: 'Maximize retirement contributions to reduce taxable income.', color: '#25D366' },
            { icon: 'fa-receipt', tip: 'Keep records of all business expenses for deductions.', color: '#63b3ed' },
            { icon: 'fa-building', tip: 'Real estate investments offer depreciation deductions.', color: '#fbbf24' },
            { icon: 'fa-hand-holding-dollar', tip: 'Charitable donations are tax-deductible in Kenya.', color: '#a78bfa' },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${t.color}10`, border: `1px solid ${t.color}20` }}>
              <i className={`fa-solid ${t.icon} mt-0.5 flex-shrink-0`} style={{ color: t.color }} />
              <span className="text-white/60 text-sm">{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
