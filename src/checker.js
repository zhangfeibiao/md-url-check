const http = require('http');
const https = require('https');

const CONNECT_TIMEOUT = 5000;
const READ_TIMEOUT = 5000;
const MAX_REDIRECTS = 5;

function checkUrl(url) {
  return new Promise((resolve) => {
    let redirectCount = 0;

    function tryRequest(currentUrl) {
      const parsedUrl = new URL(currentUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'HEAD',
        timeout: CONNECT_TIMEOUT
      };

      const req = client.request(options, (res) => {
        // Handle redirects (3xx)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectCount >= MAX_REDIRECTS) {
            resolve({ url, status: 'FAILED', error: 'Too many redirects' });
            return;
          }
          redirectCount++;
          // Handle relative redirects
          const redirectUrl = new URL(res.headers.location, currentUrl).toString();
          tryRequest(redirectUrl);
          return;
        }

        // Success: 2xx
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ url, status: 'OK', statusCode: res.statusCode });
        } else {
          // Other status codes (4xx, 5xx) are failures
          resolve({ url, status: 'FAILED', statusCode: res.statusCode });
        }
      });

      req.on('error', (err) => {
        resolve({ url, status: 'FAILED', error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ url, status: 'FAILED', error: 'Timeout' });
      });

      req.setTimeout(READ_TIMEOUT, () => {
        req.destroy();
        resolve({ url, status: 'FAILED', error: 'Timeout' });
      });

      req.end();
    }

    tryRequest(url);
  });
}

async function checkUrls(urls, options = {}) {
  const { concurrency = 10 } = options;
  const results = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
  }

  return results;
}

module.exports = { checkUrl, checkUrls };