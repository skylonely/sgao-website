---
layout: home

hero:
  name: "SGAO 知识库"
  tagline: |-
    记录真实实践
    沉淀可复用经验
  actions:
    - theme: brand
      text: 查看平台架构
      link: /guide/platform-architecture
    - theme: alt
      text: Cloudflare 文档
      link: /cloudflare/
---

<div id="knowledge-sections" class="docs-portal">
  <section class="portal-section">
    <div class="portal-heading">
      <span class="portal-heading-icon">🧭</span>
      <div>
        <h2>核心文档</h2>
        <p>了解平台组成、部署方式与文档维护规则</p>
      </div>
    </div>
    <div class="portal-grid portal-grid-technical">
      <a class="portal-card" href="/guide/platform-architecture">
        <strong>平台架构</strong>
        <span>统一域名、Cloudflare、Worker 与 R2</span>
        <i>→</i>
      </a>
      <a class="portal-card" href="/cloudflare/">
        <strong>Cloudflare</strong>
        <span>部署、DNS、域名与图片中心实践</span>
        <i>→</i>
      </a>
      <a class="portal-card" href="/guide/writing-standard">
        <strong>文档写作规范</strong>
        <span>统一文档结构、命名和维护方式</span>
        <i>→</i>
      </a>
      <a class="portal-card" href="/ai/">
        <strong>AI 基础</strong>
        <span>API、CLI、Prompt、MCP、Skill 与 Agent</span>
        <i>→</i>
      </a>
      <a class="portal-card" href="/git/">
        <strong>Git 与 GitHub</strong>
        <span>版本控制、协作流程、Actions 与 Pages</span>
        <i>→</i>
      </a>
    </div>
  </section>

  <section class="portal-section">
    <div class="portal-heading">
      <span class="portal-heading-icon">☁️</span>
      <div>
        <h2>Cloudflare 实践</h2>
        <p>当前项目已经落地并持续维护的技术方案</p>
      </div>
    </div>
    <div class="portal-grid portal-grid-technical">
      <a class="portal-card" href="/cloudflare/workers-auto-deploy">
        <strong>Workers 自动部署</strong>
        <span>主站与知识库双 Worker 部署流程</span>
        <i>→</i>
      </a>
      <a class="portal-card" href="/cloudflare/dns-domain">
        <strong>DNS 与域名</strong>
        <span>域名解析、代理状态和 Worker 绑定</span>
        <i>→</i>
      </a>
      <a class="portal-card" href="/cloudflare/spaceship-worker-deployment">
        <strong>Spaceship 域名部署</strong>
        <span>购买域名、接入 Cloudflare 并绑定 Worker</span>
        <i>→</i>
      </a>
      <a class="portal-card" href="/cloudflare/image-center">
        <strong>Image Center</strong>
        <span>R2 图片存储、上传、访问与缓存</span>
        <i>→</i>
      </a>
    </div>
  </section>

  <div class="portal-columns">
    <section class="portal-list-section">
      <div class="portal-heading compact">
        <span class="portal-heading-icon">📝</span>
        <div>
          <h2>最近更新</h2>
          <p>当前维护中的核心内容</p>
        </div>
      </div>
      <div class="portal-links">
        <a href="/git/github-complete-guide">
          <span>一篇文章搞定 GitHub（2026 完整版）</span><i>→</i>
        </a>
        <a href="/ai/api-cli-prompt-mcp-skill-agent">
          <span>API、CLI、Prompt、MCP、Skill 与 Agent</span><i>→</i>
        </a>
        <a href="/guide/platform-architecture">
          <span>SGAO Platform 架构 v2.0</span><i>→</i>
        </a>
        <a href="/cloudflare/image-center">
          <span>Image Center R2 架构</span><i>→</i>
        </a>
        <a href="/cloudflare/dns-domain">
          <span>DNS 与域名配置</span><i>→</i>
        </a>
        <a href="/cloudflare/spaceship-worker-deployment">
          <span>Spaceship Worker 部署指南</span><i>→</i>
        </a>
      </div>
    </section>
    <section class="portal-list-section">
      <div class="portal-heading compact">
        <span class="portal-heading-icon">⭐</span>
        <div>
          <h2>推荐阅读顺序</h2>
          <p>从全局架构逐步进入具体实践</p>
        </div>
      </div>
      <div class="portal-links">
        <a href="/guide/platform-architecture"><span>1. 平台架构</span><i>→</i></a>
        <a href="/cloudflare/workers-auto-deploy"><span>2. 自动部署</span><i>→</i></a>
        <a href="/cloudflare/image-center"><span>3. 图片中心</span><i>→</i></a>
      </div>
    </section>
  </div>
</div>
