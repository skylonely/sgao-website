# 50 Kubernetes 核心知识体系与架构总结

> 本文是「Docker + Kubernetes 云原生专题」Kubernetes 部分的最终总结篇。
>
> 本篇不再扩展新的大型技术主题，而是把前面 Kubernetes
> 的架构、资源模型、工作负载、网络、存储、调度、安全、可观测性、交付、扩展、多集群与生产排障重新串成一套完整的知识体系。
>
> **核心主线：声明式 API + Desired State + Controller + Reconciliation +
> 插件化扩展。**

------------------------------------------------------------------------

# 目录

1.  Kubernetes知识体系总览
2.  Kubernetes到底解决什么问题
3.  Kubernetes核心设计思想
4.  Kubernetes声明式API模型
5.  Desired State与Reconciliation
6.  Kubernetes整体架构
7.  Control Plane核心组件
8.  Worker Node核心组件
9.  API Server核心地位
10. etcd集群状态存储
11. Scheduler调度体系
12. Controller控制循环
13. kubelet与容器运行时
14. Kubernetes资源对象体系
15. Pod核心模型
16. Deployment与无状态应用
17. StatefulSet与有状态应用
18. DaemonSet节点级工作负载
19. Job与CronJob任务体系
20. Service服务发现与负载均衡
21. Ingress / Gateway外部流量入口
22. ConfigMap与Secret配置体系
23. Volume与数据持久化
24. PV / PVC / StorageClass存储模型
25. CSI存储扩展体系
26. Kubernetes网络模型
27. CNI与Pod网络
28. DNS与服务发现
29. NetworkPolicy网络安全
30. Scheduler高级调度
31. Requests / Limits资源管理
32. QoS服务质量模型
33. HPA / VPA自动扩缩容
34. RBAC权限体系
35. ServiceAccount身份体系
36. Admission Controller准入控制
37. Kubernetes整体安全体系
38. 日志、监控与可观测性
39. 备份、恢复与灾难恢复
40. Helm应用包管理
41. Kustomize配置定制
42. Kubernetes CI/CD体系
43. GitOps持续交付
44. Service Mesh服务治理
45. CRD与API扩展
46. Operator与自动化运维
47. Multi-Cluster多集群架构
48. Cluster API集群生命周期
49. Kubernetes生产故障排查
50. Kubernetes高可用架构
51. Kubernetes生产架构设计
52. Kubernetes完整请求链路
53. Kubernetes完整部署链路
54. Kubernetes完整控制循环
55. Kubernetes核心资源关系图
56. Kubernetes网络知识地图
57. Kubernetes存储知识地图
58. Kubernetes安全知识地图
59. Kubernetes运维知识地图
60. Kubernetes云原生技术栈
61. Kubernetes核心概念对比
62. Kubernetes高频易混淆知识点
63. Kubernetes生产最佳实践
64. Kubernetes面试高频问题
65. 系统架构设计师高频考点
66. Kubernetes故障速查表
67. Kubernetes命令速查表
68. Kubernetes核心知识速记表
69. Mermaid Kubernetes完整架构图
70. Mermaid Kubernetes知识体系图
71. Kubernetes学习路线回顾
72. 全系列最终总结

------------------------------------------------------------------------

# 1. Kubernetes知识体系总览（★★★★★）

学习 Kubernetes 不应该把它理解成大量零散命令，而应该建立完整知识地图：

``` text
Kubernetes
│
├── Architecture
│   ├── API Server
│   ├── etcd
│   ├── Scheduler
│   ├── Controller Manager
│   └── kubelet
│
├── Workloads
│   ├── Pod
│   ├── Deployment
│   ├── StatefulSet
│   ├── DaemonSet
│   ├── Job
│   └── CronJob
│
├── Network
│   ├── CNI
│   ├── Service
│   ├── DNS
│   ├── Ingress / Gateway
│   └── NetworkPolicy
│
├── Storage
│   ├── Volume
│   ├── PV
│   ├── PVC
│   ├── StorageClass
│   └── CSI
│
├── Scheduling & Resources
│   ├── Requests / Limits
│   ├── QoS
│   ├── Taint / Toleration
│   ├── Affinity
│   ├── HPA
│   └── VPA
│
├── Security
│   ├── ServiceAccount
│   ├── RBAC
│   ├── Secret
│   ├── Admission
│   └── NetworkPolicy
│
├── Delivery
│   ├── Helm
│   ├── Kustomize
│   ├── CI/CD
│   └── GitOps
│
├── Extensibility
│   ├── CRD
│   ├── Operator
│   └── Admission Webhook
│
└── Production
    ├── Observability
    ├── Backup / DR
    ├── Troubleshooting
    ├── Multi-Cluster
    └── Cluster API
```

------------------------------------------------------------------------

# 2. Kubernetes到底解决什么问题（★★★★★）

容器解决：

``` text
Application
+
Dependencies
+
Runtime Environment
```

的一致性问题。

但生产环境还需要解决：

``` text
容器部署到哪里？
容器挂了怎么办？
如何扩容？
如何升级？
如何服务发现？
如何负载均衡？
如何挂载存储？
如何管理配置？
如何管理权限？
```

Kubernetes 的价值：

> 对大规模容器化应用提供声明式编排、调度、自愈、扩缩容、服务发现、配置、存储和生命周期管理。

------------------------------------------------------------------------

# 3. Kubernetes核心设计思想（★★★★★）

理解 Kubernetes 的五个关键词：

