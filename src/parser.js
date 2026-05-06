const fs = require('fs');
const path = require('path');
const micromatch = require('micromatch');

function extractUrls(content) {
  const urlRegex = /https?:\/\/[^\s)>"\]]+/g;
  const urls = content.match(urlRegex) || [];
  return [...new Set(urls)];
}

function parseFiles(globPattern) {
  // Get all files in current directory (simple approach)
  const cwd = process.cwd();
  let files;

  if (fs.statSync(globPattern).isFile()) {
    files = [globPattern];
  } else {
    // For glob patterns, use micromatch with file list
    // Read all files recursively or use simple readdir
    const pattern = globPattern.replace(/^\.\//, '');
    files = fs.readdirSync(cwd)
      .filter(f => micromatch.isMatch(f, pattern));
  }

  const urls = [];

  for (const file of files) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const fileUrls = extractUrls(content);
      urls.push(...fileUrls);
    }
  }

  return [...new Set(urls)];
}

module.exports = { extractUrls, parseFiles };