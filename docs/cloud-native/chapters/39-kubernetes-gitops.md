# 39 Kubernetes GitOps 持续交付与自动化部署

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes GitOps
> 持续交付与自动化部署体系，重点掌握声明式配置、Git
> 单一事实来源、Desired State、持续调谐、Push/Pull 模式、CI/CD、Argo
> CD、Flux、Helm、Kustomize、多环境与多集群管理，以及 GitOps
> 与灾难恢复的关系。

------------------------------------------------------------------------

# 目录

1.  GitOps概述
2.  为什么需要GitOps
3.  GitOps核心原则
4.  GitOps整体架构
5.  Git作为Single Source of Truth
6.  声明式配置与Desired State
7.  GitOps持续调谐机制
8.  Push模式与Pull模式
9.  CI/CD与GitOps的关系
10. GitOps标准工作流程
11. Argo CD核心原理
12. Argo CD整体架构
13. Flux核心原理
14. GitOps Repository目录设计
15. Kubernetes多环境配置管理
16. Helm与GitOps
17. Kustomize与GitOps
18. 自动同步与手动同步
19. Drift配置漂移检测
20. GitOps回滚机制
21. Secret与GitOps安全
22. RBAC与GitOps权限控制
23. 多集群GitOps管理
24. GitOps与灾难恢复
25. GitOps与传统CI/CD区别
26. 企业GitOps部署架构
27. GitOps生产最佳实践
28. GitOps常见问题与排查
29. 系统架构设计师考点
30. Mermaid GitOps架构图
31. 本节小结

------------------------------------------------------------------------

# 1. GitOps概述（★★★★★）

GitOps是一种以Git为核心的云原生持续交付和运维模式。

核心思想：

> 将系统期望状态以声明式配置保存在Git中，并由自动化控制器持续比较Git中的期望状态与集群实际状态，使实际环境逐步收敛到期望状态。

基本关系：

``` text
Git Repository
      │
      │ Desired State
      ↓
GitOps Controller
      │
      │ Compare / Reconcile
      ↓
Kubernetes Cluster
      │
      ↓
Actual State
```

因此GitOps并不只是：

``` text
把YAML文件放进Git
```

真正关键的是：

``` text
声明式配置

+

版本控制

+

自动化同步

+

持续调谐
```

------------------------------------------------------------------------

# 2. 为什么需要GitOps

传统部署中经常出现：

``` text
开发人员

↓

手工执行kubectl

↓

修改生产Cluster
```

久而久之容易产生：

-   谁修改了配置不清楚；
-   Git中的YAML与生产不一致；
-   回滚困难；
-   环境差异越来越大；
-   操作缺乏审计；
-   人工误操作风险高。

GitOps将变更过程改造成：

``` text
修改Git

↓

Code Review

↓

Merge

↓

Controller检测变化

↓

自动同步Cluster
```

这样可以提高：

-   可追溯性；
-   一致性；
-   自动化程度；
-   回滚能力；
-   审计能力。

------------------------------------------------------------------------

# 3. GitOps核心原则（★★★★★）

GitOps可以概括为几个核心原则。

## 声明式

系统状态通过声明式配置描述。

``` yaml
replicas: 3
```

表达的是：

> 我希望系统最终运行3个副本。

------------------------------------------------------------------------

## 版本化

期望状态保存在Git：

``` text
Commit

↓

History

↓

Diff

↓

Rollback
```

------------------------------------------------------------------------

## 自动获取变更

GitOps Controller持续关注Git中的配置变化。

------------------------------------------------------------------------

## 持续调谐

Controller持续比较：

``` text
Desired State

与

Actual State
```

并尝试使系统收敛。

------------------------------------------------------------------------

# 4. GitOps整体架构

典型架构：

``` text
Developer
    ↓
Git Push
    ↓
Application Repository
    ↓
CI
    ↓
Build Image
    ↓
Container Registry
    ↓
Update Deployment Manifest
    ↓
GitOps Repository
    ↓
GitOps Controller
    ↓
Kubernetes Cluster
```

其中：

``` text
CI

主要负责构建、测试、镜像


GitOps Controller

主要负责部署与状态同步
```

------------------------------------------------------------------------

# 5. Git作为Single Source of Truth（★★★★★）

Single Source of Truth：

> 单一事实来源。

在GitOps体系中，Git通常保存系统的期望配置。

例如：

