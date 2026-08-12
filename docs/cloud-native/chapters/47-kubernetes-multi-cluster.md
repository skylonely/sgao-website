# 47 Kubernetes 多集群架构与统一管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇系统介绍 Kubernetes Multi-Cluster
> 多集群架构，重点掌握多环境、多地域、多云、混合云、Hub-Spoke、Management
> Cluster、Workload Cluster、Cluster
> API、GitOps、多集群服务发现、跨集群通信、全局流量治理、Service
> Mesh、多集群高可用、灾难恢复、RPO/RTO、可观测性、安全、Fleet
> Management 与企业生产最佳实践。

------------------------------------------------------------------------

# 目录

1.  Kubernetes多集群概述
2.  为什么需要多集群
3.  单集群架构的边界
4.  Multi-Cluster核心设计思想
5.  多集群典型应用场景
6.  多环境集群划分
7.  多地域Region架构
8.  多可用区与多集群区别
9.  多云Multi-Cloud架构
10. 混合云Hybrid Cloud架构
11. Edge + Cloud多集群
12. 多集群整体架构模型
13. Management Cluster管理集群
14. Workload Cluster工作负载集群
15. Hub-Spoke管理模式
16. Independent Cluster独立集群模式
17. Kubernetes Cluster API
18. 集群生命周期统一管理
19. 多集群身份认证
20. 多集群RBAC权限治理
21. 多集群配置统一管理
22. 多集群Secret管理
23. 多集群应用部署
24. GitOps多集群管理
25. Argo CD多集群模式
26. Flux多集群模式
27. 多集群Service Discovery
28. 跨集群服务通信
29. Multi-Cluster Service
30. Service Mesh多集群架构
31. 跨集群Ingress与Gateway
32. Global Load Balancing全局负载均衡
33. DNS流量调度
34. 多集群数据与存储问题
35. Stateful Application多集群设计
36. 多集群高可用
37. Active-Active双活架构
38. Active-Standby主备架构
39. 多集群灾难恢复DR
40. RPO与RTO设计
41. 多集群故障切换
42. 多集群可观测性
43. 日志、指标与Tracing统一治理
44. 多集群安全体系
45. Policy as Code统一策略治理
46. 多集群NetworkPolicy治理
47. 多集群升级与版本管理
48. Fleet Management集群舰队管理
49. 多集群成本治理FinOps
50. 多集群常见问题与排查
51. 企业多集群设计原则
52. 多集群生产最佳实践
53. 系统架构设计师考点
54. Mermaid多集群总体架构图
55. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes多集群概述（★★★★★）

Multi-Cluster：

> 使用两个或多个彼此独立的 Kubernetes
> Cluster，共同承载企业应用、平台能力和基础设施，并通过统一的管理、配置、网络、安全、可观测性和交付体系进行治理。

基本结构：

``` text
                Management Plane
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   Cluster A       Cluster B       Cluster C
```

多集群不是简单地：

``` text
多安装几个Kubernetes
```

真正的问题是：

``` text
如何统一管理？

如何统一部署？

如何统一安全？

如何跨集群通信？

如何故障切换？

如何控制成本？
```

------------------------------------------------------------------------

# 2. 为什么需要多集群（★★★★★）

单集群可以承载大量业务，但企业规模扩大后会出现：

``` text
环境隔离
故障域隔离
地域隔离
团队隔离
合规隔离
容量边界
升级风险
云厂商隔离
灾难恢复
```

例如：

``` text
Dev
Test
Prod
```

全部运行在同一 Cluster：

``` text
             One Cluster
                 │
        ┌────────┼────────┐
        ↓        ↓        ↓
       Dev      Test     Prod
```

如果集群控制面、网络插件或关键基础组件出现严重问题：

``` text
Dev + Test + Prod
```

都可能同时受到影响。

多集群可以把故障域拆开：

``` text
Dev Cluster

Test Cluster

Prod Cluster
```

------------------------------------------------------------------------

# 3. 单集群架构的边界（★★★★★）

Namespace 可以提供逻辑隔离：

``` text
Cluster

├── Namespace A
├── Namespace B
└── Namespace C
```

但 Namespace 不等于独立 Cluster。

它们仍共享：

``` text
Control Plane
Cluster Network
CNI
部分系统组件
集群升级生命周期
底层故障域
```

因此：

> Namespace解决的是单集群内部的逻辑隔离，多集群可以进一步实现控制面和故障域级别的隔离。

------------------------------------------------------------------------

# 4. Multi-Cluster核心设计思想（★★★★★）

多集群架构的核心不是：