``` text
Declarative API
Desired State
Controller
Reconciliation
Extensibility
```

用户描述：

``` text
我要3个副本
```

而不是：

``` text
启动容器A
启动容器B
启动容器C
```

Kubernetes 负责持续把实际状态向期望状态收敛。

------------------------------------------------------------------------

# 4. Kubernetes声明式API模型（★★★★★）

典型资源：

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
```

重点不是 YAML 本身，而是：

``` text
YAML
 ↓
API Object
 ↓
Desired State
```

Kubernetes API 是整个系统的核心抽象。

------------------------------------------------------------------------

# 5. Desired State与Reconciliation（★★★★★）

核心控制循环：

``` text
Desired State
      ↓
Observe Actual State
      ↓
Compare
      ↓
Difference?
      ↓
Reconcile
      ↓
Actual State approaches Desired State
```

例如：

``` text
Desired Pods = 3
Actual Pods = 2
```

Controller：

``` text
Create 1 Pod
```

这就是 Kubernetes 自动化的基础。

------------------------------------------------------------------------

# 6. Kubernetes整体架构（★★★★★）

``` text
                 Control Plane
 ┌────────────────────────────────────┐
 │ API Server                         │
 │ etcd                               │
 │ Scheduler                          │
 │ Controller Manager                 │
 └────────────────────────────────────┘
                  │
                  │ Kubernetes API
                  ↓
 ┌────────────────────────────────────┐
 │ Worker Node                        │
 │                                    │
 │ kubelet                            │
 │ Container Runtime                  │
 │ Network Components                 │
 │ Pods                               │
 └────────────────────────────────────┘
```

------------------------------------------------------------------------

# 7. Control Plane核心组件（★★★★★）

## API Server

``` text
统一API入口
```

## etcd

``` text
保存集群状态
```

## Scheduler

``` text
决定Pod运行在哪个Node
```

## Controller Manager

``` text
运行各种Controller
持续Reconcile
```

记忆：

``` text
API Server → 门
etcd → 状态
Scheduler → 选Node
Controller → 保持期望状态
```

------------------------------------------------------------------------

# 8. Worker Node核心组件（★★★★★）

Node 核心：

``` text
kubelet
Container Runtime
Network Components
Pods
```

kubelet：

``` text
Control Plane
    ↓
PodSpec
    ↓
kubelet
    ↓
Container Runtime
    ↓
Container
```

------------------------------------------------------------------------

# 9. API Server核心地位（★★★★★）

绝大多数 Kubernetes 组件通过 API Server 协作：

``` text
kubectl
   ↓
API Server
   ↓
etcd

Scheduler
   ↕
API Server

Controller
   ↕
API Server

kubelet
   ↕
API Server
```

原则：

> API Server 是 Kubernetes 控制面的统一 API 中心。

------------------------------------------------------------------------

# 10. etcd集群状态存储（★★★★★）

etcd 保存：

``` text
Cluster State
Configuration
Metadata
Resource Objects
```

它不是：

``` text
业务数据库
```

而是：

``` text
Kubernetes控制面状态数据库
```

生产重点：

``` text
Backup
Quorum
Disk Latency
Security
Recovery
```

------------------------------------------------------------------------

# 11. Scheduler调度体系（★★★★★）

调度：

``` text
Pending Pod
   ↓
Filter Nodes
   ↓
Score Nodes
   ↓
Select Node
   ↓
Bind
```

影响因素：

``` text
Requests
NodeSelector
Affinity
Anti-Affinity
Taint / Toleration
Topology
Volume
```

------------------------------------------------------------------------

# 12. Controller控制循环（★★★★★）

Controller 基本模式：

``` text
Watch
 ↓
Observe
 ↓
Compare
 ↓
Reconcile
```

例如 Deployment：

``` text
Deployment Controller
       ↓
ReplicaSet
       ↓
Pod
```

Controller 是 Kubernetes 自动化能力的核心。

------------------------------------------------------------------------

# 13. kubelet与容器运行时（★★★★★）

kubelet：

> 每个 Node 上负责 Pod 生命周期执行与状态上报的核心 Agent。

Container Runtime：

``` text
containerd
CRI-O
```

关系：

``` text
kubelet
   ↓ CRI
Container Runtime
   ↓
Container
```

------------------------------------------------------------------------

# 14. Kubernetes资源对象体系（★★★★★）

资源通常包含：

``` text
apiVersion
kind
metadata
spec
status
```

理解：

``` text
spec
↓
用户期望状态

status
↓
系统观察到的当前状态
```

这是非常重要的 API 设计模式。

------------------------------------------------------------------------

# 15. Pod核心模型（★★★★★）

Pod：

> Kubernetes 最小可调度单元。

一个 Pod 可以包含：

``` text
1个或多个Container
```

共享：

``` text
Network Namespace
Volumes
Lifecycle
```

关系：

``` text
Pod
├── App Container
├── Sidecar
└── Shared Volume
```

------------------------------------------------------------------------

# 16. Deployment与无状态应用（★★★★★）

Deployment 适合：

``` text
Stateless Application
```

关系：

``` text
Deployment
   ↓
ReplicaSet
   ↓
