# 46 Kubernetes Admission Controller 准入控制与策略治理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇系统介绍 Kubernetes Admission
> Controller（准入控制器）与策略治理体系，重点掌握
> Authentication、Authorization、Admission、Mutating
> Admission、Validating Admission、Admission
> Webhook、ValidatingAdmissionPolicy、CEL、Pod Security、Policy as
> Code，以及 OPA/Gatekeeper、Kyverno 等策略治理方案。

------------------------------------------------------------------------

# 目录

1.  Admission Controller概述
2.  为什么Kubernetes需要准入控制
3.  Kubernetes API请求完整生命周期
4.  Authentication身份认证
5.  Authorization权限授权
6.  Admission准入控制
7.  Admission Controller整体架构
8.  Mutating Admission与Validating Admission
9.  Mutating Admission工作原理
10. Validating Admission工作原理
11. Mutating与Validating执行关系
12. Built-in Admission Controller
13. Admission Webhook概述
14. MutatingAdmissionWebhook
15. ValidatingAdmissionWebhook
16. Webhook完整调用流程
17. AdmissionReview请求与响应模型
18. Webhook匹配规则
19. namespaceSelector与objectSelector
20. failurePolicy故障策略
21. timeoutSeconds超时控制
22. reinvocationPolicy重新调用机制
23. sideEffects副作用声明
24. Webhook TLS与证书管理
25. Admission与CRD Validation
26. ValidatingAdmissionPolicy
27. CEL声明式策略校验
28. Admission与RBAC区别
29. Admission与NetworkPolicy区别
30. Admission与Pod Security
31. Admission与Policy as Code
32. OPA与Gatekeeper策略治理
33. Kyverno策略治理
34. 企业级Admission策略体系
35. Admission高可用设计
36. Admission安全风险
37. Admission常见问题与排查
38. Admission生产最佳实践
39. 系统架构设计师考点
40. Mermaid Admission完整流程图
41. 本节小结

------------------------------------------------------------------------

# 1. Admission Controller概述（★★★★★）

Admission Controller：

> Kubernetes API Server
> 在请求通过身份认证和权限授权之后、对象最终持久化之前执行的一组准入控制机制。

它解决的问题不是：

``` text
用户是谁？
```

也不是：

``` text
用户有没有create权限？
```

而是：

``` text
这个请求即使有权限，
是否仍然符合平台安全与治理策略？
```

例如用户拥有：

``` text
create pods
```

但提交了：

``` yaml
securityContext:
  privileged: true
```

Admission 仍然可以拒绝。

------------------------------------------------------------------------

# 2. 为什么Kubernetes需要准入控制（★★★★★）

仅依赖 RBAC 通常只能回答：

``` text
谁
可以对
什么资源
执行什么动作
```

例如：

``` text
Developer

↓

可以 create Deployment
```

但 RBAC 通常不会表达：

``` text
镜像必须来自公司Registry

禁止Privileged Container

必须设置CPU/Memory

必须包含owner标签

禁止使用hostNetwork
```

这些属于：

> Policy / Governance。

Admission Controller 正是 Kubernetes API 层实现这类治理的重要机制。

------------------------------------------------------------------------

# 3. Kubernetes API请求完整生命周期（★★★★★）

可以把典型写请求理解为：

``` text
kubectl / Client
       ↓
   API Server
       ↓
Authentication
       ↓
Authorization
       ↓
Mutating Admission
       ↓
Schema / Object Validation
       ↓
Validating Admission
       ↓
Persistence
       ↓
      etcd
```

实际内部处理细节比该图更复杂，但学习时最重要的是理解：

``` text
认证
 ↓
授权
 ↓
准入
 ↓
持久化
```

------------------------------------------------------------------------

# 4. Authentication身份认证（★★★★★）

Authentication：

> 身份认证，回答"你是谁"。

例如：

``` text
User

ServiceAccount

Client Certificate

OIDC Identity
```

认证成功后，API Server 获得：

``` text
Username

Groups

Identity
```

认证失败：

``` text
Request Rejected
```

------------------------------------------------------------------------

# 5. Authorization权限授权（★★★★★）

Authorization：

> 判断已经认证的身份是否有权执行当前操作。

例如：

``` text
User Alice

↓

create

↓

pods

↓

namespace dev
```

RBAC 可以决定：

``` text
Allow / Deny
```

因此：

``` text
Authentication
↓
Who are you?

Authorization
↓
What are you allowed to do?
```

