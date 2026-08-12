# 41 Kubernetes Kustomize 配置定制与多环境管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes Kustomize 配置定制与多环境管理，重点掌握
> Base、Overlay、Patch、Generator、多环境目录设计，以及 Kustomize 与
> Helm、GitOps、Argo CD 的关系。

------------------------------------------------------------------------

# 目录

1.  Kustomize概述
2.  为什么需要Kustomize
3.  Kustomize核心设计思想
4.  Kustomize整体工作原理
5.  kustomization.yaml核心配置
6.  Base基础配置
7.  Overlay环境覆盖
8.  Resources资源组合
9.  Patches配置修改机制
10. Strategic Merge与JSON Patch
11. Labels与Annotations统一管理
12. Namespace统一配置
13. NamePrefix与NameSuffix
14. Images镜像版本管理
15. ConfigMapGenerator
16. SecretGenerator
17. Generator哈希与滚动更新
18. Components组件复用
19. Dev / Test / Prod多环境管理
20. kubectl与Kustomize集成
21. Kustomize目录设计
22. Kustomize与Helm区别
23. Kustomize与GitOps结合
24. Kustomize与Argo CD结合
25. Kustomize配置漂移与版本控制
26. Secret安全管理
27. 常见问题与排查
28. 企业Kustomize项目设计
29. Kustomize生产最佳实践
30. 系统架构设计师考点
31. Mermaid多环境配置架构图
32. 本节小结

------------------------------------------------------------------------

# 1. Kustomize概述（★★★★★）

Kustomize 是 Kubernetes 声明式配置定制工具。

它最核心的思想是：

> 不通过模板变量重新生成一套 YAML，而是在已有 Kubernetes 原生 YAML
> 基础上，通过组合和 Patch 得到不同环境的最终配置。

核心模型：

``` text
Base
  +
Overlay
  ↓
Customized Kubernetes YAML
```

因此 Kustomize 特别适合：

-   Dev / Test / Prod 多环境管理；
-   Kubernetes 原生 YAML 复用；
-   环境差异配置；
-   GitOps；
-   减少重复 YAML。

------------------------------------------------------------------------

# 2. 为什么需要Kustomize（★★★★★）

假设一个项目有三个环境：

``` text
Dev
Test
Prod
```

传统方式可能维护：

``` text
deployment-dev.yaml
deployment-test.yaml
deployment-prod.yaml

service-dev.yaml
service-test.yaml
service-prod.yaml
```

这些文件往往 80%～90% 内容完全相同。

真正不同的可能只有：

``` text
replicas

image tag

resources

domain
```

大量复制会产生：

``` text
重复配置
   ↓
修改遗漏
   ↓
环境漂移
   ↓
维护成本上升
```

Kustomize 改成：

``` text
Base
  ↓
公共配置

Overlay
  ↓
环境差异
```

------------------------------------------------------------------------

# 3. Kustomize核心设计思想（★★★★★）

Kustomize 的核心不是"模板替换"，而是：

``` text
原生 Kubernetes YAML

+

声明式定制

↓

最终 Kubernetes YAML
```

典型结构：

``` text
Base

├── Deployment
├── Service
└── ConfigMap

        ↓

Overlays

├── Dev
├── Test
└── Prod
```

可以简单记忆：

> Base 放共性，Overlay 放差异。

------------------------------------------------------------------------

# 4. Kustomize整体工作原理

整体过程：

``` text
Base Resources
       │
       ↓
kustomization.yaml
       │
       ├── Patches
       ├── Images
       ├── Labels
       ├── Namespace
       └── Generators
       │
       ↓
Kustomize Build
       │
       ↓
Final Kubernetes Manifests
       │
       ↓
Kubernetes API
```

Kustomize 本身并不替代：

``` text
Deployment

Service

Ingress
```

而是对这些 Kubernetes 原生资源进行组合和定制。

------------------------------------------------------------------------

# 5. kustomization.yaml核心配置（★★★★★）

Kustomize 的核心文件通常是：

``` text
kustomization.yaml
```

例如：

``` yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
```

它描述：

``` text
当前目录包含哪些资源

以及

如何定制这些资源
```

常见配置能力包括：

``` text
resources
patches
images
namespace
namePrefix
nameSuffix
configMapGenerator
secretGenerator
components
```

