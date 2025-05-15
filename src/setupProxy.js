console.log('[setupProxy] File loaded at: ', new Date().toISOString());
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  console.log('[setupProxy] Initializing proxy...');
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // Keep /api prefix
      },
      logLevel: 'debug',
      onProxyReq: (proxyReq, req) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:5000${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(500).send('Proxy error');
      },
    })
  );
};