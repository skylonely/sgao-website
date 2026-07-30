# Spaceship 域名接入 Cloudflare Worker

> 更新时间：2026-07-30

本文记录从 Spaceship 购买域名、将 DNS 管理权交给 Cloudflare，再把根域名绑定到 Cloudflare Worker 的完整流程。

如果希望通过带交互效果的页面阅读，可以打开：

[查看 Spaceship Worker 部署图文版](https://sgao.cc/docs/spaceship)

## 一、部署目标

完成后的访问链路：

```text
用户
  ↓
sgao.cc
  ↓
Cloudflare Edge
  ↓
Cloudflare Worker
  ↓
网站页面
```

核心步骤：

```text
Spaceship 购买域名
  ↓
Cloudflare 接管 DNS
  ↓
修改 Nameserver
  ↓
清理冲突 DNS 记录
  ↓
绑定 Worker Custom Domain
  ↓
验证 HTTPS 和页面访问
```

## 二、准备工作

开始前需要：

- 一个可以正常使用的 Spaceship 账户
- 一个已经购买并处于正常状态的域名
- 一个 Cloudflare 账户
- 一个已经成功部署的 Cloudflare Worker
- 修改域名 Nameserver 的权限

本指南使用 `sgao.cc` 作为示例，实际操作时请替换成自己的域名。

## 三、在 Spaceship 购买域名

在 Spaceship 搜索并购买准备使用的域名。

购买完成后确认：

- 域名状态正常
- 域名没有处于锁定或验证异常状态
- 可以进入 Nameserver 设置
- 已保存域名续费和账户恢复信息

刚购买的域名通常使用 Spaceship 默认 Nameserver。下一步需要将其替换为 Cloudflare 分配的 Nameserver。

## 四、将域名添加到 Cloudflare

1. 登录 Cloudflare 控制台。
2. 选择添加域名。
3. 输入根域名，例如 `sgao.cc`，不要包含 `https://` 或路径。
4. 根据需求选择套餐，个人网站可以先使用 Free 套餐。
5. 检查 Cloudflare 自动扫描到的 DNS 记录。
6. 保存 Cloudflare 为当前域名分配的两个 Nameserver。

示例：

```text
donald.ns.cloudflare.com
violet.ns.cloudflare.com
```

::: warning 注意
上面的 Nameserver 仅用于说明格式。必须使用 Cloudflare 控制台为自己域名显示的两个地址，不能直接复制示例。
:::

## 五、在 Spaceship 修改 Nameserver

回到 Spaceship 域名管理后台，进入：

```text
Spaceship
  → 域名管理
  → Nameservers
  → Custom Nameservers
```

操作步骤：

1. 删除原有的 Spaceship Nameserver。
2. 填入 Cloudflare 分配的两个 Nameserver。
3. 保存修改。
4. 返回 Cloudflare 等待接管完成。

DNS 更新一般在几分钟内完成，部分情况下可能需要 24～48 小时。

当 Cloudflare 显示域名已经受保护时，说明 Nameserver 修改已经生效。

## 六、检查并清理 DNS

Cloudflare 接管域名时，可能会自动导入 Spaceship 中原有的 DNS 记录。

如果网站直接由 Worker 提供，不使用其他源站，需要重点检查目标主机名上的：

- A 记录
- AAAA 记录
- CNAME 记录
- 旧 Worker Route
- 旧 Pages 自定义域

这些记录可能与 Worker Custom Domain 冲突。

::: danger 不要误删邮件记录
MX、SPF、DKIM 和 DMARC 等邮件记录与网站绑定用途不同，不要因为清理网站域名记录而删除。
:::

如果域名还在使用其他源站，只清理与准备绑定 Worker 的主机名直接冲突的记录。

## 七、绑定 Worker Custom Domain

在 Cloudflare 控制台进入：

```text
Workers & Pages
  → 选择目标 Worker
  → Settings
  → Domains & Routes
  → Add
  → Custom domain
```

输入准备绑定的域名：

```text
sgao.cc
```

确认后，Cloudflare 会为 Custom Domain 创建所需 DNS 配置并签发 TLS 证书。

### 常见错误

如果出现：

```text
Hostname already has externally managed DNS records
```

说明当前主机名存在冲突记录。返回 DNS 页面，检查并删除冲突的 A、AAAA 或 CNAME 记录，然后重新添加 Custom Domain。

## 八、验证部署

### 检查 Cloudflare 状态

确认 Worker 的 **Domains & Routes** 中：

- 自定义域名存在
- 域名状态正常
- 没有待处理错误

### 浏览器访问

打开：

```text
https://sgao.cc
```

检查：

- HTTPS 能正常建立连接
- 首页能够打开
- 刷新页面正常
- 站内路径可以访问
- 静态资源没有报错

### 命令行检查

```bash
dig sgao.cc
curl -I https://sgao.cc
```

## 九、常见问题

### Cloudflare 一直显示等待接管

确认 Spaceship 中填写的 Nameserver 与 Cloudflare 分配的地址完全一致。Nameserver 修改后需要等待 DNS 在全球范围更新，最长可能需要 24～48 小时。

### 无法绑定根域名

检查根域名是否还存在旧 A、AAAA 或 CNAME 记录，以及是否绑定在其他 Worker 或 Pages 项目中。

### HTTPS 证书需要手工配置吗

通过 Worker Custom Domain 绑定后，Cloudflare 会自动签发并管理对应的 TLS 证书。

### `www.sgao.cc` 无法访问

`sgao.cc` 和 `www.sgao.cc` 是两个不同的主机名。可以：

- 为 `www.sgao.cc` 单独添加 Custom Domain
- 配置重定向，将 `www` 跳转到根域名
- 根据实际架构配置对应的代理记录

### 更新 Worker 后仍显示旧内容

依次检查：

1. 最新代码是否已经部署
2. 域名是否绑定到正确的 Worker
3. 浏览器缓存
4. Cloudflare Edge Cache
5. 是否仍在访问旧域名或预览地址

## 十、实际部署记录

`sgao.cc` 的实际部署过程：

1. 在 Spaceship 购买 `sgao.cc`
2. 将域名添加到 Cloudflare
3. 修改 Nameserver 为 Cloudflare 分配的地址
4. 等待 Cloudflare 接管完成
5. 删除根域名上冲突的旧 A 记录
6. 将 `sgao.cc` 添加为 Worker Custom Domain
7. 通过 `https://sgao.cc` 成功访问网站

## 十一、后续扩展

完成根域名上线后，可以继续：

- 配置 `www.sgao.cc` 重定向
- 配置企业邮箱和邮件 DNS 记录
- 增加 WAF 与访问规则
- 优化静态资源缓存
- 接入 R2、KV 或 D1
- 增加 `docs.sgao.cc`、`img.sgao.cc` 等子域名

## 十二、相关文章

- [Cloudflare DNS 与域名配置](./dns-domain)
- [Workers 双站点自动部署](./workers-auto-deploy)
- [Cloudflare 图片中心](./image-center)
- [SGAO Platform 架构](/guide/platform-architecture)
