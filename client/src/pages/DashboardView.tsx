import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getTransactions, getInvestments, calcStats, calcTax, calcInvestmentROI,
  formatCurrency, formatDate, Transaction, hasFeature, getTransactions as getTx
} from '@/lib/store';
import { Chart, registerables } from 'chart.js';
import BudgetAlerts from '@/components/BudgetAlerts';

Chart.register(...registerables);

type DateFilter = 'week' | 'month' | 'year' | 'all';

function useCounter(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

function StatCard({ icon, label, value, prefix = '', suffix = '', color, trend, delay = 0 }: any) {
  const num = useCounter(Math.abs(value));
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <i className={`fa-solid ${icon} text-base`} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green/10 text-green' : 'bg-red-500/10 text-red-400'}`}>
            <i className={`fa-solid ${trend >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-xs`} />
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-white/50 text-xs font-medium mb-1">{label}</div>
        <div className="text-white font-black text-2xl tabular-nums">
          {prefix}{num.toLocaleString()}{suffix}
        </div>
      </div>
    </div>
  );
}

const AI_TIPS = [
  { icon: 'fa-lightbulb', tip: 'Your food spending is 15% above average. Try meal prepping to save KSh 2,000/month.', color: '#fbbf24' },
  { icon: 'fa-chart-line', tip: 'Your savings rate of 68% is excellent! Consider moving 20% into investments.', color: '#25D366' },
  { icon: 'fa-piggy-bank', tip: 'You have KSh 113,800 in net savings this month. Great progress toward your goals!', color: '#63b3ed' },
  { icon: 'fa-rotate', tip: 'Set up recurring savings transfers on payday to automate your wealth building.', color: '#a78bfa' },
];

