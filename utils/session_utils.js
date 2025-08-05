/**
 * Session Utilities
 * Utilities for enriching session data with device info and location
 */

/**
 * Parse User-Agent string to extract device information
 * @param {string} userAgent - The User-Agent header string
 * @returns {Object} Device information object
 */
export function parseDeviceInfo(userAgent) {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
    };
  }

  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // OS detection (order matters - check specific ones first)
  let os = 'Unknown';
  if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    os = 'iOS';
  } else if (ua.includes('windows nt')) {
    os = 'Windows';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // Device type detection (check iPad first before mobile)
  let device = 'Desktop';
  if (ua.includes('ipad')) {
    device = 'Tablet';
  } else if (ua.includes('mobile') || ua.includes('android')) {
    device = 'Mobile';
  } else if (ua.includes('tablet')) {
    device = 'Tablet';
  }

  return {
    browser,
    os,
    device,
  };
}

/**
 * Get location information from IP address
 * Note: This is a basic implementation. In production, you'd use a service like:
 * - MaxMind GeoIP2
 * - ipapi.co
 * - ip-api.com
 * @param {string} ipAddress - The client IP address
 * @returns {Object} Location information object
 */
export function getLocationFromIP(ipAddress) {
  // For localhost/development, return default values
  if (
    !ipAddress ||
    ipAddress === '127.0.0.1' ||
    ipAddress === '::1' ||
    ipAddress.includes('localhost')
  ) {
    return {
      country: 'Local',
      city: 'Development',
      region: 'Local',
    };
  }

  // Basic IP range detection (this is very simplified)
  // In production, you'd use a proper geolocation service
  const firstOctet = parseInt(ipAddress.split('.')[0]);

  let country = 'Unknown';
  let city = 'Unknown';
  let region = 'Unknown';

  // Very basic geolocation based on IP ranges (for demo purposes)
  if (firstOctet >= 1 && firstOctet <= 126) {
    country = 'US';
    city = 'New York';
    region = 'NY';
  } else if (firstOctet >= 128 && firstOctet <= 191) {
    country = 'CA';
    city = 'Toronto';
    region = 'ON';
  } else if (firstOctet >= 192 && firstOctet <= 223) {
    country = 'EU';
    city = 'London';
    region = 'UK';
  }

  return {
    country,
    city,
    region,
  };
}

/**
 * Create enriched session data with device and location information
 * @param {Object} req - Express request object
 * @returns {Object} Enriched session data
 */
export function createEnrichedSessionData(req) {
  const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const userAgent = req.get('User-Agent') || '';

  const deviceInfo = parseDeviceInfo(userAgent);
  const location = getLocationFromIP(ipAddress);

  return {
    ipAddress,
    userAgent,
    deviceInfo,
    location,
  };
}

/**
 * Format session data for API response
 * @param {Object} session - Session document from database
 * @param {boolean} includeDetails - Whether to include detailed info
 * @returns {Object} Formatted session data
 */
export function formatSessionResponse(session, includeDetails = false) {
  const baseResponse = {
    _id: session._id,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    expiresAt: session.expiresAt,
    isActive: session.isActive,
  };

  if (includeDetails) {
    return {
      ...baseResponse,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceInfo: session.deviceInfo || {
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
      },
      location: session.location || {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
      },
    };
  }

  return baseResponse;
}

/**
 * Get session security level based on activity and device info
 * @param {Object} session - Session document
 * @returns {string} Security level: 'high', 'medium', 'low'
 */
export function getSessionSecurityLevel(session) {
  let level = 'medium';

  // Check if it's a recent session
  const hoursSinceCreated = (Date.now() - new Date(session.createdAt).getTime()) / (1000 * 60 * 60);
  const hoursSinceActivity =
    (Date.now() - new Date(session.lastActivity).getTime()) / (1000 * 60 * 60);

  // High security: recent activity, known device
  if (hoursSinceActivity < 1 && session.deviceInfo?.browser !== 'Unknown') {
    level = 'high';
  }

  // Low security: old session, unknown device, or suspicious patterns
  if (hoursSinceCreated > 24 || hoursSinceActivity > 12 || !session.deviceInfo) {
    level = 'low';
  }

  return level;
}
