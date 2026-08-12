# 48 Kubernetes Cluster API 集群生命周期自动化管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇系统介绍 Kubernetes Cluster API（CAPI），重点掌握 Management
> Cluster、Workload
> Cluster、Cluster、Machine、MachineSet、MachineDeployment、MachineHealthCheck、Control
> Plane Provider、Bootstrap Provider、Infrastructure
> Provider、clusterctl、ClusterClass、Managed
> Topology、集群创建、扩缩容、升级、自动修复、删除，以及 Cluster API 与
> GitOps、Terraform、Operator、kubeadm 的关系。

------------------------------------------------------------------------

# 目录

1.  Cluster API概述
2.  为什么需要Cluster API
3.  传统Kubernetes集群管理的问题
4.  Kubernetes管理Kubernetes思想
5.  Management Cluster与Workload Cluster
6.  Cluster API整体架构
7.  Cluster API核心资源模型
8.  Cluster资源
9.  Machine资源
10. MachineSet资源
11. MachineDeployment资源
12. MachineHealthCheck资源
13. Control Plane资源模型
14. Infrastructure Provider
15. Bootstrap Provider
16. Control Plane Provider
17. Provider架构与扩展机制
18. clusterctl工具
19. Management Cluster初始化
20. Workload Cluster创建流程
21. Cluster声明式配置
22. Machine生命周期管理
23. Worker Node扩缩容
24. Control Plane扩缩容
25. Kubernetes集群升级
26. Rolling Upgrade滚动升级
27. Machine故障检测与自动修复
28. Cluster删除与资源回收
29. ClusterClass概述
30. Managed Topology
31. ClusterClass模板化集群
32. Cluster变量与Patch
33. 多环境集群模板
34. 多云Cluster API架构
35. Cluster API与GitOps
36. Cluster API与Argo CD / Flux
37. Cluster API与Terraform区别
38. Cluster API与Operator关系
39. Cluster API与kubeadm关系
40. Cluster API安全体系
41. Cluster API RBAC与凭证管理
42. Cluster API高可用
43. Cluster API可观测性
44. Cluster API备份与灾难恢复
45. Cluster API版本兼容性
46. Cluster API常见问题与排查
47. 企业集群生命周期管理体系
48. Cluster API生产最佳实践
49. 系统架构设计师考点
50. Mermaid Cluster API架构图
51. 本节小结

------------------------------------------------------------------------

# 1. Cluster API概述（★★★★★）

Cluster API，简称：

``` text
CAPI
```

核心目标：

> 使用 Kubernetes 风格的声明式 API 和 Controller 模式管理 Kubernetes
> 集群本身的生命周期。

传统 Kubernetes：

``` text
Kubernetes
    ↓
管理
    ↓
Pod / Deployment / Service
```

Cluster API：

``` text
Kubernetes
    ↓
管理
    ↓
Kubernetes Cluster
```

因此可以记忆：

``` text
Kubernetes manages Kubernetes
```

------------------------------------------------------------------------

# 2. 为什么需要Cluster API（★★★★★）

当企业只有少量 Kubernetes 集群时，可以使用：

``` text
kubeadm
Terraform
Shell
Cloud Console
```

人工维护。

但当集群增加到：

``` text
10
50
100+
```

会出现：

``` text
创建方式不统一
版本不一致
升级困难
配置漂移
人工操作过多
故障恢复困难
集群生命周期缺乏标准
```

Cluster API 的目标是：

``` text
Cluster Lifecycle
       ↓
Declarative API
       ↓
Controller
       ↓
Continuous Reconciliation
```

------------------------------------------------------------------------

# 3. 传统Kubernetes集群管理的问题（★★★★★）

传统流程：

``` text
申请VM
 ↓
配置网络
 ↓
安装系统
 ↓
安装Container Runtime
 ↓
安装Kubernetes
 ↓
初始化Control Plane
 ↓
加入Worker
 ↓
安装CNI
 ↓
配置Load Balancer
```

大量依赖：

``` text
脚本
文档
人工操作
```

容易形成：

``` text
Cluster A
和
Cluster B
配置不完全一致
```

Cluster API 将集群基础设施和 Kubernetes 生命周期转化为声明式资源。

------------------------------------------------------------------------

# 4. Kubernetes管理Kubernetes思想（★★★★★）

Cluster API 延续 Kubernetes Controller Pattern：

``` text
Desired State
      ↓
Controller
      ↓
Observe
      ↓
Compare
      ↓
Reconcile
      ↓
Actual State
```