``` text
Git

├── Deployment
├── Service
├── Ingress
├── ConfigMap
├── HPA
└── NetworkPolicy
```

理想情况下：

``` text
生产配置变更

↓

先修改Git

↓

再由GitOps Controller同步
```

而不是：

``` text
直接kubectl edit生产资源
```

否则容易产生配置漂移。

------------------------------------------------------------------------

# 6. 声明式配置与Desired State

Kubernetes本身就是典型声明式系统。

例如：

``` yaml
apiVersion: apps/v1
kind: Deployment

spec:
  replicas: 3
```

表示：

``` text
Desired State

=

3 Pods
```

如果实际只有2个：

``` text
Actual State = 2
```

Kubernetes Controller会尝试：

``` text
2 → 3
```

GitOps进一步将这种思想扩展到：

``` text
Git Desired State

↓

Kubernetes Desired State
```

形成多层控制循环。

------------------------------------------------------------------------

# 7. GitOps持续调谐机制（★★★★★）

Reconciliation：

> 调谐。

基本流程：

``` text
读取Git

↓

读取Cluster

↓

Compare

↓

发现差异

↓

Reconcile

↓

再次Compare
```

最终目标：

``` text
Desired State

≈

Actual State
```

这是一种持续控制循环，而不是一次性部署脚本。

------------------------------------------------------------------------

# 8. Push模式与Pull模式（★★★★★）

传统CD经常采用Push模式：

``` text
CI/CD Server

↓

持有Cluster Credential

↓

kubectl / Helm

↓

Kubernetes
```

GitOps常见模式更偏向Pull：

``` text
Git Repository

←── GitOps Controller

       ↓

Kubernetes
```

Controller运行在或连接到目标环境，主动获取期望配置并执行同步。

Pull模式的优势之一：

> CI系统不一定需要直接持有生产集群的高权限访问凭据。

------------------------------------------------------------------------

# 9. CI/CD与GitOps的关系

GitOps不是取消CI。

典型职责：

``` text
CI

├── Build
├── Test
├── Scan
└── Push Image
```

而CD/GitOps部分：

``` text
GitOps Controller

├── Detect Manifest Change
├── Compare State
├── Sync
└── Reconcile
```

完整流程：

``` text
Source Code

↓

CI

↓

Container Image

↓

Registry

↓

Update GitOps Config

↓

GitOps Controller

↓

Kubernetes
```

------------------------------------------------------------------------

# 10. GitOps标准工作流程（★★★★★）

典型流程：

``` text
Developer修改代码

↓

Git Push

↓

CI Test

↓

Build Image

↓

Push Registry

↓

更新Manifest中的Image Tag

↓

Commit GitOps Repository

↓

GitOps Controller检测变化

↓

Sync

↓

Kubernetes Rolling Update

↓

Health Check
```

如果出现异常：

``` text
Rollback Git Commit

↓

Controller检测

↓

恢复旧版本配置
```

------------------------------------------------------------------------

# 11. Argo CD核心原理（★★★★★）

Argo CD是常见的Kubernetes GitOps持续交付工具。

核心工作：

``` text
Git

↓

读取Desired State

↓

与Cluster Actual State比较

↓

显示Sync Status

↓

执行同步
```

典型状态：

``` text
Synced

OutOfSync
```

还会结合应用健康状态：

``` text
Healthy

Degraded

Progressing
```

核心价值：

> 将Git中的声明式配置与Kubernetes实际状态建立持续同步关系。

------------------------------------------------------------------------

# 12. Argo CD整体架构

概念架构：

``` text
Git Repository
      │
      ↓
   Argo CD
      │
      ├── Compare
      ├── Sync
      ├── Health
      └── Reconcile
      │
      ↓
Kubernetes Cluster
```

用户通常通过：

``` text
Web UI

CLI

API
```

查看应用状态和执行授权范围内的操作。

生产环境应配合：

``` text
RBAC

SSO

Least Privilege
```

------------------------------------------------------------------------

# 13. Flux核心原理

Flux也是GitOps生态中的重要工具。

基本思想同样是：

``` text
Git / OCI等声明式来源

↓

Controller

↓

Reconciliation

↓

Kubernetes
```

Flux强调基于Kubernetes Controller模式实现持续调谐，并可以与：

-   Git；
-   Helm；
-   Kustomize；

等方式结合。

学习重点不是死记工具命令，而是理解：