------------------------------------------------------------------------

# 6. Base基础配置（★★★★★）

Base 用于保存多个环境共享的基础配置。

例如：

``` text
base/

├── deployment.yaml
├── service.yaml
└── kustomization.yaml
```

Deployment：

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app

spec:
  replicas: 1

  selector:
    matchLabels:
      app: my-app

  template:
    metadata:
      labels:
        app: my-app

    spec:
      containers:
        - name: my-app
          image: example/my-app:1.0.0
```

Base 应尽量表示：

> 应用跨环境共享的默认结构。

------------------------------------------------------------------------

# 7. Overlay环境覆盖（★★★★★）

Overlay 引用 Base，并描述当前环境差异。

例如：

``` text
overlays/

├── dev/
├── test/
└── prod/
```

Prod：

``` yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

patches:
  - path: deployment-patch.yaml
```

然后：

``` text
Base

+

Prod Patch

↓

Production Manifest
```

------------------------------------------------------------------------

# 8. Resources资源组合

`resources` 用于组合 Kubernetes 资源或其他 Kustomization。

例如：

``` yaml
resources:
  - deployment.yaml
  - service.yaml
  - ingress.yaml
```

Overlay 中：

``` yaml
resources:
  - ../../base
```

因此可以形成层级复用：

``` text
Base

↓

Environment Overlay

↓

Cluster Overlay
```

但层级不宜设计得过深，否则会降低可读性。

------------------------------------------------------------------------

# 9. Patches配置修改机制（★★★★★）

Patch 是 Kustomize 最重要的能力之一。

例如 Base：

``` yaml
spec:
  replicas: 1
```

Prod 希望：

``` yaml
spec:
  replicas: 5
```

只需要描述差异。

概念：

``` text
Base Deployment

replicas = 1

        +

Prod Patch

replicas = 5

        ↓

Final Deployment

replicas = 5
```

优势：

> 不需要复制整个 Deployment。

------------------------------------------------------------------------

# 10. Strategic Merge与JSON Patch（★★★★☆）

Kustomize 中常见 Patch 思路包括：

``` text
结构化合并式Patch

JSON Patch
```

JSON Patch 可以表达精确操作：

``` yaml
- op: replace
  path: /spec/replicas
  value: 5
```

概念：

``` text
找到 /spec/replicas

↓

replace

↓

5
```

适合需要明确字段路径操作的场景。

实际项目应根据 Kustomize 版本和当前推荐语法选择 Patch 写法。

------------------------------------------------------------------------

# 11. Labels与Annotations统一管理

多资源经常需要统一 Label：

``` text
environment=prod

team=frontend
```

Kustomize 可以集中添加公共标签或注解。

效果：

``` text
Deployment

Service

ConfigMap

↓

统一Metadata
```

这样可以减少：

``` text
每个YAML重复修改
```

Label 设计需要保持稳定，因为它还可能被：

``` text
Service Selector

NetworkPolicy

Monitoring

Policy
```

使用。

------------------------------------------------------------------------

# 12. Namespace统一配置

不同环境可能使用：

``` text
dev

test

production
```

Kustomize 可以在环境层统一设置 Namespace。

概念：

``` yaml
namespace: production
```

最终多个资源：

``` text
Deployment
Service
ConfigMap
```

都进入对应 Namespace。

但：

> 是否应由 Kustomize 创建 Namespace 本身，应根据项目资源边界单独设计。

------------------------------------------------------------------------

# 13. NamePrefix与NameSuffix

可以统一给资源名称增加：

``` text
Prefix

Suffix
```

例如：

``` yaml
namePrefix: prod-
```

原资源：

``` text
my-app
```

最终：

``` text
prod-my-app
```

也可以：

``` yaml
nameSuffix: -v2
```

得到：

``` text
my-app-v2
```

适用于需要区分环境或实例的场景。

------------------------------------------------------------------------

# 14. Images镜像版本管理（★★★★★）

不同环境经常使用不同镜像版本。

Base：

``` text
example/my-app:latest
```

Overlay 可以单独修改镜像：

``` yaml
images:
  - name: example/my-app
    newTag: "2.1.0"
```

于是：

``` text
Base

image = example/my-app:latest

+

Prod Overlay

