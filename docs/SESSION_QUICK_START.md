# Session Management Quick Start

Get started with the advanced session management features in 5 minutes.

## 🚀 Quick Overview

The session management system provides:

- **Device Detection**: Automatic browser/OS/device identification
- **Location Tracking**: IP-based geolocation
- **Security Assessment**: Dynamic security level calculation
- **Session Control**: Individual and bulk session management

## 📋 Prerequisites

1. **Authentication Required**: All session endpoints require valid JWT authentication
2. **Active Session**: User must have at least one active session
3. **API Access**: Ensure your client can make authenticated requests

## 🎯 Common Use Cases

### 1. Display User's Active Sessions

```javascript
// Frontend: Get all active sessions
const response = await fetch('/api/sessions/active', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const { data } = await response.json();

// Display sessions in UI
data.sessions.forEach(session => {
  console.log(`${session.deviceInfo.browser} on ${session.deviceInfo.os}`);
  console.log(`Location: ${session.location.city}, ${session.location.country}`);
  console.log(`Security Level: ${session.securityLevel}`);
  console.log(`Current Session: ${session.isCurrent}`);
});
```

### 2. Security Dashboard

```javascript
// Get security overview
const securityResponse = await fetch('/api/sessions/security-overview', {
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { securityOverview } = securityResponse.data;

// Check for suspicious activity
if (securityOverview.suspiciousActivity.multipleLocations) {
  showAlert('Multiple locations detected - review your sessions');
}

// Display recommendations
securityOverview.recommendations.forEach(rec => {
  addSecurityTip(rec);
});
```

### 3. Device Statistics

```javascript
// Get device usage statistics
const deviceStats = await fetch('/api/sessions/stats/devices', {
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { deviceStats } = deviceStats.data;

// Create charts or display stats
console.log('Browsers:', deviceStats.browsers);
console.log('Operating Systems:', deviceStats.operatingSystems);
console.log('Device Types:', deviceStats.deviceTypes);
```

### 4. Terminate Suspicious Sessions

```javascript
// Get all sessions
const sessions = await fetch('/api/sessions/active', {
  headers: { Authorization: `Bearer ${accessToken}` },
});

// Find suspicious sessions
const suspiciousSessions = sessions.data.sessions.filter(
  session => session.securityLevel === 'low' || session.location.country !== 'US', // Example: unexpected country
);

// Terminate suspicious sessions
for (const session of suspiciousSessions) {
  if (!session.isCurrent) {
    // Don't terminate current session
    await fetch(`/api/sessions/${session._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}