``` text
Cluster数量越多越好
```

而是：

``` text
合理划分故障域
+
统一治理
```

可以概括为：

``` text
Isolation

+

Federation / Central Governance

+

Automation
```

即：

``` text
集群彼此独立
       ↓
降低故障传播

同时
       ↓
统一管理与自动化
```

------------------------------------------------------------------------

# 5. 多集群典型应用场景（★★★★★）

常见场景：

``` text
Dev / Test / Prod隔离

多Region部署

多云部署

混合云

边缘计算

多租户

全球业务

灾难恢复

法规与数据主权

大型组织团队隔离
```

例如：

``` text
China Cluster

US Cluster

EU Cluster
```

可以分别满足：

``` text
地域延迟
数据驻留
法规要求
容灾需求
```

------------------------------------------------------------------------

# 6. 多环境集群划分（★★★★★）

典型：

``` text
Dev Cluster
Test Cluster
Staging Cluster
Prod Cluster
```

优点：

``` text
权限隔离
故障隔离
升级隔离
资源隔离
```

生产环境可以采用更严格：

``` text
Prod Cluster A
Prod Cluster B
```

避免测试变更影响生产。

但也不要无限拆分，否则会带来：

``` text
集群数量膨胀
管理复杂度增加
成本增加
平台维护负担
```

------------------------------------------------------------------------

# 7. 多地域Region架构（★★★★★）

全球业务常见：

``` text
              Global Traffic
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
   Asia Region   EU Region   US Region
        │           │           │
   Cluster A    Cluster B    Cluster C
```

价值：

``` text
降低访问延迟

Region级容灾

数据地域隔离

全球流量治理
```

多 Region 最大难点往往不是 Kubernetes 本身，而是：

``` text
Data Consistency
Network Latency
Traffic Routing
State Synchronization
```

------------------------------------------------------------------------

# 8. 多可用区与多集群区别（★★★★★）

这是非常重要的区别。

## Multi-AZ

``` text
             One Kubernetes Cluster
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
         AZ-A        AZ-B        AZ-C
```

仍然是：

``` text
一个Cluster
```

共享：

``` text
一个逻辑Control Plane
一个Cluster API
一个集群资源体系
```

## Multi-Cluster

``` text
Cluster A             Cluster B
   │                      │
Region A               Region B
```

拥有彼此独立的：

``` text
API Server
etcd
Cluster State
```

所以：

> Multi-AZ主要解决单集群内部可用区故障；Multi-Cluster可以进一步解决Cluster或Region级故障域问题。

------------------------------------------------------------------------

# 9. 多云Multi-Cloud架构（★★★★☆）

Multi-Cloud：

``` text
Cloud A
  │
Kubernetes A

Cloud B
  │
Kubernetes B
```

价值：

``` text
避免单一云依赖
利用不同云能力
地域覆盖
商业议价
灾难恢复
```

但也会增加：

``` text
网络复杂度
IAM复杂度
存储差异
Load Balancer差异
成本治理复杂度
```

Kubernetes 可以统一工作负载 API，但：

> 并不能自动消除不同云基础设施之间的差异。

------------------------------------------------------------------------

# 10. 混合云Hybrid Cloud架构（★★★★☆）

Hybrid Cloud：

``` text
On-Premises
     │
Kubernetes A

     +

Public Cloud
     │
Kubernetes B
```

常见场景：

``` text
核心数据留在本地

弹性计算进入公有云

逐步云迁移

灾难恢复
```

需要重点解决：

``` text
专线 / VPN

Identity

DNS

Service Discovery

Data Synchronization
```

------------------------------------------------------------------------

# 11. Edge + Cloud多集群（★★★★☆）

边缘计算可能形成：

``` text
               Cloud Management
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
       Edge A      Edge B      Edge C
```

边缘特点：

``` text
网络不稳定
资源有限
节点分散
远程管理
低延迟要求
```

因此不能简单照搬数据中心 Kubernetes 架构。

关键要求：

``` text
离线容忍
远程升级
轻量化
配置同步
集中可观测性
```

------------------------------------------------------------------------

# 12. 多集群整体架构模型（★★★★★）

企业多集群通常可以抽象为：

``` text
              Global Management Layer
                       │
      ┌────────────────┼────────────────┐
      │                │                │
    GitOps          Security       Observability
      │                │                │
      └────────────────┼────────────────┘
                       ↓
             Cluster Management
                       │
       ┌───────────────┼───────────────┐
       ↓               ↓               ↓
   Cluster A       Cluster B       Cluster C
```

核心：

