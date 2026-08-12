# 42 Kubernetes CI/CD 持续集成与持续交付体系

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes CI/CD 持续集成与持续交付体系，重点掌握
> CI、Continuous Delivery、Continuous Deployment、Pipeline、Docker
> Image、Registry、Helm、Kustomize、GitOps、Argo CD，以及 Rolling
> Update、Blue-Green、Canary 等发布策略。

------------------------------------------------------------------------

# 目录

1.  CI/CD概述
2.  为什么Kubernetes需要CI/CD
3.  CI持续集成
4.  CD持续交付与持续部署
5.  CI/CD整体架构
6.  Kubernetes应用交付完整流程
7.  Source Code源码管理
8.  CI Pipeline流水线
9.  Build应用构建
10. Test自动化测试
11. Docker Image镜像构建
12. Container Registry镜像仓库
13. Image Tag镜像版本策略
14. Security Scan安全扫描
15. Kubernetes部署阶段
16. Deployment滚动发布
17. Helm与CI/CD
18. Kustomize与CI/CD
19. GitOps与CI/CD
20. Push CD与Pull CD
21. Argo CD持续交付
22. Dev / Test / Staging / Prod环境晋级
23. Rolling Update滚动发布
24. Blue-Green蓝绿发布
25. Canary金丝雀发布
26. CI/CD回滚机制
27. Pipeline Secret与凭据安全
28. CI/CD质量门禁
29. CI/CD可观测性与审计
30. 企业级CI/CD架构设计
31. CI/CD常见问题与排查
32. Kubernetes CI/CD生产最佳实践
33. 系统架构设计师考点
34. Mermaid CI/CD完整架构图
35. 本节小结

------------------------------------------------------------------------

# 1. CI/CD概述（★★★★★）

CI/CD 是现代软件工程中实现自动化构建、测试、交付和部署的重要体系。

整体可以理解为：

``` text
Developer
    ↓
Source Code
    ↓
CI
    ↓
Build / Test / Scan
    ↓
Artifact / Container Image
    ↓
CD
    ↓
Kubernetes
```

其中：

``` text
CI

Continuous Integration

持续集成
```

而 CD 可能表示：

``` text
Continuous Delivery

持续交付
```

或者：

``` text
Continuous Deployment

持续部署
```

这两个概念需要严格区分。

------------------------------------------------------------------------

# 2. 为什么Kubernetes需要CI/CD（★★★★★）

如果没有 CI/CD，部署可能是：

``` text
开发完成

↓

人工构建

↓

人工制作Docker Image

↓

人工Push Registry

↓

人工修改YAML

↓

人工kubectl apply

↓

人工验证
```

问题包括：

-   操作步骤多；
-   容易人为出错；
-   发布过程不可重复；
-   版本难以追踪；
-   回滚效率低；
-   环境差异大；
-   缺少自动化质量检查。

CI/CD 的目标：

> 将代码从提交到生产交付的过程标准化、自动化和可追踪化。

------------------------------------------------------------------------

# 3. CI持续集成（★★★★★）

CI：

> Continuous Integration，持续集成。

核心思想：

``` text
开发人员频繁提交代码

↓

自动触发Pipeline

↓

Build

↓

Test

↓

Quality Check
```

典型流程：

``` text
Git Push
   ↓
Compile / Build
   ↓
Unit Test
   ↓
Lint
   ↓
Security Scan
   ↓
Build Artifact
```

CI 的重点不是部署生产，而是：

> 尽早发现代码集成问题，并持续产生可交付的软件制品。

------------------------------------------------------------------------

# 4. CD持续交付与持续部署（★★★★★）

这是非常重要的概念。

## Continuous Delivery

持续交付：

> 软件经过自动化流程后，始终处于可以部署到生产环境的状态，但生产发布通常可以保留人工审批。

``` text
CI通过

↓

Artifact Ready

↓

Staging

↓

Manual Approval

↓

Production
```

------------------------------------------------------------------------

## Continuous Deployment

持续部署：

> 软件通过全部自动化测试和质量门禁后，自动部署到生产环境。

``` text
CI通过

↓

Quality Gate通过

↓

Automatically Deploy

↓

Production
```

记忆：

``` text
Continuous Delivery

可以随时发布


Continuous Deployment

自动发布
```

------------------------------------------------------------------------

# 5. CI/CD整体架构

典型 Kubernetes CI/CD：

``` text
Developer
    ↓
Git Repository
    ↓
CI Pipeline
    ↓
Build
    ↓
Test
    ↓
Security Scan
    ↓
Docker Build
    ↓
Container Registry
    ↓
Deployment Configuration
    ↓
CD / GitOps
    ↓
Kubernetes Cluster
```

