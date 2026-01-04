import { useState, useEffect } from 'react';
import { getCurrentUser, getUserAttributes, signIn as authSignIn, signOut as authSignOut, type AuthUser } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const cognitoUser = await getCurrentUser();
      if (cognitoUser) {
        const attributes = await getUserAttributes(cognitoUser);
        setUser(attributes);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    await authSignIn(username, password);
    await checkUser();
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
