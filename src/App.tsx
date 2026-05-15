import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { UpdateToast } from './components/common/UpdateToast';
import { LanguagePicker } from './components/onboarding/LanguagePicker';
import { LoggFangst } from './pages/LoggFangst';
import { Kart } from './pages/Kart';
import { BiteScore } from './pages/BiteScore';
import { Historikk } from './pages/Historikk';
import type { AppView } from './components/layout/BottomNav';

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
    <>
      <AppShell user={user} onSignOut={signOutUser}>
        {(view: AppView, navigate: (v: AppView) => void) => {
          switch (view) {
            case 'logg':      return <LoggFangst user={user} />;
            case 'kart':      return <Kart user={user} />;
            case 'score':     return <BiteScore user={user} navigate={navigate} />;
            case 'historikk': return <Historikk user={user} />;
          }
        }}
      </AppShell>
      <UpdateToast />
    </>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
