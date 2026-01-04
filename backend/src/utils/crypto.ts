import { randomBytes } from 'crypto';

export const generateShareCode = (): string => {
  return randomBytes(8).toString('hex');
};
