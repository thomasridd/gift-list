const STORAGE_KEY = 'google_id_token';

export interface AuthUser {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export const storeToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEY, token);
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const clearToken = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

export const getUserFromToken = (token: string): AuthUser => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
};

export const getCurrentUser = (): AuthUser | null => {
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) {
    if (token) clearToken();
    return null;
  }
  return getUserFromToken(token);
};

export const signOut = (): void => {
  clearToken();
};
