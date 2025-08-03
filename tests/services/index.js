import { jest } from '@jest/globals';

export const userService = {
  findUserByEmailVerificationToken: jest.fn(),
  verifyUserEmail: jest.fn(),
  findUserByEmail: jest.fn(),
  updateEmailVerificationToken: jest.fn(),
};

export const emailService = {
  sendWelcomeEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
};