例如声明：

``` text
Control Plane = 3
Workers = 5
Kubernetes = vX.Y.Z
```

Controller 负责持续推动实际集群接近期望状态。

这与：

``` text
Deployment
↓
ReplicaSet
↓
Pod
```

的声明式思想高度一致。

------------------------------------------------------------------------

# 5. Management Cluster与Workload Cluster（★★★★★）

## Management Cluster

运行 Cluster API Controller 的 Kubernetes 集群。

``` text
Management Cluster

├── CAPI Core Controller
├── Infrastructure Provider
├── Bootstrap Provider
└── Control Plane Provider
```

## Workload Cluster

由 Cluster API 创建和管理、主要承载业务工作负载的集群。

``` text
Management Cluster
        │
        ├── Workload Cluster A
        ├── Workload Cluster B
        └── Workload Cluster C
```

Management Cluster 属于关键控制面，必须重点保护。

------------------------------------------------------------------------

# 6. Cluster API整体架构（★★★★★）

``` text
User / GitOps
      ↓
Cluster API Resources
      ↓
Management Cluster
      │
      ├── Core CAPI Controllers
      ├── Infrastructure Provider
      ├── Bootstrap Provider
      └── Control Plane Provider
      ↓
Cloud / VM / Bare Metal
      ↓
Workload Kubernetes Cluster
```

Cluster API 本身不直接实现所有云平台细节，而是通过 Provider 扩展。

------------------------------------------------------------------------

# 7. Cluster API核心资源模型（★★★★★）

核心资源可以理解为：

``` text
Cluster
   │
   ├── Control Plane
   │
   └── Workers
          │
          ├── MachineDeployment
          │      ↓
          │   MachineSet
          │      ↓
          └── Machine
```

再结合：

``` text
Infrastructure Resources
Bootstrap Resources
MachineHealthCheck
ClusterClass
```

形成完整生命周期管理体系。

------------------------------------------------------------------------

# 8. Cluster资源（★★★★★）

Cluster：

> 表示一个 Kubernetes 集群的逻辑资源。

它描述：

``` text
Cluster Identity
Infrastructure Reference
Control Plane Reference
Network Information
Topology
```

可以类比：

``` text
Deployment
```

代表一个应用整体；

而：

``` text
Cluster
```

代表一个 Kubernetes 集群整体。

------------------------------------------------------------------------

# 9. Machine资源（★★★★★）

Machine：

> 表示承载 Kubernetes Node 的一台机器。

底层可能是：

``` text
Virtual Machine
Cloud Instance
Bare Metal
```

关系：

``` text
Machine Resource
      ↓
Infrastructure Machine
      ↓
VM / Server
      ↓
Kubernetes Node
```

Machine 是 Cluster API 中非常核心的抽象。

------------------------------------------------------------------------

# 10. MachineSet资源（★★★★★）

MachineSet：

> 管理一组相似 Machine，并维持期望数量。

可以类比：

``` text
ReplicaSet
↓
Pods
```

Cluster API：

``` text
MachineSet
↓
Machines
```

例如：

``` text
replicas = 3
```

Controller 会努力维持：

``` text
3 Machines
```

------------------------------------------------------------------------

# 11. MachineDeployment资源（★★★★★）

MachineDeployment：

> 为一组 Worker Machine 提供声明式更新、扩缩容和滚动替换能力。

类比：

``` text
Deployment
   ↓
ReplicaSet
   ↓
Pod
```

Cluster API：

``` text
MachineDeployment
       ↓
MachineSet
       ↓
Machine
       ↓
Node
```

因此：

``` text
MachineDeployment
```

是管理 Worker Node 池的重要资源。

------------------------------------------------------------------------

# 12. MachineHealthCheck资源（★★★★★）

MachineHealthCheck：

> 根据健康条件检测 Machine 对应 Node 是否异常，并触发相应修复流程。

概念：

``` text
Machine
   ↓
Node Health
   ↓
MachineHealthCheck
   ↓
Unhealthy?
   ↓
Remediation
```

例如：

``` text
Node Ready=False
持续超过阈值
```

可以触发：

``` text
删除异常Machine
↓
由上层控制器创建替代Machine
```

这使集群具备基础设施层面的自愈能力。

------------------------------------------------------------------------

# 13. Control Plane资源模型（★★★★★）

Cluster API 将 Control Plane 生命周期交给 Control Plane Provider 管理。

