# mdcheck 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 构建一个 Node.js 命令行工具检查 Markdown 文件中的链接是否有效

**架构:** 使用原生 http/https 模块进行链接检查，chalk 进行终端颜色输出，glob 模式匹配文件

**技术栈:** Node.js 原生模块 + chalk + micromatch

---

## 文件结构

```
mdcheck/
├── bin/
│   └── mdcheck.js          # CLI 入口，shebang
├── src/
│   ├── index.js             # 主逻辑
│   ├── parser.js            # 解析 Markdown 提取 URL
│   ├── checker.js           # 检查 URL 有效性
│   └── reporter.js          # 格式化输出
├── package.json
└── README.md
```

---

## Task 1: 项目初始化和 package.json

**Files:**
- Create: `package.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "mdcheck",
  "version": "1.0.0",
  "description": "Check URLs in Markdown files",
  "main": "src/index.js",
  "bin": {
    "mdcheck": "./bin/mdcheck.js"
  },
  "scripts": {
    "test": "node test/"
  },
  "dependencies": {
    "chalk": "^4.1.2",
    "micromatch": "^4.0.5"
  },
  "engines": {
    "node": ">=14"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run: `npm install`
Expected: 安装 chalk 和 micromatch

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: initialize project with package.json"
```

---

## Task 2: CLI 入口

**Files:**
- Create: `bin/mdcheck.js`

- [ ] **Step 1: 创建 CLI 入口文件**

```javascript
#!/usr/bin/env node

const path = require('path');
const { parseArgs } = require('util');

const options = {
  concurrency: {
    type: 'string',
    short: 'c',
    default: '10'
  }
};

const { positionals, values } = parseArgs({ options, allowPositionals: true });

const globPattern = positionals[0];
if (!globPattern) {
  console.error('Usage: mdcheck <glob-pattern> [-c concurrency]');
  process.exit(1);
}

const concurrency = parseInt(values.concurrency, 10);

const index = require('../src/index');
index.run(globPattern, { concurrency });
```

- [ ] **Step 2: 设置执行权限并测试帮助信息**

Run: `chmod +x bin/mdcheck.js`
Run: `./bin/mdcheck.js --help` (should show usage)
Expected: 显示 usage 信息

- [ ] **Step 3: Commit**

```bash
git add bin/mdcheck.js
git commit -m "feat: add CLI entry point"
```

---

## Task 3: Markdown 解析器

**Files:**
- Create: `src/parser.js`

- [ ] **Step 1: 创建 parser.js**

```javascript
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
```

- [ ] **Step 2: 创建测试目录和测试文件**

Run: `mkdir -p test`
Create: `test/parser.test.js`

```javascript
const { extractUrls } = require('../src/parser');

function testExtractUrls() {
  const content = 'Check [this](https://example.com) and [that](https://test.com)';
  const urls = extractUrls(content);
  console.assert(urls.includes('https://example.com'), 'Should extract first URL');
  console.assert(urls.includes('https://test.com'), 'Should extract second URL');
  console.log('Parser tests passed');
}

testExtractUrls();
```

- [ ] **Step 3: 运行测试**

Run: `node test/parser.test.js`
Expected: 输出 "Parser tests passed"

- [ ] **Step 4: Commit**

```bash
git add src/parser.js test/parser.test.js
git commit -m "feat: add Markdown parser to extract URLs"
```

---

## Task 4: 链接检查器

**Files:**
- Create: `src/checker.js`

- [ ] **Step 1: 创建 checker.js**

```javascript
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
```

- [ ] **Step 2: 测试 checker**

Create: `test/checker.test.js`

```javascript
const { checkUrl } = require('../src/checker');

async function testChecker() {
  const result = await checkUrl('https://example.com');
  console.log('Result:', result);
  console.assert(result.url === 'https://example.com', 'Should return url');
  console.log('Checker tests passed');
}

testChecker();
```

- [ ] **Step 3: 运行测试**

Run: `node test/checker.test.js`
Expected: 输出检查结果

- [ ] **Step 4: Commit**

```bash
git add src/checker.js test/checker.test.js
git commit -m "feat: add URL checker with timeout handling"
```

---

## Task 5: 输出器

**Files:**
- Create: `src/reporter.js`

- [ ] **Step 1: 创建 reporter.js**

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/reporter.js
git commit -m "feat: add color reporter for terminal output"
```

---

## Task 6: 主逻辑整合

**Files:**
- Modify: `src/index.js` (create)

- [ ] **Step 1: 创建 index.js**

```javascript
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
```

- [ ] **Step 2: 测试完整流程**

Run: `echo '# Test\n- [Example](https://example.com)' > test.md`
Run: `./bin/mdcheck.js "test.md" -c 5`
Expected: 显示检查结果

- [ ] **Step 3: Commit**

```bash
git add src/index.js
git commit -m "feat: integrate all components in main entry"
```

---

## Task 7: README 文档

**Files:**
- Create: `README.md`

- [ ] **Step 1: 创建 README.md**

```markdown
# mdcheck

检查 Markdown 文件中的链接是否有效。

## 安装

```bash
npm install -g
```

## 使用

```bash
mdcheck "docs/**/*.md"
mdcheck "**/*.md" -c 20
```

## 选项

- `-c, --concurrency` 并发数，默认 10

## 退出码

- `0` 所有链接有效
- `1` 存在无效链接
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## 验证

1. 创建测试 Markdown 文件包含有效和无效链接
2. 运行 `mdcheck "test.md"` 验证输出
3. 检查退出码是否正确（有效链接=0，无效链接=1）

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-06-mdcheck-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**