const { extractUrls } = require('../src/parser');

function testExtractUrls() {
  const content = 'Check [this](https://example.com) and [that](https://test.com)';
  const urls = extractUrls(content);
  console.assert(urls.includes('https://example.com'), 'Should extract first URL');
  console.assert(urls.includes('https://test.com'), 'Should extract second URL');
  console.log('Parser tests passed');
}

testExtractUrls();