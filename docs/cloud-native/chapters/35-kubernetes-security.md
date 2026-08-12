# 35 Kubernetes 安全体系与容器安全实践

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇从整体架构角度介绍 Kubernetes 安全体系，重点掌握 API Server
> 访问控制、RBAC、Pod Security Standards、SecurityContext、Linux
> Capabilities、seccomp、镜像与供应链安全、Secret、NetworkPolicy、etcd、Node、审计和运行时安全。

------------------------------------------------------------------------

# 目录

1.  Kubernetes安全概述
2.  Kubernetes安全体系整体架构
3.  API Server访问安全
4.  Authentication身份认证
5.  Authorization权限控制
6.  Admission Control准入控制
7.  RBAC最小权限原则
8.  ServiceAccount安全
9.  Pod Security Standards
10. SecurityContext安全上下文
11. privileged特权容器风险
12. Linux Capabilities权限控制
13. seccomp系统调用限制
14. 容器Root用户安全
15. 镜像安全与供应链安全
16. Secret敏感信息安全
17. NetworkPolicy网络隔离
18. etcd数据安全
19. Node节点安全
20. Kubernetes审计与日志
21. Runtime Security运行时安全
22. Kubernetes安全攻击面
23. 零信任与纵深防御
24. Kubernetes生产安全最佳实践
25. 系统架构设计师考点
26. Mermaid安全体系架构图
27. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes安全概述（★★★★★）

Kubernetes是一个分布式容器编排平台，其安全问题并不仅仅是"容器是否安全"。

一个完整的Kubernetes安全体系至少涉及：

``` text
身份

↓

权限

↓

API访问

↓

工作负载

↓

容器运行时

↓

网络

↓

数据

↓

Node

↓

镜像供应链

↓

审计
```

因此Kubernetes安全的核心思想是：

> 通过多层安全控制形成纵深防御，而不是依赖某一个单独机制。

------------------------------------------------------------------------

# 2. Kubernetes安全体系整体架构

可以将Kubernetes安全划分为几个主要层次：

``` text
Kubernetes Security

├── API与身份安全
│   ├── Authentication
│   ├── Authorization
│   ├── RBAC
│   └── Admission Control
│
├── Workload安全
│   ├── Pod Security Standards
│   ├── SecurityContext
│   ├── Capabilities
│   └── seccomp
│
├── 网络安全
│   └── NetworkPolicy
│
├── 数据安全
│   ├── Secret
│   └── etcd
│
├── 供应链安全
│   └── Container Image
│
└── 基础设施与运行时安全
    ├── Node
    ├── Runtime
    └── Audit
```

------------------------------------------------------------------------

# 3. API Server访问安全

API Server是Kubernetes控制面的核心入口。

大量操作最终都会经过：

``` text
Client

↓

kube-apiserver

↓

Kubernetes Resources
```

因此API Server是最重要的安全边界之一。

典型安全链路：

``` text
API Request

↓

TLS

↓

Authentication

↓

Authorization

↓

Admission Control

↓

Resource Operation
```

安全重点：

-   使用安全通信；
-   限制API暴露范围；
-   强身份认证；
-   最小权限授权；
-   启用必要准入策略；
-   开启审计。

------------------------------------------------------------------------

# 4. Authentication身份认证（★★★★★）

Authentication解决：

> 你是谁？

典型身份包括：

-   User；
-   ServiceAccount；
-   外部身份系统中的用户。

流程：

``` text
Request

↓

Authentication

↓

Identity
```

认证成功并不代表可以操作资源。

还必须继续经过：

``` text
Authorization
```

------------------------------------------------------------------------

# 5. Authorization权限控制（★★★★★）

Authorization解决：

> 这个身份能做什么？

例如：

``` text
Developer

↓

是否允许

↓

delete Pod？
```

Kubernetes支持不同授权机制，而企业环境中最常见的核心机制之一就是：

