import { useState, lazy, Suspense } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { UpdateToast } from './components/common/UpdateToast';
import { LanguagePicker } from './components/onboarding/LanguagePicker';
import { UnitsProvider } from './contexts/UnitsContext';
import type { AppView } from './components/layout/BottomNav';

const LoggFangst = lazy(() => import('./pages/LoggFangst').then((m) => ({ default: m.LoggFangst })));
const Kart       = lazy(() => import('./pages/Kart').then((m) => ({ default: m.Kart })));
const BiteScore  = lazy(() => import('./pages/BiteScore').then((m) => ({ default: m.BiteScore })));
const Historikk  = lazy(() => import('./pages/Historikk').then((m) => ({ default: m.Historikk })));
const Profil     = lazy(() => import('./pages/Profil').then((m) => ({ default: m.Profil })));

export default function App() {
  const { user, loading, error, signInWithGoogle, signOutUser } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem('bc_onboarding') === '1',
  );

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <LoginPage onSignIn={signInWithGoogle} error={error} />;
  }

  if (!onboardingDone) {
    return (
      <LanguagePicker
        onDone={() => {
          localStorage.setItem('bc_onboarding', '1');
          setOnboardingDone(true);
        }}
      />
    );
  }

  return (
    <UnitsProvider>
      <AppShell user={user} onSignOut={signOutUser}>
        {(view: AppView, navigate: (v: AppView) => void) => (
          <Suspense fallback={<PageSpinner />}>
            {view === 'logg'      && <LoggFangst user={user} />}
            {view === 'kart'      && <Kart user={user} />}
            {view === 'score'     && <BiteScore user={user} navigate={navigate} />}
            {view === 'historikk' && <Historikk user={user} />}
            {view === 'profil'    && <Profil user={user} />}
          </Suspense>
        )}
      </AppShell>
      <UpdateToast />
    </UnitsProvider>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <Spinner />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PageSpinner() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width: 36, height: 36, border: '3px solid var(--color-divider)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  );
}
