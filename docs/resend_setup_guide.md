# Resend Configuration Guide

## 🚀 Step 1: Creating Resend Account

1. **Go to [resend.com](https://resend.com)**
2. **Create an account** with your main email
3. **Verify your confirmation email**
4. **Log in to the dashboard**

## 🔑 Step 2: Getting API Key

1. **In the Resend dashboard**, go to **"API Keys"**
2. **Click "Create API Key"**
3. **Name the key**: `Express Auth API - Production`
4. **Select permissions**: `Send emails`
5. **Copy the key** (format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`)

⚠️ **IMPORTANT**: Save this key immediately, it won't be visible again!

## 🌐 Step 3: Domain Configuration (Optional)

### 3.1 Add Domain in Resend

1. **In the dashboard**, go to **"Domains"**
2. **Click "Add Domain"**
3. **Enter**: your domain name
4. **Click "Add Domain"**

### 3.2 DNS Configuration (Required for custom domain)

Resend will provide DNS records to add. **Add these records in your DNS manager:**

#### SPF Record (TXT)

```
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

#### DKIM Records (CNAME)

```
Name: resend._domainkey
Value: [value provided by Resend]

Name: resend2._domainkey
Value: [value provided by Resend]
```

#### DMARC Record (TXT) - Optional but recommended

```
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com
```

### 3.3 Domain Verification

1. **Wait 5-10 minutes** after adding DNS records
2. **In Resend**, click **"Verify Domain"**
3. **Status should change to "Verified" ✅**

## ⚙️ Step 4: Application Configuration

### 4.1 Update .env file

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_your_actual_api_key_here
FROM_EMAIL=onboarding@resend.dev
APP_NAME=Express Auth API
FRONTEND_URL=http://localhost:3000

# For production
# FRONTEND_URL=https://your-frontend.com
```

### 4.2 Test configuration

```bash
# Start the API
npm run dev

# In another terminal, test the configuration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

## 🧪 Validation Tests

### Test 1: Service Configuration

```javascript
// Test in Node.js
import { emailService } from './services/index.js';

const testConfig = await emailService.testConfiguration();
console.log('Valid configuration:', testConfig);
```

### Test 2: Test Email Sending

```bash
# Register a test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### Test 3: Email Verification

1. **Check email reception** in the `test@example.com` inbox
2. **Click the verification link**
3. **Verify the API response**

### Test 4: Resend Verification

```bash
curl -X POST http://localhost:5000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 📊 Monitoring in Resend

1. **Resend Dashboard** → **"Emails"**
2. **View sending statistics**
3. **Check for any errors**
4. **Analyze open/click rates**

## 🚨 Troubleshooting

### Issue: Domain not verified

- **Check DNS records** with `dig` or `nslookup`
- **Wait for DNS propagation** (up to 24h)
- **Contact support** of your DNS provider

### Issue: Emails not received

- **Check spam folder**
- **Test with different** email providers
- **Check Resend logs**

### Issue: API Error

- **Check API key** in .env
- **Check Resend quotas**
- **Check application logs**

## 📈 Resend Free Plan Limits

- **3,000 emails/month** free
- **100 emails/day** maximum
- **Unlimited domains**
- **Email support**

For more emails, upgrade to paid plan.

## 🔒 Security

- ✅ **Never commit** API keys
- ✅ **Use environment** variables
- ✅ **Regular key rotation**
- ✅ **Access monitoring**

## 📞 Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **Status page**: https://status.resend.com
