const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for NewsAPI
  app.use(
    '/api/news',
    createProxyMiddleware({
      target: 'https://newsapi.org',
      changeOrigin: true,
      pathRewrite: {
        '^/api/news': '/v2',
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
};