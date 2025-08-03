# 🚀 Quick Start: Resend Email Configuration

> 🚀 **5-minute setup** for email verification with Resend

## Prerequisites

- ✅ Express Auth API project installed
- ✅ Resend account (free: https://resend.com)
- ✅ Access to your domain for DNS configuration (optional)

## 🎯 Quick Setup

### 1. Get Resend API Key (1 minute)

```bash
# 1. Go to https://resend.com
# 2. Create account or sign in
# 3. Go to "API Keys"
# 4. Create new API key
# 5. Copy the key (starts with "re_")
```

### 2. Automatic Configuration (1 minute)

```bash
# Launch configuration assistant
npm run setup:resend

# Follow instructions:
# - Paste your Resend API key
# - Confirm sender email (onboarding@resend.dev)
# - Confirm app name (Express Auth API)
# - Confirm frontend URL (http://localhost:3000)
```

### 3. Test Configuration (1 minute)

```bash
# Start the server
npm run dev

# In another terminal, test email sending
npm run test:email
```

### 4. Domain Configuration (2 minutes) - Optional

1. **Add your domain in Resend:**
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter your domain name
   - Click "Add"

2. **Configure DNS records:**

   ```
   # SPF Record
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all

   # DKIM Record (provided by Resend)
   Type: CNAME
   Name: [provided by Resend]
   Value: [provided by Resend]
   ```

3. **Verify domain:**
   - Wait 5-10 minutes for DNS propagation
   - Click "Verify" in Resend

## 🧪 Complete Test

### Test registration with email verification

```bash
# 1. Make sure server is running
npm run dev

# 2. Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "test@example.com",
    "password": "Test123!"
  }'

# 3. Check email reception
# 4. Click verification link
# 5. Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "password": "Test123!"
  }'
```

## 📧 Available Endpoints

| Endpoint                        | Method | Description                          |
| ------------------------------- | ------ | ------------------------------------ |
| `/api/auth/register`            | POST   | Registration with verification email |
| `/api/auth/verify-email/:token` | GET    | Email verification                   |
| `/api/auth/resend-verification` | POST   | Resend verification email            |
| `/api/auth/email-status`        | GET    | Email verification status            |

## 🔧 Environment Variables

```env
# Required
RESEND_API_KEY=re_your_api_key_here

# Optional (with default values)
FROM_EMAIL=onboarding@resend.dev
APP_NAME=Express Auth API
FRONTEND_URL=http://localhost:3000
```

## ⚡ Available npm Scripts

```bash
npm run setup:resend     # Interactive configuration
npm run test:email       # Test email configuration
npm run dev             # Start development server
npm test                # Run all tests
```

## 🚨 Quick Troubleshooting

### Issue: Email not received

```bash
# Check configuration
npm run test:email

# Check logs
tail -f logs/app.log
```

### Issue: Domain not verified

```bash
# Check DNS records
nslookup -type=TXT yourdomain.com
nslookup -type=CNAME [dkim-record].yourdomain.com
```

### Issue: Verification token expired

```bash
# Resend verification email
curl -X POST http://localhost:5000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 📚 Complete Documentation

- **Detailed setup:** `docs/resend_setup_guide.md`
- **Technical documentation:** `docs/email_verification.md`
- **API Reference:** `README.md`

## ✅ Final Checklist

- [ ] Resend API key configured
- [ ] Environment variables set
- [ ] Custom domain added in Resend (optional)
- [ ] DNS records configured (if using custom domain)
- [ ] Domain verified in Resend (if using custom domain)
- [ ] Registration test successful
- [ ] Verification email received
- [ ] Email verification functional

---

🎉 **Congratulations!** Your email verification system is now operational.

For any questions or issues, check the complete documentation or application logs.

## 📊 Monitoring and Debugging

### Real-time Logs

```bash
# View logs in real-time
tail -f logs/app.log

# Or in console with npm run dev
```

### Resend Dashboard

- **Sent emails**: https://resend.com/emails
- **Statistics**: Delivery rates, opens, clicks
- **Errors**: Details of sending failures

### Current Environment Variables

```bash
# Check configuration
node -e "
require('dotenv').config();
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Defined' : '❌ Missing');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || '❌ Missing');
console.log('APP_NAME:', process.env.APP_NAME || '❌ Missing');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Missing');
"
```

---

## 🚨 Additional Troubleshooting

### ❌ Email not received

1. **Check spam folder**
2. **Verify domain** in Resend (must be "Verified")
3. **Test with different email** (Gmail, Outlook)
4. **Check application logs**

### ❌ "Invalid API key" error

1. **Check API key** in `.env`
2. **Generate new key** in Resend
3. **Restart application** after modification

### ❌ Domain not verified

1. **Check DNS** with `nslookup`
2. **Wait for propagation** (5-30 minutes)
3. **Click "Verify"** in Resend

### ❌ Verification token expired

```bash
# Send new token
curl -X POST http://localhost:5000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 🎯 Next Steps

Once everything works locally:

1. **🚀 Deploy to production**
   - Update `FRONTEND_URL` for your production domain
   - Configure environment variables on your server

2. **📈 Optimize templates**
   - Customize emails in `services/email_service.js`
   - Add your logo and branding

3. **🔒 Enhance security**
   - Add email verification middleware on sensitive routes
   - Configure alerts for email failures

4. **📊 Analyze performance**
   - Monitor open rates in Resend
   - Optimize templates based on statistics

---

## 💡 Pro Tips

- **🔄 Test regularly** with real emails
- **📱 Check mobile display** of emails
- **⏰ Monitor quotas** Resend (3000 emails/month free)
- **🔐 Keep API keys secure** and never commit them
- **📈 Use Resend analytics** to optimize your emails

**🎉 Your email verification system is now ready!**