Pod
```

提供：

``` text
Rolling Update
Rollback
Scaling
Self-healing
```

------------------------------------------------------------------------

# 17. StatefulSet与有状态应用（★★★★★）

StatefulSet 提供：

``` text
Stable Identity
Stable Network Identity
Stable Storage
Ordered Lifecycle
```

典型：

``` text
database-0
database-1
database-2
```

适用于需要稳定身份和存储关系的应用。

------------------------------------------------------------------------

# 18. DaemonSet节点级工作负载（★★★★☆）

DaemonSet：

> 在符合条件的 Node 上维持 Pod 副本。

典型：

``` text
CNI Agent
Log Agent
Monitoring Agent
Storage Agent
```

关系：

``` text
Node A → Agent Pod
Node B → Agent Pod
Node C → Agent Pod
```

------------------------------------------------------------------------

# 19. Job与CronJob任务体系（★★★★☆）

Job：

``` text
Run To Completion
```

CronJob：

``` text
Scheduled Job
```

典型：

``` text
Batch Processing
Backup
Periodic Cleanup
Report
```

------------------------------------------------------------------------

# 20. Service服务发现与负载均衡（★★★★★）

Pod：

``` text
IP会变化
```

Service：

``` text
Stable Virtual Access
```

链路：

``` text
Client
 ↓
Service
 ↓
EndpointSlice
 ↓
Pod
```

常见类型：

``` text
ClusterIP
NodePort
LoadBalancer
ExternalName
```

------------------------------------------------------------------------

# 21. Ingress / Gateway外部流量入口（★★★★★）

典型：

``` text
Internet
 ↓
Load Balancer
 ↓
Ingress / Gateway
 ↓
Service
 ↓
Pod
```

Ingress / Gateway 主要处理：

``` text
Host
Path
TLS
Routing
```

Service 负责服务层访问，二者不要混淆。

------------------------------------------------------------------------

# 22. ConfigMap与Secret配置体系（★★★★★）

ConfigMap：

``` text
Non-sensitive Configuration
```

Secret：

``` text
Sensitive Data
```

可以：

``` text
Environment Variable
Volume Mount
```

生产环境还应结合：

``` text
Encryption at Rest
External Secret Management
Least Privilege
```

------------------------------------------------------------------------

# 23. Volume与数据持久化（★★★★★）

容器文件系统：

``` text
Ephemeral
```

Volume 用于：

``` text
共享数据
持久数据
配置挂载
```

但真正的持久化体系通常需要：

``` text
PV
PVC
StorageClass
CSI
```

------------------------------------------------------------------------

# 24. PV / PVC / StorageClass存储模型（★★★★★）

关系：

``` text
Pod
 ↓
PVC
 ↓
PV
 ↓
Storage Backend
```

动态供应：

``` text
PVC
 ↓
StorageClass
 ↓
CSI Provisioner
 ↓
PV
```

理解：

``` text
PVC = 应用提出存储需求
PV = 实际存储资源抽象
StorageClass = 动态供应策略
```

------------------------------------------------------------------------

# 25. CSI存储扩展体系（★★★★★）

CSI：

``` text
Container Storage Interface
```

使 Kubernetes 可以通过标准接口集成不同存储系统。

典型：

``` text
Kubernetes
 ↓
CSI Driver
 ↓
Cloud Disk / SAN / NAS / Distributed Storage
```

------------------------------------------------------------------------

# 26. Kubernetes网络模型（★★★★★）

核心目标：

``` text
Pod-to-Pod
Pod-to-Service
External-to-Service
```

网络体系：

``` text
CNI
Service
DNS
Ingress / Gateway
NetworkPolicy
```

------------------------------------------------------------------------

# 27. CNI与Pod网络（★★★★★）

CNI 负责：

``` text
Pod Network
IP Allocation
Route / Overlay
Network Setup
```

典型架构：

``` text
Pod A
 ↓
CNI Network
 ↓
Pod B
```

不同 CNI 实现可能采用：

``` text
Overlay
Routing
eBPF
```

等不同技术。

------------------------------------------------------------------------

# 28. DNS与服务发现（★★★★★）

Service 通常拥有稳定 DNS 名称。

例如概念形式：

``` text
service.namespace.svc.cluster.local
```

链路：

``` text
Application
 ↓
DNS
 ↓
Service
 ↓
EndpointSlice
 ↓
Pod
```

CoreDNS 是常见集群 DNS 实现。

------------------------------------------------------------------------

# 29. NetworkPolicy网络安全（★★★★★）

默认网络模型下，需要通过 NetworkPolicy 表达：

``` text
Who
Can Talk To
Whom
On Which Port
```

典型策略：

``` text
Default Deny
+
Explicit Allow
```

前提：

> 使用的网络插件必须支持 NetworkPolicy。

------------------------------------------------------------------------

# 30. Scheduler高级调度（★★★★★）

常见机制：

``` text
NodeSelector
Node Affinity
Pod Affinity
Pod Anti-Affinity
Taint
Toleration
Topology Spread
```

目标：

``` text
Performance
Availability
Isolation
Cost
Compliance
```

------------------------------------------------------------------------

# 31. Requests / Limits资源管理（★★★★★）

Requests：

``` text
Scheduler主要用于资源调度判断
```

Limits：

``` text
运行时资源上限约束
```

例如：

``` text
requests.cpu
requests.memory

limits.cpu
limits.memory
```

错误配置可能导致：

``` text
Pending
CPU Throttling
OOMKilled
Low Utilization
```

------------------------------------------------------------------------

# 32. QoS服务质量模型（★★★★★）

Pod QoS：

``` text
Guaranteed
Burstable
BestEffort
```

资源压力时，QoS 会影响：

``` text
Eviction Priority
```

理解 QoS 要结合：

``` text
Requests
Limits
```

------------------------------------------------------------------------

# 33. HPA / VPA自动扩缩容（★★★★★）

HPA：

``` text
Horizontal
↓
改变Pod副本数
```

VPA：

``` text
Vertical
↓
调整Pod资源建议/请求
```

概念：

``` text
Traffic ↑
 ↓
