# mdcheck 工具设计

## 目标

检查 Markdown 文件中的链接是否有效，输出详细的检查报告。

## 核心组件

### 1. CLI 入口 (`bin/mdcheck.js`)
- Shebang: `#!/usr/bin/env node`
- 参数：`glob` 模式（位置参数）、`-c/--concurrency` 并发数（默认 10）

### 2. Markdown 解析器 (`src/parser.js`)
- 正则提取所有 `http(s)://` 链接
- 支持 CommonMark 和部分 GFM

### 3. 链接检查器 (`src/checker.js`)
- 连接超时 5s，读取超时 10s
- 跟随最多 5 次重定向
- 判定有效：HTTP 状态码 2xx

### 4. 输出器 (`src/reporter.js`)
- `[✓]` 绿色 - 成功链接，显示状态码
- `[✗]` 红色 - 失败链接，显示错误原因
- 汇总统计：总数/通过/失败/耗时

## 项目结构

```
mdcheck/
├── bin/
│   └── mdcheck.js        # CLI 入口
├── src/
│   ├── index.js          # 主逻辑
│   ├── parser.js         # 提取 URL
│   ├── checker.js        # 检查 URL
│   └── reporter.js       # 格式化输出
├── package.json
└── README.md
```

## 退出码

- `0` — 所有链接有效
- `1` — 存在无效链接或检查过程出错