> GitOps工具的本质是持续调谐声明式期望状态。

------------------------------------------------------------------------

# 14. GitOps Repository目录设计

典型目录：

``` text
gitops-repo/

├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
│
└── overlays/
    ├── dev/
    ├── test/
    └── prod/
```

也可以按：

``` text
clusters/

apps/

environments/
```

组织。

目标：

-   环境边界清晰；
-   配置复用；
-   易于Code Review；
-   减少重复；
-   避免生产配置误改。

------------------------------------------------------------------------

# 15. Kubernetes多环境配置管理（★★★★★）

企业常见：

``` text
dev

test

staging

prod
```

不同环境可能存在：

``` text
replicas

resources

domain

image tag

HPA

StorageClass
```

GitOps需要做到：

``` text
共享基础配置

+

环境差异配置
```

而不是：

``` text
复制4套完全独立YAML

↓

长期逐渐失控
```

------------------------------------------------------------------------

# 16. Helm与GitOps

Helm适合：

> Kubernetes应用模板化与包管理。

GitOps Controller可以根据Git中的Helm相关声明生成或部署资源。

关系：

``` text
Git

↓

Helm Chart + Values

↓

GitOps Controller

↓

Rendered Kubernetes Resources

↓

Cluster
```

适合：

-   参数较多；
-   应用组件复杂；
-   多环境Values管理。

------------------------------------------------------------------------

# 17. Kustomize与GitOps（★★★★★）

Kustomize强调：

> 基础配置 + Overlay。

例如：

``` text
base

↓

deployment.yaml


overlays/dev

↓

replicas = 1


overlays/prod

↓

replicas = 5
```

优势：

``` text
不复制整套YAML

↓

只维护环境差异
```

与GitOps结合非常自然。

------------------------------------------------------------------------

# 18. 自动同步与手动同步

GitOps并不意味着所有环境都必须完全自动同步。

## 自动同步

``` text
Git Change

↓

Automatically Sync

↓

Cluster
```

适合：

-   开发环境；
-   自动化程度高的场景。

## 手动同步

``` text
Git Change

↓

OutOfSync

↓

人工批准

↓

Sync
```

适合部分：

-   生产环境；
-   强审批流程。

企业可以根据风险等级设计不同策略。

------------------------------------------------------------------------

# 19. Drift配置漂移检测（★★★★★）

Drift：

> 实际集群状态偏离Git中期望状态。

例如Git：

``` text
replicas = 3
```

管理员手工执行：

``` bash
kubectl scale deployment web --replicas=8
```

此时：

``` text
Git Desired State = 3

Cluster Actual State = 8
```

产生：

``` text
Drift
```

GitOps Controller可以检测差异。

根据策略：

``` text
告警

或

自动恢复到3
```

这就是GitOps的重要价值之一。

------------------------------------------------------------------------

# 20. GitOps回滚机制

传统回滚可能需要：

``` text
寻找旧YAML

↓

手工重新部署
```

GitOps中可以：

``` text
Git History

↓

找到稳定Commit

↓

Revert

↓

GitOps Controller

↓

Sync

↓

Cluster恢复旧配置
```

优势：

-   变更历史明确；
-   容易审计；
-   回滚过程标准化。

但需要注意：

> Git配置回滚并不等于数据库数据回滚。

涉及数据库Schema和业务数据时，需要单独设计迁移与恢复策略。

------------------------------------------------------------------------

# 21. Secret与GitOps安全（★★★★★）

GitOps最大的安全问题之一：

``` text
Git中不能直接保存明文Password / Token / Private Key
```

错误：

``` yaml
password: my-production-password
```

一旦提交：

``` text
Git History

↓

长期保留
```

即使之后删除，也可能仍存在于历史记录。

常见思路：

``` text
Encrypted Secret

External Secret Manager

Sealed Secret等机制
```

核心原则：

> Git保存可审计的声明式配置，但敏感信息必须使用安全的密钥管理方式。

------------------------------------------------------------------------

# 22. RBAC与GitOps权限控制

GitOps Controller通常需要访问Kubernetes API。

因此必须控制：

``` text
Controller

↓

ServiceAccount

↓

RBAC

↓

Cluster
```

错误设计：

``` text
所有GitOps Controller

↓

cluster-admin
```

正确思路：

``` text
按应用

按Namespace

按Cluster

↓

授予必要权限
```