------------------------------------------------------------------------

# 6. Admission准入控制（★★★★★）

通过 Authorization 并不代表请求一定会被接受。

例如：

``` text
Developer
   ↓
拥有create pod权限
   ↓
提交Privileged Pod
```

RBAC：

``` text
Allowed
```

Admission：

``` text
Policy Violation
↓
Rejected
```

因此：

``` text
Admission
↓
这个已经获得授权的请求
是否符合平台规则？
```

------------------------------------------------------------------------

# 7. Admission Controller整体架构（★★★★★）

``` text
Client
  ↓
API Server
  ↓
Authentication
  ↓
Authorization
  ↓
Admission Controllers
  │
  ├── Mutating
  │
  └── Validating
  ↓
Validation
  ↓
Storage
```

Admission Controller 可以是：

``` text
Built-in Admission Plugin
```

也可以通过：

``` text
Admission Webhook
```

扩展。

------------------------------------------------------------------------

# 8. Mutating Admission与Validating Admission（★★★★★）

## Mutating Admission

作用：

> 修改请求对象。

例如：

``` text
自动添加Label

自动添加Annotation

补充默认配置

注入Sidecar
```

------------------------------------------------------------------------

## Validating Admission

作用：

> 判断对象是否允许进入集群。

例如：

``` text
禁止Privileged

限制镜像Registry

要求必须配置Resource Limits
```

记忆：

``` text
Mutating
↓
修改

Validating
↓
判断
```

------------------------------------------------------------------------

# 9. Mutating Admission工作原理（★★★★★）

例如用户提交：

``` yaml
metadata:
  name: app
```

Mutating Admission 可以补充：

``` yaml
metadata:
  name: app
  labels:
    environment: production
```

流程：

``` text
Original Object
      ↓
Mutating Admission
      ↓
Modified Object
```

经典场景之一：

``` text
Application Pod
      ↓
Sidecar Injection
      ↓
Application + Proxy
```

------------------------------------------------------------------------

# 10. Validating Admission工作原理（★★★★★）

Validating Admission 不负责修改对象，而是：

``` text
Object
  ↓
Policy Check
  ↓
Allow / Reject
```

例如：

``` text
image:
  docker.io/example/app
```

企业策略要求：

``` text
必须使用registry.company.example
```

结果：

``` text
Reject
```

并向客户端返回原因。

------------------------------------------------------------------------

# 11. Mutating与Validating执行关系（★★★★★）

学习时可以记为：

``` text
Request
   ↓
Mutating
   ↓
对象可能被修改
   ↓
Validating
   ↓
Allow / Reject
```

设计原则：

> Validation 应针对最终将被接受的对象状态进行判断。

Mutating Webhook 还存在重新调用等机制，因此复杂环境中不能简单假设"每个
Mutating Webhook 永远只执行一次"。

------------------------------------------------------------------------

# 12. Built-in Admission Controller（★★★★☆）

Kubernetes API Server 内置多种 Admission Plugin。

不同版本和集群发行版启用的插件可能不同。

常见能力涉及：

``` text
Namespace生命周期

资源限制

ServiceAccount

Pod安全

默认配置
```

因此生产环境应明确：

``` text
当前集群启用了哪些Admission Plugins
```

而不是假设所有 Kubernetes 集群完全相同。

------------------------------------------------------------------------

# 13. Admission Webhook概述（★★★★★）

Admission Webhook 允许把准入逻辑扩展到外部 HTTPS 服务。

两种主要配置：

``` text
MutatingWebhookConfiguration

ValidatingWebhookConfiguration
```

架构：

``` text
API Server
    ↓
Admission Webhook
    ↓ HTTPS
Webhook Service
```

Webhook 返回：

``` text
Allowed

或

Denied
```

Mutating Webhook 还可以返回：

``` text
Patch
```

修改请求对象。

------------------------------------------------------------------------

# 14. MutatingAdmissionWebhook（★★★★★）

Mutating Webhook 常用于：

``` text
Sidecar Injection

自动添加Label

自动添加Annotation

默认配置注入
```

流程：

``` text
Pod Request
    ↓
API Server
    ↓
Mutating Webhook
    ↓
JSON Patch
    ↓
Modified Pod
```

注意：

> 不应让 Mutating Webhook
> 隐式修改大量关键业务语义，否则会降低系统可理解性。

------------------------------------------------------------------------

# 15. ValidatingAdmissionWebhook（★★★★★）

