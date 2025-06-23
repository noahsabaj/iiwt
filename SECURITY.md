# Security Documentation - Israel-Iran War Tracker

## Overview
This document outlines the security measures implemented in the Israel-Iran War Tracker application and provides guidelines for secure deployment.

## Security Measures Implemented

### 1. XSS (Cross-Site Scripting) Protection
- ✅ HTML content is escaped in Leaflet map icons to prevent XSS attacks
- ✅ React's JSX automatically escapes content by default
- ✅ No use of `dangerouslySetInnerHTML` without sanitization
- ✅ Content Security Policy (CSP) headers implemented

### 2. Security Headers
The following security headers are configured in `public/index.html`:
- ✅ `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- ✅ `X-Frame-Options: DENY` - Prevents clickjacking attacks
- ✅ `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- ✅ `Permissions-Policy` - Restricts browser features
- ✅ `Content-Security-Policy` - Controls resource loading

### 3. API Key Protection
- ✅ API keys stored in environment variables (`.env.local`)
- ✅ `.env.local` is gitignored and never committed
- ✅ Demo mode with simulated data when API keys are not available
- ✅ Rate limiting implemented to stay within free tier limits

### 4. Information Disclosure Prevention
- ✅ Console.log statements wrapped in development-only checks
- ✅ Configuration details not exposed in production builds
- ✅ Error messages don't reveal system internals

### 5. Rate Limiting
- ✅ API request rate limiting (100 requests/day for NewsAPI)
- ✅ Caching implemented to reduce API calls
- ✅ Update intervals optimized (30 minutes instead of 1 minute)

## Known Security Limitations

### 1. Client-Side API Keys (CRITICAL)
**Issue**: API keys are included in the React build and visible to users.

**Mitigation Required**:
```bash
# Deploy a backend proxy server to hide API keys
# Example using Express.js:
npm install express cors dotenv
```

### 2. No Authentication System
**Issue**: All data is publicly accessible without authentication.

**Recommended Solution**:
- Implement JWT-based authentication
- Add role-based access control (RBAC)
- Protect sensitive endpoints

### 3. CORS Configuration
**Issue**: The current proxy setup (`setupProxy.js`) has no authentication.

**Fix Required**:
- Add authentication to proxy endpoints
- Implement rate limiting per IP/user
- Whitelist allowed origins

## Production Deployment Checklist

### Before deploying to production, ensure:

- [ ] Remove or disable SourceCodeViewer component
- [ ] Set up backend API proxy server
- [ ] Move all API keys to backend
- [ ] Implement user authentication
- [ ] Enable HTTPS only
- [ ] Configure proper CORS policies
- [ ] Set up monitoring and alerting
- [ ] Implement request logging
- [ ] Add rate limiting for all endpoints
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated
- [ ] Secrets rotation policy in place

## Secure Backend Proxy Example

```javascript
// server.js - Basic secure proxy example
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(cors(corsOptions));
app.use(limiter);

// Proxy endpoint for NewsAPI
app.get('/api/news/*', async (req, res) => {
  try {
    const newsApiUrl = `https://newsapi.org/v2${req.path.replace('/api/news', '')}`;
    const response = await fetch(newsApiUrl, {
      headers: {
        'X-Api-Key': process.env.NEWS_API_KEY
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(process.env.PORT || 3001);
```

## Vulnerability Disclosure

If you discover a security vulnerability, please:
1. Do NOT open a public issue
2. Email security concerns to: [your-security-email@example.com]
3. Include steps to reproduce the vulnerability
4. Allow reasonable time for fixes before public disclosure

## Security Best Practices for Contributors

1. **Never commit sensitive data**
   - API keys, passwords, tokens
   - Personal information
   - Internal URLs or IPs

2. **Validate all inputs**
   - Sanitize user inputs
   - Use parameterized queries
   - Implement proper type checking

3. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages promptly
   - Use automated tools like Dependabot

4. **Follow secure coding practices**
   - Principle of least privilege
   - Defense in depth
   - Fail securely

## Regular Security Tasks

### Daily
- Monitor API usage and rate limits
- Check for unusual activity patterns

### Weekly
- Run `npm audit` and address issues
- Review access logs

### Monthly
- Update dependencies
- Rotate API keys
- Security assessment

### Quarterly
- Full security audit
- Penetration testing (if applicable)
- Update security documentation

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://reactjs.org/docs/security.html)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

## Conclusion

While this application implements several security measures, it requires additional work before production deployment. The most critical issue is the exposure of API keys in the client-side code, which must be addressed by implementing a secure backend proxy server.

Remember: Security is not a one-time task but an ongoing process. Regular updates, monitoring, and improvements are essential for maintaining a secure application.