``` text
Cluster Lifecycle

Application Lifecycle

Policy

Traffic

Security

Observability
```

统一治理。

------------------------------------------------------------------------

# 13. Management Cluster管理集群（★★★★★）

Management Cluster：

> 用于运行多集群管理、GitOps、策略、可观测性、集群生命周期等平台组件的管理集群。

例如：

``` text
Management Cluster

├── GitOps Controller
├── Cluster API
├── Policy Engine
├── Monitoring
└── Security Platform
```

然后管理：

``` text
Workload Cluster A
Workload Cluster B
Workload Cluster C
```

管理集群自身必须：

``` text
高可用
严格权限
可靠备份
独立故障域
```

------------------------------------------------------------------------

# 14. Workload Cluster工作负载集群（★★★★★）

Workload Cluster：

> 主要用于承载业务应用的 Kubernetes 集群。

例如：

``` text
Management Cluster
        │
        ├── Prod Asia Cluster
        ├── Prod EU Cluster
        └── Prod US Cluster
```

工作集群应尽量：

``` text
减少不必要的平台管理组件
```

从而降低：

``` text
攻击面
资源消耗
运维复杂度
```

------------------------------------------------------------------------

# 15. Hub-Spoke管理模式（★★★★★）

典型：

``` text
                 Hub
                  │
       ┌──────────┼──────────┐
       ↓          ↓          ↓
    Spoke A    Spoke B    Spoke C
```

Hub：

``` text
统一策略
统一GitOps
统一可观测性
统一集群管理
```

Spoke：

``` text
运行实际业务
```

优点：

``` text
治理集中
标准统一
自动化程度高
```

风险：

``` text
Hub成为关键控制点
```

因此 Hub 必须高可用。

------------------------------------------------------------------------

# 16. Independent Cluster独立集群模式（★★★★☆）

另一种方式：

``` text
Cluster A

Cluster B

Cluster C
```

完全独立。

优点：

``` text
隔离强
单个管理系统故障影响小
```

缺点：

``` text
配置漂移
权限不一致
升级困难
运维重复
```

适合：

``` text
组织高度独立
法规强隔离
特殊安全边界
```

------------------------------------------------------------------------

# 17. Kubernetes Cluster API（★★★★★）

Cluster API：

> 使用 Kubernetes 风格的声明式 API 管理 Kubernetes Cluster 生命周期。

思想：

``` text
Kubernetes manages Kubernetes
```

例如：

``` text
Cluster Resource
Machine Resource
MachineDeployment
```

通过声明式资源描述：

``` text
我要一个Kubernetes Cluster
```

Controller 负责：

``` text
Provision
Scale
Upgrade
Delete
```

------------------------------------------------------------------------

# 18. 集群生命周期统一管理（★★★★★）

集群生命周期：

``` text
Create
  ↓
Configure
  ↓
Scale
  ↓
Upgrade
  ↓
Repair
  ↓
Delete
```

企业需要标准化：

``` text
Kubernetes Version

CNI

CSI

Ingress / Gateway

Monitoring

Security Baseline
```

避免出现：

``` text
Cluster A一种配置

Cluster B另一种配置

Cluster C无人知道怎么创建
```

------------------------------------------------------------------------

# 19. 多集群身份认证（★★★★★）

如果每个集群都有独立账号：

``` text
Cluster A Users

Cluster B Users

Cluster C Users
```

管理成本很高。

企业通常希望：

``` text
Central Identity Provider
          │
          ├── Cluster A
          ├── Cluster B
          └── Cluster C
```

实现统一身份。

重点：

``` text
SSO
OIDC
短期凭证
审计
```

避免长期散发高权限 kubeconfig。

------------------------------------------------------------------------

# 20. 多集群RBAC权限治理（★★★★★）

统一身份后还要统一授权。

例如：

``` text
Developer

Dev Cluster
→ Admin-like Application Access

Prod Cluster
→ Read Only
```

可以形成：

``` text
Identity
   ↓
Group
   ↓
Cluster Role Mapping
   ↓
Cluster Permission
```

原则：

``` text
Least Privilege
Separation of Duties
Production Strong Isolation
```

------------------------------------------------------------------------

# 21. 多集群配置统一管理（★★★★★）

如果手工执行：

``` bash
kubectl apply
```

到几十个 Cluster：

``` text
极易产生Configuration Drift
```

应采用：

``` text
Git

↓

Declarative Configuration

↓

Automated Sync

↓

Multiple Clusters
```

配置可分层：

``` text
Base

Environment

Region

Cluster
```

------------------------------------------------------------------------

