const http = require('http');
const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'HEAD',
      timeout: 5000,
      maxRedirects: 5
    };

    const req = client.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ url, status: 'OK', statusCode: res.statusCode });
      } else {
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

    req.setTimeout(5000);
    req.end();
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