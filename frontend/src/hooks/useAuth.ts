import { useState, useEffect } from 'react';
import {
  getCurrentUser,
  getUserFromToken,
  storeToken,
  signOut as authSignOut,
  type AuthUser,
} from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  const signIn = (token: string) => {
    storeToken(token);
    setUser(getUserFromToken(token));
  };

  const signOut = () => {
    authSignOut();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  };
};