典型能力：

``` text
初始化Control Plane
增加Control Plane Machine
减少Control Plane Machine
升级Kubernetes
管理etcd相关生命周期
```

例如 kubeadm 场景常见：

``` text
KubeadmControlPlane
```

抽象关系：

``` text
Cluster
  ↓
Control Plane Resource
  ↓
Control Plane Machines
```

------------------------------------------------------------------------

# 14. Infrastructure Provider（★★★★★）

Infrastructure Provider：

> 负责实际基础设施资源生命周期。

例如：

``` text
VM
Network
Load Balancer
Security Group
IP
```

架构：

``` text
Cluster API
    ↓
Infrastructure Provider
    ↓
Cloud / Virtualization / Bare Metal
```

这样 CAPI Core 不需要了解每个平台的所有底层细节。

------------------------------------------------------------------------

# 15. Bootstrap Provider（★★★★★）

Bootstrap Provider：

> 负责生成机器加入 Kubernetes 集群所需的初始化配置。

例如：

``` text
Control Plane Bootstrap

Worker Join Configuration
```

典型 kubeadm Bootstrap Provider 会生成 kubeadm 所需数据。

流程：

``` text
Machine
  ↓
Bootstrap Config
  ↓
Cloud-init / User Data
  ↓
kubeadm
  ↓
Join Cluster
```

------------------------------------------------------------------------

# 16. Control Plane Provider（★★★★★）

Control Plane Provider：

> 管理 Kubernetes Control Plane 的声明式生命周期。

职责通常包括：

``` text
Create
Scale
Upgrade
Remediate
```

它与 Infrastructure Provider 协作：

``` text
Control Plane Provider
        ↓
需要Machine
        ↓
Infrastructure Provider
        ↓
创建VM
```

------------------------------------------------------------------------

# 17. Provider架构与扩展机制（★★★★★）

Cluster API 的重要设计之一：

``` text
Provider Model
```

典型：

``` text
Core Provider
Infrastructure Provider
Bootstrap Provider
Control Plane Provider
```

因此可以：

``` text
Cluster API Core
       │
       ├── Provider A
       ├── Provider B
       └── Provider C
```

适配：

``` text
Public Cloud
Private Cloud
Virtualization
Bare Metal
```

这与 Kubernetes 的：

``` text
CNI
CSI
CRI
```

类似，都体现插件化和可扩展架构思想。

------------------------------------------------------------------------

# 18. clusterctl工具（★★★★★）

clusterctl：

> Cluster API 官方管理 CLI，用于初始化 Management
> Cluster、生成集群模板、查看集群、获取 kubeconfig、迁移对象和升级
> Provider 等。

常见命令：

``` bash
clusterctl init
```

初始化 Management Cluster。

``` bash
clusterctl generate cluster
```

生成 Workload Cluster 模板。

``` bash
clusterctl describe cluster
```

查看 Cluster API 集群状态。

``` bash
clusterctl get kubeconfig
```

获取 Workload Cluster kubeconfig。

``` bash
clusterctl move
```

迁移 Cluster API 管理对象。

------------------------------------------------------------------------

# 19. Management Cluster初始化（★★★★★）

典型流程：

``` text
Existing Kubernetes Cluster
        ↓
clusterctl init
        ↓
Install CAPI Core
        ↓
Install Providers
        ↓
Management Cluster Ready
```

Management Cluster 可以是：

``` text
临时Bootstrap Cluster
```

也可以是：

``` text
长期运行的Management Cluster
```

生产环境必须考虑其高可用和恢复能力。

------------------------------------------------------------------------

# 20. Workload Cluster创建流程（★★★★★）

典型：

``` text
clusterctl generate cluster
        ↓
Cluster Manifest
        ↓
kubectl apply
        ↓
CAPI Controllers
        ↓
Infrastructure Provisioning
        ↓
Control Plane Bootstrap
        ↓
Worker Bootstrap
        ↓
Workload Cluster Ready
```

例如概念命令：

``` bash
clusterctl generate cluster my-cluster \
  --kubernetes-version <version> \
  --control-plane-machine-count 3 \
  --worker-machine-count 3
```

然后：

``` bash
kubectl apply -f my-cluster.yaml
```

------------------------------------------------------------------------

# 21. Cluster声明式配置（★★★★★）

传统：

``` text
请帮我创建3台Control Plane
再创建5台Worker
然后安装Kubernetes
```

Cluster API：

