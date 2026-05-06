const { checkUrl } = require('../src/checker');

async function testChecker() {
  const result = await checkUrl('https://example.com');
  console.log('Result:', result);
  console.assert(result.url === 'https://example.com', 'Should return url');
  console.log('Checker tests passed');
}

testChecker();