发布完成后：

``` text
Kubernetes

↓

Metrics / Logs / Traces

↓

Observability

↓

Feedback
```

形成闭环。

------------------------------------------------------------------------

# 6. Kubernetes应用交付完整流程（★★★★★）

完整链路：

``` text
Code

↓

Commit

↓

CI

↓

Build

↓

Test

↓

Scan

↓

Docker Image

↓

Registry

↓

Update Image Version

↓

Deployment Configuration

↓

CD / GitOps

↓

Kubernetes

↓

Health Check

↓

Observability
```

任何一个阶段失败：

``` text
Pipeline Stop
```

避免错误继续传播到后续环境。

------------------------------------------------------------------------

# 7. Source Code源码管理

CI/CD 通常从 Git 事件开始。

例如：

``` text
Push

Pull Request

Merge

Tag
```

常见分支策略可能包括：

``` text
main

develop

feature/*
release/*
hotfix/*
```

但企业不应机械套用复杂分支模型。

核心要求：

-   变更可追踪；
-   Code Review；
-   Branch Protection；
-   CI检查；
-   Release版本明确。

------------------------------------------------------------------------

# 8. CI Pipeline流水线（★★★★★）

Pipeline 是 CI/CD 自动化执行流程。

例如：

``` text
Checkout

↓

Install Dependencies

↓

Lint

↓

Unit Test

↓

Build

↓

Security Scan

↓

Docker Build

↓

Push Image
```

Pipeline 的核心价值：

> 把人工发布步骤转化为可重复执行的自动化流程。

------------------------------------------------------------------------

# 9. Build应用构建

不同技术栈 Build 方式不同。

例如前端：

``` text
npm install

↓

npm run build
```

Java：

``` text
mvn package
```

Go：

``` text
go build
```

构建阶段目标：

``` text
Source Code

↓

Executable / Static Files / Package
```

随后再进入容器镜像构建。

------------------------------------------------------------------------

# 10. Test自动化测试（★★★★★）

CI 中通常包含多层测试：

``` text
Unit Test

↓

Integration Test

↓

API Test

↓

End-to-End Test
```

测试的核心作用：

> 在进入生产环境之前尽可能早地发现问题。

可以设置：

``` text
Test Failed

↓

Pipeline Failed

↓

禁止部署
```

------------------------------------------------------------------------

# 11. Docker Image镜像构建（★★★★★）

Kubernetes 应用通常最终以 Container Image 交付。

流程：

``` text
Source Code

↓

Build

↓

Dockerfile

↓

docker build

↓

Container Image
```

例如：

``` bash
docker build -t registry.example.com/my-app:1.5.0 .
```

然后：

``` text
Image

↓

Registry

↓

Kubernetes
```

------------------------------------------------------------------------

# 12. Container Registry镜像仓库

Registry 保存构建后的镜像。

典型流程：

``` text
CI

↓

Build Image

↓

Push Registry

↓

Kubernetes Pull Image
```

Registry 需要考虑：

-   Authentication；
-   Authorization；
-   Image Scan；
-   Retention；
-   Immutable Tag；
-   Replication。

企业环境中：

> Registry 是 CI 与 Kubernetes 之间的重要制品交付边界。

------------------------------------------------------------------------

# 13. Image Tag镜像版本策略（★★★★★）

不推荐生产环境长期依赖：

``` text
latest
```

因为：

``` text
latest

↓

无法明确对应哪次构建
```

推荐使用：

``` text
Semantic Version

Git Commit SHA

Build Number
```

例如：

``` text
my-app:1.5.0

my-app:a83f21c
```

理想关系：

``` text
Git Commit

↓

CI Build

↓

Unique Image

↓

Deployment
```

从而实现完整追踪。

------------------------------------------------------------------------

# 14. Security Scan安全扫描（★★★★★）

DevSecOps 强调：

> 安全检查进入软件交付流水线，而不是上线之后才检查。

可以在 Pipeline 中加入：

``` text
Dependency Scan

SAST

Container Image Scan

Configuration Scan

Policy Check
```

例如：

``` text
Critical Vulnerability

↓

Quality Gate Failed

↓

Stop Deployment
```

注意：

> 安全扫描工具本身不能替代安全架构和人工安全审查。

------------------------------------------------------------------------

# 15. Kubernetes部署阶段

CI 完成后进入部署阶段。

传统方式：

``` text
CI/CD Server

↓

kubectl apply

↓

Kubernetes
```

也可以：

