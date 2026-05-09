import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import AuthModal from './components/AuthModal';
import DashboardLayout, { DashView } from './components/DashboardLayout';
import DashboardView from './pages/DashboardView';
import TransactionsView from './pages/TransactionsView';
import InvestmentsView from './pages/InvestmentsView';
import TaxView from './pages/TaxView';
import ProfileView from './pages/ProfileView';
import UpgradeView from './pages/UpgradeView';
import SavingsView from './pages/SavingsView';
import AuditView from './pages/AuditView';
import { AppSession } from './lib/store';

function AppContent() {
  const { session, setSession, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeView, setActiveView] = useState<DashView>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #060d1f 0%, #0a1a2e 50%, #071520 100%)' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 48, height: 48, borderTopColor: '#25D366', borderWidth: 3 }} />
          <div className="text-white/40 text-sm font-medium">Loading Income Track...</div>
        </div>
      </div>
    );
  }

  const handleAuthSuccess = (s: AppSession) => {
    setSession(s);
    setShowAuth(false);
  };

  if (!session) {
    return (
      <>
        <Landing onGetStarted={() => setShowAuth(true)} />
        {showAuth && (
          <AuthModal
            onSuccess={handleAuthSuccess}
            onClose={() => setShowAuth(false)}
          />
        )}
      </>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'transactions': return <TransactionsView />;
      case 'investments': return <InvestmentsView />;
      case 'tax': return <TaxView />;
      case 'savings': return <SavingsView />;
      case 'audit': return <AuditView />;
      case 'profile': return <ProfileView />;
      case 'upgrade': return <UpgradeView />;
      default: return <DashboardView />;
    }
  };

  return (
    <DashboardLayout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