# 22. 多集群Secret管理（★★★★★）

Secret 不应简单：

``` text
明文提交Git
```

多集群 Secret 管理应考虑：

``` text
External Secret Store

Encryption

Secret Rotation

Cluster Isolation

Least Privilege
```

架构：

``` text
Secret Manager
      │
      ├── Cluster A
      ├── Cluster B
      └── Cluster C
```

生产环境尤其要避免：

``` text
一个全局凭证泄露
↓
所有Cluster同时失陷
```

------------------------------------------------------------------------

# 23. 多集群应用部署（★★★★★）

一个应用可能部署到：

``` text
Dev

Staging

Prod Asia

Prod EU

Prod US
```

应将：

``` text
Application Definition
```

与：

``` text
Environment / Cluster Configuration
```

分离。

例如：

``` text
Base Application
      │
      ├── dev overlay
      ├── staging overlay
      ├── prod-asia overlay
      └── prod-eu overlay
```

可以结合：

``` text
Helm
Kustomize
GitOps
```

------------------------------------------------------------------------

# 24. GitOps多集群管理（★★★★★）

GitOps 是多集群管理的重要模式。

``` text
                    Git
                     │
              GitOps Controller
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
   Cluster A     Cluster B     Cluster C
```

Git 可以成为：

``` text
Desired State Source
```

典型目录：

``` text
clusters/
├── dev/
├── staging/
├── prod-asia/
├── prod-us/
└── prod-eu/

apps/
policies/
infrastructure/
```

------------------------------------------------------------------------

# 25. Argo CD多集群模式（★★★★☆）

Argo CD 可用于管理多个目标 Kubernetes Cluster。

典型：

``` text
Argo CD
   │
   ├── Cluster A
   ├── Cluster B
   └── Cluster C
```

常见设计包括：

``` text
Centralized Argo CD

或

Per-Cluster Argo CD
```

集中式：

``` text
治理简单
统一视图
```

但：

``` text
管理面影响范围更大
```

分布式：

``` text
故障隔离更强
```

但：

``` text
管理组件更多
```

------------------------------------------------------------------------

# 26. Flux多集群模式（★★★★☆）

Flux 同样可以用于：

``` text
Git
 ↓
Cluster Reconciliation
```

多集群可以采用：

``` text
每个Cluster运行自己的Flux
```

然后：

``` text
Cluster A ← Git
Cluster B ← Git
Cluster C ← Git
```

这种 Pull 模式具有：

``` text
集群自治
故障隔离
无需中心组件直接持续控制全部集群
```

等特点。

------------------------------------------------------------------------

# 27. 多集群Service Discovery（★★★★★）

单集群 Service Discovery：

``` text
Service
 ↓
Cluster DNS
 ↓
Pods
```

但跨 Cluster：

``` text
Cluster A Service

如何发现

Cluster B Service？
```

需要额外机制：

``` text
Global DNS

Multi-Cluster Service Discovery

Service Mesh

Gateway
```

这属于多集群最复杂的领域之一。

------------------------------------------------------------------------

# 28. 跨集群服务通信（★★★★★）

典型：

``` text
Cluster A
Service A
    │
    │ Cross-Cluster Network
    ↓
Cluster B
Service B
```

必须解决：

``` text
Network Reachability

DNS

Identity

mTLS

Routing

Firewall

Latency
```

跨 Region 时还必须考虑：

``` text
高延迟
带宽费用
网络抖动
```

不要把跨集群调用当成本地 Service 调用。

------------------------------------------------------------------------

# 29. Multi-Cluster Service（★★★★☆）

多集群服务抽象的目标：

``` text
同一个Logical Service

↓

多个Cluster Endpoint
```

例如：

``` text
payments.example

├── Cluster A Endpoint
└── Cluster B Endpoint
```

上层调用方不必直接了解：

``` text
Pod在哪个Cluster
```

具体实现方式取决于：

``` text
平台
网络方案
Service Mesh
DNS / Gateway体系
```

------------------------------------------------------------------------

# 30. Service Mesh多集群架构（★★★★★）

Service Mesh 可以进一步提供：

``` text
跨集群服务发现

mTLS

Traffic Policy

Retry

Observability

Identity
```

例如：

``` text
Cluster A                       Cluster B

Service A ─────── Mesh ─────── Service B
```

需要选择：

``` text
Shared Control Plane

Multiple Control Planes
```

以及：

``` text
Flat Network

Gateway-based Network
```

多集群 Mesh 的能力很强，但复杂度也显著提高。

------------------------------------------------------------------------