HPA
 ↓
Pods ↑
```

而：

``` text
单Pod资源不足
 ↓
VPA
 ↓
CPU / Memory Recommendation
```

------------------------------------------------------------------------

# 34. RBAC权限体系（★★★★★）

核心资源：

``` text
Role
ClusterRole
RoleBinding
ClusterRoleBinding
```

模型：

``` text
Subject
 ↓
Binding
 ↓
Role / ClusterRole
 ↓
Permissions
```

核心原则：

``` text
Least Privilege
```

------------------------------------------------------------------------

# 35. ServiceAccount身份体系（★★★★★）

ServiceAccount：

> 为 Pod 内工作负载提供 Kubernetes 身份。

关系：

``` text
Pod
 ↓
ServiceAccount
 ↓
RBAC
 ↓
API Permissions
```

不要把：

``` text
ServiceAccount
```

理解成普通用户账号。

------------------------------------------------------------------------

# 36. Admission Controller准入控制（★★★★★）

请求链：

``` text
Client
 ↓
Authentication
 ↓
Authorization
 ↓
Admission
 ↓
Persist
```

Admission 可以：

``` text
Mutate
Validate
Enforce Policy
```

典型：

``` text
Mutating Admission
Validating Admission
Admission Webhook
```

------------------------------------------------------------------------

# 37. Kubernetes整体安全体系（★★★★★）

安全不是单点：

``` text
Identity
RBAC
Admission
Pod Security
NetworkPolicy
Secrets
Image Security
Runtime Security
Node Security
Audit
Supply Chain
```

可以记：

``` text
Who?
↓
Authentication

Can do what?
↓
Authorization

Should this object be accepted?
↓
Admission

Can workloads communicate?
↓
NetworkPolicy
```

------------------------------------------------------------------------

# 38. 日志、监控与可观测性（★★★★★）

三大支柱：

``` text
Metrics
Logs
Traces
```

用途：

``` text
Metrics → 发现趋势和异常
Logs    → 查看事件细节
Traces  → 查看请求链路
```

生产还需要：

``` text
Alert
SLO
Dashboard
Correlation
```

------------------------------------------------------------------------

# 39. 备份、恢复与灾难恢复（★★★★★）

保护对象：

``` text
etcd
Persistent Data
Configuration
Secrets
Cluster State
Application State
```

核心指标：

``` text
RPO
RTO
```

真正可靠的备份：

``` text
Backup
+
Restore Test
```

没有恢复演练的备份不能证明可恢复。

------------------------------------------------------------------------

# 40. Helm应用包管理（★★★★★）

Helm：

``` text
Chart
+
Values
+
Templates
=
Rendered Kubernetes Manifests
```

适合：

``` text
Package
Version
Reuse
Release Management
```

------------------------------------------------------------------------

# 41. Kustomize配置定制（★★★★★）

Kustomize：

``` text
Base
+
Overlay
=
Environment-specific Manifest
```

例如：

``` text
base/
overlays/dev/
overlays/prod/
```

特点：

``` text
Patch-based Customization
```

------------------------------------------------------------------------

# 42. Kubernetes CI/CD体系（★★★★★）

典型：

``` text
Developer
 ↓
Git
 ↓
CI
 ↓
Test
 ↓
Build Image
 ↓
Registry
 ↓
CD
 ↓
Kubernetes
```

CI：

``` text
Build + Test
```

CD：

``` text
Delivery / Deployment
```

不要混淆。

------------------------------------------------------------------------

# 43. GitOps持续交付（★★★★★）

GitOps：

``` text
Git = Desired State Source
```

典型：

``` text
Git
 ↓
GitOps Controller
 ↓
Observe Difference
 ↓
Reconcile
 ↓
Kubernetes
```

与手工：

``` bash
kubectl apply
```

相比，更强调：

``` text
Versioned
Auditable
Declarative
Continuous Reconciliation
```

------------------------------------------------------------------------

# 44. Service Mesh服务治理（★★★★☆）

Service Mesh 关注：

``` text
Service-to-Service Communication
```

能力：

``` text
Traffic Management
mTLS
Observability
Retry
Timeout
Circuit Breaking
```

它不是 Kubernetes 的必需组件，应根据复杂度和治理需求选择。

------------------------------------------------------------------------

# 45. CRD与API扩展（★★★★★）

CRD：

``` text
CustomResourceDefinition
```

允许扩展：

``` text
Kubernetes API
```

例如：

``` text
kind: Database
kind: Cluster
kind: Certificate
```

核心：

``` text
CRD
↓
定义新资源类型

CR
↓
该资源的实例
```

------------------------------------------------------------------------

# 46. Operator与自动化运维（★★★★★）

Operator：

``` text
CRD
+
Controller
+
Domain Knowledge
```

例如：

``` text
Database CR
 ↓
Operator
 ↓
Create
Upgrade
Backup
Failover
```

本质：

> 把人工运维知识编码进 Controller。

------------------------------------------------------------------------

# 47. Multi-Cluster多集群架构（★★★★★）

为什么多集群：

``` text
Failure Isolation
Region
Compliance
Environment Isolation
Scale
Multi-cloud
```

典型：

``` text
Global Layer
    ↓