Validating Webhook 常用于：

``` text
安全策略

合规策略

镜像来源检查

资源规范检查

组织治理规则
```

例如：

``` text
Deployment
    ↓
Validating Webhook
    ↓
检查image registry
    ↓
Allow / Deny
```

优势：

``` text
可以实现复杂动态逻辑
```

代价：

``` text
增加外部依赖和运行复杂度
```

------------------------------------------------------------------------

# 16. Webhook完整调用流程（★★★★★）

``` text
kubectl apply
      ↓
API Server
      ↓
Webhook Matching
      ↓
构造AdmissionReview
      ↓
HTTPS Request
      ↓
Webhook Server
      ↓
Policy Logic
      ↓
AdmissionReview Response
      ↓
API Server
      ↓
Continue / Reject
```

因此 Webhook 本质上属于：

> API Server 请求路径中的同步依赖。

------------------------------------------------------------------------

# 17. AdmissionReview请求与响应模型（★★★★☆）

API Server 调用 Webhook 时会发送 AdmissionReview。

其中包含类似信息：

``` text
Operation

UserInfo

Resource

Namespace

Object

OldObject
```

Webhook 返回：

``` text
uid

allowed

status

patch
```

例如：

``` text
allowed = false
```

并提供：

``` text
拒绝原因
```

Mutating Webhook 则可以返回 Patch。

------------------------------------------------------------------------

# 18. Webhook匹配规则（★★★★★）

不是所有 API 请求都应该调用每个 Webhook。

可以通过规则限制：

``` text
operations

apiGroups

apiVersions

resources

scope
```

例如只检查：

``` text
CREATE / UPDATE

apps

deployments
```

设计原则：

> Webhook 匹配范围越精确，对 API Server 的额外影响通常越容易控制。

------------------------------------------------------------------------

# 19. namespaceSelector与objectSelector（★★★★☆）

可以进一步通过 Selector 控制匹配范围。

## namespaceSelector

例如：

``` text
只检查production Namespace
```

或者：

``` text
排除system Namespace
```

## objectSelector

可以根据对象 Label 决定是否匹配。

例如：

``` text
policy.company.example/enabled=true
```

但安全策略不能随意设计成：

``` text
用户自己添加一个Label就能绕过
```

必须考虑绕过风险。

------------------------------------------------------------------------

# 20. failurePolicy故障策略（★★★★★）

Webhook 服务可能发生：

``` text
Timeout

Network Error

Service Down
```

这时如何处理请求由 failurePolicy 等配置影响。

核心思想可以理解为：

``` text
Fail Open

vs

Fail Closed
```

安全关键策略通常倾向：

``` text
失败时拒绝
```

但如果所有策略都这样设计：

``` text
Webhook故障
↓
整个集群关键API写请求受阻
```

因此必须在：

``` text
Security

Availability
```

之间进行架构权衡。

------------------------------------------------------------------------

# 21. timeoutSeconds超时控制（★★★★★）

Webhook 位于 API 请求同步路径中。

如果：

``` text
Webhook Response = 20s
```

那么 API 请求延迟也会受到影响。

因此必须设置合理：

``` text
timeoutSeconds
```

并确保 Webhook：

``` text
快速
稳定
可扩展
```

原则：

> Admission Webhook 不适合执行耗时很长的业务流程。

------------------------------------------------------------------------

# 22. reinvocationPolicy重新调用机制（★★★★☆）

Mutating Webhook 之间可能存在依赖。

例如：

``` text
Webhook A

↓

修改对象


Webhook B

↓

再次修改对象
```

某些情况下，之前的 Mutating Webhook 可能需要针对变化后的对象重新执行。

因此 Kubernetes 提供：

``` text
reinvocationPolicy
```

相关机制。

开发 Mutating Webhook 时：

> 必须保证修改逻辑尽量幂等。

------------------------------------------------------------------------

# 23. sideEffects副作用声明（★★★★☆）

Admission Webhook 需要声明：

``` text
sideEffects
```

用于说明 Webhook 是否产生外部副作用。

理想的 Admission 逻辑应该尽量：

``` text
Pure Validation

或

Deterministic Mutation
```

避免：

``` text
每次准入都创建不可回滚的外部资源
```

否则重试和 Dry Run 都会变得复杂。

------------------------------------------------------------------------

# 24. Webhook TLS与证书管理（★★★★★）

API Server 与 Webhook 通常通过 HTTPS 通信。

因此需要：