``` text
CI

↓

helm upgrade

↓

Kubernetes
```

现代 GitOps：

``` text
CI

↓

Update GitOps Repository

↓

GitOps Controller

↓

Kubernetes
```

------------------------------------------------------------------------

# 16. Deployment滚动发布

Kubernetes Deployment 默认支持滚动更新思想。

例如：

``` text
Version 1

Pod A
Pod B
Pod C
```

更新：

``` text
Version 2
```

过程：

``` text
创建V2 Pod

↓

等待Ready

↓

删除部分V1 Pod

↓

继续创建V2

↓

最终全部V2
```

目标：

> 尽量降低发布过程中的服务中断。

------------------------------------------------------------------------

# 17. Helm与CI/CD（★★★★★）

Helm 可以将应用部署配置标准化。

流程：

``` text
CI

↓

Build Image

↓

Push Registry

↓

Update Values

↓

helm upgrade
```

例如：

``` text
Chart

+

values-prod.yaml

↓

Production Release
```

Helm 主要解决：

``` text
应用模板化

应用打包

Release管理
```

------------------------------------------------------------------------

# 18. Kustomize与CI/CD（★★★★★）

Kustomize 可以管理多环境差异。

例如：

``` text
base/

overlays/
├── dev/
├── test/
└── prod/
```

CI/CD 更新：

``` text
overlays/prod

↓

Image Tag
```

然后：

``` text
kubectl apply -k

或

GitOps Controller
```

完成部署。

------------------------------------------------------------------------

# 19. GitOps与CI/CD（★★★★★）

GitOps 通常将 CI 和 CD 的职责进一步分离。

``` text
CI

↓

Build / Test / Scan

↓

Push Image

↓

Update GitOps Repo
```

然后：

``` text
GitOps Controller

↓

Detect Change

↓

Reconcile

↓

Kubernetes
```

因此：

> CI 负责产生可信制品，GitOps负责把声明式期望状态持续同步到集群。

------------------------------------------------------------------------

# 20. Push CD与Pull CD（★★★★★）

## Push模式

``` text
CI/CD Server

↓

kubectl / Helm

↓

Kubernetes
```

特点：

> Pipeline主动连接生产集群并执行部署。

------------------------------------------------------------------------

## Pull模式

``` text
Git Repository

←── GitOps Controller

       ↓

Kubernetes
```

Controller主动获取配置。

优点之一：

> CI系统不一定需要持有直接访问生产Cluster的高权限凭据。

------------------------------------------------------------------------

# 21. Argo CD持续交付（★★★★★）

Argo CD 常用于 Kubernetes GitOps CD。

典型流程：

``` text
CI

↓

Build Image

↓

Push Registry

↓

Update Git Manifest

↓

Argo CD

↓

Compare Desired / Actual State

↓

Sync

↓

Kubernetes
```

Argo CD 关注：

``` text
Synced / OutOfSync

Healthy / Degraded
```

因此部署不仅是：

``` text
执行kubectl
```

而是持续维护期望状态。

------------------------------------------------------------------------

# 22. Dev / Test / Staging / Prod环境晋级（★★★★★）

企业常见：

``` text
Dev

↓

Test

↓

Staging

↓

Prod
```

制品晋级应尽量遵循：

> Build Once, Promote Many。

即：

``` text
同一个Image

↓

Dev验证

↓

Test验证

↓

Staging验证

↓

Prod
```

而不是：

``` text
每个环境重新Build
```

否则可能出现：

``` text
测试通过的镜像

≠

生产实际部署的镜像
```

------------------------------------------------------------------------

# 23. Rolling Update滚动发布（★★★★★）

Rolling Update：

``` text
Old Version

↓

逐步替换

↓

New Version
```

优点：

-   Kubernetes原生支持；
-   资源成本较低；
-   发布平滑。

缺点：

``` text
发布过程中

↓

新旧版本可能同时存在
```

因此需要保证：

> API、数据库和依赖具有一定向前/向后兼容能力。

------------------------------------------------------------------------

# 24. Blue-Green蓝绿发布（★★★★★）

蓝绿发布维护两套环境：

``` text
Blue

Version 1


Green

Version 2
```

开始：

``` text
Traffic

↓

Blue
```

新版本验证完成：

``` text
Traffic

↓

Green
```

如果失败：

``` text
Traffic

↓

Blue
```

优点：

-   切换快速；
-   回滚快速；
-   新旧环境隔离明显。

缺点：

``` text
通常需要更多资源
```

------------------------------------------------------------------------

# 25. Canary金丝雀发布（★★★★★）

Canary：