newTag = 2.1.0

↓

example/my-app:2.1.0
```

这非常适合 GitOps 中通过 Commit 更新部署版本。

------------------------------------------------------------------------

# 15. ConfigMapGenerator（★★★★★）

Kustomize 可以根据：

-   literals；
-   文件；

生成 ConfigMap。

例如：

``` yaml
configMapGenerator:
  - name: app-config
    literals:
      - APP_ENV=production
      - LOG_LEVEL=info
```

生成：

``` text
ConfigMap
```

这样配置可以直接纳入 Kustomize 管理体系。

------------------------------------------------------------------------

# 16. SecretGenerator

SecretGenerator 可以生成 Kubernetes Secret。

概念：

``` yaml
secretGenerator:
  - name: app-secret
    literals:
      - username=admin
```

但是必须注意：

> SecretGenerator 并不意味着可以安全地把生产明文密码提交到 Git。

GitOps 环境仍需要：

``` text
External Secret Manager

Encrypted Secret

Sealed Secret

或其他安全机制
```

------------------------------------------------------------------------

# 17. Generator哈希与滚动更新（★★★★★）

Generator 生成的 ConfigMap / Secret 名称通常可以带内容哈希。

例如：

``` text
app-config-abc123
```

当配置发生变化：

``` text
Config Changed

↓

Hash Changed

↓

ConfigMap Name Changed

↓

Pod Template Reference Changed

↓

Deployment Rolling Update
```

这解决了一个常见问题：

> ConfigMap 更新后，如何让工作负载自动使用新配置？

哈希机制可以让配置变化进入 Pod Template 变化链路。

------------------------------------------------------------------------

# 18. Components组件复用（★★★★☆）

Components 可以用于复用一些可选配置能力。

例如：

``` text
components/

├── monitoring/
├── security/
└── debug/
```

某些环境：

``` text
Base

+

Monitoring Component

+

Prod Overlay
```

最终组合成生产配置。

适合：

> 横向复用但并非所有环境都必须启用的配置片段。

------------------------------------------------------------------------

# 19. Dev / Test / Prod多环境管理（★★★★★）

推荐模型：

``` text
                  Base
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
       Dev         Test        Prod
        │           │           │
     Overlay     Overlay     Overlay
```

差异可能是：

  配置           Dev    Test    Prod
  ---------- ------- ------- -------
  replicas         1       2       5
  CPU           100m    200m    500m
  Memory       128Mi   256Mi   512Mi
  HPA           关闭    可选    开启
  Domain         dev    test    prod

核心：

``` text
共性

↓

Base


差异

↓

Overlay
```

------------------------------------------------------------------------

# 20. kubectl与Kustomize集成（★★★★★）

Kustomize 能力已经集成到 `kubectl` 的常见工作流中。

查看构建结果：

``` bash
kubectl kustomize overlays/prod
```

直接应用：

``` bash
kubectl apply -k overlays/prod
```

这里：

``` text
-k

↓

使用Kustomization目录
```

与普通：

``` bash
kubectl apply -f
```

需要区分。

------------------------------------------------------------------------

# 21. Kustomize目录设计

推荐结构：

``` text
k8s/

├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── kustomization.yaml
│
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── deployment-patch.yaml
    │
    ├── test/
    │   ├── kustomization.yaml
    │   └── deployment-patch.yaml
    │
    └── prod/
        ├── kustomization.yaml
        └── deployment-patch.yaml
```

设计目标：

``` text
结构清晰

↓

差异容易发现

↓

Review容易

↓

维护成本低
```

------------------------------------------------------------------------

# 22. Kustomize与Helm区别（★★★★★）

这是本篇最重要的对比之一。

  Helm                 Kustomize
  -------------------- ------------------------
  Template + Values    Base + Overlay
  强调模板化           强调原生YAML定制
  支持Chart包管理      主要负责配置组合与定制
  具有Release模型      没有Helm式Release模型
  适合应用打包和分发   适合多环境配置差异管理
  模板逻辑能力较强     配置方式相对直观

可以记忆：

``` text
Helm

应用包 + 模板参数


Kustomize

原生YAML + Patch覆盖
```

没有绝对谁更好，应根据项目选择。

------------------------------------------------------------------------

# 23. Kustomize与GitOps结合（★★★★★）

GitOps强调：

``` text
Git

