import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { completeNewPassword, NewPasswordRequiredError } from '../../services/auth';
import type { CognitoUser } from 'amazon-cognito-identity-js';
import { Button } from '../common/Button';
import toast from 'react-hot-toast';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ cognitoUser: CognitoUser; userAttributes: Record<string, string> } | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(username, password);
      toast.success('Successfully signed in!');
      navigate('/');
    } catch (error: any) {
      if (error instanceof NewPasswordRequiredError) {
        setPendingUser({ cognitoUser: error.cognitoUser, userAttributes: error.userAttributes });
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setLoading(true);

    try {
      await completeNewPassword(pendingUser.cognitoUser, newPassword, pendingUser.userAttributes);
      await signIn(username, newPassword);
      toast.success('Password updated. Successfully signed in!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to set new password');
    } finally {
      setLoading(false);
    }
  };

  if (pendingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
              <span>🎁</span>
              Gift List
            </h1>
            <p className="text-text-secondary mt-2">Please set a new password to continue</p>
          </div>

          <form onSubmit={handleNewPassword} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your new password"
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Set New Password
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <span>🎁</span>
            Gift List
          </h1>
          <p className="text-text-secondary mt-2">Sign in to manage your gift lists</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};