> 先让少量流量进入新版本，再逐步扩大。

例如：

``` text
V1 = 95%

V2 = 5%
```

观察：

``` text
Error Rate

Latency

Business Metrics
```

正常后：

``` text
V2

5%

↓

20%

↓

50%

↓

100%
```

异常：

``` text
停止放量

↓

Rollback
```

Canary 特别适合：

> 风险较高、需要真实流量验证的新版本发布。

------------------------------------------------------------------------

# 26. CI/CD回滚机制（★★★★★）

回滚需要分层设计。

## 应用配置回滚

``` text
Git Revert

Helm Rollback

Deployment Rollback
```

## 镜像回滚

``` text
Image v2

↓

Image v1
```

## 数据库回滚

更加复杂：

``` text
Schema Migration

Business Data

↓

需要独立策略
```

因此：

> 应用版本回滚不等于数据回滚。

生产系统必须提前设计兼容性和恢复方案。

------------------------------------------------------------------------

# 27. Pipeline Secret与凭据安全（★★★★★）

CI/CD 中可能使用：

``` text
Registry Token

Git Token

Cloud Credential

Kubernetes Credential

Signing Key
```

不能：

``` text
直接写在Pipeline YAML

直接提交Git
```

应使用：

``` text
CI Secret Store

Secret Manager

Short-Lived Credential

Workload Identity
```

并遵循：

``` text
Least Privilege
```

------------------------------------------------------------------------

# 28. CI/CD质量门禁（★★★★★）

Quality Gate：

> 只有满足规定质量标准，Pipeline才能进入下一阶段。

例如：

``` text
Unit Test Pass

Coverage >= Threshold

No Critical Vulnerability

Image Scan Pass

Policy Check Pass
```

否则：

``` text
Pipeline Stop
```

质量门禁可以把：

``` text
组织规范

↓

自动化执行
```

------------------------------------------------------------------------

# 29. CI/CD可观测性与审计

CI/CD 本身也需要可观测。

需要记录：

``` text
谁触发？

哪个Commit？

哪个Image？

部署到哪个Cluster？

什么时候部署？

是否成功？

谁批准？
```

典型指标：

``` text
Deployment Frequency

Lead Time

Change Failure Rate

Mean Time to Recovery
```

这些指标可以帮助持续改进交付效率和可靠性。

------------------------------------------------------------------------

# 30. 企业级CI/CD架构设计（★★★★★）

完整架构：

``` text
Developer
    ↓
Source Repository
    ↓
Pull Request
    ↓
CI Pipeline
    │
    ├── Build
    ├── Test
    ├── Security Scan
    └── Docker Build
          ↓
    Container Registry
          ↓
    Update GitOps Repo
          ↓
    Pull Request / Approval
          ↓
       Argo CD
          ↓
      Kubernetes
          ↓
  Progressive Delivery
          ↓
    Observability
```

同时外围还包括：

``` text
Secret Management

RBAC

Audit

Backup

Policy

Artifact Governance
```

------------------------------------------------------------------------

# 31. CI/CD常见问题与排查

## Pipeline Build失败

检查：

``` text
Dependency

Build Environment

Compiler

Configuration
```

------------------------------------------------------------------------

## Image Build成功但无法部署

检查：

``` text
Registry Push是否成功？

Image Tag是否正确？

ImagePullSecret是否正确？

Cluster能否访问Registry？
```

------------------------------------------------------------------------

## Pod启动失败

检查：

``` text
kubectl get pods

kubectl describe pod

kubectl logs
```

------------------------------------------------------------------------

## GitOps一直OutOfSync

检查：

``` text
Manifest差异

Controller状态

RBAC

手工Cluster修改

生成配置是否稳定
```

------------------------------------------------------------------------

## 发布成功但业务异常

进一步检查：

``` text
Readiness

Service

Ingress

NetworkPolicy

Logs

Metrics

Traces

External Dependencies
```

------------------------------------------------------------------------

# 32. Kubernetes CI/CD生产最佳实践

1.  所有代码进入版本控制；
2.  关键分支启用Code Review；
3.  Pipeline自动执行测试；
4.  Build一次，多环境晋级同一制品；
5.  镜像使用不可歧义版本；
6.  不依赖`latest`作为生产版本策略；
7.  镜像进入Registry前执行安全扫描；
8.  Pipeline配置同样纳入版本控制；
9.  Secret不得明文提交Git；
10. CI/CD权限遵循最小权限；
11. 生产环境设置质量门禁；
12. 高风险发布保留审批机制；
13. 使用Rolling、Blue-Green或Canary控制发布风险；
14. 发布过程接入Metrics、Logs和Traces；
15. 为失败发布准备自动或快速回滚机制；
16. 数据库迁移必须考虑版本兼容；
17. GitOps环境尽量减少手工修改Cluster；
18. 记录Commit、Image、Release和Deployment之间的映射；
19. 对Pipeline和部署行为保留审计记录；
20. 定期评估交付效率与失败率。