=

Desired State
```

Kustomize非常适合把多环境配置保存在Git：

``` text
Git Repository

├── base/
└── overlays/
    ├── dev/
    ├── test/
    └── prod/
```

GitOps Controller读取：

``` text
overlays/prod
```

构建：

``` text
Production Manifests
```

然后持续同步：

``` text
Git

↓

Kustomize

↓

GitOps Controller

↓

Kubernetes
```

------------------------------------------------------------------------

# 24. Kustomize与Argo CD结合（★★★★★）

典型关系：

``` text
Git Repository
      │
      ↓
overlays/prod
      │
      ↓
   Argo CD
      │
      ↓
Kustomize Build
      │
      ↓
Desired Resources
      │
      ↓
Kubernetes Cluster
```

Argo CD 可以持续比较：

``` text
Git Desired State

与

Cluster Actual State
```

如果不同：

``` text
OutOfSync
```

再根据策略进行同步。

因此：

> Kustomize负责生成目标环境配置，Argo CD负责持续同步和调谐。

------------------------------------------------------------------------

# 25. Kustomize配置漂移与版本控制

所有 Base 和 Overlay 都应该：

``` text
Git Version Control
```

变更流程：

``` text
Modify Overlay

↓

Pull Request

↓

Code Review

↓

Merge

↓

GitOps Sync
```

这样可以追踪：

``` text
谁修改了Prod replicas？

谁修改了Image Tag？

为什么修改？

什么时候上线？
```

避免：

``` text
长期直接kubectl edit生产资源
```

造成配置漂移。

------------------------------------------------------------------------

# 26. Secret安全管理（★★★★★）

Kustomize能够生成Secret，但：

``` text
生成Secret

≠

安全保存Secret
```

例如把：

``` text
password=123456
```

直接写进Git：

``` text
仍然是明文敏感数据泄露风险
```

生产环境应考虑：

``` text
External Secrets

Secret Manager

Encrypted Secret

Sealed Secrets

KMS
```

核心：

> Kustomize负责配置组织，密钥安全应由专门的Secret管理机制保证。

------------------------------------------------------------------------

# 27. 常见问题与排查

## 问题一：Patch没有生效

检查：

``` text
目标资源Name是否匹配？

Kind是否正确？

Namespace是否匹配？

字段路径是否正确？
```

------------------------------------------------------------------------

## 问题二：构建结果与预期不同

先执行：

``` bash
kubectl kustomize overlays/prod
```

查看最终生成的 YAML。

原则：

> 先看Render结果，再排查Cluster。

------------------------------------------------------------------------

## 问题三：引用路径错误

例如：

``` yaml
resources:
  - ../../base
```

需要确认目录关系。

------------------------------------------------------------------------

## 问题四：镜像版本没有变化

检查：

``` text
images.name

是否与Base中的镜像名称匹配
```

------------------------------------------------------------------------

## 问题五：ConfigMap变化但Pod行为异常

检查：

``` text
生成资源名称是否变化？

Deployment引用是否正确？

Pod是否已经Rolling Update？
```

------------------------------------------------------------------------

# 28. 企业Kustomize项目设计

企业项目可以设计：

``` text
platform-config/

├── apps/
│   ├── app-a/
│   │   ├── base/
│   │   └── overlays/
│   │
│   └── app-b/
│       ├── base/
│       └── overlays/
│
├── components/
│   ├── monitoring/
│   └── security/
│
└── clusters/
    ├── dev/
    ├── test/
    └── prod/
```

目标：

``` text
Application差异

+

Environment差异

+

