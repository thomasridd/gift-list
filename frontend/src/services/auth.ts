import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

if (!userPoolId || !clientId) {
  console.warn('Cognito configuration missing. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID');
}

const poolData = {
  UserPoolId: userPoolId || 'us-east-1_PLACEHOLDER',
  ClientId: clientId || 'placeholder-client-id',
};

const userPool = new CognitoUserPool(poolData);

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
      Pool: userPool,
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
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
};

export const getCurrentUser = (): Promise<CognitoUser | null> => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();

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
