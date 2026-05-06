# Superpowers 项目完成总结

## 什么是 Superpowers

Superpowers 是一套 Claude Code 的插件/技能系统，提供了经过封装的最佳实践工作流程。它不是替代品，而是约束——让 AI 在执行任务时遵循一套经过验证的流程，减少随意性和错误。

---

## 为什么要使用 Superpowers

### 核心好处

| 好处 | 说明 |
|------|------|
| **避免"直觉陷阱"** | AI 容易凭直觉快速做事，但直觉会跳过重要步骤（设计、计划、验证） |
| **流程标准化** | 每个技能都有明确的输入、步骤、输出，不会遗漏关键环节 |
| **质量可控** | brainstorming → writing-plans → execution → finishing，每步都有检查点 |
| **上下文隔离** | subagent 独立执行任务，避免上下文污染 |
| **可追溯** | 设计文档、计划文档、commit 历史完整保留 |

### 不使用会怎样

想象一个没有 Superpowers 的场景：

```
用户: "帮我做一个 mdurlcheck 工具"

AI (凭直觉):
1. 创建 package.json ✅
2. 创建 parser.js ✅
3. 创建 checker.js ✅
4. 创建 reporter.js ✅
5. 创建 index.js ✅
6. npm install ✅
7. 测试 ✅
8. Done ✅
```

**问题：**
- 没有设计阶段 → 需求模糊时容易返工
- 没有计划文档 → 任务边界不清晰，容易遗漏
- 没有验证检查点 → 可能带着 bug 进入下一阶段
- 没有统一的 exit 标准 → 做到什么程度算"完成"？

**本质区别：**
- 无 Superpowers：线性执行，快速交付，但质量依赖 AI 自身能力
- 有 Superpowers：流程约束，确保每个环节都被正确处理，质量可预期

---

## 如何发现和触发 Superpowers

### 触发机制

当用户会话开始时，System Prompt 中嵌入了这段逻辑：

```
"如果存在 1% 的可能性某个 skill 会适用，你必须调用它"
```

这句话强制执行了"技能优先检查"原则。

### 发现过程

1. **会话初始化时** - System 显示可用技能列表
2. **用户提出任务** - 我先检查是否有技能适用
3. **用户说"做一个 Node.js 命令行工具"** - 这属于"创意工作" → 触发 `brainstorming`
4. **brainstorming 完成后** - 自动触发 `writing-plans`
5. **计划完成后** - 自动触发 `subagent-driven` 执行
6. **所有任务完成** - 自动触发 `finishing`

### 技能列表

```
superpowers:brainstorming              # 必用，创意工作前
superpowers:writing-plans               # 必用，多步骤任务前
superpowers:subagent-driven-development # 常用，计划执行
superpowers:executing-plans            # 备选，跨 session 执行
superpowers:finishing-a-development-branch # 必用，收尾
superpowers:systematic-debugging        # 调试时用
superpowers:test-driven-development     # TDD 场景
superpowers:requesting-code-review     # 需要 code review 时
superpowers:receiving-code-review      # 被 review 时
superpowers:verification-before-completion # 完成前验证
superpowers:using-git-worktrees        # 需要隔离时
superpowers:dispatching-parallel-agents # 可并行任务
... 等等
```

---

## 未使用技能的决策逻辑

### 决策原则

**每个技能都有明确的使用场景，不是越多越好。**

| 技能 | 未使用原因 | 决策依据 |
|------|-----------|---------|
| `using-git-worktrees` | 在主仓库工作，不需要隔离 | 场景不匹配 |
| `executing-plans` | 与 subagent-driven 二选一，选择了后者 | 同等能力，选择更高效的 |
| `test-driven-development` | 实现型任务，plan 已含测试步骤 | plan 中已覆盖 |
| `requesting/receiving-code-review` | 个人项目，快速迭代 | 场景不适用 |
| `verification-before-completion` | finishing 阶段已做验证 | 功能重复 |
| `systematic-debugging` | 过程顺利，无 bug | 无需触发条件 |
| `dispatching-parallel-agents` | 任务有顺序依赖 | 并行会出错 |

### 决策流程图

```
遇到问题/任务
    ↓
检查是否有对应技能
    ↓
技能触发条件满足？ ─── NO ──→ 不用此技能
    ↓ YES
会产生冲突吗？ ─── YES ──→ 不用此技能（选择更合适的）
    ↓ NO
此技能是否冗余？ ─── YES ──→ 不用此技能（其他技能已覆盖）
    ↓ NO
使用此技能 ✅
```

