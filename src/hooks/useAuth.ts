import { useState, useEffect } from 'react';
import { type User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(): AuthState & {
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Innlogging feilet');
    }
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Utlogging feilet');
    }
  };

  return { user, loading, error, signInWithGoogle, signOutUser };
}