``` yaml
spec:
  topology:
    version: <kubernetes-version>
```

配合集群拓扑描述：

``` text
Control Plane
Workers
Infrastructure
```

由 Controller 持续 Reconcile。

核心：

``` text
Describe Desired State
```

而不是：

``` text
Describe Manual Steps
```

------------------------------------------------------------------------

# 22. Machine生命周期管理（★★★★★）

Machine 生命周期：

``` text
Pending
   ↓
Provisioning
   ↓
Running
   ↓
Deleting
```

背后通常涉及：

``` text
Infrastructure Machine Creation
Bootstrap Data
Node Registration
ProviderID
Node Association
Deletion
```

Machine Controller 会协调这些过程。

------------------------------------------------------------------------

# 23. Worker Node扩缩容（★★★★★）

Worker 通常由：

``` text
MachineDeployment
```

管理。

例如：

``` text
replicas: 3
```

修改：

``` text
3 → 6
```

流程：

``` text
MachineDeployment
       ↓
MachineSet
       ↓
Create Machines
       ↓
Infrastructure Provider
       ↓
Create VM
       ↓
Bootstrap
       ↓
Join Cluster
```

缩容则执行相反生命周期。

------------------------------------------------------------------------

# 24. Control Plane扩缩容（★★★★★）

Control Plane 也可以声明式管理。

例如：

``` text
3 Control Plane Nodes
        ↓
Scale
        ↓
5 Control Plane Nodes
```

但 Control Plane 扩缩容比 Worker 更复杂，因为涉及：

``` text
etcd Quorum
API Server
Certificates
Control Plane Membership
```

因此应由对应 Control Plane Provider 按其能力执行。

------------------------------------------------------------------------

# 25. Kubernetes集群升级（★★★★★）

传统升级需要：

``` text
逐台节点操作
```

Cluster API 可以将版本变化表达为：

``` text
Desired Kubernetes Version
```

然后 Controller：

``` text
Observe Old Version
      ↓
Create / Replace Machines
      ↓
Rollout
      ↓
New Version
```

在 Managed Topology 中，可以通过 Cluster 的 topology version
作为集中控制点推动相关 Control Plane 和 MachineDeployment 升级。

------------------------------------------------------------------------

# 26. Rolling Upgrade滚动升级（★★★★★）

MachineDeployment 可以采用滚动方式替换 Machine。

概念：

``` text
Old Machine 1
Old Machine 2
Old Machine 3
```

逐步变为：

``` text
New Machine 1
New Machine 2
New Machine 3
```

核心原则：

``` text
先创建新Machine
确认健康
再逐步移除旧Machine
```

以减少升级对业务的影响。

------------------------------------------------------------------------

# 27. Machine故障检测与自动修复（★★★★★）

MachineHealthCheck：

``` text
Check Node Health
       ↓
Unhealthy
       ↓
Remediation
       ↓
Replacement Machine
```

例如：

``` text
Node NotReady
超过5分钟
```

可以触发修复。

注意：

> 自动修复必须设置合理阈值，防止大面积基础设施故障时同时替换过多
> Machine。

------------------------------------------------------------------------

# 28. Cluster删除与资源回收（★★★★★）

声明式生命周期不仅包括：

``` text
Create
```

也包括：

``` text
Delete
```

删除 Cluster 时：

``` text
Cluster Delete
     ↓
Child Resources
     ↓
Machines
     ↓
Infrastructure
     ↓
Load Balancer / Network Resources
```

需要 Provider 正确实现：

``` text
Finalizer
Cleanup
```

避免遗留云资源造成：

``` text
资源泄露
成本泄露
```

------------------------------------------------------------------------

# 29. ClusterClass概述（★★★★★）

ClusterClass：

> 用于定义可复用的 Kubernetes Cluster 模板或蓝图。

如果企业有：

``` text
50 Clusters
```

不应该维护：

``` text
50份完全独立的大型YAML
```

而应该：

``` text
ClusterClass
      ↓
Standard Blueprint
      ↓
Cluster A
Cluster B
Cluster C
```

------------------------------------------------------------------------

# 30. Managed Topology（★★★★★）

Managed Topology：

> 通过 Cluster.spec.topology 使用 ClusterClass 管理集群拓扑，使 Cluster
> 成为更高层的统一控制入口。

概念：

``` text
Cluster
  ↓
spec.topology
  ↓
ClusterClass
  ↓
Control Plane
Workers
Infrastructure
```

改变：