``` text
RBAC
```

上一章已经学习：

``` text
Role / ClusterRole

↓

定义权限


RoleBinding / ClusterRoleBinding

↓

绑定身份
```

------------------------------------------------------------------------

# 6. Admission Control准入控制（★★★★★）

Admission Control位于身份认证和授权之后。

结构：

``` text
Authentication

↓

Authorization

↓

Admission Control

↓

写入资源
```

它可以：

-   校验请求；
-   拒绝不符合策略的资源；
-   对资源进行修改或补充。

例如：

``` text
Pod申请特权模式

↓

Admission Policy

↓

不符合安全要求

↓

Reject
```

因此：

> RBAC解决"有没有权限提交"，Admission
> Control可以进一步判断"提交的资源是否符合规则"。

------------------------------------------------------------------------

# 7. RBAC最小权限原则

RBAC安全的核心：

> Least Privilege，最小权限原则。

错误：

``` text
普通业务Pod

↓

cluster-admin
```

一旦Pod被攻击：

``` text
攻击者

↓

获取ServiceAccount权限

↓

控制整个Cluster
```

正确思路：

``` text
Application

↓

Dedicated ServiceAccount

↓

只授予必要verbs/resources
```

尽量避免：

``` yaml
verbs: ["*"]
resources: ["*"]
```

------------------------------------------------------------------------

# 8. ServiceAccount安全

ServiceAccount代表Kubernetes中的工作负载身份。

典型结构：

``` text
Pod

↓

ServiceAccount

↓

RBAC

↓

API Server
```

安全实践：

1.  不给普通应用绑定高权限角色；
2.  不需要访问API的Pod，应避免获得不必要的API凭据；
3.  为不同应用使用独立ServiceAccount；
4.  定期审计ServiceAccount权限；
5.  避免所有Pod共用高权限身份。

核心原则：

> 工作负载身份也必须遵循最小权限。

------------------------------------------------------------------------

# 9. Pod Security Standards（★★★★★）

Kubernetes Pod Security Standards定义三种安全级别：

``` text
Privileged

Baseline

Restricted
```

## Privileged

限制最少。

适合确实需要底层系统权限的特殊工作负载。

风险最高。

------------------------------------------------------------------------

## Baseline

阻止常见的高风险容器配置，同时保留较好的应用兼容性。

适合作为一般安全基线。

------------------------------------------------------------------------

## Restricted

采用更加严格的安全限制。

适合：

-   普通业务应用；
-   高安全要求环境。

记忆：

``` text
Privileged

限制少


Baseline

基础安全


Restricted

严格安全
```

------------------------------------------------------------------------

# 10. SecurityContext安全上下文（★★★★★）

SecurityContext用于配置Pod或Container的运行安全属性。

例如：

``` yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
```

常见控制项：

-   运行用户；
-   运行组；
-   是否允许Privilege Escalation；
-   Capabilities；
-   seccomp；
-   文件系统相关安全配置。

关系：

``` text
Pod / Container

↓

SecurityContext

↓

Linux Security Mechanisms
```

------------------------------------------------------------------------

# 11. privileged特权容器风险（★★★★★）

特权容器：

``` yaml
securityContext:
  privileged: true
```

意味着容器获得非常高的主机访问能力。

风险：

``` text
Container Compromise

↓

Host Access

↓

Node Compromise

↓

Cluster Risk
```

因此：

> 普通业务容器原则上不应运行在privileged模式。

某些基础设施组件可能确实需要较高权限，但必须严格控制。

------------------------------------------------------------------------

# 12. Linux Capabilities权限控制

传统Linux root拥有大量权限。

Capabilities将root权限拆分成更细粒度的能力。

例如某个应用只需要特定能力：

``` text
不需要完整root权限

↓

只增加必要Capability
```

常见安全策略：

``` yaml
securityContext:
  capabilities:
    drop:
      - ALL
```