``` text
TLS Certificate

CA Bundle

Service DNS

Certificate Rotation
```

典型：

``` text
API Server
    ↓ HTTPS
Webhook Service
    ↓
Webhook Pod
```

证书过期可能导致：

``` text
Admission Failure
```

因此证书生命周期必须纳入监控和自动化管理。

------------------------------------------------------------------------

# 25. Admission与CRD Validation（★★★★★）

第45篇已经学习：

``` text
CRD OpenAPI Schema
```

它适合：

``` text
字段类型

minimum / maximum

required

enum

结构校验
```

Admission 则可以处理更复杂规则，例如：

``` text
跨字段逻辑

组织策略

动态上下文

外部信息
```

原则：

> 能使用 CRD Schema / CEL 等声明式机制解决的问题，通常不应优先写复杂
> Webhook。

------------------------------------------------------------------------

# 26. ValidatingAdmissionPolicy（★★★★★）

Kubernetes 提供 ValidatingAdmissionPolicy，用于通过声明式策略对 API
请求执行验证。

核心思想：

``` text
API Request
    ↓
ValidatingAdmissionPolicy
    ↓
CEL Expression
    ↓
Allow / Deny
```

它可以减少一些简单验证场景对独立 Webhook 服务的依赖。

------------------------------------------------------------------------

# 27. CEL声明式策略校验（★★★★★）

CEL：

> Common Expression Language。

例如概念上要求：

``` text
replicas <= 10
```

或者：

``` text
必须存在某个Label
```

可以通过表达式描述。

相比自建 Webhook：

``` text
无需额外Webhook Server
无需单独网络调用
无需维护Webhook TLS服务
```

因此：

> 简单、确定性的准入规则优先考虑声明式策略机制。

------------------------------------------------------------------------

# 28. Admission与RBAC区别（★★★★★）

这是重点。

## RBAC

回答：

``` text
谁

可以对什么资源

执行什么操作？
```

例如：

``` text
Alice

可以

create deployment
```

## Admission

回答：

``` text
即使Alice有权限，

这个Deployment本身

是否符合规则？
```

例如：

``` text
RBAC

Allowed

↓

Admission

Image Registry不合规

↓

Rejected
```

------------------------------------------------------------------------

# 29. Admission与NetworkPolicy区别（★★★★★）

NetworkPolicy：

``` text
运行时网络访问控制
```

例如：

``` text
Pod A

能否访问

Pod B:8080
```

Admission：

``` text
API对象创建/更新时的准入控制
```

例如：

``` text
是否允许创建hostNetwork Pod
```

记忆：

``` text
Admission
↓
资源进入集群前治理

NetworkPolicy
↓
工作负载运行后的网络治理
```

------------------------------------------------------------------------

# 30. Admission与Pod Security（★★★★★）

Kubernetes Pod Security 体系用于约束 Pod 的安全配置。

常见安全级别概念：

``` text
Privileged

Baseline

Restricted
```

可以限制高风险配置，例如：

``` text
Privileged Container

Host Namespace

危险Capabilities
```

Pod Security 与 Admission 的关系：

``` text
Pod Request
    ↓
Admission
    ↓
Pod Security Policy Check
    ↓
Allow / Reject
```

这里的"Pod Security Policy Check"指 Pod Security Admission
所执行的策略检查，而不是已废弃的旧 PodSecurityPolicy API。

------------------------------------------------------------------------

# 31. Admission与Policy as Code（★★★★★）

Policy as Code：

> 将安全、合规和平台规则以代码或声明式策略形式管理。

例如：

``` text
禁止latest

必须设置resources

必须添加owner标签

只允许可信Registry
```

策略可以：

``` text
存入Git

↓

Code Review

↓

CI Test

↓

GitOps Deploy

↓

Admission Enforcement
```

这样策略本身也具备：

``` text
Versioning

Audit

Review

Rollback
```

------------------------------------------------------------------------

# 32. OPA与Gatekeeper策略治理（★★★★★）

OPA：

> Open Policy Agent。

它提供通用策略决策能力。

Gatekeeper 将 OPA 策略治理模式与 Kubernetes Admission 集成。

概念：

``` text
Kubernetes Request
       ↓
Gatekeeper
       ↓
Policy / Constraint
       ↓
Allow / Deny
```

适合：

``` text
组织级安全规范

合规检查

统一策略治理
```

企业使用时应关注具体版本的能力与部署模式。

------------------------------------------------------------------------