``` text
Cluster.spec.topology.version
```

可以驱动相关对象逐步收敛。

------------------------------------------------------------------------

# 31. ClusterClass模板化集群（★★★★★）

ClusterClass 可以定义：

``` text
Infrastructure Cluster Template

Control Plane Template

Worker Machine Templates

MachineHealthCheck

Variables

Patches
```

形成：

``` text
Enterprise Kubernetes Blueprint
```

例如：

``` text
Production ClusterClass

├── 3 Control Plane
├── Standard Worker
├── Security Baseline
└── Standard Infrastructure
```

------------------------------------------------------------------------

# 32. Cluster变量与Patch（★★★★★）

不同 Cluster 需要：

``` text
相同结构
不同参数
```

例如：

``` text
Region
Instance Type
Registry
Worker Size
```

ClusterClass 可以通过：

``` text
Variables
+
Patches
```

实现。

概念：

``` text
ClusterClass
      │
      ├── region
      ├── workerSize
      └── registry
      ↓
Patch Templates
      ↓
Generated Cluster Objects
```

------------------------------------------------------------------------

# 33. 多环境集群模板（★★★★★）

企业可以建立：

``` text
Base ClusterClass
```

然后通过变量形成：

``` text
Dev Cluster

Staging Cluster

Prod Cluster
```

例如：

``` text
Dev
Worker = Small

Prod
Worker = Large
Control Plane = HA
```

实现：

``` text
Standardization
+
Customization
```

------------------------------------------------------------------------

# 34. 多云Cluster API架构（★★★★☆）

Cluster API Provider 模型可以支持多种基础设施。

``` text
                 Management Cluster
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
     Provider A    Provider B    Provider C
          ↓             ↓             ↓
       Cloud A       Cloud B      On-Prem
```

上层：

``` text
Cluster API
```

保持相似；

底层：

``` text
Infrastructure Resource
```

由不同 Provider 实现。

但：

> CAPI 统一的是生命周期管理模型，并不会消除各云平台本身的能力差异。

------------------------------------------------------------------------

# 35. Cluster API与GitOps（★★★★★）

Cluster API 非常适合 GitOps。

``` text
Git
 ↓
Cluster Manifest
 ↓
GitOps Controller
 ↓
Management Cluster
 ↓
Cluster API
 ↓
Workload Cluster
```

这样：

``` text
创建Cluster
修改Cluster
升级Cluster
```

都可以通过：

``` text
Git Commit
Pull Request
Code Review
```

进行治理。

------------------------------------------------------------------------

# 36. Cluster API与Argo CD / Flux（★★★★☆）

可以使用：

``` text
Argo CD
```

或：

``` text
Flux
```

将 Cluster API Manifest 同步到 Management Cluster。

例如：

``` text
Git

↓

Flux / Argo CD

↓

Cluster Resource

↓

CAPI Controllers

↓

Cloud Infrastructure
```

形成：

``` text
GitOps for Kubernetes Clusters
```

即：

> 不只是应用 GitOps，连 Cluster 本身也可以 GitOps。

------------------------------------------------------------------------

# 37. Cluster API与Terraform区别（★★★★★）

两者并非简单替代关系。

## Terraform

核心：

``` text
Infrastructure as Code
```

擅长：

``` text
Cloud Resource Provisioning
VPC
IAM
Database
DNS
Infrastructure
```

## Cluster API

核心：

``` text
Kubernetes-style Cluster Lifecycle
```

擅长：

``` text
Cluster
Machine
Control Plane
Upgrade
Remediation
Continuous Reconciliation
```

对比：

  维度         Terraform         Cluster API
  ------------ ----------------- ----------------------------
  核心模型     IaC               Kubernetes API
  执行方式     Plan / Apply      Controller Reconcile
  主要对象     通用基础设施      Kubernetes Cluster生命周期
  状态管理     Terraform State   Kubernetes API状态
  GitOps融合   可以              非常自然
  持续调谐     非核心模式        核心模式

实际企业可能组合：

``` text
Terraform
↓
基础平台

Cluster API
↓
Kubernetes Cluster Lifecycle
```

------------------------------------------------------------------------

# 38. Cluster API与Operator关系（★★★★★）

Cluster API 本质上大量采用：

``` text
Operator Pattern
```

因为：

``` text
CRD
+
Controller
+
Reconciliation
```

就是 Operator 的核心思想。

例如：

``` text
Cluster CR
    ↓
Cluster Controller
    ↓
Infrastructure / Control Plane
```