# 31. 跨集群Ingress与Gateway（★★★★★）

外部流量：

``` text
Internet
   ↓
Global Entry
   ↓
Cluster Gateway
   ↓
Application
```

可以设计：

``` text
Global Gateway

↓

Regional Gateway

↓

Cluster Gateway
```

形成多层流量入口。

Gateway API 等现代 Kubernetes 网络 API
可以作为集群内或平台网络治理的一部分，但全局跨集群流量通常仍需要外部
DNS、负载均衡或专门的多集群网络方案配合。

------------------------------------------------------------------------

# 32. Global Load Balancing全局负载均衡（★★★★★）

典型：

``` text
                  Global Load Balancer
                          │
             ┌────────────┴────────────┐
             ↓                         ↓
        Cluster A                  Cluster B
        Region A                   Region B
```

调度依据：

``` text
Health

Latency

Geography

Weight

Capacity
```

例如：

``` text
Asia Users
↓
Asia Cluster

US Users
↓
US Cluster
```

------------------------------------------------------------------------

# 33. DNS流量调度（★★★★★）

DNS 可以实现：

``` text
api.example.com
       ↓
Global DNS
       │
       ├── IP A
       └── IP B
```

策略：

``` text
Geo Routing

Weighted Routing

Latency Routing

Failover
```

但 DNS 故障切换受到：

``` text
TTL
Client Cache
Resolver Cache
```

影响，因此不能假设：

``` text
DNS修改后立即100%切流
```

------------------------------------------------------------------------

# 34. 多集群数据与存储问题（★★★★★）

计算层跨集群部署通常比数据层容易。

例如：

``` text
Application
```

可以在：

``` text
Cluster A + Cluster B
```

各部署一份。

但数据库：

``` text
Data
```

必须考虑：

``` text
Replication

Consistency

Latency

Conflict

Backup

Data Residency
```

因此：

> Multi-Cluster 的真正难点往往是 Data，而不是 Pod。

------------------------------------------------------------------------

# 35. Stateful Application多集群设计（★★★★★）

有状态系统常见方案：

``` text
Single Primary

Primary + Replica

Multi-Primary

External Managed Database
```

例如：

``` text
Cluster A
Primary DB

Cluster B
Replica DB
```

故障：

``` text
Cluster A Down
    ↓
Promote Cluster B
```

需要考虑：

``` text
Split Brain

Replication Lag

Consistency

Failover Automation
```

------------------------------------------------------------------------

# 36. 多集群高可用（★★★★★）

单集群 HA：

``` text
Node Failure
AZ Failure
```

多集群 HA：

``` text
Cluster Failure
Region Failure
```

典型层次：

``` text
Pod HA

↓

Node HA

↓

AZ HA

↓

Cluster HA

↓

Region HA
```

高可用级别越高：

``` text
成本
复杂度
数据一致性难度
```

通常也越高。

------------------------------------------------------------------------

# 37. Active-Active双活架构（★★★★★）

``` text
                Global LB
                   │
          ┌────────┴────────┐
          ↓                 ↓
     Cluster A          Cluster B
       Active             Active
```

优点：

``` text
资源利用率高
快速故障切换
全球就近访问
```

难点：

``` text
数据双写
一致性
冲突解决
跨Region延迟
```

双活真正困难的通常是：

> 数据层双活。

------------------------------------------------------------------------

# 38. Active-Standby主备架构（★★★★★）

``` text
                Global LB
                   │
          ┌────────┴────────┐
          ↓                 ↓
     Cluster A          Cluster B
       Active            Standby
```

正常：

``` text
流量 → Cluster A
```

故障：

``` text
Cluster A Down
     ↓
Failover
     ↓
Cluster B Active
```

优点：

``` text
架构相对简单
数据冲突少
```

缺点：

``` text
备用资源利用率较低
切换需要时间
```

------------------------------------------------------------------------

# 39. 多集群灾难恢复DR（★★★★★）

Disaster Recovery：

> 当整个 Cluster、Region
> 或关键基础设施发生严重故障时，恢复业务服务的能力。

需要准备：

``` text
Application Manifests

Cluster Configuration

Secrets

Persistent Data

DNS

Certificates

External Dependencies
```

仅备份 YAML：

``` text
并不等于完整DR
```

因为真正关键的往往还有：

``` text
业务数据
外部系统
密钥
DNS
```

------------------------------------------------------------------------

# 40. RPO与RTO设计（★★★★★）

## RPO

Recovery Point Objective：

> 最多允许丢失多少时间范围的数据。

例如：

``` text
RPO = 5 minutes
```