Cluster差异
```

分层管理。

但应避免：

> Overlay层级过深、Patch过多，导致最终配置难以理解。

------------------------------------------------------------------------

# 29. Kustomize生产最佳实践

1.  Base只保存真正共享的配置；
2.  Overlay只描述环境差异；
3.  避免复制完整资源到Overlay；
4.  保持目录层级简单；
5.  使用稳定清晰的Label；
6.  镜像版本通过images统一管理；
7.  ConfigMap配置纳入版本控制；
8.  不在Git保存生产明文Secret；
9.  所有生产修改通过Pull Request；
10. 使用`kubectl kustomize`检查最终结果；
11. 在CI中验证构建是否成功；
12. 对Prod变更进行Review；
13. 与GitOps Controller结合减少手工操作；
14. 避免Base和Overlay职责混乱；
15. Patch保持小而明确；
16. 关键配置变化需要可追踪；
17. 统一应用目录规范；
18. 避免为了"复用"制造过度抽象。

------------------------------------------------------------------------

# 30. 系统架构设计师考点

## 什么是Kustomize？

答：

> Kustomize是Kubernetes声明式配置定制工具，通过Base、Overlay和Patch在保留原生Kubernetes
> YAML的基础上实现配置复用和多环境管理。

------------------------------------------------------------------------

## Base和Overlay分别是什么？

答：

> Base保存多个环境共享的基础资源，Overlay引用Base并描述Dev、Test、Prod等具体环境的差异配置。

------------------------------------------------------------------------

## Kustomize和Helm的主要区别？

答：

> Helm主要通过Template和Values进行模板化和应用包管理；Kustomize主要通过Base、Overlay和Patch对原生Kubernetes
> YAML进行定制。

------------------------------------------------------------------------

## Patch有什么作用？

答：

> Patch用于只描述某个环境相对于Base发生变化的字段，从而避免复制完整资源定义。

------------------------------------------------------------------------

## ConfigMapGenerator有什么作用？

答：

> ConfigMapGenerator可以根据字面值或文件生成ConfigMap，并可结合内容哈希使配置变化触发工作负载更新。

------------------------------------------------------------------------

## Kustomize为什么适合GitOps？

答：

> 因为Base和Overlay本身都是声明式文本配置，适合存储在Git中，并由GitOps
> Controller构建目标环境配置后持续同步到Kubernetes。

------------------------------------------------------------------------

## Kustomize能否安全保存生产密码？

答：

> Kustomize可以生成Secret资源，但它本身不能解决Git中的明文密钥安全问题，生产环境仍应结合专门的Secret管理或加密机制。

------------------------------------------------------------------------

# 31. Mermaid多环境配置架构图

``` mermaid
flowchart TD

A[Base]

A --> B[Deployment]
A --> C[Service]
A --> D[Ingress]

A --> E[Dev Overlay]
A --> F[Test Overlay]
A --> G[Prod Overlay]

E --> H[Dev Patches]
F --> I[Test Patches]
G --> J[Prod Patches]

H --> K[Kustomize Build]
I --> L[Kustomize Build]
J --> M[Kustomize Build]

K --> N[Dev Kubernetes]
L --> O[Test Kubernetes]
M --> P[Prod Kubernetes]

Q[Git Repository] --> A
Q --> E
Q --> F
Q --> G

R[Argo CD / GitOps Controller] --> Q
R --> N
R --> O
R --> P
```

------------------------------------------------------------------------

# 32. 本节小结

Kustomize核心知识：

1.  Kustomize是Kubernetes声明式配置定制工具；
2.  核心思想是Base + Overlay，而不是模板变量替换；
3.  Base保存跨环境公共资源；
4.  Overlay保存Dev、Test、Prod等环境差异；
5.  kustomization.yaml描述资源组合和定制规则；
6.  Patch用于只修改需要变化的字段；
7.  Resources可以组合多个资源和Kustomization；
8.  Namespace、Labels、NamePrefix等可以统一定制资源；
9.  images适合管理不同环境的镜像版本；
10. ConfigMapGenerator和SecretGenerator可以生成配置资源；
11. Generator内容哈希可以帮助配置变化触发滚动更新；
12. Components可用于复用可选配置能力；
13. `kubectl apply -k`可以直接应用Kustomization目录；
14. Helm强调Template + Values和应用包管理；
15. Kustomize强调Base + Overlay和原生YAML定制；
16. Kustomize非常适合与GitOps和Argo CD结合；
17. Kustomize不能替代专业Secret安全管理；
18. 企业项目应避免Overlay过深和Patch过度复杂。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Kustomize通过"Base保存共性、Overlay描述差异、Patch修改局部"的方式实现Kubernetes多环境配置复用；Helm偏向"Template +
> Values + Chart包管理"，而Kustomize偏向"原生YAML + Base +
> Overlay"，GitOps则负责让最终期望配置持续同步到集群。