------------------------------------------------------------------------

# 33. 系统架构设计师考点

## 什么是CI？

答：

> CI即持续集成，通过频繁集成代码并自动执行构建、测试和质量检查，尽早发现代码集成问题。

------------------------------------------------------------------------

## Continuous Delivery与Continuous Deployment区别？

答：

> Continuous
> Delivery强调软件始终保持可发布状态，生产发布可以保留人工审批；Continuous
> Deployment则在通过自动化检查后自动发布到生产环境。

------------------------------------------------------------------------

## 为什么推荐Build Once, Promote Many？

答：

> 因为同一制品经过不同环境逐级验证，可以保证生产部署的制品与测试验证的制品一致，减少重新构建产生的不确定性。

------------------------------------------------------------------------

## Push CD和Pull CD区别？

答：

> Push模式由CI/CD系统主动连接目标集群执行部署；Pull模式通常由目标环境中的GitOps
> Controller主动获取期望配置并执行调谐。

------------------------------------------------------------------------

## Rolling、Blue-Green、Canary区别？

答：

> Rolling逐步替换旧实例；Blue-Green维护两套完整版本并切换流量；Canary先向新版本导入少量流量，验证后逐步扩大。

------------------------------------------------------------------------

## GitOps与CI是什么关系？

答：

> CI负责构建、测试、扫描和产生可信制品；GitOps通常负责根据Git中的声明式期望状态持续完成Kubernetes交付与状态调谐。

------------------------------------------------------------------------

## 为什么CI/CD需要安全扫描？

答：

> 将安全检查前移可以在软件进入生产之前发现依赖、代码、镜像和配置中的高风险问题，降低供应链和运行时风险。

------------------------------------------------------------------------

# 34. Mermaid CI/CD完整架构图

``` mermaid
flowchart TD

A[Developer] --> B[Source Git]
B --> C[Pull Request / Merge]
C --> D[CI Pipeline]

D --> E[Build]
D --> F[Test]
D --> G[Security Scan]

E --> H[Docker Build]
F --> H
G --> H

H --> I[Container Registry]
I --> J[Update Deployment Version]

J --> K[GitOps Repository]
K --> L[Review / Approval]
L --> M[Argo CD / GitOps Controller]

M --> N[Kubernetes Cluster]

N --> O[Rolling Update]
N --> P[Blue-Green]
N --> Q[Canary]

O --> R[Application]
P --> R
Q --> R

R --> S[Metrics / Logs / Traces]
S --> T[Deployment Feedback]

T --> M
```

------------------------------------------------------------------------

# 35. 本节小结

Kubernetes CI/CD核心知识：

1.  CI负责持续集成、构建、测试和质量检查；
2.  Continuous Delivery强调始终可发布；
3.  Continuous Deployment强调通过检查后自动发布；
4.  Pipeline将人工交付步骤转化为自动化流程；
5.  Kubernetes应用通常以Container Image作为主要交付制品；
6.  Registry负责镜像存储和分发；
7.  生产镜像应使用明确且可追踪的版本；
8.  DevSecOps将安全扫描纳入Pipeline；
9.  Helm负责应用模板化和Release管理；
10. Kustomize负责Base + Overlay多环境配置；
11. GitOps负责Desired State和持续调谐；
12. Push模式由Pipeline主动部署，Pull模式由Controller主动获取配置；
13. Argo CD是常见Kubernetes GitOps CD工具；
14. 多环境推荐Build Once, Promote Many；
15. Rolling Update逐步替换实例；
16. Blue-Green通过两套环境切换流量；
17. Canary通过逐步放量降低发布风险；
18. 应用回滚与数据库数据回滚必须分别设计；
19. CI/CD凭据必须安全管理并遵循最小权限；
20. 企业CI/CD需要结合质量门禁、可观测性、审计和灾难恢复形成完整交付体系。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Kubernetes CI/CD就是把"代码提交 → 构建 → 测试 → 安全扫描 → Docker镜像
> → Registry → 部署配置 → GitOps/CD → Kubernetes → 灰度发布 →
> 可观测性反馈"串成自动化交付闭环；CI负责产生可信制品，CD负责安全地把制品送到目标环境。
