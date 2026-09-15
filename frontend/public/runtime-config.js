(function configureFinancialAdvisoryRuntime(global) {
  const productionApiOrigin = 'https://ai-financial-consultant-production.up.railway.app';
  const sameOriginHosts = new Set([
    'localhost',
    '127.0.0.1',
    'ai-financial-consultant-production.up.railway.app',
  ]);

  global.__FINANCIAL_ADVISORY_CONFIG__ = Object.freeze({
    apiBaseUrl: sameOriginHosts.has(global.location.hostname) ? '' : productionApiOrigin,
  });
})(window);
