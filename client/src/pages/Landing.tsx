import { useState, useEffect } from 'react';
import { PACKAGE_LIMITS } from '@/lib/store';

interface LandingProps {
  onGetStarted: () => void;
}

const features = [
  { icon: 'fa-wallet', title: 'Income & Salary Tracking', desc: 'Log all income sources — salary, freelance, dividends, and more with full CRUD control.', color: '#25D366' },
  { icon: 'fa-receipt', title: 'Expense Management', desc: 'Categorize and track every expenditure. Set budgets and get alerts before overspending.', color: '#00d4aa' },
  { icon: 'fa-chart-line', title: 'Investment Portfolio', desc: 'Monitor stocks, bonds, real estate, crypto and mutual funds with ROI calculations.', color: '#63b3ed' },
  { icon: 'fa-file-invoice-dollar', title: 'Tax Calculator', desc: 'Auto-calculate estimated tax liability based on your total income with configurable rates.', color: '#a78bfa' },
  { icon: 'fa-chart-pie', title: 'Performance Analytics', desc: 'Net profit, savings rate, expense ratios, and beautiful interactive charts.', color: '#fbbf24' },
  { icon: 'fa-mobile-screen', title: 'M-Pesa Integration', desc: 'Simulate M-Pesa payments to upgrade your plan and unlock premium features instantly.', color: '#25D366' },
  { icon: 'fa-rotate', title: 'Recurring Transactions', desc: 'Set daily, weekly, or monthly recurring entries. Never miss a transaction again.', color: '#f87171' },
  { icon: 'fa-file-export', title: 'CSV Export', desc: 'Export all your financial data to CSV for use in Excel, Google Sheets, or audits.', color: '#34d399' },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: 'KSh 2B+', label: 'Tracked Monthly' },
  { value: '99.9%', label: 'Uptime' },
  { value: '5 Tiers', label: 'Flexible Plans' },
];

