import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PACKAGE_LIMITS, PackageTier, updateUserPackage } from '@/lib/store';
import confetti from 'canvas-confetti';

const TIER_ORDER: PackageTier[] = ['BASIC', 'DIAMOND', 'PREMIUM', 'GOLD', 'MASTER'];

function fireCelebration() {
  const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
  myConfetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.5 },
    colors: ['#25D366', '#00d4aa', '#fbbf24', '#a78bfa', '#63b3ed', '#ffffff'],
    startVelocity: 45,
    gravity: 0.8,
  });
  setTimeout(() => myConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#25D366', '#fbbf24'] }), 500);
}

export default function UpgradeView() {
  const { session, setSession } = useAuth();
  const pkg = session?.package || 'BASIC';
  const currentIdx = TIER_ORDER.indexOf(pkg);

  const [showMpesa, setShowMpesa] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PackageTier>('DIAMOND');
  const [mpesaForm, setMpesaForm] = useState({ phone: '', amount: '' });
  const [mpesaStep, setMpesaStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [mpesaError, setMpesaError] = useState('');

  const openMpesa = (tier: PackageTier) => {
    setSelectedTier(tier);
    setMpesaForm({ phone: '', amount: PACKAGE_LIMITS[tier].price.toString() });
    setMpesaStep('form');
    setMpesaError('');
    setShowMpesa(true);
  };

  const handleMpesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = mpesaForm.phone.replace(/\s/g, '');
    if (!/^(07|01)\d{8}$/.test(phone)) {
      setMpesaError('Enter a valid Kenyan phone number (07xx or 01xx)');
      return;
    }
    setMpesaStep('processing');
    await new Promise(r => setTimeout(r, 3000));
    // 90% success rate simulation
    if (Math.random() > 0.1) {
      setMpesaStep('success');
      updateUserPackage(session!.userId, selectedTier);
      if (session) setSession({ ...session, package: selectedTier });
      setTimeout(() => fireCelebration(), 300);
    } else {
      setMpesaStep('failed');
    }
  };

  const allFeatures = [
    { key: 'income_tracking', label: 'Income Tracking', icon: 'fa-wallet' },
    { key: 'expense_tracking', label: 'Expense Tracking', icon: 'fa-receipt' },
    { key: 'investments', label: 'Investment Portfolio', icon: 'fa-chart-line' },
    { key: 'tax_calculator', label: 'Tax Calculator', icon: 'fa-file-invoice-dollar' },
    { key: 'analytics', label: 'Advanced Analytics', icon: 'fa-chart-pie' },
    { key: 'export_csv', label: 'CSV Export', icon: 'fa-file-export' },
    { key: 'budget_alerts', label: 'Budget Alerts', icon: 'fa-bell' },
    { key: 'recurring', label: 'Recurring Transactions', icon: 'fa-rotate' },
    { key: 'multi_currency', label: 'Multi-Currency', icon: 'fa-coins' },
    { key: 'mpesa_sync', label: 'M-Pesa Auto-Sync', icon: 'fa-mobile-screen' },
    { key: 'ai_tips', label: 'AI Spending Tips', icon: 'fa-robot' },
  ];

  return (
    <div className="p-5 lg:p-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black text-white">Upgrade Your Plan</h1>
        <p className="text-white/40 text-sm mt-1">Unlock powerful features to supercharge your finances</p>
      </div>

      {/* Current Plan Banner */}
      <div className="glass-card rounded-2xl p-5 mb-8 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(0,212,170,0.04))', border: '1px solid rgba(37,211,102,0.15)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${PACKAGE_LIMITS[pkg].color}20`, border: `1px solid ${PACKAGE_LIMITS[pkg].color}40` }}>
          <i className={`fa-solid ${PACKAGE_LIMITS[pkg].icon} text-xl`} style={{ color: PACKAGE_LIMITS[pkg].color }} />
        </div>
        <div>
          <div className="text-white/50 text-xs">Current Plan</div>
          <div className="text-white font-black text-xl">{PACKAGE_LIMITS[pkg].label}</div>
        </div>
        {pkg === 'MASTER' && (
          <div className="ml-auto green-badge">You're on the best plan! 🎉</div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {TIER_ORDER.map((tier, i) => {
          const info = PACKAGE_LIMITS[tier];
          const isCurrent = tier === pkg;
          const isUpgrade = i > currentIdx;
          return (
            <div key={tier} className={`glass-card rounded-2xl p-5 flex flex-col transition-all ${isCurrent ? 'ring-2 ring-green/40' : ''} ${tier === 'MASTER' ? 'relative overflow-hidden' : ''}`}>
              {tier === 'MASTER' && (
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #25D366, transparent)' }} />
              )}
              {isCurrent && (
                <div className="text-center mb-3">
                  <span className="green-badge text-xs">Current Plan</span>
                </div>
              )}
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: `${info.color}20`, border: `1px solid ${info.color}40` }}>
                  <i className={`fa-solid ${info.icon} text-2xl`} style={{ color: info.color }} />
                </div>
                <div className="text-white font-black text-lg">{info.label}</div>
                <div className="mt-2">
                  {info.price === 0 ? (
                    <span className="text-2xl font-black text-white">Free</span>
                  ) : (
                    <div>
                      <span className="text-white/40 text-sm">KSh </span>
                      <span className="text-2xl font-black text-white">{info.price.toLocaleString()}</span>
                      <span className="text-white/40 text-xs">/mo</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-white/30 text-xs mb-3">
                {info.transactionLimit === Infinity ? 'Unlimited' : `${info.transactionLimit}`} transactions
              </div>
              <ul className="space-y-2 flex-1 mb-5">
                {allFeatures.map(f => {
                  const has = info.features.includes(f.key);
                  return (
                    <li key={f.key} className={`flex items-center gap-2 text-xs ${has ? 'text-white/70' : 'text-white/20'}`}>
                      <i className={`fa-solid ${has ? 'fa-check' : 'fa-xmark'} text-xs flex-shrink-0 ${has ? 'text-green' : 'text-white/20'}`} />
                      {f.label}
                    </li>
                  );
                })}
              </ul>
              {isCurrent ? (
                <div className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-white/30 glass">Active</div>
              ) : isUpgrade ? (
                <button onClick={() => openMpesa(tier)} className="w-full py-2.5 rounded-xl text-xs font-bold text-white mpesa-btn flex items-center justify-center gap-1.5">
                  <i className="fa-solid fa-mobile-screen text-xs" />
                  Pay via M-Pesa
                </button>
              ) : (
                <div className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-white/20 glass">Downgrade</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="glass-card rounded-2xl overflow-hidden mb-8">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-white font-bold text-base">Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-white/40 text-xs font-medium">Feature</th>
                {TIER_ORDER.map(t => (
                  <th key={t} className="p-4 text-center">
                    <span className={`text-xs font-bold badge-${t.toLowerCase()} px-2 py-1 rounded-full`}>{PACKAGE_LIMITS[t].label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFeatures.map((f, i) => (
                <tr key={f.key} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/1' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid ${f.icon} text-white/30 text-xs w-4`} />
                      <span className="text-white/60 text-sm">{f.label}</span>
                    </div>
                  </td>
                  {TIER_ORDER.map(t => (
                    <td key={t} className="p-4 text-center">
                      {PACKAGE_LIMITS[t].features.includes(f.key) ? (
                        <i className="fa-solid fa-check text-green text-sm" />
                      ) : (
                        <i className="fa-solid fa-xmark text-white/15 text-sm" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* M-Pesa Modal */}
      {showMpesa && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="glass-modal w-full max-w-md p-6 animate-slide-up">
            {mpesaStep === 'form' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
                      <i className="fa-solid fa-mobile-screen text-green text-lg" />
                    </div>
                    <div>
                      <h2 className="text-white font-black text-lg">M-Pesa Payment</h2>
                      <p className="text-white/40 text-xs">Upgrading to {PACKAGE_LIMITS[selectedTier].label}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMpesa(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/40 hover:text-white">
                    <i className="fa-solid fa-xmark text-sm" />
                  </button>
                </div>

                {/* Package Summary */}
                <div className="glass rounded-xl p-4 mb-5" style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white/50 text-xs">Upgrading to</div>
                      <div className="text-white font-bold">{PACKAGE_LIMITS[selectedTier].label} Plan</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/50 text-xs">Monthly</div>
                      <div className="text-green font-black text-xl">KSh {PACKAGE_LIMITS[selectedTier].price.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {mpesaError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                    <i className="fa-solid fa-triangle-exclamation text-red-400 text-sm" />
                    <span className="text-red-300 text-sm">{mpesaError}</span>
                  </div>
                )}

                <form onSubmit={handleMpesaSubmit} className="space-y-4">
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">M-Pesa Phone Number</label>
                    <div className="relative">
                      <i className="fa-solid fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
                      <input type="tel" value={mpesaForm.phone} onChange={e => setMpesaForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="0712345678" required className="glass-input w-full pl-10 pr-4 py-3 text-sm" />
                    </div>
                    <p className="text-white/25 text-xs mt-1">Format: 07xx or 01xx (10 digits)</p>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Amount (KSh)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm font-semibold">KSh</span>
                      <input type="number" value={mpesaForm.amount} onChange={e => setMpesaForm(f => ({ ...f, amount: e.target.value }))}
                        required className="glass-input w-full pl-12 pr-4 py-3 text-sm" />
                    </div>
                  </div>
                  <button type="submit" className="mpesa-btn w-full py-4 text-base font-bold flex items-center justify-center gap-2">
                    <i className="fa-solid fa-mobile-screen text-lg" />
                    Send M-Pesa Request
                  </button>
                </form>
                <p className="text-white/20 text-xs text-center mt-3">
                  You'll receive an STK push on your phone. Enter your M-Pesa PIN to confirm.
                </p>
              </>
            )}

            {mpesaStep === 'processing' && (
              <div className="text-center py-8">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="spinner" style={{ width: 80, height: 80, borderTopColor: '#25D366', borderWidth: 4 }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fa-solid fa-mobile-screen text-green text-2xl" />
                  </div>
                </div>
                <h3 className="text-white font-black text-xl mb-2">Processing Payment</h3>
                <p className="text-white/50 text-sm">STK push sent to {mpesaForm.phone}</p>
                <p className="text-white/30 text-xs mt-2">Enter your M-Pesa PIN on your phone...</p>
              </div>
            )}

            {mpesaStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-in" style={{ background: 'rgba(37,211,102,0.15)', border: '2px solid rgba(37,211,102,0.4)' }}>
                  <i className="fa-solid fa-check text-green text-3xl" />
                </div>
                <h3 className="text-white font-black text-2xl mb-2">Payment Successful! 🎉</h3>
                <p className="text-white/60 text-sm mb-2">You've been upgraded to</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold badge-${selectedTier.toLowerCase()} mb-6`}>
                  <i className={`fa-solid ${PACKAGE_LIMITS[selectedTier].icon}`} />
                  {PACKAGE_LIMITS[selectedTier].label} Plan
                </div>
                <p className="text-white/40 text-xs mb-6">KSh {PACKAGE_LIMITS[selectedTier].price.toLocaleString()} charged to {mpesaForm.phone}</p>
                <button onClick={() => setShowMpesa(false)} className="glass-btn-primary px-8 py-3 text-sm font-bold text-white">
                  Start Exploring Features
                </button>
              </div>
            )}

            {mpesaStep === 'failed' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)' }}>
                  <i className="fa-solid fa-xmark text-red-400 text-3xl" />
                </div>
                <h3 className="text-white font-black text-xl mb-2">Payment Failed</h3>
                <p className="text-white/50 text-sm mb-6">The transaction was declined. Please try again.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowMpesa(false)} className="flex-1 glass-btn-secondary py-3 text-sm font-semibold">Cancel</button>
                  <button onClick={() => setMpesaStep('form')} className="flex-1 glass-btn-primary py-3 text-sm font-bold text-white">Try Again</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
