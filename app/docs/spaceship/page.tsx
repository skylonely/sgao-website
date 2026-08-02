import type { Metadata } from "next";
import CopyCode from "./CopyCode";
import styles from "./spaceship.module.css";

export const metadata: Metadata = {
  title: "Cloudflare + Spaceship Worker 部署指南｜拾光导航",
  description:
    "从 Spaceship 购买域名、接入 Cloudflare，到绑定 Cloudflare Worker 自定义域名的完整部署指南。",
};

const navigation = [
  ["overview", "部署概览"],
  ["buy-domain", "购买域名"],
  ["add-cloudflare", "接入 Cloudflare"],
  ["nameservers", "修改 Nameserver"],
  ["dns", "检查 DNS"],
  ["worker-domain", "绑定 Worker"],
  ["verify", "验证部署"],
  ["faq", "常见问题"],
  ["deployment-log", "实际部署记录"],
  ["next", "后续扩展"],
] as const;

const faqs = [
  {
    question: "Cloudflare 一直显示等待接管怎么办？",
    answer:
      "Nameserver 修改后需要等待全球 DNS 更新。一般几分钟即可完成，个别情况下可能需要 24～48 小时。请先确认 Spaceship 中填写的两个地址与 Cloudflare 分配的完全一致。",
  },
  {
    question: "为什么无法绑定根域名？",
    answer:
      "根域通常还保留着旧的 A 或 CNAME 记录。进入 Cloudflare 的 DNS 记录页面，确认目标主机名没有冲突记录后，再重新添加 Worker 自定义域。",
  },
  {
    question: "HTTPS 证书需要自己配置吗？",
    answer:
      "不需要。通过 Worker 自定义域绑定成功后，Cloudflare 会自动签发并管理 SSL 证书。",
  },
  {
    question: "为什么 www.sgao.cc 不能访问？",
    answer:
      "根域和 www 是两个不同的主机名。可以为 www 单独绑定 Worker，自定义 CNAME，或配置重定向统一跳转到 sgao.cc。",
  },
] as const;

