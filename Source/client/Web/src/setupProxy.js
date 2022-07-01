const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://test-jskak.run.goorm.io/',
      changeOrigin: true,
    })
  );
};