# Travel 旅行站 Worker 创建与部署

本文记录如何在现有 `sgao.cc` 主站和 `docs.sgao.cc` 知识库之外，创建第三个独立旅行站：

```text
travel.sgao.cc
```

最终对应关系：

| 域名 | Worker | 构建命令 | Wrangler 配置 |
| --- | --- | --- | --- |
| `sgao.cc` | `noisy-math-2b8d` | `npm run build:static` | `wrangler.jsonc` |
| `docs.sgao.cc` | `sgao-docs` | `npm run docs:build` | `wrangler.docs.jsonc` |
| `travel.sgao.cc` | `sgao-travel` | `npm run travel:build` | `wrangler.travel.jsonc` |

## 一、项目已准备好的内容

旅行站采用独立 VitePress 构建，但和知识库共用 `docs/travel/` 中的旅行文档，因此行程只需维护一份。

```text
docs/travel/                       # 唯一内容来源
travel/.vitepress/config.ts        # 旅行站配置
travel/.vitepress/dist/            # 旅行站构建输出，不提交 Git
wrangler.travel.jsonc              # 旅行站 Worker 配置
```

本地检查：

```bash
npm run travel:dev
npm run travel:build
npm run travel:preview
```

## 二、提交并推送代码

Cloudflare 从 GitHub 仓库构建，因此先将本次修改提交并推送到 `main` 分支。

推送完成后，再到 Cloudflare 创建 Worker。

## 三、创建并连接 Worker

1. 登录 Cloudflare 控制台。
2. 进入 **Workers & Pages**。
3. 点击 **Create application**。
4. 在 **Import a repository** 旁点击 **Get started**。
5. 选择已经授权的 GitHub 账户。
6. 选择仓库 `skylonely/sgao-website`。
7. 将 Worker 名称填写为 `sgao-travel`。

::: warning 名称必须一致
Cloudflare 中的 Worker 名称必须与 `wrangler.travel.jsonc` 的 `name` 一致，否则 Git 构建会失败。
:::

## 四、填写构建配置

按下表填写：

| 配置项 | 内容 |
| --- | --- |
| Production branch | `main` |
| Root directory | 留空，使用仓库根目录 |
| Build command | `npm run travel:build` |
| Deploy command | `npx wrangler deploy --config wrangler.travel.jsonc` |

如果启用了非生产分支预览，可填写：

```text
npx wrangler versions upload --config wrangler.travel.jsonc
```

确认后点击 **Save and Deploy**。首次构建成功后，先打开 Cloudflare 提供的 `workers.dev` 地址检查页面。

## 五、绑定 travel.sgao.cc

1. 打开刚创建的 `sgao-travel` Worker。
2. 进入 **Domains**；如果当前控制台仍使用旧布局，则进入 **Settings → Domains & Routes**。
3. 点击 **Add → Custom Domain**。
4. 输入 `travel.sgao.cc`。
5. 点击 **Add Custom Domain**。
6. 等待域名和证书状态变为可用。

Cloudflare 会自动创建对应 DNS 记录并签发证书，一般不需要手动添加 DNS 记录。

::: warning 已有同名 DNS 记录时
如果 DNS 中已经存在 `travel` 的 CNAME、A 或 AAAA 记录，先删除冲突记录，再添加 Custom Domain。
:::

## 六、上线后检查

依次访问：

```text
https://travel.sgao.cc/
https://travel.sgao.cc/shenyang-dandong-dalian/
https://travel.sgao.cc/shenyang-dandong-dalian/itinerary
https://travel.sgao.cc/shenyang-dandong-dalian/checklist
```

同时确认原知识库隐藏地址仍能访问：

```text
https://docs.sgao.cc/travel/shenyang-dandong-dalian/
```

## 七、以后如何更新

只需修改：

```text
docs/travel/
```

提交并推送到 `main` 后，Cloudflare Workers Builds 会执行：

```text
npm run travel:build
        ↓
npx wrangler deploy --config wrangler.travel.jsonc
        ↓
travel.sgao.cc
```

## 官方参考

- [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Wrangler 静态资源配置](https://developers.cloudflare.com/workers/wrangler/configuration/#assets)
