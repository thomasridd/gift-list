import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

// Lazy initialization: validate and create pool when first accessed
let userPool: CognitoUserPool | null = null;
let configError: string | null = null;

// Check for configuration errors at module load time
if (!userPoolId || !clientId) {
  configError =
    'Cognito configuration missing. Please ensure VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID ' +
    'environment variables are set at build time. If you are deploying to Netlify, these variables must be ' +
    'configured in the Netlify dashboard for your deployment context.';
} else if (clientId.includes('placeholder') || clientId.includes('xxxxxxxxx')) {
  configError =
    'Invalid Cognito client ID detected. The VITE_COGNITO_CLIENT_ID environment variable contains a ' +
    'placeholder value. Please configure it with the actual Cognito User Pool Client ID from your AWS setup.';
}

// Get or create the user pool, throwing error if misconfigured
const getUserPool = (): CognitoUserPool => {
  if (configError) {
    throw new Error(configError);
  }

  if (!userPool) {
    userPool = new CognitoUserPool({
      UserPoolId: userPoolId!,
      ClientId: clientId!,
    });
  }

  return userPool;
};

export interface AuthUser {
  username: string;
  email?: string;
  sub?: string;
}

export const signIn = (username: string, password: string): Promise<CognitoUserSession> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: getUserPool(),
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        resolve(session);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

export const signOut = (): void => {
  const cognitoUser = getUserPool().getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
};

export const getCurrentUser = (): Promise<CognitoUser | null> => {
  return new Promise((resolve) => {
    const cognitoUser = getUserPool().getCurrentUser();

    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        resolve(null);
        return;
      }
      resolve(cognitoUser);
    });
  });
};

export const getUserAttributes = (user: CognitoUser): Promise<AuthUser> => {
  return new Promise((resolve, reject) => {
    user.getUserAttributes((err, attributes) => {
      if (err) {
        reject(err);
        return;
      }

      const authUser: AuthUser = {
        username: user.getUsername(),
      };

      attributes?.forEach((attr) => {
        if (attr.Name === 'email') {
          authUser.email = attr.Value;
        }
        if (attr.Name === 'sub') {
          authUser.sub = attr.Value;
        }
      });

      resolve(authUser);
    });
  });
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};
