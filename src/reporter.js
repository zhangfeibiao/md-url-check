const chalk = require('chalk');

function report(results) {
  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === 'OK') {
      console.log(chalk.green(`[✓] ${result.url} - ${result.statusCode} OK`));
      passed++;
    } else {
      const errorMsg = result.error || `HTTP ${result.statusCode}`;
      console.log(chalk.red(`[✗] ${result.url} - ${errorMsg}`));
      failed++;
    }
  }

  console.log('');
  console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${failed}`);

  return failed === 0;
}

module.exports = { report };