# 一篇文档搞懂 API、CLI、Prompt、MCP、Skill 与 Agent

随着 ChatGPT、Codex、Claude、Gemini 等 AI 工具的普及，我们经常会看到 API、CLI、Prompt、MCP、Skill、Agent 等概念。

它们彼此有关联，但承担的职责不同。本文将从定义、作用、关系和实际应用四个角度进行介绍。

## 一、API（Application Programming Interface）

API 是程序与程序之间进行通信的接口。

简单理解：

> API = 软件提供给其他软件调用的能力。

例如，浏览器可以通过天气 API 获取天气数据：

```text
浏览器
  ↓
天气 API
  ↓
返回天气数据
```

开发中常见的 API 包括：

- OpenAI API
- GitHub API
- Cloudflare API
- 微信支付 API

API 通常具有以下特点：

- 面向程序
- 返回 JSON、XML 等结构化数据
- 通常需要使用 API Key、Token 等方式鉴权

## 二、CLI（Command Line Interface）

CLI 是命令行界面。用户或脚本可以通过在终端中输入命令来控制程序。

例如：

```bash
git status
npm install
docker compose up -d
wrangler deploy
```

CLI 的主要优势包括：

- 便于自动化
- 可以编写脚本
- 执行效率高

## 三、Prompt

Prompt 是提供给 AI 的输入或指令。

例如：

> 帮我生成一个 Vue 登录页面。

Prompt 越清晰，AI 就越容易准确理解任务。一个好的 Prompt 通常包括：

- 背景
- 目标
- 约束
- 输出格式

## 四、MCP（Model Context Protocol）

MCP 是一种让 AI 应用与外部工具、数据源进行标准化连接的开放协议。

可以把它理解为：

> MCP = AI 应用连接外部能力的“USB-C 接口”。

支持 MCP 的 AI 应用可以通过统一方式连接不同能力，例如：

- GitHub
- 数据库
- 文件系统
- 浏览器
- 企业系统

MCP 负责定义连接和交互方式，真正执行操作的仍然是它所连接的工具或服务。

## 五、Skill

Skill（技能）是为 AI 封装的专门知识、操作流程或工具使用方法。

例如：

- 编写代码
- 生成文档
- 查询数据库
- 操作 GitHub

Skill 通常聚焦某一类任务，并指导 AI 稳定、规范地完成它。不同 AI 平台对 Skill 的具体定义和实现方式可能不同。

## 六、Agent（智能体）

Agent 是能够围绕目标自主推进任务的 AI 系统。

它通常具备以下能力：

- 理解目标
- 制定计划
- 调用工具
- 执行任务
- 检查结果
- 持续迭代

例如，一个开发网站的 Agent 可能按下面的流程工作：

```text
分析需求
  ↓
生成代码
  ↓
调用 Git
  ↓
部署到 Cloudflare
  ↓
检查结果
```

Agent 往往会组合多个 Skill，并通过 API、CLI 或 MCP 工具与外部系统交互。

## 七、它们之间的关系

```text
用户
  ↓
Prompt
  ↓
Agent
  ├── 使用 Skill 指导具体任务
  ├── 通过 API 调用服务
  ├── 通过 CLI 操作程序
  └── 通过 MCP 连接工具与数据
```

- **Prompt**：告诉 AI 要做什么。
- **Agent**：围绕目标组织并执行任务。
- **Skill**：为具体任务提供专门能力或操作方法。
- **API**：让程序调用外部服务。
- **CLI**：让人或脚本通过命令操作程序。
- **MCP**：让 AI 应用以标准方式连接工具与上下文。

这些概念不完全处于同一层级。例如，API 和 CLI 是操作软件的接口，MCP 是连接 AI 应用与外部能力的协议，而 Skill 和 Agent 是 AI 平台中的能力组织方式。

## 八、实际开发中的例子

以一个前端开发流程为例：

```text
用户提交 Prompt
  ↓
ChatGPT / Codex 等 AI 应用
  ↓
Agent 规划并执行任务
  ├── 使用前端开发 Skill
  ├── 通过 GitHub API 管理代码
  ├── 通过 Docker CLI 运行环境
  ├── 通过 Cloudflare API 完成部署
  └── 通过 MCP 获取工具和项目上下文
```

最终可以完成：

- 生成代码
- 提交 Git
- 自动部署
- 编写文档

## 九、一张表总结

| 名称 | 是什么 | 面向对象 | 典型示例 |
| --- | --- | --- | --- |
| API | 软件接口 | 程序 | OpenAI API |
| CLI | 命令行界面 | 人、脚本 | Git、Docker |
| Prompt | 提供给 AI 的输入或指令 | AI | “生成登录页” |
| MCP | AI 应用连接工具和数据的协议 | AI 应用、工具 | 连接 GitHub、数据库 |
| Skill | 封装的专门知识或操作流程 | AI | 写代码、生成文档 |
| Agent | 围绕目标自主执行任务的 AI 系统 | 用户、AI 系统 | 自动开发助手 |

## 十、总结

- API：让软件之间进行通信。
- CLI：通过命令操作软件。
- Prompt：告诉 AI 要做什么。
- MCP：以标准方式连接 AI 应用、工具与数据。
- Skill：为 AI 提供完成特定任务的方法。
- Agent：组织多种能力，自主完成复杂任务。

理解这些概念后，就能更容易看懂 ChatGPT、Codex、Claude Code 等现代 AI 开发平台的整体工作方式。

## 相关文章

- [AI 基础](/ai/)
- [SGAO Platform 架构](/guide/platform-architecture)