### 关键原则

1. **宁缺毋滥** - 技能不是越多越好，不适用的技能会产生干扰
2. **场景匹配** - 根据当前任务特征选择最合适的技能
3. **效率优先** - 功能重复时选择更高效的那个
4. **安全第一** - 有冲突风险的技能避免使用

---

## 整体流程回顾

```
需求 → Brainstorming → 设计文档 → 实现计划 → Subagent执行 → 收尾
```

### 各阶段职责

| 阶段 | 技能 | 输入 | 输出 |
|------|------|------|------|
| 设计 | brainstorming | 用户需求 | 设计文档 |
| 计划 | writing-plans | 设计文档 | 实现计划 |
| 执行 | subagent-driven | 实现计划 | 代码 + 测试 |
| 收尾 | finishing | 完成的代码 | PR/Merge |

---

## 使用到的技能详解

### 1. `superpowers:brainstorming` ✅

**触发时机：** 用户提出"做一个 X"（创意工作）

**做了什么：**
- 检查项目上下文（新仓库）
- 询问澄清问题（输出模式、超时配置）
- 呈现设计方案（组件架构、文件结构）
- 确认设计后写文档并 commit

**为什么必须用：** 磨刀不误砍柴工，设计阶段的投入产出比最高

---

### 2. `superpowers:writing-plans` ✅

**触发时机：** brainstorming 完成后

**做了什么：**
- 将设计拆解为 7 个具体 task
- 每个 task 有明确的文件、步骤、测试命令
- 包含 commit 指令，确保小步提交

**为什么必须用：** 没有计划就开始写代码是"边想边做"，有计划是"想好再做"

---

### 3. `superpowers:subagent-driven-development` ✅

**触发时机：** 计划完成后

**做了什么：**
- 创建 7 个 Task 追踪进度
- 顺序 dispatch subagent 实现每个 task
- 每个 task 分 3 个阶段：implement → spec review → code quality review

**为什么选择它：** 任务独立、同一 session、不需要并行

---

### 4. `superpowers:finishing-a-development-branch` ✅

**触发时机：** 所有 task 完成后

**做了什么：**
- 验证测试（运行 mdurlcheck 验证功能）
- 检测环境（normal repo，无 worktree）
- 呈现 4 个选项
- 用户选择 Push，执行推送

**为什么必须用：** 收尾阶段需要标准化的结束流程，避免"做完但没结束"

---

## 技能使用全景图

```
                        使用
                       ↙    ↘
用户请求 → brainstorming → writing-plans → subagent-driven → finishing → 完成
                ↑              ↑                ↑               ↑
                │              │                │               │
           设计文档        7个Task          执行并review       验证+选项
           + commit        + commit           + commit          + push
```

---

## mdurlcheck 项目实现记录

### 任务列表

| Task | 内容 | 状态 |
|------|------|------|
| 1 | 项目初始化和 package.json | ✅ |
| 2 | CLI 入口 | ✅ |
| 3 | Markdown 解析器 | ✅ |
| 4 | 链接检查器 | ✅ |
| 5 | 输出器 | ✅ |
| 6 | 主逻辑整合 | ✅ |
| 7 | README 文档 | ✅ |

### 最终验证

```bash
# 测试用例
echo '# Test
- [Example](https://example.com)
- [Broken](https://this-domain-does-not-exist.com)
' > test.md

mdurlcheck "test.md"

# 输出
# Found 3 URLs to check
# [✓] https://example.com - 200 OK
# [✗] https://this-domain-does-not-exist.com - getaddrinfo ENOTFOUND
# Exit code: 1 ✅
```

### Git 提交记录

1. `feat: initialize project with package.json`
2. `feat: add CLI entry point`
3. `feat: add Markdown parser to extract URLs`
4. `feat: add URL checker with timeout handling`
5. `feat: add color reporter for terminal output`
6. `feat: integrate all components in main entry`
7. `docs: add README`

---

## 总结

**Superpowers 的价值不在于"用了多少技能"，而在于"在正确的时机用了正确的技能"。**

- 设计阶段用 brainstorming → 确保方向正确
- 计划阶段用 writing-plans → 确保边界清晰
- 执行阶段用 subagent-driven → 确保效率和质量
- 收尾阶段用 finishing → 确保完整结束

不使用 Superpowers 也能完成任务，但质量和可预期性会下降。用了 Superpowers，流程标准化，结果可预期。