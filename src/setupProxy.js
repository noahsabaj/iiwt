const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Note: This proxy is only used in development (npm start)
  // In production, requests are handled by the backend server or Vercel rewrites
  
  // Proxy for NewsAPI
  app.use(
    '/api/news',
    createProxyMiddleware({
      target: 'https://newsapi.org',
      changeOrigin: true,
      pathRewrite: {
        '^/api/news': '/v2',
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add API key if available
        if (process.env.REACT_APP_NEWS_API_KEY) {
          proxyReq.setHeader('X-Api-Key', process.env.REACT_APP_NEWS_API_KEY);
        }
      },
    })
  );

  // Proxy for UN/OCHA ReliefWeb API
  app.use(
    '/api/reliefweb',
    createProxyMiddleware({
      target: 'https://api.reliefweb.int',
      changeOrigin: true,
      pathRewrite: {
        '^/api/reliefweb': '/v1',
      },
    })
  );

  // Proxy for IAEA RSS feeds
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
  
  // Proxy for backend API (development only)
  if (process.env.NODE_ENV === 'development') {
    app.use(
      '/api',
      createProxyMiddleware({
        target: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
      })
    );
  }
};