Cluster A
Cluster B
Cluster C
```

挑战：

``` text
Identity
Policy
Traffic
Observability
GitOps
Lifecycle
Cost
```

------------------------------------------------------------------------

# 48. Cluster API集群生命周期（★★★★★）

Cluster API：

> 用 Kubernetes API 管理 Kubernetes Cluster。

核心：

``` text
Management Cluster
      ↓
Cluster API
      ↓
Workload Cluster
```

资源：

``` text
Cluster
Machine
MachineSet
MachineDeployment
MachineHealthCheck
ClusterClass
```

核心记忆：

``` text
Kubernetes manages Kubernetes
```

------------------------------------------------------------------------

# 49. Kubernetes生产故障排查（★★★★★）

固定流程：

``` text
影响范围
 ↓
最近变更
 ↓
kubectl get
 ↓
describe / Events
 ↓
logs
 ↓
Pod
 ↓
Node
 ↓
Network
 ↓
Storage
 ↓
Security
 ↓
Control Plane
 ↓
Metrics + Logs + Traces
 ↓
Root Cause
```

生产事故：

> 先恢复业务，同时尽可能保护现场，恢复后完成 RCA。

------------------------------------------------------------------------

# 50. Kubernetes高可用架构（★★★★★）

高可用不是：

``` text
多部署几个Pod
```

而是整个链路：

``` text
Application
Control Plane
Node
Network
Storage
Ingress
DNS
Region
Backup
```

都需要分析故障域。

典型：

``` text
Multiple Control Plane Nodes
Multiple Worker Nodes
Pod Anti-Affinity
Topology Spread
Multiple Replicas
PDB
Storage Replication
Load Balancer HA
Backup / DR
```

------------------------------------------------------------------------

# 51. Kubernetes生产架构设计（★★★★★）

典型生产架构：

``` text
Internet
 ↓
DNS / Global Traffic
 ↓
Load Balancer
 ↓
Ingress / Gateway
 ↓
Service
 ↓
Application Pods
 ↓
Database / Cache / MQ
```

基础层：

``` text
Multi-AZ Nodes
CNI
CSI
Observability
Security
GitOps
Backup
```

架构设计核心：

``` text
Availability
Scalability
Security
Observability
Recoverability
Cost
Operability
```

------------------------------------------------------------------------

# 52. Kubernetes完整请求链路（★★★★★）

用户访问应用：

``` text
Client
 ↓
DNS
 ↓
Load Balancer
 ↓
Ingress / Gateway
 ↓
Service
 ↓
EndpointSlice
 ↓
Pod IP
 ↓
Container
 ↓
Application
 ↓
Database / Cache / MQ
```

任何一层异常都可能表现为：

``` text
网站打不开
```

所以必须逐层验证。

------------------------------------------------------------------------

# 53. Kubernetes完整部署链路（★★★★★）

执行：

``` bash
kubectl apply -f deployment.yaml
```

背后：

``` text
kubectl
 ↓
API Server
 ↓
Authentication
 ↓
Authorization
 ↓
Admission
 ↓
etcd
 ↓
Deployment Controller
 ↓
ReplicaSet
 ↓
Pod
 ↓
Scheduler
 ↓
Node Binding
 ↓
kubelet
 ↓
Container Runtime
 ↓
CNI / CSI
 ↓
Container Running
 ↓
Probe
 ↓
Ready
 ↓
Service Endpoint
```

这条链是理解 Kubernetes 最重要的综合链路之一。

------------------------------------------------------------------------

# 54. Kubernetes完整控制循环（★★★★★）

``` text
User
 ↓
Desired State
 ↓
API Server
 ↓
etcd
 ↑
Controller Watch
 ↓
Observe Actual State
 ↓
Difference?
 ↓
Reconcile
 ↓
Update Resources
 ↓
Actual State
```

一句话：

> Kubernetes 不是执行一次命令就结束，而是持续调谐。

------------------------------------------------------------------------

# 55. Kubernetes核心资源关系图（★★★★★）

``` text
Deployment
   ↓
ReplicaSet
   ↓
Pod
   ↓
Container

StatefulSet
   ↓
Pod
   ↓
PVC
   ↓
PV

Service
   ↓
EndpointSlice
   ↓
Pod

Ingress / Gateway
   ↓
Service
   ↓
Pod

HPA
   ↓
Deployment
   ↓
Pods
```

------------------------------------------------------------------------

# 56. Kubernetes网络知识地图（★★★★★）

``` text
Network
│
├── Pod Network
│   └── CNI
│
├── Service Network
│   ├── Service
│   └── EndpointSlice
│
├── DNS
│   └── CoreDNS
│
├── External Traffic
│   ├── LoadBalancer
│   ├── Ingress
│   └── Gateway
│
└── Security
    └── NetworkPolicy
```

排障链：

``` text
DNS
↓
Ingress / Gateway
↓
Service
↓
EndpointSlice
↓
Pod
↓
CNI
```

------------------------------------------------------------------------

# 57. Kubernetes存储知识地图（★★★★★）

``` text
Application
 ↓
Pod
 ↓
Volume
 ↓
PVC
 ↓
PV
 ↓
StorageClass
 ↓
CSI
 ↓
Storage Backend
```

重点：

``` text
Provision
Attach
Mount
Use
Detach
Delete
```

------------------------------------------------------------------------

# 58. Kubernetes安全知识地图（★★★★★）

``` text
Request
 ↓
Authentication
 ↓
Authorization / RBAC
 ↓
Admission
 ↓
