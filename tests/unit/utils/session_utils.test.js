/**
 * Session Utils Unit Tests
 * Tests for session utility functions including device detection and location parsing
 */

import {
  parseDeviceInfo,
  getLocationFromIP,
  createEnrichedSessionData,
  formatSessionResponse,
  getSessionSecurityLevel,
} from '../../../utils/session_utils.js';

describe('Session Utils', () => {
  describe('parseDeviceInfo', () => {
    it('should parse Chrome browser correctly', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const result = parseDeviceInfo(userAgent);

      expect(result).toEqual({
        browser: 'Chrome',
        os: 'Windows',
        device: 'Desktop',
      });
    });

    it('should parse Firefox browser correctly', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      const result = parseDeviceInfo(userAgent);

      expect(result).toEqual({
        browser: 'Firefox',
        os: 'Windows',
        device: 'Desktop',
      });
    });

    it('should parse Safari browser correctly', () => {
      const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
      const result = parseDeviceInfo(userAgent);

      expect(result).toEqual({
        browser: 'Safari',
        os: 'macOS',
        device: 'Desktop',
      });
    });

    it('should parse Edge browser correctly', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
      const result = parseDeviceInfo(userAgent);

      expect(result).toEqual({
        browser: 'Edge',
        os: 'Windows',
        device: 'Desktop',
      });
    });

    it('should parse mobile Android device correctly', () => {
      const userAgent =
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
      const result = parseDeviceInfo(userAgent);

      expect(result).toEqual({
        browser: 'Chrome',
        os: 'Android',
        device: 'Mobile',
      });
    });

    it('should parse iOS device correctly', () => {
      const userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1';
      const result = parseDeviceInfo(userAgent);

      expect(result).toEqual({
        browser: 'Safari',
        os: 'iOS',
        device: 'Mobile',
      });
    });

    it('should parse iPad correctly', () => {
      const userAgent =
        'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1';
      const result = parseDeviceInfo(userAgent);

      expect(result).toEqual({
        browser: 'Safari',
        os: 'iOS',
        device: 'Tablet',
      });
    });

    it('should handle empty or undefined user agent', () => {
      expect(parseDeviceInfo('')).toEqual({
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
      });

      expect(parseDeviceInfo(undefined)).toEqual({
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
      });

      expect(parseDeviceInfo(null)).toEqual({
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
      });
    });

    it('should handle unknown user agent', () => {
      const userAgent = 'SomeUnknownBrowser/1.0';
      const result = parseDeviceInfo(userAgent);

      expect(result).toEqual({
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Desktop',
      });
    });
  });

  describe('getLocationFromIP', () => {
    it('should return local for localhost IPs', () => {
      expect(getLocationFromIP('127.0.0.1')).toEqual({
        country: 'Local',
        city: 'Development',
        region: 'Local',
      });

      expect(getLocationFromIP('::1')).toEqual({
        country: 'Local',
        city: 'Development',
        region: 'Local',
      });

      expect(getLocationFromIP('localhost')).toEqual({
        country: 'Local',
        city: 'Development',
        region: 'Local',
      });
    });

    it('should handle empty or undefined IP', () => {
      expect(getLocationFromIP('')).toEqual({
        country: 'Local',
        city: 'Development',
        region: 'Local',
      });

      expect(getLocationFromIP(undefined)).toEqual({
        country: 'Local',
        city: 'Development',
        region: 'Local',
      });

      expect(getLocationFromIP(null)).toEqual({
        country: 'Local',
        city: 'Development',
        region: 'Local',
      });
    });

    it('should parse IP ranges correctly (basic demo logic)', () => {
      // First octet 1-126 -> US
      expect(getLocationFromIP('100.1.1.1')).toEqual({
        country: 'US',
        city: 'New York',
        region: 'NY',
      });

      // First octet 128-191 -> CA
      expect(getLocationFromIP('150.1.1.1')).toEqual({
        country: 'CA',
        city: 'Toronto',
        region: 'ON',
      });

      // First octet 192-223 -> EU
      expect(getLocationFromIP('200.1.1.1')).toEqual({
        country: 'EU',
        city: 'London',
        region: 'UK',
      });

      // Other ranges -> Unknown
      expect(getLocationFromIP('250.1.1.1')).toEqual({
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
      });
    });
  });

  describe('createEnrichedSessionData', () => {
    let mockReq;

    beforeEach(() => {
      mockReq = {
        ip: '192.168.1.1',
        connection: {
          remoteAddress: '192.168.1.1',
        },
        get: jest.fn(),
      };
    });

    it('should create enriched session data with all fields', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      mockReq.get.mockReturnValue(userAgent);

      const result = createEnrichedSessionData(mockReq);

      expect(result).toEqual({
        ipAddress: '192.168.1.1',
        userAgent,
        deviceInfo: {
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop',
        },
        location: {
          country: 'EU',
          city: 'London',
          region: 'UK',
        },
      });

      expect(mockReq.get).toHaveBeenCalledWith('User-Agent');
    });

    it('should handle missing IP address', () => {
      mockReq.ip = undefined;
      mockReq.connection.remoteAddress = undefined;
      mockReq.get.mockReturnValue('SomeBrowser/1.0');

      const result = createEnrichedSessionData(mockReq);

      expect(result.ipAddress).toBe('127.0.0.1');
      expect(result.location).toEqual({
        country: 'Local',
        city: 'Development',
        region: 'Local',
      });
    });

    it('should handle missing User-Agent', () => {
      mockReq.get.mockReturnValue(undefined);

      const result = createEnrichedSessionData(mockReq);

      expect(result.userAgent).toBe('');
      expect(result.deviceInfo).toEqual({
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
      });
    });

    it('should prefer req.ip over connection.remoteAddress', () => {
      mockReq.ip = '100.1.1.1';
      mockReq.connection.remoteAddress = '150.1.1.1';
      mockReq.get.mockReturnValue('Browser/1.0');

      const result = createEnrichedSessionData(mockReq);

      expect(result.ipAddress).toBe('100.1.1.1');
      expect(result.location.country).toBe('US');
    });
  });

  describe('formatSessionResponse', () => {
    let mockSession;

    beforeEach(() => {
      mockSession = {
        _id: 'session123',
        createdAt: new Date('2023-01-01'),
        lastActivity: new Date('2023-01-02'),
        expiresAt: new Date('2023-01-30'),
        isActive: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/91.0',
        deviceInfo: {
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop',
        },
        location: {
          country: 'US',
          city: 'New York',
          region: 'NY',
        },
      };
    });

    it('should format basic session response without details', () => {
      const result = formatSessionResponse(mockSession, false);

      expect(result).toEqual({
        _id: 'session123',
        createdAt: mockSession.createdAt,
        lastActivity: mockSession.lastActivity,
        expiresAt: mockSession.expiresAt,
        isActive: true,
      });

      expect(result).not.toHaveProperty('ipAddress');
      expect(result).not.toHaveProperty('deviceInfo');
      expect(result).not.toHaveProperty('location');
    });

    it('should format detailed session response with all fields', () => {
      const result = formatSessionResponse(mockSession, true);

      expect(result).toEqual({
        _id: 'session123',
        createdAt: mockSession.createdAt,
        lastActivity: mockSession.lastActivity,
        expiresAt: mockSession.expiresAt,
        isActive: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/91.0',
        deviceInfo: {
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop',
        },
        location: {
          country: 'US',
          city: 'New York',
          region: 'NY',
        },
      });
    });

    it('should handle session with missing deviceInfo and location', () => {
      delete mockSession.deviceInfo;
      delete mockSession.location;

      const result = formatSessionResponse(mockSession, true);

      expect(result.deviceInfo).toEqual({
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
      });

      expect(result.location).toEqual({
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
      });
    });
  });

  describe('getSessionSecurityLevel', () => {
    let mockSession;

    beforeEach(() => {
      const now = new Date();
      mockSession = {
        createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        lastActivity: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
        deviceInfo: {
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop',
        },
      };
    });

    it('should return high security for recent activity with known device', () => {
      const now = new Date();
      mockSession.lastActivity = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

      const result = getSessionSecurityLevel(mockSession);
      expect(result).toBe('high');
    });

    it('should return low security for old sessions', () => {
      const now = new Date();
      mockSession.createdAt = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago

      const result = getSessionSecurityLevel(mockSession);
      expect(result).toBe('low');
    });

    it('should return low security for inactive sessions', () => {
      const now = new Date();
      mockSession.lastActivity = new Date(now.getTime() - 13 * 60 * 60 * 1000); // 13 hours ago

      const result = getSessionSecurityLevel(mockSession);
      expect(result).toBe('low');
    });

    it('should return low security for sessions without device info', () => {
      delete mockSession.deviceInfo;

      const result = getSessionSecurityLevel(mockSession);
      expect(result).toBe('low');
    });

    it('should return medium security for moderate activity', () => {
      const now = new Date();
      mockSession.createdAt = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      mockSession.lastActivity = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

      const result = getSessionSecurityLevel(mockSession);
      expect(result).toBe('medium');
    });
  });
});
