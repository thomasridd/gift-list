import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

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

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                signIn(credentialResponse.credential);
                toast.success('Successfully signed in!');
                navigate('/');
              }
            }}
            onError={() => {
              toast.error('Google sign in failed');
            }}
          />
        </div>
      </div>
    </div>
  );
};