意味着最多允许：

``` text
约5分钟数据损失
```

## RTO

Recovery Time Objective：

> 故障发生后允许多长时间恢复业务。

例如：

``` text
RTO = 30 minutes
```

意味着目标是在约 30 分钟内恢复。

记忆：

``` text
RPO
↓
丢多少数据

RTO
↓
停多久
```

------------------------------------------------------------------------

# 41. 多集群故障切换（★★★★★）

典型流程：

``` text
Health Check
    ↓
Detect Cluster Failure
    ↓
Stop Routing
    ↓
Verify Secondary
    ↓
Promote / Activate
    ↓
Update Global Traffic
```

必须避免：

``` text
误判
```

否则可能导致：

``` text
正常Cluster被切走
```

甚至：

``` text
Split Brain
```

因此 Failover 需要：

``` text
多级健康检查
延迟窗口
人工兜底
演练
```

------------------------------------------------------------------------

# 42. 多集群可观测性（★★★★★）

如果每个集群单独看：

``` text
Cluster A Dashboard

Cluster B Dashboard

Cluster C Dashboard
```

大规模后非常困难。

需要：

``` text
Global Observability
```

统一查看：

``` text
Cluster Health

Application Health

Resource Usage

Traffic

Errors

SLO
```

并支持：

``` text
Cluster
Region
Environment
Application
```

维度筛选。

------------------------------------------------------------------------

# 43. 日志、指标与Tracing统一治理（★★★★★）

多集群可观测性三大支柱：

``` text
Metrics

Logs

Traces
```

典型：

``` text
Cluster A ─┐
Cluster B ─┼─→ Central Observability
Cluster C ─┘
```

必须给数据增加：

``` text
cluster

region

environment

namespace

application
```

等标签，否则聚合后难以区分来源。

------------------------------------------------------------------------

# 44. 多集群安全体系（★★★★★）

多集群安全需要覆盖：

``` text
Identity

RBAC

Network

Admission

Secrets

Supply Chain

Runtime

Audit
```

架构：

``` text
Central Security Policy
          │
          ├── Cluster A
          ├── Cluster B
          └── Cluster C
```

但同时需要：

``` text
Cluster-level Isolation
```

避免：

``` text
一个Cluster凭证
```

可以直接控制全部生产集群。

------------------------------------------------------------------------

# 45. Policy as Code统一策略治理（★★★★★）

策略可以统一存入 Git：

``` text
Git
 │
 ├── Security Policies
 ├── Admission Policies
 ├── Network Policies
 └── Compliance Rules
```

然后：

``` text
GitOps
  ↓
Cluster A
Cluster B
Cluster C
```

实现：

``` text
统一标准
版本管理
Code Review
Audit
Rollback
```

------------------------------------------------------------------------

# 46. 多集群NetworkPolicy治理（★★★★☆）

NetworkPolicy 通常是：

``` text
Cluster-local Policy
```

每个集群都需要一致的安全基线。

例如：

``` text
Default Deny

DNS Allow

Ingress Rules

Egress Rules
```

可以通过 GitOps 统一分发。

但：

> NetworkPolicy 本身通常不等于完整的跨集群网络安全体系。

跨集群还需要：

``` text
Firewall
Gateway
Mesh Policy
Cloud Network Policy
```

共同治理。

------------------------------------------------------------------------

# 47. 多集群升级与版本管理（★★★★★）

不要一次升级所有集群。

推荐：

``` text
Dev Cluster
    ↓
Test Cluster
    ↓
Canary Prod Cluster
    ↓
Remaining Prod Clusters
```

即：

``` text
Progressive Upgrade
```

需要兼容：

``` text
Kubernetes Version

CNI

CSI

Ingress / Gateway

Service Mesh

Operator

CRD
```

多集群反而可以提供：

``` text
更安全的升级灰度能力
```

------------------------------------------------------------------------

# 48. Fleet Management集群舰队管理（★★★★★）

当企业拥有：

``` text
10
50
100
甚至更多Cluster
```

不能再把每个 Cluster 当作独立宠物管理。

Fleet Management：

> 把大量 Kubernetes Cluster
> 视为一个集群舰队，通过标准化、分组、策略和自动化统一管理。

例如：

``` text
Fleet

├── Production
│   ├── Asia
│   ├── Europe
│   └── America
│
├── Staging
└── Development
```

统一管理：

``` text
Version

Policy

Applications

Security

Health

Upgrade
```

------------------------------------------------------------------------

# 49. 多集群成本治理FinOps（★★★★☆）

集群越多：