同时Git Repository本身也需要：

-   Branch Protection；
-   Code Review；
-   Merge权限；
-   Audit Log。

因为：

> 能修改Git中的生产配置，本质上可能等同于拥有生产变更权限。

------------------------------------------------------------------------

# 23. 多集群GitOps管理（★★★★★）

企业可能有：

``` text
Cluster Dev

Cluster Test

Cluster Prod

Cluster DR
```

GitOps可以建立：

``` text
Central Git Repository

↓

GitOps Management

↓

Multiple Clusters
```

配置结构：

``` text
clusters/

├── dev/
├── test/
├── prod/
└── dr/
```

优势：

-   统一管理；
-   环境一致；
-   集群配置可追踪；
-   易于批量升级。

但也必须避免：

``` text
一个错误Commit

↓

同时破坏所有Cluster
```

因此需要：

-   分环境审批；
-   渐进式发布；
-   权限隔离。

------------------------------------------------------------------------

# 24. GitOps与灾难恢复（★★★★★）

上一章学习了Backup & Recovery。

GitOps可以帮助恢复：

``` text
Kubernetes声明式配置
```

例如：

``` text
Primary Cluster故障

↓

创建DR Cluster

↓

安装GitOps Controller

↓

连接Git Repository

↓

重新同步Resources
```

可以恢复：

-   Deployment；
-   Service；
-   Ingress；
-   ConfigMap模板；
-   HPA；
-   NetworkPolicy；
-   RBAC等。

但：

``` text
GitOps

≠

完整Backup
```

GitOps通常不能单独恢复：

``` text
PV Data

Database Data

etcd Historical State
```

因此完整DR：

``` text
GitOps

+

Backup

+

Persistent Data Recovery
```

------------------------------------------------------------------------

# 25. GitOps与传统CI/CD区别（★★★★★）

  传统CI/CD                    GitOps
  ---------------------------- -------------------------------
  Pipeline常直接部署集群       Controller持续调谐集群
  常见Push模式                 常见Pull/Reconcile模式
  CI/CD系统可能持有集群凭据    可减少CI直接访问生产集群
  部署通常由Pipeline触发       Git状态变化驱动同步
  状态漂移检测能力视方案而定   持续比较Desired与Actual State

最核心区别：

``` text
传统CD

执行一次部署流程


GitOps

持续保证系统状态接近期望状态
```

------------------------------------------------------------------------

# 26. 企业GitOps部署架构

典型企业架构：

``` text
Developer
    ↓
Application Git
    ↓
CI Pipeline
    ↓
Test / Scan
    ↓
Container Registry
    ↓
Update Image Version
    ↓
GitOps Repository
    ↓
Pull Request / Review
    ↓
Merge
    ↓
GitOps Controller
    ↓
Kubernetes Cluster
    ↓
Observability
```

生产环境还应结合：

``` text
RBAC

Security Scan

Policy

Audit

Backup

Monitoring
```

形成完整DevSecOps流程。

------------------------------------------------------------------------

# 27. GitOps生产最佳实践

建议：

1.  Git作为声明式配置的事实来源；
2.  尽量减少直接修改生产Cluster；
3.  所有生产变更通过Pull Request审查；
4.  启用Branch Protection；
5.  应用配置与环境配置合理分层；
6.  使用Helm或Kustomize减少重复；
7.  不在Git保存明文Secret；
8.  GitOps Controller遵循最小权限；
9.  开发与生产环境采用不同同步策略；
10. 对关键生产变更保留人工审批；
11. 开启Drift检测；
12. 建立清晰回滚流程；
13. 对GitOps Controller本身进行高可用设计；
14. 监控同步失败和应用健康状态；
15. 多集群变更采用渐进式策略；
16. 将GitOps与Backup/DR结合；
17. 将GitOps Repository纳入审计与安全治理；
18. 避免使用不可追踪的手工生产变更。

------------------------------------------------------------------------

# 28. GitOps常见问题与排查

## 问题一：Git已更新，但Cluster没有变化

检查：

``` text
Controller是否正常？

Repository连接是否正常？

目标Revision是否正确？

自动同步是否开启？

是否存在权限错误？
```

------------------------------------------------------------------------

## 问题二：持续显示OutOfSync

可能原因：

``` text
有人手工修改Cluster

↓

Drift
```

或者某些资源字段被其他Controller动态修改。