API Object
```

工作负载：

``` text
ServiceAccount
Secret
Pod Security
NetworkPolicy
Runtime Security
```

供应链：

``` text
Source
↓
Build
↓
Image
↓
Registry
↓
Admission
↓
Runtime
```

------------------------------------------------------------------------

# 59. Kubernetes运维知识地图（★★★★★）

``` text
Operations
│
├── Monitoring
├── Logging
├── Tracing
├── Alerting
├── Backup
├── Restore
├── Upgrade
├── Scaling
├── Security
├── Cost
└── Troubleshooting
```

成熟 Kubernetes 平台的重点不是：

``` text
能部署
```

而是：

``` text
可运营
```

------------------------------------------------------------------------

# 60. Kubernetes云原生技术栈（★★★★☆）

Kubernetes 通常位于更大的云原生体系中：

``` text
Source Control
 ↓
CI
 ↓
Container Image
 ↓
Registry
 ↓
Kubernetes
 ↓
GitOps
 ↓
Observability
 ↓
Service Mesh
 ↓
Policy / Security
```

再向下：

``` text
Cloud / VM / Bare Metal
Network
Storage
```

------------------------------------------------------------------------

# 61. Kubernetes核心概念对比（★★★★★）

  --------------------------------------------------------------------------------------
  概念                                核心区别
  ----------------------------------- --------------------------------------------------
  Pod vs Container                    Pod是Kubernetes调度单元，Container是其中运行单元

  Deployment vs StatefulSet           无状态副本管理 vs 稳定身份/存储的有状态管理

  Deployment vs DaemonSet             指定副本数 vs 按Node部署

  Job vs CronJob                      一次/有限任务 vs 定时任务

  Service vs Ingress                  服务访问抽象 vs HTTP/HTTPS入口路由

  ConfigMap vs Secret                 普通配置 vs 敏感数据

  PV vs PVC                           存储资源 vs 存储需求

  Requests vs Limits                  调度保障基准 vs 运行上限

  HPA vs VPA                          横向副本扩缩 vs 纵向资源调整

  Role vs ClusterRole                 Namespace权限 vs 可表达集群范围权限

  RoleBinding vs ClusterRoleBinding   Namespace内授权 vs 集群范围授权

  Liveness vs Readiness               是否需要重启 vs 是否接收流量

  Ingress vs NetworkPolicy            流量入口路由 vs 网络访问控制

  CRD vs CR                           类型定义 vs 类型实例

  CRD vs Operator                     API扩展定义 vs 自动化控制逻辑

  Helm vs Kustomize                   模板化包管理 vs Overlay/Patch定制

  CI/CD vs GitOps                     交付流水线体系 vs Git驱动持续调谐

  Terraform vs Cluster API            通用IaC vs Kubernetes集群生命周期控制
  --------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 62. Kubernetes高频易混淆知识点（★★★★★）

## Running ≠ Ready

``` text
Running
```

表示容器已经运行。

``` text
Ready
```

表示 Pod 可以接收流量。

------------------------------------------------------------------------

## Service ≠ Ingress

``` text
Service
↓
服务访问与后端抽象

