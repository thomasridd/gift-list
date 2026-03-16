import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

// Validate that required environment variables are set
if (!userPoolId || !clientId) {
  throw new Error(
    'Cognito configuration missing. Please ensure VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID ' +
    'environment variables are set at build time. If you are deploying to Netlify, these variables must be ' +
    'configured in the Netlify dashboard for your deployment context.'
  );
}

// Validate that environment variables are not placeholder values
if (clientId.includes('placeholder') || clientId.includes('xxxxxxxxx')) {
  throw new Error(
    'Invalid Cognito client ID detected. The VITE_COGNITO_CLIENT_ID environment variable contains a ' +
    'placeholder value. Please configure it with the actual Cognito User Pool Client ID from your AWS setup.'
  );
}

const poolData = {
  UserPoolId: userPoolId,
  ClientId: clientId,
};

const userPool = new CognitoUserPool(poolData);

export interface AuthUser {
  username: string;
  email?: string;
  sub?: string;
}

export class NewPasswordRequiredError extends Error {
  cognitoUser: CognitoUser;
  userAttributes: Record<string, string>;

  constructor(cognitoUser: CognitoUser, userAttributes: Record<string, string>) {
    super('New password required');
    this.name = 'NewPasswordRequiredError';
    this.cognitoUser = cognitoUser;
    this.userAttributes = userAttributes;
  }
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
      newPasswordRequired: (_userAttributes, requiredAttributes) => {
        // Only pass back attributes explicitly required by the user pool policy.
        // Passing existing attributes (e.g. email) causes Cognito to reject
        // with "Cannot modify an already provided email".
        const attributesForChallenge: Record<string, string> = {};
        if (requiredAttributes) {
          requiredAttributes.forEach((key: string) => {
            if (_userAttributes[key] !== undefined) {
              attributesForChallenge[key] = _userAttributes[key];
            }
          });
        }
        reject(new NewPasswordRequiredError(cognitoUser, attributesForChallenge));
      },
    });
  });
};

export const completeNewPassword = (
  cognitoUser: CognitoUser,
  newPassword: string,
  userAttributes: Record<string, string>
): Promise<CognitoUserSession> => {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
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
