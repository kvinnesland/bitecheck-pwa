import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { UpdateToast } from './components/common/UpdateToast';

export default function App() {
  const { user, loading, error, signInWithGoogle, signOutUser } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <LoginPage
        onSignIn={signInWithGoogle}
        error={error}
      />
    );
  }

  return (
    <>
      <AppShell user={user} onSignOut={signOutUser}>
        <Dashboard user={user} />
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