所以可以理解：

> Cluster API 是把 Operator 模式应用到了 Kubernetes 集群生命周期领域。

------------------------------------------------------------------------

# 39. Cluster API与kubeadm关系（★★★★★）

kubeadm：

> 负责 Kubernetes 节点初始化、Control Plane 初始化和节点加入等 Bootstrap
> 工作。

Cluster API：

> 负责更高层的声明式集群生命周期管理。

关系：

``` text
Cluster API
     ↓
Kubeadm Bootstrap Provider
     ↓
kubeadm
     ↓
Initialize / Join Node
```

所以：

``` text
CAPI ≠ kubeadm
```

而可以组合：

``` text
CAPI + kubeadm
```

------------------------------------------------------------------------

# 40. Cluster API安全体系（★★★★★）

Cluster API Management Cluster 权限非常高。

因为它可能控制：

``` text
Cloud Credentials
VM Creation
Network
Load Balancer
Kubernetes Cluster
```

因此需要：

``` text
Strong Authentication
Least Privilege
RBAC
Secret Encryption
Audit
Network Isolation
Supply Chain Security
```

Management Cluster 被攻破可能影响多个 Workload Cluster。

------------------------------------------------------------------------

# 41. Cluster API RBAC与凭证管理（★★★★★）

Provider 通常需要基础设施凭证。

例如：

``` text
Cloud API Credential
```

不应：

``` text
硬编码到Git
```

应采用：

``` text
Secret Manager
External Secrets
Short-lived Credentials
Workload Identity
```

并限制：

``` text
Provider Controller
```

只能访问必要权限。

原则：

``` text
Management Cluster Credential
≠
Unlimited Cloud Admin
```

------------------------------------------------------------------------

# 42. Cluster API高可用（★★★★★）

Management Cluster 应考虑：

``` text
Multi Control Plane
etcd Backup
Multiple Controller Replicas
Provider Availability
Persistent State Protection
```

同时 Workload Cluster：

``` text
Control Plane
```

也应根据生产要求部署高可用拓扑。

需要区分：

``` text
Management Plane HA

和

Workload Cluster HA
```

两者都重要。

------------------------------------------------------------------------

# 43. Cluster API可观测性（★★★★★）

需要监控：

``` text
Cluster Status
Machine Status
Control Plane Status
Controller Errors
Reconcile Duration
Provider Errors
Infrastructure Provisioning
```

典型链路：

``` text
Cluster
 ↓
MachineDeployment
 ↓
MachineSet
 ↓
Machine
 ↓
Infrastructure Resource
```

排查时要沿资源所有权关系逐层定位。

------------------------------------------------------------------------

# 44. Cluster API备份与灾难恢复（★★★★★）

Management Cluster 保存：

``` text
Cluster API Objects
Provider Objects
Secrets
Desired State
```

因此需要：

``` text
etcd Backup

Resource Backup

Secret Backup

Provider Credential Recovery
```

如果使用 GitOps：

``` text
Git
```

可以恢复大量 Desired State；

但：

``` text
Git ≠ 完整Management Cluster Backup
```

因为仍可能存在：

``` text
Secrets
Runtime State
Provider State
```

需要额外保护。

------------------------------------------------------------------------

# 45. Cluster API版本兼容性（★★★★★）

Cluster API 生态包含：

``` text
CAPI Core

Infrastructure Provider

Bootstrap Provider

Control Plane Provider
```

升级时必须检查：

``` text
Provider Compatibility

Contract Version

Kubernetes Version

CRD Version

API Deprecation
```

不要：

``` text
只升级Core
```

却忽略 Provider 兼容性。

clusterctl 提供 Provider 升级规划和应用相关命令，可用于辅助管理
Management Cluster 中的 CAPI Provider 生命周期。

------------------------------------------------------------------------

# 46. Cluster API常见问题与排查

## Cluster一直Provisioning

检查：

``` text
kubectl describe cluster

Infrastructure Cluster

Control Plane Resource

Controller Logs
```

------------------------------------------------------------------------

## Machine一直Pending

检查：

``` text
Infrastructure Machine

Bootstrap Secret

Cloud Credential

Quota

Network
```

------------------------------------------------------------------------

## Machine创建了但Node没有加入

检查：

``` text
Bootstrap Data

kubeadm

Network

API Server Reachability

Certificate

Cloud-init
```

------------------------------------------------------------------------