# 33. Kyverno策略治理（★★★★★）

Kyverno 是 Kubernetes 原生风格的策略引擎之一。

它的策略通常围绕 Kubernetes Resource 表达，可用于：

``` text
Validate

Mutate

Generate

Verify Images
```

概念：

``` text
Kubernetes Resource
      ↓
Kyverno Policy
      ↓
Validate / Mutate / Generate
```

与 Gatekeeper 相比：

``` text
Gatekeeper
↓
强调OPA/约束策略体系

Kyverno
↓
强调Kubernetes资源风格策略
```

选择应基于：

``` text
团队技能
策略复杂度
生态
运维成本
现有平台
```

------------------------------------------------------------------------

# 34. 企业级Admission策略体系（★★★★★）

典型企业策略可以分层：

``` text
Security Baseline

↓

Platform Governance

↓

Application Standards

↓

Business Compliance
```

例如：

``` text
Security
├── 禁止Privileged
├── 限制Capabilities
└── 限制HostPath

Platform
├── 必须设置Resources
├── 必须设置Labels
└── 镜像来源限制

Business
├── Team Owner
├── Cost Center
└── Environment Rules
```

不要把所有策略混在一个巨大 Webhook 中。

------------------------------------------------------------------------

# 35. Admission高可用设计（★★★★★）

Admission Webhook 位于 API Server 的关键请求路径。

因此应：

``` text
多副本

Pod Anti-Affinity / Topology Spread

PDB

Readiness Probe

合理Resources

快速响应

证书自动轮换

监控告警
```

典型：

``` text
API Server
   │
   ├── Webhook Pod A
   ├── Webhook Pod B
   └── Webhook Pod C
```

避免：

``` text
单Pod Webhook
↓
Pod故障
↓
整个集群部署受影响
```

------------------------------------------------------------------------

# 36. Admission安全风险（★★★★★）

Admission 本身也是高权限控制点。

风险包括：

``` text
Webhook被攻破

恶意Mutation

策略绕过

TLS配置错误

过宽匹配范围

高权限ServiceAccount

供应链风险
```

尤其 Mutating Webhook：

``` text
可以修改用户提交的资源
```

因此必须：

``` text
最小权限

镜像可信

审计

版本锁定

代码审查

安全扫描
```

------------------------------------------------------------------------

# 37. Admission常见问题与排查

## kubectl apply突然很慢

检查：

``` text
Admission Webhook Latency

timeoutSeconds

Webhook Pod负载

DNS / Network
```

------------------------------------------------------------------------

## 所有Deployment无法创建

检查：

``` text
ValidatingWebhookConfiguration

MutatingWebhookConfiguration

failurePolicy

Webhook Service

Endpoints

Certificate
```

------------------------------------------------------------------------

## x509证书错误

检查：

``` text
Webhook Certificate

CA Bundle

Service DNS

Certificate Expiration
```

------------------------------------------------------------------------

## Webhook规则没有生效

检查：

``` text
apiGroups

apiVersions

resources

operations

namespaceSelector

objectSelector
```

------------------------------------------------------------------------

## Pod被意外修改

检查：

``` text
Mutating Webhooks

Admission Audit

Webhook Logs

Patch Response
```

------------------------------------------------------------------------

# 38. Admission生产最佳实践

1.  先使用 Kubernetes 内置能力，再考虑自建 Webhook；
2.  简单验证优先考虑 Schema、CEL 或声明式策略；
3.  Webhook 匹配范围尽量精确；
4.  Admission 逻辑必须快速；
5.  设置合理 timeoutSeconds；
6.  谨慎选择 failurePolicy；
7.  安全关键策略考虑 Fail Closed；
8.  高可用场景避免单副本 Webhook；
9.  Mutating 逻辑保持幂等；
10. 尽量减少隐式 Mutation；
11. 不在 Webhook 中执行长耗时任务；
12. Webhook 外部依赖必须有 Timeout；
13. 管理 TLS 证书生命周期；
14. 监控证书过期时间；
15. 对 Webhook 延迟和错误率告警；
16. 避免匹配不需要治理的系统资源；
17. 防止 Selector 被用户用于绕过策略；
18. Admission ServiceAccount 遵循最小权限；
19. Policy 纳入 Git；
20. 策略变更通过 Code Review；
21. 策略上线前进行测试；
22. 对拒绝原因提供清晰错误信息；
23. 记录 Admission Audit；
24. 为关键 Webhook 设计故障恢复方案；
25. 定期清理失效的 WebhookConfiguration。

