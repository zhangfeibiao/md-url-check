const fs = require('fs');
const path = require('path');
const micromatch = require('micromatch');

const EXCLUDE_DIRS = ['node_modules', '.git', '.svn', 'coverage'];

function extractUrls(content) {
  const urlRegex = /https?:\/\/[^\s)>"\]]+/g;
  const urls = content.match(urlRegex) || [];
  return [...new Set(urls)];
}

function findFilesRecursive(dir, pattern) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return results;
  }

  for (const entry of entries) {
    if (EXCLUDE_DIRS.includes(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesRecursive(fullPath, pattern));
    } else if (entry.isFile() && micromatch.isMatch(entry.name, pattern)) {
      results.push(fullPath);
    }
  }
  return results;
}

function parseFiles(globPattern) {
  const cwd = process.cwd();

  // Check if it's a direct file path (not a glob pattern with wildcards)
  if (!globPattern.includes('*') && fs.existsSync(globPattern) && fs.statSync(globPattern).isFile()) {
    const content = fs.readFileSync(globPattern, 'utf-8');
    return extractUrls(content);
  }

  // For glob patterns, extract base directory and pattern
  const lastSlash = globPattern.lastIndexOf('/');
  let baseDir = globPattern.includes('/') ? globPattern.slice(0, lastSlash) : '.';
  const pattern = globPattern.includes('/') ? globPattern.slice(lastSlash + 1) : globPattern;

  // Handle cases where baseDir doesn't exist as a directory
  const searchDir = fs.existsSync(baseDir) && fs.statSync(baseDir).isDirectory() ? baseDir : '.';

  const files = findFilesRecursive(searchDir, pattern);
  const urls = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const fileUrls = extractUrls(content);
    urls.push(...fileUrls);
  }

  return [...new Set(urls)];
}

module.exports = { extractUrls, parseFiles };