## MachineHealthCheck反复替换Machine

检查：

``` text
Health Condition

Timeout

Node Problem

CNI

Infrastructure Stability
```

------------------------------------------------------------------------

## Cluster删除卡住

检查：

``` text
Finalizer

Child Resources

Infrastructure Provider

Cloud Resource Cleanup
```

------------------------------------------------------------------------

## clusterctl升级失败

检查：

``` text
Provider Compatibility

Contract Version

CRD

Provider Repository

Management Cluster State
```

------------------------------------------------------------------------

# 47. 企业集群生命周期管理体系（★★★★★）

企业可以建立：

``` text
Git
 ↓
Cluster Definition
 ↓
GitOps
 ↓
Management Cluster
 ↓
Cluster API
 ↓
Cluster Fleet
```

再配合：

``` text
ClusterClass
Policy
Security
Observability
Backup
FinOps
```

形成：

``` text
Enterprise Kubernetes Platform
```

最终用户不再：

``` text
手工申请VM并安装Kubernetes
```

而是提交：

``` text
Cluster Request
```

平台自动完成生命周期。

------------------------------------------------------------------------

# 48. Cluster API生产最佳实践

1.  不要直接在生产环境无规划引入 CAPI；
2.  先建立标准 Cluster Blueprint；
3.  Management Cluster 与业务工作负载合理隔离；
4.  Management Cluster 必须高可用；
5.  使用 Git 管理 Cluster Desired State；
6.  Cluster 变更通过 Pull Request；
7.  使用 ClusterClass 减少模板复制；
8.  使用 Variables 表达集群差异；
9.  避免大量不可维护的 Patch；
10. 明确 Infrastructure Provider 版本；
11. 明确 Bootstrap Provider 版本；
12. 明确 Control Plane Provider 版本；
13. 建立 Provider Compatibility Matrix；
14. Worker 优先使用 MachineDeployment 管理；
15. 合理配置 MachineHealthCheck；
16. 自动修复设置健康阈值；
17. 避免大规模故障时无限自动替换；
18. Cluster 升级采用渐进式策略；
19. 先 Dev/Test 再 Production；
20. Control Plane 升级关注 etcd 与 Quorum；
21. Provider Credential 遵循最小权限；
22. 不将长期 Cloud Admin Credential 明文提交 Git；
23. 对 Management Cluster 启用审计；
24. 备份 Management Cluster 状态；
25. GitOps 不能替代完整备份；
26. 定期演练 Management Cluster 恢复；
27. 监控 Reconcile Errors；
28. 监控 Machine Provisioning Duration；
29. 监控 Cluster Ready 状态；
30. 删除 Cluster 后检查云资源是否完全释放；
31. 对 ClusterClass 变更进行测试；
32. 避免未经验证的模板同时影响大量 Cluster；
33. 大规模环境采用 Fleet 分批变更；
34. 为集群创建、升级和删除建立审批策略；
35. 把 CAPI 视为企业基础设施控制平面，而不是普通业务应用。

------------------------------------------------------------------------

# 49. 系统架构设计师考点

## 什么是Cluster API？

> Cluster API 是使用 Kubernetes 声明式 API 和 Controller 模式管理
> Kubernetes 集群创建、扩缩容、升级、修复和删除生命周期的项目。

## Management Cluster是什么？

> Management Cluster 是运行 Cluster API Core 和各类 Provider
> Controller、负责管理其他 Kubernetes 集群的管理集群。

## Workload Cluster是什么？

> Workload Cluster 是由 Management Cluster 中的 Cluster API
> 管理、主要用于运行实际业务工作负载的 Kubernetes 集群。

## Machine是什么？

> Machine 是 Cluster API 对承载 Kubernetes Node
> 的基础设施机器的声明式抽象。

## MachineDeployment作用是什么？

> MachineDeployment 管理 Worker Machine
> 的声明式副本、扩缩容和滚动更新，其关系类似 Kubernetes Deployment 管理
> ReplicaSet 和 Pod。

## MachineHealthCheck是什么？

> MachineHealthCheck 根据配置的健康条件判断 Machine 对应 Node
> 是否异常，并触发修复机制。

## ClusterClass是什么？

> ClusterClass 是用于定义可复用 Kubernetes Cluster
> 拓扑和模板的资源，可用于标准化大规模集群创建和生命周期管理。

## Cluster API与Terraform区别？