export default function DashboardView() {
  const { session } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [tipIdx, setTipIdx] = useState(0);
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartInstance = useRef<Chart | null>(null);
  const pieChartInstance = useRef<Chart | null>(null);

  const userId = session?.userId || '';
  const pkg = session?.package || 'BASIC';
  const currency = session?.currency || 'KES';
  const allTx = getTransactions(userId);
  const investments = getInvestments(userId);

  const filterTx = (txs: Transaction[], filter: DateFilter) => {
    const now = new Date();
    return txs.filter(t => {
      const d = new Date(t.date);
      if (filter === 'week') return (now.getTime() - d.getTime()) <= 7 * 86400000;
      if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (filter === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const filteredTx = filterTx(allTx, dateFilter);
  const stats = calcStats(filteredTx, currency);
  const tax = calcTax(stats.totalIn);
  const roi = calcInvestmentROI(investments);
  const recentTx = [...allTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  // Rotate AI tips
  useEffect(() => {
    const timer = setInterval(() => setTipIdx(i => (i + 1) % AI_TIPS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  // Line Chart
  useEffect(() => {
    if (!lineChartRef.current) return;
    if (lineChartInstance.current) lineChartInstance.current.destroy();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const incomeData = [75000, 82000, 103000, 97000, 110000];
    const expenseData = [42000, 38000, 45000, 41000, 38200];

    lineChartInstance.current = new Chart(lineChartRef.current, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: '#25D366',
            backgroundColor: 'rgba(37, 211, 102, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#25D366',
            pointBorderColor: 'rgba(37,211,102,0.3)',
            pointBorderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: 'rgba(239,68,68,0.3)',
            pointBorderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeInOutQuart' },
        plugins: {
          legend: {
            labels: { color: 'rgba(255,255,255,0.6)', font: { family: 'Inter', size: 12 }, boxWidth: 12, boxHeight: 12, padding: 20 },
          },
          tooltip: {
            backgroundColor: 'rgba(10, 20, 40, 0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: 'rgba(255,255,255,0.8)',
            bodyColor: 'rgba(255,255,255,0.6)',
            padding: 12,
            callbacks: {
              label: ctx => ` KSh ${(ctx.parsed.y ?? 0).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'Inter', size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'Inter', size: 11 }, callback: v => `${(+v / 1000).toFixed(0)}k` } },
        },
      },
    });
    return () => { lineChartInstance.current?.destroy(); };
  }, [dateFilter]);

  // Pie Chart
  useEffect(() => {
    if (!pieChartRef.current || !hasFeature(pkg, 'analytics')) return;
    if (pieChartInstance.current) pieChartInstance.current.destroy();

    const categories: Record<string, number> = {};
    filteredTx.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);
    const colors = ['#25D366', '#00d4aa', '#63b3ed', '#a78bfa', '#fbbf24', '#f87171', '#34d399', '#fb923c'];

    if (labels.length === 0) return;

    pieChartInstance.current = new Chart(pieChartRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length).map(c => c + '88'),
          borderColor: colors.slice(0, labels.length),
          borderWidth: 1.5,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: { duration: 1000, easing: 'easeInOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter', size: 10 }, boxWidth: 10, padding: 10 },
          },
          tooltip: {
            backgroundColor: 'rgba(10, 20, 40, 0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              label: ctx => ` KSh ${ctx.parsed.toLocaleString()}`,
            },
          },
        },
      },
    });
    return () => { pieChartInstance.current?.destroy(); };
  }, [filteredTx, pkg]);

  const txTypeIcon = (type: string) => {
    if (type === 'income') return { icon: 'fa-arrow-down-left', color: '#25D366', bg: 'rgba(37,211,102,0.12)' };
    if (type === 'revenue') return { icon: 'fa-briefcase', color: '#00d4aa', bg: 'rgba(0,212,170,0.12)' };
    return { icon: 'fa-arrow-up-right', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  };

  const currentTip = AI_TIPS[tipIdx];

  return (
    <div className="p-5 lg:p-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {session?.username} 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex glass rounded-xl p-1 gap-1">
          {(['week', 'month', 'year', 'all'] as DateFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${dateFilter === f ? 'glass-btn-primary text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* AI Tip Banner (Master only) */}
      {hasFeature(pkg, 'ai_tips') && (
        <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-4 animate-fade-in" style={{ background: `${currentTip.color}10`, border: `1px solid ${currentTip.color}20` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${currentTip.color}20` }}>
            <i className={`fa-solid ${currentTip.icon} text-base`} style={{ color: currentTip.color }} />
          </div>
          <div className="flex-1">
            <div className="text-white/40 text-xs font-medium mb-0.5">AI Spending Insight</div>
            <div className="text-white text-sm">{currentTip.tip}</div>
          </div>
          <div className="flex gap-1">
            {AI_TIPS.map((_, i) => (
              <button key={i} onClick={() => setTipIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === tipIdx ? 'bg-green w-4' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      )}

      {/* ====== STAT CARDS ====== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard icon="fa-arrow-down-left" label="Total Income" value={stats.totalIn} prefix="KSh " color="#25D366" trend={12.4} delay={0.05} />
        <StatCard icon="fa-arrow-up-right" label="Total Expenses" value={stats.expenses} prefix="KSh " color="#ef4444" trend={-5.2} delay={0.10} />
        <StatCard icon="fa-piggy-bank" label="Net Savings" value={Math.max(0, stats.netProfit)} prefix="KSh " color="#63b3ed" trend={8.7} delay={0.15} />
        <StatCard icon="fa-chart-line" label="Investment ROI" value={Math.round(Math.abs(roi) * 10) / 10} suffix="%" color="#fbbf24" trend={roi} delay={0.20} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="glass-card rounded-2xl p-4 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-percent text-green text-xs" />
            <div className="text-white/40 text-xs">Savings Rate</div>
          </div>
          <div className="text-white font-black text-xl tabular-nums">{stats.savingsRate.toFixed(1)}%</div>
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: `${Math.min(100, stats.savingsRate)}%` }} />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-scale-balanced text-orange-400 text-xs" />
            <div className="text-white/40 text-xs">Expense Ratio</div>
          </div>
          <div className="text-white font-black text-xl tabular-nums">{stats.expenseRatio.toFixed(1)}%</div>
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: `${Math.min(100, stats.expenseRatio)}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
          </div>
        </div>
        <div className={`glass-card rounded-2xl p-4 animate-fade-in-up stagger-3 relative ${!hasFeature(pkg, 'tax_calculator') ? 'overflow-hidden' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-file-invoice-dollar text-yellow-400 text-xs" />
            <div className="text-white/40 text-xs">Est. Tax (15%)</div>
          </div>
          <div className="text-white font-black text-xl tabular-nums">KSh {tax.toLocaleString()}</div>
          {!hasFeature(pkg, 'tax_calculator') && (
            <div className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl" style={{ background: 'rgba(6,13,31,0.7)', backdropFilter: 'blur(4px)' }}>
              <div className="text-center">
                <i className="fa-solid fa-lock text-white/40 text-lg mb-1" />
                <div className="text-white/40 text-xs">Diamond+</div>
              </div>
            </div>
          )}
        </div>
        <div className={`glass-card rounded-2xl p-4 animate-fade-in-up stagger-4 relative ${!hasFeature(pkg, 'investments') ? 'overflow-hidden' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-building-columns text-blue-400 text-xs" />
            <div className="text-white/40 text-xs">Portfolio Value</div>
          </div>
          <div className="text-white font-black text-xl tabular-nums">
            KSh {investments.reduce((s, i) => s + i.currentValue, 0).toLocaleString()}
          </div>
          {!hasFeature(pkg, 'investments') && (
            <div className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl" style={{ background: 'rgba(6,13,31,0.7)', backdropFilter: 'blur(4px)' }}>
              <div className="text-center">
                <i className="fa-solid fa-lock text-white/40 text-lg mb-1" />
                <div className="text-white/40 text-xs">Diamond+</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-base">Income vs Expenses</h3>
              <p className="text-white/40 text-xs">Monthly trend 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green" />
                <span className="text-white/40 text-xs">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-white/40 text-xs">Expenses</span>
              </div>
            </div>
          </div>
          <div className="chart-container" style={{ height: 220 }}>
            <canvas ref={lineChartRef} />
          </div>
        </div>

        <div className={`glass-card rounded-2xl p-5 animate-fade-in-up stagger-3`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-base">Expense Breakdown</h3>
              <p className="text-white/40 text-xs">By category</p>
            </div>
          </div>
          {hasFeature(pkg, 'analytics') ? (
            <div className="chart-container" style={{ height: 220 }}>
              <canvas ref={pieChartRef} />
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center">
              <i className="fa-solid fa-lock text-white/20 text-3xl mb-3" />
              <div className="text-white/40 text-sm font-semibold">Premium Feature</div>
              <div className="text-white/25 text-xs mt-1">Upgrade to Premium+</div>
            </div>
          )}
        </div>
      </div>

      {/* Budget Alerts + Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-1">
          <BudgetAlerts />
        </div>

        {/* Quick Financial Health */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-heart-pulse text-red-400" />
            <h3 className="text-white font-bold text-sm">Financial Health Score</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Savings Rate', value: stats.savingsRate, target: 20, icon: 'fa-piggy-bank', color: '#25D366' },
              { label: 'Debt Ratio', value: 100 - stats.expenseRatio, target: 60, icon: 'fa-hand-holding-dollar', color: '#63b3ed' },
              { label: 'Investment %', value: investments.length > 0 ? 35 : 0, target: 15, icon: 'fa-chart-line', color: '#fbbf24' },
              { label: 'Emergency Fund', value: 85, target: 100, icon: 'fa-shield-halved', color: '#a78bfa' },
            ].map((metric, i) => {
              const score = Math.min(100, (metric.value / metric.target) * 100);
              const isGood = score >= 100;
              return (
                <div key={i} className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <i className={`fa-solid ${metric.icon} text-xs`} style={{ color: metric.color }} />
                    <span className="text-white/50 text-xs">{metric.label}</span>
                    {isGood && <i className="fa-solid fa-check text-green text-xs ml-auto" />}
                  </div>
                  <div className="text-white font-bold text-lg tabular-nums">{metric.value.toFixed(1)}%</div>
                  <div className="progress-bar mt-1.5">
                    <div className="progress-fill" style={{ width: `${Math.min(100, score)}%`, background: `linear-gradient(90deg, ${metric.color}, ${metric.color}88)` }} />
                  </div>
                  <div className="text-white/25 text-xs mt-1">Target: {metric.target}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-2xl p-5 animate-fade-in-up stagger-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-bold text-base">Recent Transactions</h3>
            <p className="text-white/40 text-xs">{recentTx.length} latest entries</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs">{allTx.length} total</span>
          </div>
        </div>
        <div className="space-y-1">
          {recentTx.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-receipt text-white/15 text-4xl mb-3" />
              <div className="text-white/30 text-sm">No transactions yet</div>
            </div>
          ) : (
            recentTx.map((tx, i) => {
              const { icon, color, bg } = txTypeIcon(tx.type);
              return (
                <div key={tx.id} className="transaction-row flex items-center gap-3" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <i className={`fa-solid ${icon} text-sm`} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate">{tx.description}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/30 text-xs">{tx.category}</span>
                      <span className="text-white/15 text-xs">·</span>
                      <span className="text-white/30 text-xs">{formatDate(tx.date)}</span>
                    </div>
                  </div>
                  <div className={`text-sm font-bold tabular-nums flex-shrink-0 ${tx.type === 'expense' ? 'text-red-400' : 'text-green'}`}>
                    {tx.type === 'expense' ? '-' : '+'}KSh {tx.amount.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