需要确认差异字段和资源所有权。

------------------------------------------------------------------------

## 问题三：同步失败

检查：

-   YAML语法；
-   CRD是否存在；
-   Namespace；
-   RBAC；
-   Admission Policy；
-   Image；
-   Helm/Kustomize渲染结果。

------------------------------------------------------------------------

## 问题四：Git回滚后业务仍异常

可能原因：

``` text
Manifest恢复

但是

Database Schema / Data没有恢复
```

因此应用回滚与数据回滚必须分别设计。

------------------------------------------------------------------------

# 29. 系统架构设计师考点

## 什么是GitOps？

答：

> GitOps是一种以Git中的声明式配置作为系统期望状态，通过自动化控制器持续比较并调谐实际环境的持续交付和运维模式。

------------------------------------------------------------------------

## GitOps为什么强调Git？

答：

> Git提供版本控制、变更历史、Diff、Review和回滚能力，可以作为声明式配置的单一事实来源。

------------------------------------------------------------------------

## 什么是Desired State？

答：

> Desired
> State表示系统期望达到的目标状态，例如Deployment期望运行3个Pod副本。

------------------------------------------------------------------------

## 什么是Reconciliation？

答：

> Reconciliation是控制器持续比较期望状态和实际状态，并采取动作使实际状态向期望状态收敛的过程。

------------------------------------------------------------------------

## 什么是Drift？

答：

> Drift是实际集群状态与Git中声明的期望状态发生偏离的现象。

------------------------------------------------------------------------

## GitOps和传统CI/CD主要区别？

答：

> 传统CI/CD常通过Pipeline直接Push部署，而GitOps通常由Controller从声明式配置源获取期望状态，并持续执行比较、同步和调谐。

------------------------------------------------------------------------

## GitOps能否替代备份？

答：

> 不能。GitOps主要恢复声明式资源状态，PV、数据库和其他持久化业务数据仍需要独立备份与恢复机制。

------------------------------------------------------------------------

## GitOps为什么有利于审计？

答：

> 因为生产配置变更可以通过Git Commit、Pull
> Request和Review记录进行追踪，从而明确谁在什么时候修改了什么内容。

------------------------------------------------------------------------

# 30. Mermaid GitOps架构图

``` mermaid
flowchart TD

A[Developer] --> B[Application Git]
B --> C[CI Pipeline]

C --> D[Test / Security Scan]
D --> E[Build Container Image]
E --> F[Container Registry]

C --> G[Update Deployment Manifest]
G --> H[GitOps Repository]

H --> I[Pull Request / Review]
I --> J[Merge]

J --> K[GitOps Controller]

K --> L[Compare Desired State]
L --> M[Kubernetes Actual State]

L -->|OutOfSync| N[Reconcile / Sync]
N --> M

M --> O[Application]
O --> P[Observability]

Q[Git History] --> R[Rollback / Revert]
R --> J
```

------------------------------------------------------------------------

# 31. 本节小结

GitOps核心知识：

1.  GitOps以Git中的声明式配置作为系统期望状态；
2.  Git提供版本控制、审计、Review和回滚能力；
3.  GitOps Controller持续比较Desired State与Actual State；
4.  Reconciliation是GitOps最核心的机制之一；
5.  Drift表示实际集群状态偏离Git期望状态；
6.  GitOps常采用Pull/Reconcile模式；
7.  CI主要负责构建、测试和镜像，GitOps负责持续交付和状态同步；
8.  Argo CD和Flux是常见GitOps工具；
9.  Helm和Kustomize可用于多环境配置管理；
10. 自动同步和手动同步应根据环境风险选择；
11. Secret不能以明文方式直接保存在Git；
12. GitOps Controller必须遵循RBAC最小权限原则；
13. GitOps适合多环境和多集群统一管理；
14. GitOps可以帮助灾难后重建Kubernetes声明式资源；
15. GitOps不能替代PV和数据库备份；
16. 企业GitOps应结合CI、Registry、Security、Observability和Backup形成完整DevSecOps体系。

------------------------------------------------------------------------

# 一句话冲刺记忆

> GitOps不是简单地"把YAML放进Git"，而是以Git作为声明式期望状态的事实来源，通过GitOps
> Controller持续执行"比较 → 发现漂移 → 调谐 →
> 同步"，让Kubernetes实际状态持续收敛到Git中的Desired State。