export default function Landing({ onGetStarted }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen hero-gradient relative overflow-x-hidden">
      {/* Aurora Orbs */}
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />

      {/* ====== NAVBAR ====== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-sidebar py-3' : 'py-5'}`}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
              <i className="fa-solid fa-chart-line text-white text-sm" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">Income<span className="text-green">Track</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200">
                {item}
              </a>
            ))}
          </div>
          <button onClick={onGetStarted} className="glass-btn-primary px-5 py-2.5 text-sm font-semibold text-white">
            <i className="fa-solid fa-arrow-right-to-bracket mr-2" />
            Get Started
          </button>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
                <span className="green-dot" />
                <span className="text-white/70 text-sm font-medium">iOS 26 Liquid Glass UI · Now Live</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
                Master Your<br />
                <span className="gradient-text">Finances</span><br />
                Effortlessly
              </h1>
              <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
                The all-in-one financial management platform for individuals and businesses. Track income, manage expenses, monitor investments, and grow your wealth — all in one beautiful dashboard.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={onGetStarted} className="glass-btn-primary px-8 py-4 text-base font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-rocket" />
                  Start Free Today
                </button>
                <button onClick={onGetStarted} className="glass-btn-secondary px-8 py-4 text-base font-semibold flex items-center gap-2">
                  <i className="fa-solid fa-play text-green" />
                  Try as Guest
                </button>
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                {['Bank-grade Security', 'No Credit Card', 'Free Forever Plan'].map(badge => (
                  <div key={badge} className="flex items-center gap-1.5 text-white/50 text-sm">
                    <i className="fa-solid fa-check text-green text-xs" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero Image + floating cards */}
            <div className={`relative transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="relative">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663642672073/RFHkd6Q6m9EgnCT5yZrWvB/landing-hero-WqNNowojkrLgczo3vHNRxS.webp"
                  alt="Income Track Dashboard"
                  className="w-full rounded-2xl"
                  style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
                />
                {/* Floating stat cards */}
                <div className="absolute -left-8 top-1/4 glass-card p-4 rounded-2xl animate-fade-in-up stagger-3">
                  <div className="text-white/50 text-xs mb-1">Net Profit</div>
                  <div className="text-green font-black text-xl tabular-nums">KSh 118,500</div>
                  <div className="flex items-center gap-1 mt-1">
                    <i className="fa-solid fa-arrow-trend-up text-green text-xs" />
                    <span className="text-green text-xs font-semibold">+12.4%</span>
                  </div>
                </div>
                <div className="absolute -right-6 bottom-1/4 glass-card p-4 rounded-2xl animate-fade-in-up stagger-4">
                  <div className="text-white/50 text-xs mb-1">Savings Rate</div>
                  <div className="text-white font-black text-xl">68.2%</div>
                  <div className="progress-bar mt-2 w-24">
                    <div className="progress-fill" style={{ width: '68%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== STATS BAR ====== */}
      <section className="py-12 relative">
        <div className="container">
          <div className="glass-card rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-black gradient-text tabular-nums">{stat.value}</div>
                  <div className="text-white/50 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="py-20 relative">
        <div className="container">
          <div className="text-center mb-16">
            <div className="green-badge inline-block mb-4">All Features</div>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              Everything You Need to<br /><span className="gradient-text">Manage Money</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              From basic expense tracking to advanced investment analytics — Income Track has it all.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={i} className={`feature-card p-6 animate-fade-in-up stagger-${(i % 6) + 1}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}>
                  <i className={`fa-solid ${f.icon} text-lg`} style={{ color: f.color }} />
                </div>
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== PRICING ====== */}
      <section id="pricing" className="py-20 relative">
        <div className="container">
          <div className="text-center mb-16">
            <div className="green-badge inline-block mb-4">Pricing</div>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              Choose Your <span className="gradient-text">Plan</span>
            </h2>
            <p className="text-white/50 text-lg">Upgrade anytime via M-Pesa. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {(Object.entries(PACKAGE_LIMITS) as [string, typeof PACKAGE_LIMITS[keyof typeof PACKAGE_LIMITS]][]).map(([tier, info], i) => (
              <div key={tier} className={`glass-card p-6 rounded-2xl flex flex-col ${tier === 'MASTER' ? 'ring-2 ring-green/40' : ''}`}>
                {tier === 'MASTER' && (
                  <div className="text-center mb-3">
                    <span className="green-badge text-xs">Most Popular</span>
                  </div>
                )}
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${info.color}20`, border: `1px solid ${info.color}40` }}>
                    <i className={`fa-solid ${info.icon} text-xl`} style={{ color: info.color }} />
                  </div>
                  <div className="text-white font-black text-lg">{info.label}</div>
                  <div className="mt-2">
                    {info.price === 0 ? (
                      <span className="text-2xl font-black text-white">Free</span>
                    ) : (
                      <>
                        <span className="text-white/40 text-sm">KSh </span>
                        <span className="text-2xl font-black text-white">{info.price.toLocaleString()}</span>
                        <span className="text-white/40 text-sm">/mo</span>
                      </>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {info.features.slice(0, 5).map(f => (
                    <li key={f} className="flex items-center gap-2 text-white/60 text-xs">
                      <i className="fa-solid fa-check text-green text-xs flex-shrink-0" />
                      {f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </li>
                  ))}
                  {info.features.length > 5 && (
                    <li className="text-white/40 text-xs pl-5">+{info.features.length - 5} more</li>
                  )}
                </ul>
                <button onClick={onGetStarted} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${tier === 'MASTER' ? 'glass-btn-primary text-white' : 'glass-btn-secondary'}`}>
                  {info.price === 0 ? 'Get Started' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA SECTION ====== */}
      <section className="py-20 relative">
        <div className="container">
          <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at center, rgba(37,211,102,0.3) 0%, transparent 70%)' }} />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
                Ready to Take Control of<br /><span className="gradient-text">Your Finances?</span>
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of Kenyans already using Income Track to build wealth and achieve financial freedom.
              </p>
              <button onClick={onGetStarted} className="glass-btn-primary px-10 py-4 text-lg font-bold text-white inline-flex items-center gap-3">
                <i className="fa-solid fa-rocket" />
                Start Your Journey Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="py-10 border-t border-white/5">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
              <i className="fa-solid fa-chart-line text-white text-xs" />
            </div>
            <span className="text-white font-bold">Income<span className="text-green">Track</span></span>
          </div>
          <p className="text-white/30 text-sm">© 2026 IncomeTrack. Built with ❤️ for financial freedom.</p>
          <div className="flex gap-4">
            {['fa-twitter', 'fa-linkedin', 'fa-github'].map(icon => (
              <a key={icon} href="#" className="text-white/30 hover:text-green transition-colors">
                <i className={`fa-brands ${icon}`} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