------------------------------------------------------------------------

# 39. 系统架构设计师考点

## 什么是Admission Controller？

> Admission Controller 是 Kubernetes API Server
> 在认证、授权之后，对资源创建或更新请求进一步执行修改、校验和策略控制的机制。

## Authentication、Authorization、Admission区别？

> Authentication 解决"你是谁"，Authorization 解决"你能做什么"，Admission
> 解决"即使你有权限，这个请求是否符合平台策略"。

## Mutating与Validating区别？

> Mutating Admission 可以修改请求对象；Validating Admission
> 主要判断请求是否允许。

## RBAC与Admission区别？

> RBAC 主要控制主体对资源的操作权限，Admission
> 主要控制具体资源内容是否符合安全、合规和平台治理要求。

## failurePolicy为什么重要？

> 因为 Webhook
> 故障时需要决定请求继续还是拒绝，它体现了安全性与可用性之间的权衡。

## ValidatingAdmissionPolicy有什么价值？

> 它允许使用声明式策略和 CEL 对 API
> 请求执行验证，可以减少部分简单策略对独立 Webhook 服务的依赖。

## Policy as Code是什么？

> 将安全和治理规则以可版本化、可审查、可测试、可自动部署的策略代码形式管理。

------------------------------------------------------------------------

# 40. Mermaid Admission完整流程图

``` mermaid
flowchart TD

A[kubectl / Client] --> B[Kubernetes API Server]

B --> C[Authentication]
C --> D{Authenticated?}
D -->|No| X1[Reject]
D -->|Yes| E[Authorization]

E --> F{Authorized?}
F -->|No| X2[Reject]
F -->|Yes| G[Mutating Admission]

G --> H[Object Validation / Schema]
H --> I[Validating Admission]

I --> J{Policy Allowed?}
J -->|No| X3[Reject]
J -->|Yes| K[Persist]
K --> L[etcd]

G --> M[Mutating Webhook]
I --> N[Validating Webhook / Policy]

N --> O[CEL / Gatekeeper / Kyverno]
```

------------------------------------------------------------------------

# 41. 本节小结

Admission Controller 核心知识：

1.  Admission 位于 Kubernetes API 请求治理链路中；
2.  Authentication 解决身份问题；
3.  Authorization 解决操作权限问题；
4.  Admission 解决请求内容是否符合平台策略的问题；
5.  Mutating Admission 可以修改对象；
6.  Validating Admission 用于允许或拒绝请求；
7.  Admission Webhook 通过 HTTPS 扩展准入逻辑；
8.  MutatingAdmissionWebhook 可以返回对象 Patch；
9.  ValidatingAdmissionWebhook 可以实现复杂动态校验；
10. AdmissionReview 是 API Server 与 Webhook 之间的重要请求响应模型；
11. Webhook 可按 Group、Version、Resource、Operation 等匹配；
12. namespaceSelector 和 objectSelector 可以缩小作用范围；
13. failurePolicy 决定 Webhook 故障时的处理策略；
14. timeoutSeconds 对 API Server 可用性非常重要；
15. Mutating Webhook 应考虑幂等与重新调用；
16. Webhook TLS 和证书生命周期必须被治理；
17. CRD Schema 适合结构和基础字段校验；
18. ValidatingAdmissionPolicy 可以通过 CEL 实现声明式准入策略；
19. Admission 与 RBAC 不能相互替代；
20. NetworkPolicy 主要治理运行时网络访问；
21. Pod Security Admission 可用于 Pod 安全基线治理；
22. Policy as Code 让策略具备版本、审查、测试和回滚能力；
23. Gatekeeper 可将 OPA 策略体系用于 Kubernetes 治理；
24. Kyverno 提供 Kubernetes 资源风格的策略治理；
25. Admission Webhook 是 API Server
    同步路径上的关键依赖，必须重视高可用和性能；
26. 企业应构建分层、可审计、可测试的策略体系，而不是堆积大量难以维护的
    Webhook。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Kubernetes API 请求可以记成"Authentication 认人 → Authorization 查权限
> → Admission 查规则 → Persist 入库"；RBAC 决定"你有没有权做"，Admission
> 决定"你有权做的这件事是否符合平台政策"，而 Mutating
> 负责修改、Validating 负责判断，最终可通过 CEL、Gatekeeper、Kyverno
> 等机制形成企业级 Policy as Code 治理体系。
