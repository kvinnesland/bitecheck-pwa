import { useState, lazy, Suspense } from 'react';
import { useAuth } from './hooks/useAuth';
import { useUserProfile } from './hooks/useUserProfile';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { UpdateToast } from './components/common/UpdateToast';
import { LanguagePicker } from './components/onboarding/LanguagePicker';
import { UsernameModal } from './components/onboarding/UsernameModal';
import { UnitsProvider } from './contexts/UnitsContext';
import type { AppView } from './components/layout/BottomNav';
import type { User } from 'firebase/auth';

const Feed       = lazy(() => import('./pages/Feed').then((m) => ({ default: m.Feed })));
const LoggFangst = lazy(() => import('./pages/LoggFangst').then((m) => ({ default: m.LoggFangst })));
const Kart       = lazy(() => import('./pages/Kart').then((m) => ({ default: m.Kart })));
const BiteScore  = lazy(() => import('./pages/BiteScore').then((m) => ({ default: m.BiteScore })));
const Profil     = lazy(() => import('./pages/Profil').then((m) => ({ default: m.Profil })));
const Varsler    = lazy(() => import('./pages/Varsler').then((m) => ({ default: m.Varsler })));

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
      <AuthenticatedApp user={user} onSignOut={signOutUser} />
      <UpdateToast />
    </UnitsProvider>
  );
}

function AuthenticatedApp({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const { profile, loading } = useUserProfile(user.uid);

  if (loading) return <LoadingScreen />;
  if (!profile) return <UsernameModal user={user} />;

  return (
    <>
      <AppShell user={user} onSignOut={onSignOut}>
        {(view: AppView, navigate: (v: AppView) => void, openSettings: () => void) => (
          <Suspense fallback={<PageSpinner />}>
            {view === 'feed'    && <Feed user={user} onSettingsOpen={openSettings} onNavigate={navigate} />}
            {view === 'logg'    && <LoggFangst user={user} />}
            {view === 'kart'    && <Kart user={user} />}
            {view === 'score'   && <BiteScore user={user} navigate={navigate} />}
            {view === 'varsler' && <Varsler uid={user.uid} onNavigate={navigate} />}
            {view === 'profil'  && <Profil user={user} onSettingsOpen={openSettings} />}
          </Suspense>
        )}
      </AppShell>
    </>
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