export default function SpaceshipGuidePage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="返回拾光导航首页">
          <span className={styles.brandMark}>↗</span>
          <span>
            <strong>拾光导航</strong>
            <small>FLIGHT DOCS</small>
          </span>
        </a>
        <div className={styles.breadcrumb} aria-label="面包屑导航">
          <a href="/">首页</a>
          <span>/</span>
          <a href="#overview">技术文档</a>
          <span>/</span>
          <strong>Spaceship 部署</strong>
        </div>
        <a className={styles.homeButton} href="/">
          返回导航 <span>↗</span>
        </a>
      </header>

      <section className={styles.hero} id="overview">
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>
            <span />
            CLOUDFLARE DEPLOY GUIDE
          </div>
          <h1>
            从域名到上线，
            <br />
            <em>一次起飞。</em>
          </h1>
          <p>
            将 Spaceship 注册的域名接入 Cloudflare，并绑定到 Cloudflare
            Workers 的完整实践指南。
          </p>
          <div className={styles.heroActions}>
            <a href="#buy-domain">开始部署 <span>↓</span></a>
            <a href="#deployment-log">查看实际案例</a>
          </div>
          <div className={styles.heroMeta}>
            <div><strong>10</strong><span>核心章节</span></div>
            <i />
            <div><strong>15 min</strong><span>预计配置时间</span></div>
            <i />
            <div><strong>Free</strong><span>可用套餐</span></div>
          </div>
        </div>

        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.orbitOne} />
          <div className={styles.orbitTwo} />
          <div className={styles.planet}>CF</div>
          <div className={styles.satellite}>S</div>
          <span>↗</span>
        </div>
      </section>

      <div className={styles.layout}>
        <aside className={styles.aside}>
          <p>IN THIS GUIDE</p>
          <nav aria-label="文章目录">
            {navigation.map(([id, label], index) => (
              <a href={`#${id}`} key={id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {label}
              </a>
            ))}
          </nav>
          <div className={styles.asideCard}>
            <span>提示</span>
            <strong>操作前准备</strong>
            <p>准备一个已购买的域名，以及可正常登录的 Cloudflare 账号。</p>
          </div>
        </aside>

        <article className={styles.article}>
          <section className={styles.intro}>
            <span className={styles.sectionNumber}>00</span>
            <div>
              <p className={styles.overline}>BEFORE YOU START</p>
              <h2>这篇指南会完成什么？</h2>
              <p>
                你将把域名的 DNS 管理权交给 Cloudflare，清理可能冲突的旧记录，
                然后让根域名直接指向已经部署好的 Worker。最终访问
                <code>https://sgao.cc</code> 就能打开网站。
              </p>
            </div>
          </section>

          <div className={styles.flow} aria-label="部署流程">
            <div><span>01</span><strong>Spaceship</strong><small>购买域名</small></div>
            <b>→</b>
            <div><span>02</span><strong>Cloudflare</strong><small>接管 DNS</small></div>
            <b>→</b>
            <div><span>03</span><strong>Workers</strong><small>绑定域名</small></div>
            <b>→</b>
            <div><span>04</span><strong>Online</strong><small>验证上线</small></div>
          </div>

          <section className={styles.guideSection} id="buy-domain">
            <SectionHeading number="01" eyebrow="DOMAIN" title="购买域名" />
            <p>
              在 <strong>Spaceship</strong> 购买准备使用的域名，例如
              <code>sgao.cc</code>。刚购买时，域名默认使用 Spaceship
              提供的 Nameserver，接下来需要将它修改为 Cloudflare 分配的地址。
            </p>
            <div className={styles.infoCard}>
              <span>◎</span>
              <div>
                <strong>域名是网站的入口</strong>
                <p>先确认域名状态正常，并且你拥有修改 Nameserver 的权限。</p>
              </div>
            </div>
          </section>

          <section className={styles.guideSection} id="add-cloudflare">
            <SectionHeading number="02" eyebrow="CLOUDFLARE" title="添加域名到 Cloudflare" />
            <ol className={styles.steps}>
              <li><span>1</span><div><strong>登录 Cloudflare</strong><p>进入账号控制台，点击 Add a Site。</p></div></li>
              <li><span>2</span><div><strong>输入根域名</strong><p>填写域名，例如 sgao.cc，不需要添加 https://。</p></div></li>
              <li><span>3</span><div><strong>选择 Free 套餐</strong><p>个人网站和普通 Worker 项目可先使用免费套餐。</p></div></li>
              <li><span>4</span><div><strong>保存分配的 Nameserver</strong><p>Cloudflare 会显示两个专属于当前域名的服务器地址。</p></div></li>
            </ol>
            <div className={styles.codeGroup}>
              <CopyCode value="donald.ns.cloudflare.com" label="NAMESERVER 01" />
              <CopyCode value="violet.ns.cloudflare.com" label="NAMESERVER 02" />
            </div>
            <p className={styles.note}>
              上面的地址仅为示例。实际配置时，必须使用 Cloudflare
              控制台为你的域名显示的两个 Nameserver。
            </p>
          </section>

          <section className={styles.guideSection} id="nameservers">
            <SectionHeading number="03" eyebrow="SPACESHIP" title="修改 Nameserver" />
            <p>回到 Spaceship 域名管理后台，进入下面的设置路径：</p>
            <CopyCode
              value="Spaceship → 域名管理 → Nameservers → Custom Nameservers"
              label="SETTING PATH"
            />
            <p>
              将原有 Nameserver 替换为 Cloudflare 分配的两个地址并保存。
              DNS 更新一般只需几分钟，最长可能需要 24～48 小时。
            </p>
            <div className={styles.statusCard}>
              <span className={styles.pulse} />
              <div>
                <small>CLOUDFLARE STATUS</small>
                <strong>您的域现在受 Cloudflare 保护</strong>
                <p>看到这条状态，说明域名接管已经成功。</p>
              </div>
            </div>
          </section>

          <section className={styles.guideSection} id="dns">
            <SectionHeading number="04" eyebrow="DNS CHECK" title="检查并清理 DNS" />
            <p>
              Cloudflare 扫描并导入 DNS 时，可能自动保留 Spaceship
              中原有的记录。如果你准备让 Worker 直接托管网站，没有其他源服务器，
              需要检查并删除与目标域名冲突的旧记录。
            </p>
            <div className={styles.compare}>
              <div>
                <span className={styles.bad}>×</span>
                <strong>需要检查</strong>
                <p>根域名上已有的 A 或 CNAME 记录</p>
              </div>
              <div>
                <span className={styles.good}>✓</span>
                <strong>目标状态</strong>
                <p>目标主机名可直接绑定到 Worker</p>
              </div>
            </div>
            <div className={styles.warning}>
              <span>!</span>
              <p>
                只删除与 Worker 目标主机名冲突的记录。邮箱相关的 MX、SPF、
                DKIM 和 DMARC 记录不要随意删除。
              </p>
            </div>
          </section>

          <section className={styles.guideSection} id="worker-domain">
            <SectionHeading number="05" eyebrow="WORKERS" title="绑定 Worker 自定义域" />
            <p>在 Cloudflare 控制台进入：</p>
            <CopyCode
              value="Workers & Pages → 选择 Worker → Settings → Domains & Routes → Add"
              label="CLOUDFLARE PATH"
            />
            <div className={styles.domainForm}>
              <div className={styles.windowBar}><i /><i /><i /><span>Custom Domain</span></div>
              <label>
                <span>要连接到 Worker 的域名</span>
                <div><strong>https://</strong><code>sgao.cc</code><em>根域</em></div>
              </label>
              <button type="button" tabIndex={-1}>Add Custom Domain</button>
            </div>
            <div className={styles.errorCard}>
              <small>如果出现错误</small>
              <CopyCode value="Hostname already has externally managed DNS records" />
              <p>返回 DNS 页面删除根域名上冲突的 A/CNAME 记录，再重新绑定。</p>
            </div>
          </section>

          <section className={styles.guideSection} id="verify">
            <SectionHeading number="06" eyebrow="LAUNCH" title="验证部署" />
            <p>绑定完成后，Worker 的自定义域列表中会显示你的域名。打开浏览器访问：</p>
            <div className={styles.launchCard}>
              <span>↗</span>
              <div>
                <small>YOUR SITE IS READY</small>
                <a href="https://sgao.cc" target="_blank" rel="noreferrer">https://sgao.cc</a>
                <p>页面能够正常打开，即表示部署完成。</p>
              </div>
            </div>
            <ul className={styles.checkList}>
              <li><span>✓</span>Worker 自定义域状态为 Active</li>
              <li><span>✓</span>使用 HTTPS 能正常打开页面</li>
              <li><span>✓</span>刷新和站内路径访问正常</li>
            </ul>
          </section>

          <section className={styles.guideSection} id="faq">
            <SectionHeading number="07" eyebrow="TROUBLESHOOTING" title="常见问题" />
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <details key={faq.question}>
                  <summary>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {faq.question}
                    <i>＋</i>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className={styles.guideSection} id="deployment-log">
            <SectionHeading number="08" eyebrow="REAL WORLD" title="本次实际部署记录" />
            <div className={styles.timeline}>
              {[
                "在 Spaceship 购买 sgao.cc",
                "将域名添加到 Cloudflare",
                "修改 Nameserver 为 Cloudflare 提供的地址",
                "等待 Cloudflare 接管完成",
                "删除根域名上冲突的旧 A 记录",
                "将 sgao.cc 绑定到 Cloudflare Worker",
                "通过 https://sgao.cc 成功访问网站",
              ].map((item, index) => (
                <div key={item}>
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.guideSection} id="next">
            <SectionHeading number="09" eyebrow="WHAT'S NEXT" title="后续可以继续做什么？" />
            <div className={styles.nextGrid}>
              {[
                ["WWW", "配置 www.sgao.cc", "让 www 与根域使用统一入口"],
                ["MAIL", "配置企业邮箱", "完善 MX、SPF、DKIM、DMARC"],
                ["WAF", "增强安全防护", "配置 Cloudflare WAF 与访问规则"],
                ["CACHE", "优化缓存", "提升静态资源加载速度"],
                ["DATA", "接入数据服务", "使用 R2、KV、D1 扩展应用"],
                ["DOCS", "建设文档中心", "统一管理更多 Markdown 技术文档"],
              ].map(([tag, title, description]) => (
                <div key={tag}>
                  <span>{tag}</span>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className={styles.articleFooter}>
            <div>
              <span className={styles.brandMark}>↗</span>
              <div><strong>准备好，下一次起飞</strong><p>持续记录每一次部署与实践。</p></div>
            </div>
            <a href="#overview">回到顶部 ↑</a>
          </footer>
        </article>
      </div>
    </main>
  );
}

function SectionHeading({
  number,
  eyebrow,
  title,
}: {
  number: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className={styles.sectionHeading}>
      <span>{number}</span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