``` text
Control Plane Cost

Idle Capacity

Load Balancer

NAT

Observability

Cross-Region Traffic
```

成本越容易增长。

需要关注：

``` text
Cluster Utilization

Node Utilization

Idle Resource

Cross-Region Traffic

Shared Platform Cost
```

原则：

> 不要为了"架构高级"而无限拆分Cluster。

Cluster 边界必须有明确业务价值。

------------------------------------------------------------------------

# 50. 多集群常见问题与排查

## 某个Cluster无法同步GitOps

检查：

``` text
Cluster Credential

API Server Connectivity

RBAC

GitOps Controller

Repository Access
```

------------------------------------------------------------------------

## 跨集群Service无法访问

检查：

``` text
Routing

Firewall

DNS

Gateway

Service Mesh

mTLS

NetworkPolicy
```

------------------------------------------------------------------------

## Global LB仍然向故障Cluster发流量

检查：

``` text
Health Check

Failover Threshold

DNS TTL

Load Balancer Backend Status
```

------------------------------------------------------------------------

## 不同Cluster配置不一致

检查：

``` text
Git Desired State

Manual Changes

GitOps Sync

Cluster Overlay

Policy
```

------------------------------------------------------------------------

## Cluster升级失败

检查：

``` text
Kubernetes Version Compatibility

CNI

CSI

CRD

Operator

Admission Webhook
```

------------------------------------------------------------------------

# 51. 企业多集群设计原则（★★★★★）

原则一：

``` text
Cluster边界必须有明确原因
```

原则二：

``` text
自动化优先
```

原则三：

``` text
Git作为Desired State
```

原则四：

``` text
统一Identity与Policy
```

原则五：

``` text
Cluster保持自治能力
```

原则六：

``` text
控制故障爆炸半径
```

原则七：

``` text
数据架构先于双活口号
```

原则八：

``` text
可观测性必须全局化
```

原则九：

``` text
升级采用渐进式
```

原则十：

``` text
定期进行DR演练
```

------------------------------------------------------------------------

# 52. 多集群生产最佳实践

1.  不要为了多集群而多集群；
2.  明确每个 Cluster 的业务边界；
3.  使用多集群降低故障爆炸半径；
4.  Dev/Test/Prod 建立合理隔离；
5.  Region 级业务采用独立故障域；
6.  Management Cluster 自身必须高可用；
7.  管理面与工作负载面职责分离；
8.  使用声明式方式管理 Cluster；
9.  使用 GitOps 管理应用和配置；
10. 避免大量手工 kubectl 操作；
11. 建立统一 Identity Provider；
12. RBAC 遵循最小权限；
13. 不共享全局高权限长期凭证；
14. Secret 使用专业密钥管理方案；
15. 多集群配置采用 Base + Overlay；
16. 跨集群通信默认按不可信网络设计；
17. 跨集群调用考虑 mTLS；
18. 控制跨 Region 服务调用；
19. 关注跨 Region 网络费用；
20. 数据层单独设计复制和一致性；
21. Active-Active 前先解决数据双活；
22. 明确 RPO 和 RTO；
23. DR 方案必须定期演练；
24. Global LB 健康检查必须可靠；
25. DNS Failover 考虑 TTL；
26. 统一 Metrics、Logs、Tracing；
27. 所有遥测数据携带 Cluster / Region 标签；
28. Policy as Code 统一安全治理；
29. 多集群升级采用 Canary / Progressive Rollout；
30. 建立 Cluster Version Matrix；
31. 定期检查配置漂移；
32. Fleet 按 Environment / Region 分组；
33. 对 Cluster 数量建立治理机制；
34. 关注 Idle Capacity；
35. 进行多集群 FinOps 成本分析。

------------------------------------------------------------------------

# 53. 系统架构设计师考点

## 什么是Kubernetes多集群？

> Kubernetes 多集群是使用多个彼此独立的 Kubernetes Cluster
> 承载不同环境、地域或业务，并通过统一管理、配置、安全、流量和可观测性体系进行治理的架构模式。

## Multi-AZ与Multi-Cluster区别？

> Multi-AZ 可以是在同一个 Kubernetes Cluster
> 中将节点和控制面跨多个可用区部署；Multi-Cluster 则包含多个独立
> Kubernetes Cluster，每个集群拥有独立的控制面和集群状态。

## 为什么企业需要多集群？

> 主要用于环境隔离、故障域隔离、多地域部署、多云、合规、灾难恢复以及降低单集群故障爆炸半径。

## Management Cluster是什么？

