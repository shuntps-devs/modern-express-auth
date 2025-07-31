import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../../validations/auth_validation.js';
import { VALIDATION_MESSAGES } from '../../../constants/index.js';

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    const validRegisterData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#',
    };

    test('should validate correct registration data', () => {
      const result = registerSchema.safeParse(validRegisterData);
      expect(result.success).toBe(true);
      // confirmPassword is not included in the parsed result
      expect(result.data.username).toBe('testuser');
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.password).toBe('Test123!@#');
      expect(result.data.confirmPassword).toBeUndefined();
    });

    test('should reject invalid email format', () => {
      const invalidData = { ...validRegisterData, email: 'invalid-email' };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('email');
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.EMAIL_INVALID);
    });

    test('should reject short username', () => {
      const invalidData = { ...validRegisterData, username: 'ab' };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('username');
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.USERNAME_MIN_LENGTH);
    });

    test('should reject long username', () => {
      const invalidData = { ...validRegisterData, username: 'a'.repeat(31) };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('username');
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.USERNAME_MAX_LENGTH);
    });

    test('should reject username with invalid characters', () => {
      const invalidData = { ...validRegisterData, username: 'user@name' };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('username');
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.USERNAME_INVALID_CHARS);
    });

    test('should reject weak password', () => {
      const invalidData = { ...validRegisterData, password: 'weak', confirmPassword: 'weak' };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('password');
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH);
    });

    test('should reject password without uppercase', () => {
      const invalidData = { 
        ...validRegisterData, 
        password: 'test123!@#', 
        confirmPassword: 'test123!@#' 
      };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.PASSWORD_UPPERCASE_REQUIRED);
    });

    test('should reject password without lowercase', () => {
      const invalidData = { 
        ...validRegisterData, 
        password: 'TEST123!@#', 
        confirmPassword: 'TEST123!@#' 
      };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.PASSWORD_LOWERCASE_REQUIRED);
    });

    test('should reject password without number', () => {
      const invalidData = { 
        ...validRegisterData, 
        password: 'TestABC!@#', 
        confirmPassword: 'TestABC!@#' 
      };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.PASSWORD_NUMBER_REQUIRED);
    });

    test('should reject password without special character', () => {
      const invalidData = { 
        ...validRegisterData, 
        password: 'Test123ABC', 
        confirmPassword: 'Test123ABC' 
      };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.PASSWORD_SPECIAL_CHAR_REQUIRED);
    });

    test('should reject mismatched passwords', () => {
      const invalidData = { 
        ...validRegisterData, 
        confirmPassword: 'Different123!@#' 
      };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH);
    });

    test('should reject missing required fields', () => {
      const invalidData = { username: 'test' };
      const result = registerSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues.length).toBeGreaterThan(1);
      
      const missingFields = result.error.issues.map(issue => issue.path[0]);
      expect(missingFields).toContain('email');
      expect(missingFields).toContain('password');
      expect(missingFields).toContain('confirmPassword');
    });
  });

  describe('loginSchema', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Test123!@#',
    };

    test('should validate correct login data', () => {
      const result = loginSchema.safeParse(validLoginData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validLoginData);
    });

    test('should reject invalid email', () => {
      const invalidData = { ...validLoginData, email: 'invalid-email' };
      const result = loginSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('email');
    });

    test('should reject empty password', () => {
      const invalidData = { ...validLoginData, password: '' };
      const result = loginSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('password');
    });

    test('should reject missing fields', () => {
      const result = loginSchema.safeParse({});
      
      expect(result.success).toBe(false);
      expect(result.error.issues.length).toBe(2);
    });
  });

  describe('changePasswordSchema', () => {
    const validChangePasswordData = {
      currentPassword: 'Current123!@#',
      newPassword: 'New123!@#',
      confirmNewPassword: 'New123!@#',
    };

    test('should validate correct change password data', () => {
      const result = changePasswordSchema.safeParse(validChangePasswordData);
      expect(result.success).toBe(true);
      expect(result.data.currentPassword).toBe('Current123!@#');
      expect(result.data.newPassword).toBe('New123!@#');
      expect(result.data.confirmNewPassword).toBeUndefined(); // Removed after validation
    });

    test('should reject weak new password', () => {
      const invalidData = { 
        ...validChangePasswordData, 
        newPassword: 'weak',
        confirmNewPassword: 'weak'
      };
      const result = changePasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('newPassword');
    });

    test('should reject mismatched new passwords', () => {
      const invalidData = { 
        ...validChangePasswordData, 
        confirmNewPassword: 'Different123!@#' 
      };
      const result = changePasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH);
    });

    test('should reject same current and new password', () => {
      const invalidData = { 
        currentPassword: 'Same123!@#',
        newPassword: 'Same123!@#',
        confirmNewPassword: 'Same123!@#'
      };
      const result = changePasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.PASSWORD_MUST_BE_DIFFERENT);
    });
  });

  describe('forgotPasswordSchema', () => {
    test('should validate correct email', () => {
      const validData = { email: 'test@example.com' };
      const result = forgotPasswordSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    test('should reject invalid email', () => {
      const invalidData = { email: 'invalid-email' };
      const result = forgotPasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('email');
    });

    test('should reject missing email', () => {
      const result = forgotPasswordSchema.safeParse({});
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('email');
    });
  });

  describe('resetPasswordSchema', () => {
    const validResetData = {
      token: 'valid-reset-token-123',
      newPassword: 'New123!@#',
      confirmNewPassword: 'New123!@#',
    };

    test('should validate correct reset password data', () => {
      const result = resetPasswordSchema.safeParse(validResetData);
      expect(result.success).toBe(true);
      expect(result.data.token).toBe('valid-reset-token-123');
      expect(result.data.newPassword).toBe('New123!@#');
    });

    test('should reject empty token', () => {
      const invalidData = { ...validResetData, token: '' };
      const result = resetPasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('token');
    });

    test('should reject weak new password', () => {
      const invalidData = { 
        ...validResetData, 
        newPassword: 'weak',
        confirmNewPassword: 'weak'
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('newPassword');
    });

    test('should reject mismatched passwords', () => {
      const invalidData = { 
        ...validResetData, 
        confirmNewPassword: 'Different123!@#' 
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH);
    });
  });

  describe('Edge cases and security', () => {
    test('should trim whitespace from strings', () => {
      const dataWithWhitespace = {
        username: '  testuser  ',
        email: '  test@example.com  ',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
      };
      
      const result = registerSchema.safeParse(dataWithWhitespace);
      
      expect(result.success).toBe(true);
      expect(result.data.username).toBe('testuser');
      expect(result.data.email).toBe('test@example.com');
    });

    test('should convert email to lowercase', () => {
      const dataWithUppercaseEmail = {
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
      };
      
      const result = registerSchema.safeParse(dataWithUppercaseEmail);
      
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('test@example.com');
    });

    test('should reject extremely long inputs', () => {
      const longString = 'a'.repeat(1000);
      const invalidData = {
        username: longString,
        email: `${longString}@example.com`,
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
      };
      
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