```

### 5. Bulk Session Management

```javascript
// Terminate all other sessions (keep only current)
const response = await fetch('/api/sessions/terminate-others', {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { terminatedSessions } = response.data;
console.log(`Terminated ${terminatedSessions} sessions`);
```

## 🔧 Integration Examples

### React Component

```jsx
import React, { useState, useEffect } from 'react';

function SessionManager({ accessToken }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions/active', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { data } = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async sessionId => {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  };

  if (loading) return <div>Loading sessions...</div>;

  return (
    <div className="session-manager">
      <h2>Active Sessions ({sessions.length})</h2>
      {sessions.map(session => (
        <div key={session._id} className="session-card">
          <div className="device-info">
            <strong>{session.deviceInfo.browser}</strong> on {session.deviceInfo.os}
            <span className="device-type">({session.deviceInfo.device})</span>
          </div>
          <div className="location-info">
            📍 {session.location.city}, {session.location.country}
          </div>
          <div className="security-info">
            Security:{' '}
            <span className={`security-${session.securityLevel}`}>{session.securityLevel}</span>
          </div>
          <div className="session-actions">
            {session.isCurrent ? (
              <span className="current-session">Current Session</span>
            ) : (
              <button onClick={() => terminateSession(session._id)} className="terminate-btn">
                Terminate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SessionManager;
```

### Vue.js Component

```vue
<template>
  <div class="session-dashboard">
    <h2>Session Dashboard</h2>

    <!-- Security Overview -->
    <div class="security-overview" v-if="securityOverview">
      <h3>Security Status</h3>
      <div class="security-stats">
        <div class="stat">
          <span class="label">Active Sessions:</span>
          <span class="value">{{ securityOverview.totalActiveSessions }}</span>
        </div>
        <div class="stat">
          <span class="label">Security Levels:</span>
          <span class="value">
            High: {{ securityOverview.securityLevels.high }}, Medium:
            {{ securityOverview.securityLevels.medium }}, Low:
            {{ securityOverview.securityLevels.low }}
          </span>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations" v-if="securityOverview.recommendations.length">
        <h4>Security Recommendations:</h4>
        <ul>
          <li v-for="rec in securityOverview.recommendations" :key="rec">
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Device Statistics -->
    <div class="device-stats" v-if="deviceStats">
      <h3>Device Usage</h3>
      <div class="stats-grid">
        <div class="stat-category">
          <h4>Browsers</h4>
          <div v-for="(count, browser) in deviceStats.browsers" :key="browser">
            {{ browser }}: {{ count }}
          </div>
        </div>
        <div class="stat-category">
          <h4>Operating Systems</h4>
          <div v-for="(count, os) in deviceStats.operatingSystems" :key="os">
            {{ os }}: {{ count }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SessionDashboard',
  props: ['accessToken'],
  data() {
    return {
      securityOverview: null,
      deviceStats: null,
      loading: true,
    };
  },
  async mounted() {
    await this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      try {
        const [securityRes, deviceRes] = await Promise.all([
          fetch('/api/sessions/security-overview', {
            headers: { Authorization: `Bearer ${this.accessToken}` },
          }),
          fetch('/api/sessions/stats/devices', {
            headers: { Authorization: `Bearer ${this.accessToken}` },
          }),
        ]);

        const securityData = await securityRes.json();
        const deviceData = await deviceRes.json();

        this.securityOverview = securityData.data.securityOverview;
        this.deviceStats = deviceData.data.deviceStats;
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
```

## 🛡️ Security Best Practices

### 1. Validate Session Data

```javascript
// Always validate session data before using
function isValidSession(session) {
  return session && session._id && session.deviceInfo && session.location && session.securityLevel;
}

// Use in your components
const validSessions = sessions.filter(isValidSession);
```

### 2. Handle Errors Gracefully

```javascript
async function safeSessionRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Session request failed:', error);
    // Handle error appropriately (show user message, retry, etc.)
    throw error;
  }
}
```

### 3. Monitor Security Levels

```javascript
// Set up security monitoring
function monitorSessionSecurity(sessions) {
  const lowSecuritySessions = sessions.filter(s => s.securityLevel === 'low');

  if (lowSecuritySessions.length > 0) {
    console.warn(`Found ${lowSecuritySessions.length} low-security sessions`);

    // Notify user
    showSecurityAlert({
      type: 'warning',
      message: `You have ${lowSecuritySessions.length} sessions with low security. Consider reviewing them.`,
      action: 'Review Sessions',
    });
  }
}
```

## 📊 Response Formats

All session endpoints return consistent response formats:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Endpoint-specific data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error information"
  }
}
```

## 🔗 Next Steps

1. **Explore API Documentation**: [API.md](./API.md) for complete endpoint reference
2. **Read Session Management Guide**: [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) for detailed implementation
3. **Check Security Best Practices**: Review security recommendations in the main documentation
4. **Test Integration**: Use the provided examples to integrate session management into your application

## 🤝 Need Help?

- **API Reference**: Complete endpoint documentation in [API.md](./API.md)
- **Implementation Guide**: Detailed technical guide in [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md)
- **Test Examples**: Check the test files for usage patterns and edge cases
- **GitHub Issues**: Report bugs or request features in the project repository
