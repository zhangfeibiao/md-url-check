const fs = require('fs');
const path = require('path');
const micromatch = require('micromatch');

function extractUrls(content) {
  const urlRegex = /https?:\/\/[^\s)>"\]]+/g;
  const urls = content.match(urlRegex) || [];
  return [...new Set(urls)];
}

function parseFiles(globPattern) {
  const files = micromatch.sync(process.cwd(), globPattern);
  const urls = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const fileUrls = extractUrls(content);
    urls.push(...fileUrls);
  }

  return [...new Set(urls)];
}

module.exports = { extractUrls, parseFiles };