> Management Cluster
> 是用于运行集群生命周期管理、GitOps、策略、安全和可观测性等平台管理组件的
> Kubernetes 集群。

## Hub-Spoke是什么？

> Hub-Spoke 是以一个集中管理面作为 Hub，统一管理多个作为 Spoke
> 的工作负载集群的架构模式。

## Cluster API是什么？

> Cluster API 使用 Kubernetes 声明式 API 和 Controller 模式管理
> Kubernetes 集群本身的创建、扩缩容、升级和删除生命周期。

## Active-Active与Active-Standby区别？

> Active-Active 中多个集群同时提供服务；Active-Standby
> 中通常由主集群提供服务，备用集群在故障时接管。

## RPO与RTO区别？

> RPO 表示可接受的数据丢失范围，RTO 表示故障后可接受的业务恢复时间。

## 多集群最大的难点是什么？

> 多集群真正复杂的部分通常不是部署多个
> Kubernetes，而是数据一致性、跨集群网络、统一身份与策略、全局流量、配置一致性、可观测性和故障恢复。

------------------------------------------------------------------------

# 54. Mermaid多集群总体架构图

``` mermaid
flowchart TD

GIT[Git / Desired State] --> MGMT[Management Cluster]

IDP[Identity Provider] --> MGMT
POLICY[Policy as Code] --> MGMT
OBS[Global Observability] --> MGMT

MGMT --> A[Cluster A - Asia]
MGMT --> B[Cluster B - Europe]
MGMT --> C[Cluster C - America]

GLB[Global DNS / Load Balancer] --> A
GLB --> B
GLB --> C

A --> APP1[Application]
B --> APP2[Application]
C --> APP3[Application]

A <-->|Cross-Cluster Service / Mesh| B
B <-->|Cross-Cluster Service / Mesh| C

A --> DATA[(Data Layer)]
B --> DATA
C --> DATA

BACKUP[Backup / DR] --> A
BACKUP --> B
BACKUP --> C
```

------------------------------------------------------------------------

# 55. 本节小结

Kubernetes 多集群核心知识：

1.  Multi-Cluster 使用多个独立 Kubernetes Cluster；
2.  多集群用于环境、地域、故障域、法规和组织隔离；
3.  Namespace 隔离不等于 Cluster 隔离；
4.  Multi-AZ 不等于 Multi-Cluster；
5.  Multi-Cloud 可以跨多个云厂商运行 Kubernetes；
6.  Hybrid Cloud 连接本地数据中心和公有云；
7.  Edge + Cloud 属于特殊的分布式多集群场景；
8.  Management Cluster 负责平台治理；
9.  Workload Cluster 主要承载业务；
10. Hub-Spoke 是典型集中式多集群管理模式；
11. Cluster API 可以声明式管理 Kubernetes Cluster 生命周期；
12. 多集群需要统一 Identity 和 RBAC；
13. GitOps 是多集群配置和应用管理的重要模式；
14. Argo CD、Flux 可以用于多集群 GitOps；
15. 跨集群服务发现需要额外机制；
16. 跨集群通信需要解决网络、DNS、身份和安全问题；
17. Service Mesh 可以提供跨集群通信治理；
18. Global Load Balancing 可以进行全球流量调度；
19. DNS Failover 会受到 TTL 和缓存影响；
20. Multi-Cluster 最大难点之一是数据；
21. Stateful Application 必须单独设计复制、一致性和故障切换；
22. Active-Active 提供双活，但数据一致性复杂；
23. Active-Standby 相对简单，但备用资源利用率较低；
24. DR 不只是备份 Kubernetes YAML；
25. RPO 表示数据恢复点目标；
26. RTO 表示业务恢复时间目标；
27. 多集群需要全局 Metrics、Logs 和 Traces；
28. Policy as Code 可以统一安全治理；
29. NetworkPolicy 主要仍是集群内部网络策略；
30. 多集群升级应采用渐进式策略；
31. Fleet Management 用于大规模集群舰队管理；
32. Cluster 数量越多，FinOps 越重要；
33. 多集群架构的目标不是增加 Cluster
    数量，而是在隔离、可靠性、治理、复杂度和成本之间取得平衡。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Kubernetes 多集群可以记成"多个独立 Cluster + 一个统一治理体系"：用
> Cluster 边界隔离环境、地域和故障域，用 Management
> Plane、GitOps、Identity、Policy、Observability 和 Fleet Management
> 统一治理；而真正决定多集群架构成败的，往往不是 Pod
> 能否部署到多个集群，而是跨集群网络、全局流量、数据一致性以及 RPO/RTO
> 灾难恢复能力。