然后根据业务需要单独添加必要能力。

核心思想：

> 不给完整权限，只授予应用真正需要的Linux能力。

------------------------------------------------------------------------

# 13. seccomp系统调用限制（★★★★★）

seccomp：

> Secure Computing Mode，用于限制进程可使用的系统调用。

容器最终运行在Linux内核上：

``` text
Container

↓

System Call

↓

Linux Kernel
```

攻击者可能利用危险系统调用攻击主机。

seccomp可以形成：

``` text
Container

↓

seccomp Profile

↓

Allowed Syscalls

↓

Kernel
```

常见安全配置思路：

``` yaml
securityContext:
  seccompProfile:
    type: RuntimeDefault
```

作用：

> 减少容器能够调用的内核接口，从而降低攻击面。

------------------------------------------------------------------------

# 14. 容器Root用户安全

很多容器镜像默认：

``` text
User = root
```

即使容器中的root与主机root并不完全等同，仍然会增加攻击风险。

建议：

``` yaml
securityContext:
  runAsNonRoot: true
```

镜像构建时也可以：

``` dockerfile
USER 10001
```

核心原则：

> 普通应用尽量使用非root用户运行。

------------------------------------------------------------------------

# 15. 镜像安全与供应链安全（★★★★★）

容器安全从镜像构建阶段就已经开始。

风险包括：

-   基础镜像漏洞；
-   恶意镜像；
-   依赖漏洞；
-   镜像中包含密钥；
-   使用latest导致版本不可控；
-   构建链被污染。

安全链路：

``` text
Source Code

↓

Dependencies

↓

Build

↓

Container Image

↓

Registry

↓

Kubernetes
```

实践：

1.  使用可信基础镜像；
2.  使用较小镜像；
3.  固定镜像版本或Digest；
4.  扫描镜像漏洞；
5.  不把密码和Token写入镜像；
6.  保护Registry；
7.  对镜像来源建立准入策略；
8.  保持基础镜像和依赖更新。

------------------------------------------------------------------------

# 16. Secret敏感信息安全（★★★★★）

Kubernetes Secret用于保存：

-   Password；
-   Token；
-   Certificate；
-   API Key。

但需要注意：

> Secret并不意味着数据天然处于强加密状态。

Base64：

``` text
不是加密
```

安全实践：

-   对etcd中的Secret启用静态加密；
-   使用RBAC限制Secret读取；
-   避免在日志中输出Secret；
-   不将Secret明文提交Git；
-   根据场景结合外部Secret管理系统；
-   定期轮换敏感凭据。

攻击链：

``` text
读取Secret权限

↓

获取Credential

↓

访问其他系统
```

因此Secret权限属于高敏感权限。

------------------------------------------------------------------------

# 17. NetworkPolicy网络隔离（★★★★★）

默认情况下，集群网络环境如果没有额外隔离策略，Pod间通信可能过于开放。

NetworkPolicy用于：

> 控制Pod之间以及Pod与外部网络之间允许的网络流量。

例如：

``` text
Frontend

↓

允许访问

↓

Backend


其他Pod

↓

禁止访问Backend
```

结构：

``` text
Pod A

↓

NetworkPolicy

↓

Pod B
```

典型策略：

``` text
Default Deny

↓

显式允许必要流量
```

注意：

> NetworkPolicy是否真正生效依赖所使用的网络插件是否支持相应NetworkPolicy能力。

------------------------------------------------------------------------

# 18. etcd数据安全（★★★★★）

etcd保存Kubernetes核心状态数据。

例如：

-   Pod定义；
-   Deployment；
-   ConfigMap；
-   Secret；
-   RBAC配置。

因此：

``` text
etcd泄露

≈

Cluster核心数据泄露
```

安全实践：

1.  限制etcd网络访问；
2.  使用TLS；
3.  启用静态数据加密；
4.  严格控制备份文件；
5.  定期备份；
6.  保护etcd证书；
7.  不直接暴露etcd服务。

