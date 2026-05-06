const { parseFiles } = require('./parser');
const { checkUrls } = require('./checker');
const { report } = require('./reporter');

async function run(globPattern, options = {}) {
  const urls = parseFiles(globPattern);
  console.log(`Found ${urls.length} URLs to check`);
  console.log('');

  const startTime = Date.now();
  const results = await checkUrls(urls, options);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\nElapsed: ${elapsed}s`);
  const allPassed = report(results);

  process.exit(allPassed ? 0 : 1);
}

module.exports = { run };