Ingress
↓
HTTP/HTTPS外部路由
```

------------------------------------------------------------------------

## Secret ≠ 自动绝对安全

Secret 仍需：

``` text
RBAC
Encryption
External Secret Management
Audit
```

------------------------------------------------------------------------

## Requests ≠ Limits

``` text
Requests → Scheduling
Limits → Runtime Constraint
```

------------------------------------------------------------------------

## HPA ≠ VPA

``` text
HPA → More/Fewer Pods
VPA → More/Fewer Resources per Pod
```

------------------------------------------------------------------------

## CRD ≠ Operator

``` text
CRD → 新API类型
Operator → Controller + Domain Logic
```

------------------------------------------------------------------------

## GitOps ≠ 只把YAML放Git

真正 GitOps 强调：

``` text
Declarative
Versioned
Automated Pull/Reconciliation
Continuous Drift Correction
```

------------------------------------------------------------------------

# 63. Kubernetes生产最佳实践（★★★★★）

1.  使用声明式配置；
2.  配置 Requests；
3.  谨慎配置 Limits；
4.  使用 Readiness Probe；
5.  慢启动应用使用 Startup Probe；
6.  合理使用 Liveness Probe；
7.  生产应用至少多副本；
8.  跨故障域分布副本；
9.  使用 PDB 保护可用副本；
10. 使用 Rolling Update；
11. 建立快速 Rollback 能力；
12. 配置 HPA 前先保证指标可靠；
13. Stateful Workload 明确存储恢复方案；
14. StorageClass 标准化；
15. 使用 CSI；
16. 网络采用最小访问原则；
17. 逐步建立 Default Deny NetworkPolicy；
18. RBAC 使用 Least Privilege；
19. 不给普通应用过高 ClusterRole；
20. Secret 不明文提交 Git；
21. 建立 Admission Policy；
22. 镜像固定可追踪版本；
23. 建立镜像安全扫描；
24. Control Plane 高可用；
25. etcd 定期备份；
26. 定期进行恢复演练；
27. 建立 Metrics / Logs / Traces；
28. 对 SLO 建立告警；
29. 使用 GitOps 管理生产变更；
30. Helm / Kustomize 模板保持可维护；
31. CRD 和 Operator 需要版本治理；
32. Webhook 必须考虑高可用和超时；
33. 升级前检查 API Deprecation；
34. Kubernetes 和 Provider/CNI/CSI 版本统一验证；
35. 多集群优先解决身份、策略、流量和可观测性；
36. Management Cluster 属于高价值控制面；
37. 故障时先收集证据；
38. 生产事故优先恢复服务；
39. 事故结束必须 RCA；
40. 自动化不能替代恢复演练。

------------------------------------------------------------------------

# 64. Kubernetes面试高频问题（★★★★★）

## Kubernetes核心组件有哪些？

``` text
API Server
etcd
Scheduler
Controller Manager
kubelet
Container Runtime
```

## Pod为什么不是Container？

因为 Pod 是 Kubernetes
的调度和生命周期抽象，可以封装一个或多个紧密协作的 Container。

## Deployment如何实现自愈？

``` text
Desired Replicas
↓
Controller持续观察
↓
Actual不足
↓
创建ReplicaSet/Pod
```

## Service为什么存在？

Pod IP 和生命周期不稳定，Service 提供稳定的服务发现与访问抽象。

## etcd为什么重要？

它保存 Kubernetes 控制面关键状态，是集群一致性和恢复的重要基础。

## Scheduler如何选择Node？

主要经过：

``` text
Filtering
↓
Scoring
↓
Binding
```

并考虑资源和调度约束。

## Operator是什么？

> 使用 CRD + Controller + Reconciliation 将领域运维知识自动化。

------------------------------------------------------------------------

# 65. 系统架构设计师高频考点（★★★★★）

建议重点掌握：

``` text
容器编排
声明式管理
服务发现
负载均衡
弹性伸缩
高可用
故障恢复
微服务
DevOps
CI/CD
云原生
分布式系统
安全控制
可观测性
```

架构题中 Kubernetes 的价值通常体现为：

``` text
标准化部署
自动调度
弹性扩缩
故障自愈
服务治理
资源隔离
自动化运维
```

------------------------------------------------------------------------

# 66. Kubernetes故障速查表（★★★★★）

  现象                     优先检查
  ------------------------ -------------------------------------
  Pending                  Events / Scheduler / Resource / PVC
  CrashLoopBackOff         logs --previous / Exit Code
  ImagePullBackOff         Image / Registry / Secret
  OOMKilled                Memory Limit / Memory Usage
  Evicted                  Node Pressure
  Running 0/1              Readiness Probe
  FailedScheduling         Resource / Taint / Affinity
  FailedMount              PVC / PV / CSI
  FailedCreatePodSandBox   CNI / Runtime
  Service无流量            EndpointSlice / Selector / Ready
  DNS失败                  CoreDNS / CNI / Upstream DNS
  Node NotReady            kubelet / Runtime / Network
  Forbidden                RBAC
  Webhook失败              Service / TLS / Timeout / Policy
  API Server慢             etcd / Admission / Load
  x509 expired             Certificate

------------------------------------------------------------------------

# 67. Kubernetes命令速查表（★★★★★）

## Cluster

``` bash
kubectl cluster-info
kubectl get nodes
kubectl get namespaces
```

## Pod

``` bash
kubectl get pods -A
kubectl get pod <pod> -o wide
kubectl describe pod <pod>
kubectl logs <pod>
kubectl logs <pod> --previous
kubectl exec -it <pod> -- sh
kubectl debug -it <pod> --image=busybox
```

## Workload

``` bash
kubectl get deploy,sts,ds,job,cronjob
kubectl rollout status deploy/<name>
kubectl rollout history deploy/<name>
kubectl rollout undo deploy/<name>
```

## Network

``` bash
kubectl get svc
kubectl get endpointslices
kubectl get ingress
kubectl get networkpolicy
```

## Storage

``` bash
kubectl get pv
kubectl get pvc
kubectl get storageclass
```

## Resource

``` bash
kubectl top pod
kubectl top node
```

## Security

``` bash
kubectl auth can-i get pods
kubectl auth can-i --list
```

## Events

``` bash
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl events
```

------------------------------------------------------------------------

# 68. Kubernetes核心知识速记表（★★★★★）

``` text
Pod
= 最小调度单元

Deployment
= 无状态应用管理

StatefulSet
= 有状态应用管理

DaemonSet
= Node级服务

Job
= 批处理任务

CronJob
= 定时任务

Service
= 稳定服务访问

Ingress / Gateway
= 外部流量入口

ConfigMap
= 普通配置

Secret
= 敏感配置

PV
= 存储资源

PVC
= 存储申请

StorageClass
= 动态存储策略

CNI
= 容器网络接口

CSI
= 容器存储接口

RBAC
= 权限控制

Admission
= API准入策略

HPA
= 水平扩缩

VPA
= 垂直资源优化

CRD
= 自定义API

Operator
= 自动化领域运维

GitOps
= Git驱动持续调谐

Cluster API
= Kubernetes管理Kubernetes
```

------------------------------------------------------------------------

# 69. Mermaid Kubernetes完整架构图

``` mermaid
flowchart TB

USER[User / CI / GitOps] --> API[API Server]

API <--> ETCD[(etcd)]
API <--> SCH[Scheduler]
API <--> CTRL[Controller Manager]
API <--> KUBELET[kubelet]

SCH --> NODE[Worker Node]
CTRL --> RS[ReplicaSet]
RS --> POD[Pod]

KUBELET --> RUNTIME[Container Runtime]
RUNTIME --> POD

POD --> CNI[CNI Network]
POD --> PVC[PVC]
PVC --> PV[PV]
PV --> CSI[CSI Driver]

CLIENT[Client] --> LB[Load Balancer]
LB --> GW[Ingress / Gateway]
GW --> SVC[Service]
SVC --> EPS[EndpointSlice]
EPS --> POD

