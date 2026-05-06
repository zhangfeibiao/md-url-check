# mdurlcheck

检查 Markdown 文件中的链接是否有效。

## 安装

```bash
npm install -g
```

## 使用

```bash
mdurlcheck "docs/**/*.md"
mdurlcheck "**/*.md" -c 20
```

## 选项

- `-c, --concurrency` 并发数，默认 10

## 退出码

- `0` 所有链接有效
- `1` 存在无效链接