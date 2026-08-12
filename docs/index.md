---
layout: home

hero:
  name: "SGAO 知识库"
  tagline: |-
    记录真实实践
    沉淀可复用经验
  actions:
    - theme: brand
      text: 软考专题
      link: /ruankao/system-architect/
    - theme: alt
      text: 平台架构
      link: /guide/platform-architecture
    - theme: alt
      text: Git 专栏
      link: /git/
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
    </div>
  </section>

  <section class="portal-section">
    <div class="portal-heading">
      <span class="portal-heading-icon">📘</span>
      <div>
        <h2>系列专栏</h2>
        <p>按章节连续学习，从基础认知走到真实项目实践</p>
      </div>
    </div>
    <div class="portal-book-list">
      <a class="portal-book-card" href="/git/">
        <span class="portal-book-index">BOOK 01</span>
        <div>
          <strong>Git 完整专栏</strong>
          <p>12 章系统课程：原理、命令、分支、协作、CI/CD、事故恢复与 AI 工作流</p>
        </div>
        <i>开始阅读 →</i>
      </a>
      <a class="portal-book-card" href="/ruankao/system-architect/">
        <span class="portal-book-index">BOOK 02</span>
        <div>
          <strong>系统架构设计师</strong>
          <p>软考专题：已更新计算机硬件、操作系统、数据库系统、嵌入式技术、计算机网络、系统配置与信息系统基础</p>
        </div>
        <i>开始阅读 →</i>
      </a>
      <a class="portal-book-card" href="/cloudflare/">
        <span class="portal-book-index">BOOK 03</span>
        <div>
          <strong>Cloudflare 实战专题</strong>
          <p>从域名接入、DNS、Workers 自动部署到 R2 图片中心与多站点实践</p>
        </div>
        <i>开始阅读 →</i>
      </a>
      <a class="portal-book-card" href="/cloud-native/">
        <span class="portal-book-index">BOOK 04</span>
        <div>
          <strong>Docker + Kubernetes 云原生专题</strong>
          <p>已更新 01–50 章：Docker 工程实践与 Kubernetes 架构、治理、交付、扩展和生产运维</p>
        </div>
        <i>开始阅读 →</i>
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
      <a class="portal-card" href="/cloudflare/travel-worker-deployment">
        <strong>Travel 旅行站</strong>
        <span>第三个 Worker、GitHub 自动构建与独立子域名</span>
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
        <a href="/ruankao/system-architect/">
          <span>系统架构设计师 · 已更新至第八章信息系统基础知识</span><i>→</i>
        </a>
        <a href="/git/">
          <span>Git 完整专栏（12 章）</span><i>→</i>
        </a>
        <a href="/ai/api-cli-prompt-mcp-skill-agent">
          <span>API、CLI、Prompt、MCP、Skill 与 Agent</span><i>→</i>
        </a>
        <a href="/guide/platform-architecture">
          <span>SGAO Platform 架构</span><i>→</i>
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