> Terraform 是通用 Infrastructure as Code 工具；Cluster API 重点使用
> Kubernetes API 和持续 Reconciliation 模式管理 Kubernetes Cluster
> 生命周期，两者可以组合使用。

## Cluster API与kubeadm区别？

> kubeadm 主要负责 Kubernetes 节点 Bootstrap、Control Plane
> 初始化和节点加入；Cluster API
> 位于更高层，负责整个集群的声明式生命周期管理。

------------------------------------------------------------------------

# 50. Mermaid Cluster API架构图

``` mermaid
flowchart TD

USER[User / Platform API] --> GIT[Git Desired State]
GIT --> GITOPS[GitOps Controller]

GITOPS --> MGMT[Management Cluster]

MGMT --> CAPI[Cluster API Core Controllers]
MGMT --> INFRA[Infrastructure Provider]
MGMT --> BOOT[Bootstrap Provider]
MGMT --> CP[Control Plane Provider]

CAPI --> CLUSTER[Cluster Resource]

CLUSTER --> CONTROL[Control Plane]
CLUSTER --> MD[MachineDeployment]

MD --> MS[MachineSet]
MS --> M1[Machine]
MS --> M2[Machine]

MHC[MachineHealthCheck] --> M1
MHC --> M2

INFRA --> CLOUD[Cloud / VM / Bare Metal]
BOOT --> BOOTDATA[Bootstrap Data]
CP --> CONTROL

M1 --> CLOUD
M2 --> CLOUD

CLOUD --> WC[Workload Kubernetes Cluster]
CONTROL --> WC
BOOTDATA --> WC

CLASS[ClusterClass] --> CLUSTER
```

------------------------------------------------------------------------

# 51. 本节小结

Cluster API 核心知识：

1.  Cluster API 简称 CAPI；
2.  CAPI 使用 Kubernetes API 管理 Kubernetes Cluster；
3.  核心思想是 Kubernetes manages Kubernetes；
4.  Management Cluster 运行 CAPI Controller；
5.  Workload Cluster 承载业务工作负载；
6.  Cluster 表示 Kubernetes 集群；
7.  Machine 表示承载 Node 的机器；
8.  MachineSet 管理一组 Machine；
9.  MachineDeployment 管理 Worker Machine 的滚动更新和扩缩容；
10. MachineHealthCheck 负责 Machine 健康检查与修复触发；
11. Control Plane Provider 管理控制面生命周期；
12. Infrastructure Provider 管理 VM、网络等基础设施；
13. Bootstrap Provider 生成节点初始化配置；
14. Provider Model 让 CAPI 可以适配不同基础设施；
15. clusterctl 用于初始化、生成模板、查看、迁移和升级 CAPI；
16. Workload Cluster 可以通过声明式资源创建；
17. Machine 生命周期由 Controller 持续 Reconcile；
18. Worker 可以通过 MachineDeployment 声明式扩缩容；
19. Control Plane 也可以声明式扩缩容；
20. CAPI 可以驱动 Kubernetes Cluster 滚动升级；
21. Cluster 删除时 Provider 应负责基础设施清理；
22. ClusterClass 用于定义可复用集群蓝图；
23. Managed Topology 让 Cluster 成为统一拓扑控制入口；
24. Variables 和 Patches 用于表达集群差异；
25. CAPI 可以用于多环境和多云集群生命周期管理；
26. CAPI 与 GitOps 组合可以实现 Cluster as Code；
27. Terraform 与 CAPI 关注层次不同，可以组合；
28. CAPI 大量采用 CRD + Controller + Reconciliation 的 Operator
    Pattern；
29. kubeadm 可以作为 CAPI Bootstrap 实现的一部分；
30. Management Cluster 属于高价值基础设施控制平面；
31. Provider Credential 必须遵循最小权限；
32. Management Cluster 需要高可用和灾难恢复；
33. CAPI 升级必须检查 Core 与 Provider 兼容性；
34. 企业最终可以使用 ClusterClass + GitOps + CAPI 管理大规模 Kubernetes
    Fleet。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Cluster API 的本质是"把 Kubernetes Cluster 本身也变成 Kubernetes
> 资源"：Cluster 描述集群，Machine 描述节点机器，MachineDeployment 管理
> Worker，MachineHealthCheck 负责自愈，Infrastructure/Bootstrap/Control
> Plane Provider 负责具体实现，再通过 ClusterClass + GitOps
> 把创建、扩容、升级、修复和删除统一成声明式、可持续 Reconcile
> 的企业集群生命周期管理体系。