------------------------------------------------------------------------

# 19. Node节点安全

Worker Node运行：

``` text
kubelet

container runtime

Pods
```

Node被攻破可能影响其上的所有工作负载。

安全实践：

-   最小化系统组件；
-   及时安装安全补丁；
-   限制SSH访问；
-   保护kubelet接口；
-   限制管理端口；
-   使用节点隔离；
-   监控异常进程；
-   减少主机Path挂载；
-   控制特权容器。

Node属于：

> Kubernetes重要安全边界。

------------------------------------------------------------------------

# 20. Kubernetes审计与日志（★★★★★）

安全系统不仅要：

``` text
阻止攻击
```

还需要：

``` text
发现攻击

+

追踪攻击
```

Kubernetes Audit可以记录API行为。

例如：

``` text
谁

↓

什么时候

↓

访问什么资源

↓

执行什么操作
```

典型审计场景：

``` text
User A

↓

delete Deployment

↓

Audit Log
```

用于：

-   安全分析；
-   故障排查；
-   合规审计；
-   事件追踪。

------------------------------------------------------------------------

# 21. Runtime Security运行时安全

镜像安全解决：

``` text
运行之前
```

Runtime Security解决：

``` text
运行之后
```

需要监控：

-   异常进程；
-   异常网络连接；
-   异常文件修改；
-   权限提升；
-   可疑系统调用；
-   容器逃逸迹象。

结构：

``` text
Container Running

↓

Runtime Monitoring

↓

Behavior Detection

↓

Alert / Response
```

------------------------------------------------------------------------

# 22. Kubernetes安全攻击面

Kubernetes攻击面可以分为：

``` text
API Server

Control Plane

etcd

Node

Container Runtime

Pod

Container Image

Registry

Network

CI/CD Pipeline

Credentials
```

因此攻击可能来自：

``` text
供应链

↓

镜像


应用漏洞

↓

Container


权限配置错误

↓

RBAC


网络暴露

↓

Service / API


Node漏洞

↓

Host
```

安全设计必须覆盖整个生命周期。

------------------------------------------------------------------------

# 23. 零信任与纵深防御（★★★★★）

零信任核心思想：

> 不因为请求来自"内部网络"就自动信任，而是持续验证身份、权限和访问条件。

在Kubernetes中可以体现为：

``` text
Identity

↓

Authentication

↓

Authorization

↓

Policy

↓

Network Isolation

↓

Runtime Monitoring
```

纵深防御：

``` text
Authentication

↓

RBAC

↓

Admission Control

↓

Pod Security

↓

SecurityContext

↓

NetworkPolicy

↓

Runtime Security

↓

Audit
```

如果其中一层被突破：

``` text
下一层

↓

继续限制攻击范围
```

------------------------------------------------------------------------

# 24. Kubernetes生产安全最佳实践

生产环境建议：

1.  API Server使用安全通信并限制暴露；
2.  使用强身份认证；
3.  RBAC遵循最小权限；
4.  为应用创建独立ServiceAccount；
5.  避免普通容器使用privileged；
6.  普通应用尽量以非root运行；
7.  禁止不必要的Privilege Escalation；
8.  删除不需要的Linux Capabilities；
9.  使用seccomp等运行时限制；
10. 使用Pod Security Standards建立安全基线；
11. 使用NetworkPolicy实施网络隔离；
12. 对Secret实施严格RBAC控制；
13. 对etcd敏感数据启用静态加密；
14. 使用可信镜像并进行漏洞扫描；
15. 固定关键镜像版本；
16. 保护Registry与CI/CD供应链；
17. 定期更新Node和容器运行时；
18. 开启API审计；
19. 建立运行时异常检测；
20. 定期进行权限与配置审计。

------------------------------------------------------------------------

# 25. 系统架构设计师考点

