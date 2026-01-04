import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from './Button';

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export const Layout = ({ children, showNav = true }: LayoutProps) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {showNav && (
        <nav className="bg-surface border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                <span className="text-xl font-bold text-primary">Gift List</span>
              </Link>

              {isAuthenticated && (
                <div className="flex items-center gap-4">
                  <span className="text-text-secondary">
                    {user?.email || user?.username}
                  </span>
                  <Button variant="secondary" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