DNS[CoreDNS] --> SVC

RBAC[RBAC] --> API
ADM[Admission] --> API

OBS[Metrics / Logs / Traces] --> POD
OBS --> NODE
OBS --> API
```

------------------------------------------------------------------------

# 70. Mermaid Kubernetes知识体系图

``` mermaid
mindmap
  root((Kubernetes))
    Architecture
      API Server
      etcd
      Scheduler
      Controller
      kubelet
    Workloads
      Pod
      Deployment
      StatefulSet
      DaemonSet
      Job
      CronJob
    Network
      CNI
      Service
      DNS
      Ingress
      Gateway
      NetworkPolicy
    Storage
      Volume
      PV
      PVC
      StorageClass
      CSI
    Resources
      Requests
      Limits
      QoS
      HPA
      VPA
    Security
      ServiceAccount
      RBAC
      Admission
      Secret
      NetworkPolicy
    Delivery
      Helm
      Kustomize
      CI-CD
      GitOps
    Extensibility
      CRD
      Operator
      Webhook
    Production
      Observability
      Backup
      DR
      Troubleshooting
      Multi-Cluster
      Cluster API
```

------------------------------------------------------------------------

# 71. Kubernetes学习路线回顾

完整学习路线可以归纳为：

``` text
Container
 ↓
Kubernetes Architecture
 ↓
Resource Model
 ↓
Pod
 ↓
Workload Controllers
 ↓
Service
 ↓
Ingress / Gateway
 ↓
Configuration
 ↓
Storage
 ↓
Scheduling
 ↓
Resource Management
 ↓
Networking
 ↓
Security
 ↓
Observability
 ↓
Backup / DR
 ↓
Helm / Kustomize
 ↓
CI/CD
 ↓
GitOps
 ↓
Service Mesh
 ↓
CRD
 ↓
Operator
 ↓
Admission
 ↓
Multi-Cluster
 ↓
Cluster API
 ↓
Troubleshooting
 ↓
Production Architecture
```

真正掌握 Kubernetes 的标志不是：

``` text
记住很多kubectl命令
```

而是遇到一个资源时能够判断：

``` text
它是什么？
谁创建它？
谁管理它？
谁观察它？
它依赖什么？
状态保存在哪里？
流量如何到达它？
数据如何持久化？
失败后谁负责恢复？
如何监控？
如何排障？
```

------------------------------------------------------------------------

# 72. 全系列最终总结（★★★★★）

Kubernetes 的知识点非常多，但最终可以压缩为几条主线。

## 第一条：API

``` text
Everything is an API Object
```

Pod、Deployment、Service、PVC、CRD、Cluster，都通过 API 表达。

------------------------------------------------------------------------

## 第二条：声明式

用户描述：

``` text
What I Want
```

而不是详细描述：

``` text
How To Do It
```

------------------------------------------------------------------------

## 第三条：控制循环

``` text
Desired State
      ↓
Controller
      ↓
Reconciliation
      ↓
Actual State
```

这是 Kubernetes 自动化的灵魂。

------------------------------------------------------------------------

## 第四条：分层抽象

``` text
Deployment
 ↓
ReplicaSet
 ↓
Pod
 ↓
Container
```

网络：

``` text
Ingress / Gateway
 ↓
Service
 ↓
EndpointSlice
 ↓
Pod
```

存储：

``` text
Pod
 ↓
PVC
 ↓
PV
 ↓
CSI
 ↓
Storage
```

------------------------------------------------------------------------

## 第五条：插件化

``` text
CRI
CNI
CSI
Admission Webhook
CRD
Operator
Provider
```

让 Kubernetes 从容器编排器扩展为云原生平台基础。

------------------------------------------------------------------------

## 第六条：生产化

真正进入生产后，需要同时解决：

``` text
Availability
Security
Observability
Scalability
Recoverability
Operability
Cost
```

因此 Kubernetes 不是：

``` text
会部署Pod
```

就结束了。

------------------------------------------------------------------------

## 第七条：平台化

随着规模扩大：

``` text
Single Cluster
 ↓
GitOps
 ↓
Standardization
 ↓
Multi-Cluster
 ↓
Cluster API
 ↓
Fleet Management
```

Kubernetes 最终可以从：

``` text
Application Runtime
```

进一步成为：

``` text
Platform Engineering Foundation
```

------------------------------------------------------------------------

# 最终一句话总结

> **Kubernetes 的本质不是"运行容器"，而是以 API 为中心，通过声明式
> Desired State 描述系统目标，再由 Controller 持续执行
> Reconciliation；Pod、Deployment、Service、CNI、CSI、RBAC、Admission、GitOps、Operator、Multi-Cluster
> 和 Cluster API 都可以沿着这条主线理解。真正掌握 Kubernetes，就是能够从
> API → 调度 → Node → 网络 → 存储 → 安全 → 可观测性 →
> 故障恢复完整解释一个应用从声明、运行、访问到自愈的全过程。**

------------------------------------------------------------------------

# Kubernetes系列完结

``` text
Docker / Container
        ↓
Kubernetes基础
        ↓
核心资源
        ↓
网络与存储
        ↓
调度与资源
        ↓
安全
        ↓
可观测性
        ↓
CI/CD + GitOps
        ↓
CRD + Operator
        ↓
Multi-Cluster
        ↓
Cluster API
        ↓
Troubleshooting
        ↓
Production Architecture
```

> 至此，Kubernetes 系列正式完成。