## Kubernetes安全为什么需要纵深防御？

答：

> Kubernetes包含API、权限、Pod、容器、网络、数据、Node和供应链等多个安全边界，单一安全机制无法覆盖全部风险，因此需要多层安全控制共同降低攻击成功概率和影响范围。

------------------------------------------------------------------------

## Authentication、Authorization、Admission Control区别？

答：

> Authentication解决"你是谁"，Authorization解决"你能做什么"，Admission
> Control在认证和授权后进一步校验或修改资源请求。

------------------------------------------------------------------------

## SecurityContext作用？

答：

> SecurityContext用于定义Pod或Container的运行安全属性，例如运行用户、权限提升、Capabilities和seccomp等。

------------------------------------------------------------------------

## privileged容器有什么风险？

答：

> privileged容器具有非常高的主机访问能力，一旦容器被攻破，攻击者可能进一步影响Node甚至整个集群。

------------------------------------------------------------------------

## Pod Security Standards有哪些等级？

答：

> Privileged、Baseline和Restricted。

------------------------------------------------------------------------

## NetworkPolicy作用？

答：

> NetworkPolicy用于控制Pod之间以及Pod与其他网络端点之间允许的网络流量，实现网络隔离和最小通信权限。

------------------------------------------------------------------------

## Secret为什么还需要额外保护？

答：

> Secret用于保存敏感数据，但Base64编码本身不是加密，因此还需要RBAC、etcd静态加密、凭据轮换等措施。

------------------------------------------------------------------------

## seccomp作用？

答：

> seccomp通过限制容器进程可调用的Linux系统调用减少内核攻击面。

------------------------------------------------------------------------

## Kubernetes审计作用？

答：

> Kubernetes
> Audit记录API访问和操作行为，可用于安全追踪、故障分析和合规审计。

------------------------------------------------------------------------

# 26. Mermaid安全体系架构图

``` mermaid
flowchart TD

A[Client / Workload] --> B[API Server]

B --> C[Authentication]
C --> D[Authorization / RBAC]
D --> E[Admission Control]

E --> F[Kubernetes Resource]

F --> G[Pod Security Standards]
G --> H[SecurityContext]

H --> I[Non-root]
H --> J[Capabilities]
H --> K[seccomp]

F --> L[NetworkPolicy]
F --> M[Secret]
M --> N[etcd Encryption]

O[Container Image] --> P[Image Scan / Supply Chain]
P --> F

F --> Q[Node / Container Runtime]
Q --> R[Runtime Security]

B --> S[Audit Log]

T[Least Privilege] --> D
T --> H
T --> L
```

------------------------------------------------------------------------

# 27. 本节小结

Kubernetes安全核心知识：

1.  Kubernetes安全是多层体系，不只是容器安全；
2.  API请求依次涉及Authentication、Authorization和Admission Control；
3.  RBAC应遵循最小权限原则；
4.  ServiceAccount是工作负载访问API的重要身份；
5.  Pod Security Standards包括Privileged、Baseline和Restricted；
6.  SecurityContext控制Pod和Container运行安全属性；
7.  普通业务应避免privileged和root运行；
8.  Capabilities和seccomp可以减少容器权限与内核攻击面；
9.  镜像安全属于软件供应链安全的重要部分；
10. Secret需要RBAC和静态加密等额外保护；
11. NetworkPolicy用于实施网络隔离；
12. etcd是集群核心数据存储，必须重点保护；
13. Node和Container Runtime属于重要基础设施安全边界；
14. Audit用于记录和追踪API操作；
15. Runtime Security用于发现容器运行后的异常行为；
16. Kubernetes生产安全应采用零信任和纵深防御思想。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Kubernetes安全不是单点防护，而是通过"认证 → 授权 → 准入 → Pod安全 →
> 容器隔离 → 网络隔离 → 数据保护 → 运行时监控 → 审计"构建纵深防御体系。
