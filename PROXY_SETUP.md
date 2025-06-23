# Proxy Setup Guide for CORS Issues

This guide explains how to set up a development proxy to handle CORS issues with external APIs.

## Why Do We Need a Proxy?

Many APIs (NewsAPI, IAEA RSS feeds, etc.) don't allow direct browser requests due to CORS policies. A proxy server acts as an intermediary to make these requests on behalf of your browser.

## Option 1: Quick Demo Mode (Recommended for Testing)

The application automatically runs in demo mode when API keys are not configured. This uses simulated data that closely mimics real API responses.

```bash
# Just run the app without configuration
npm start
```

## Option 2: Configure API Keys

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Add your API keys to `.env.local`:
```env
REACT_APP_NEWS_API_KEY=your_newsapi_key_here
REACT_APP_ACLED_KEY=your_acled_key_here
REACT_APP_ACLED_EMAIL=your_email@example.com
REACT_APP_NASA_FIRMS_KEY=your_nasa_firms_key_here
```

3. Get API keys from:
   - NewsAPI: https://newsapi.org/register (Free tier available)
   - ACLED: https://acleddata.com/register/ (Academic access available)
   - NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/api/ (Free)

## Option 3: Set Up a Development Proxy

### Using http-proxy-middleware (Built into Create React App)

1. Create `src/setupProxy.js`:

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for NewsAPI
  app.use(
    '/api/news',
    createProxyMiddleware({
      target: 'https://newsapi.org/v2',
      changeOrigin: true,
      pathRewrite: {
        '^/api/news': '',
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add your API key here
        const apiKey = process.env.REACT_APP_NEWS_API_KEY;
        if (apiKey) {
          proxyReq.setHeader('X-Api-Key', apiKey);
        }
      },
    })
  );

  // Proxy for IAEA RSS
  app.use(
    '/api/iaea',
    createProxyMiddleware({
      target: 'https://www.iaea.org',
      changeOrigin: true,
      pathRewrite: {
        '^/api/iaea': '',
      },
    })
  );
};
```

2. Update your API calls to use the proxy endpoints:
```javascript
// Instead of: https://newsapi.org/v2/top-headlines
// Use: /api/news/top-headlines
```

### Using a Standalone Proxy Server

1. Create a simple Express proxy server:

```javascript
// proxy-server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// NewsAPI proxy
app.get('/api/news/*', async (req, res) => {
  try {
    const path = req.path.replace('/api/news', '');
    const response = await axios.get(`https://newsapi.org/v2${path}`, {
      params: req.query,
      headers: {
        'X-Api-Key': process.env.NEWS_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// IAEA RSS proxy
app.get('/api/iaea/rss', async (req, res) => {
  try {
    const response = await axios.get('https://www.iaea.org/feeds/topnews.rss');
    res.set('Content-Type', 'application/rss+xml');
    res.send(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
```

2. Run the proxy server:
```bash
node proxy-server.js
```

3. Update your React app to use the proxy:
```env
REACT_APP_NEWS_PROXY_URL=http://localhost:3001/api/news
```

## Option 4: Use a Public CORS Proxy (Not Recommended for Production)

For quick testing, you can use public CORS proxies:

```javascript
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const apiUrl = CORS_PROXY + encodeURIComponent('https://api.example.com/data');
```

⚠️ **Warning**: Public CORS proxies are unreliable and should not be used in production.

## Production Deployment

For production, you should:

1. **Use server-side rendering (SSR)** with Next.js or similar
2. **Create API routes** in your backend that make the external API calls
3. **Use serverless functions** (Vercel Functions, Netlify Functions, AWS Lambda)
4. **Set up a proper API gateway** with caching and rate limiting

### Example Vercel Function

```javascript
// api/news.js
export default async function handler(req, res) {
  const response = await fetch('https://newsapi.org/v2/top-headlines', {
    headers: {
      'X-Api-Key': process.env.NEWS_API_KEY
    }
  });
  
  const data = await response.json();
  res.status(200).json(data);
}
```

## Security Considerations

1. **Never expose API keys in client-side code**
2. **Implement rate limiting** on your proxy endpoints
3. **Add authentication** if your proxy is publicly accessible
4. **Use environment variables** for all sensitive data
5. **Enable CORS** only for your frontend domain in production

## Troubleshooting

### "CORS policy" errors
- Ensure your proxy server is running
- Check that API endpoints are correctly configured
- Verify API keys are valid

### "Failed to fetch" errors
- Check network connectivity
- Verify API service is not down
- Check browser console for detailed error messages

### Demo mode not working
- Ensure `REACT_APP_DEMO_MODE=true` is set
- Clear browser cache and restart the app

## Next Steps

1. Choose the approach that best fits your needs
2. For development, demo mode or a local proxy works well
3. For production, implement proper backend API routes
4. Consider implementing caching to reduce API calls