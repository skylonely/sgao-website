# 44 Kubernetes Operator 模式与自定义控制器开发

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes Operator 模式与自定义控制器开发，重点掌握
> CRD、CR、Controller、Reconciliation、Spec/Status、Finalizer、OwnerReference、Informer、WorkQueue、Webhook、RBAC、Leader
> Election，以及 Operator 与 Helm、GitOps 的关系。

------------------------------------------------------------------------

# 目录

1.  Operator概述
2.  为什么需要Operator
3.  Kubernetes控制器模式回顾
4.  Operator核心设计思想
5.  CRD自定义资源定义
6.  CR自定义资源
7.  Custom Controller自定义控制器
8.  Operator整体工作原理
9.  Desired State与Actual State
10. Reconciliation调谐循环
11. Watch事件监听机制
12. Informer与本地缓存
13. WorkQueue工作队列
14. Controller处理流程
15. Spec与Status状态模型
16. Finalizer资源删除控制
17. OwnerReference资源所有权
18. Operator管理子资源
19. Operator生命周期管理
20. Operator安装与升级
21. Operator故障恢复
22. Operator与有状态应用
23. 数据库Operator案例
24. Operator SDK开发框架
25. Kubebuilder开发框架
26. Operator开发基本流程
27. CRD API版本设计
28. Validation与Defaulting
29. Admission Webhook
30. Operator权限与RBAC
31. Operator高可用与Leader Election
32. Operator可观测性
33. Operator与Helm区别
34. Operator与GitOps结合
35. Operator适用与不适用场景
36. 企业Operator设计规范
37. Operator常见问题与排查
38. Operator生产最佳实践
39. 系统架构设计师考点
40. Mermaid Operator调谐架构图
41. 本节小结

------------------------------------------------------------------------

# 1. Operator概述（★★★★★）

Operator 是 Kubernetes 中非常重要的扩展模式。

可以把它理解为：

> 将某一类应用或基础设施的专业运维知识编码到 Kubernetes Controller
> 中，让系统能够按照声明式方式自动完成部署、扩缩容、升级、故障恢复等操作。

核心关系：

``` text
CRD
 +
Custom Resource
 +
Custom Controller
 +
Domain Knowledge
 ↓
Operator
```

例如 Kubernetes 原生认识：

``` text
Pod
Deployment
Service
StatefulSet
```

但它并不知道一个数据库集群应该如何：

``` text
初始化
主从配置
扩容
备份
恢复
故障切换
版本升级
```

Operator 可以把这些知识自动化。

------------------------------------------------------------------------

# 2. 为什么需要Operator（★★★★★）

对于普通无状态应用：

``` text
Deployment + Service
```

通常已经可以满足大量场景。

但复杂系统可能需要：

``` text
创建集群
初始化配置
检测主节点
添加副本
数据迁移
备份
恢复
故障切换
滚动升级
```

如果完全依赖人工：

``` text
发现问题
  ↓
工程师判断
  ↓
执行操作
  ↓
检查结果
```

Operator 将其转换为：

``` text
Observe
  ↓
Compare
  ↓
Act
  ↓
Reconcile
  ↺
```

因此 Operator 的核心价值是：

> 自动化复杂应用的长期生命周期管理，而不仅仅是完成第一次安装。

------------------------------------------------------------------------

# 3. Kubernetes控制器模式回顾（★★★★★）

Kubernetes 本身就是一个由大量 Controller 驱动的系统。

例如 Deployment：

``` text
Deployment
    ↓
Deployment Controller
    ↓
ReplicaSet
    ↓
Pod
```

用户声明：

``` yaml
spec:
  replicas: 3
```

如果实际只有：

``` text
2 Pods
```

Controller 会发现：

``` text
Desired = 3
Actual  = 2
```

然后：

``` text
创建1个Pod
```

直到：

``` text
Desired State
=
Actual State
```

Operator 正是对这一模式的扩展。

------------------------------------------------------------------------

# 4. Operator核心设计思想（★★★★★）

Operator 的核心不是：

``` text
执行一次脚本
```

而是：

``` text
持续调谐
```

即：

``` text
Desired State

↓

Controller

↓

Actual State

↓

Compare

↓

Correct

↓

Repeat
```

因此 Operator 应尽量具备：

``` text
幂等性
可重复执行
故障恢复能力
最终一致性
```

------------------------------------------------------------------------

# 5. CRD自定义资源定义（★★★★★）

CRD：

> CustomResourceDefinition，自定义资源定义。

它允许用户扩展 Kubernetes API。

例如定义：

``` text
MySQLCluster
```

安装 CRD 后，可以像使用 Deployment 一样：

``` bash
kubectl get mysqlclusters
```

概念：

``` text
Kubernetes Built-in API

Pod
Deployment
Service

+

Custom API

MySQLCluster
RedisCluster
Backup
```

------------------------------------------------------------------------

# 6. CR自定义资源（★★★★★）

CR：

> Custom Resource，自定义资源。

CRD 定义"资源类型"，CR 是该类型的具体实例。

关系：

``` text
CRD

↓

定义 MySQLCluster


CR

↓

production-db
```

例如：

``` yaml
apiVersion: database.example.com/v1
kind: MySQLCluster
metadata:
  name: production-db

spec:
  replicas: 3
  version: "8.4"
  storage: 100Gi
```

这里表达的是：

``` text
用户期望一个
3副本
8.4版本
100Gi存储
的MySQL集群
```

------------------------------------------------------------------------

# 7. Custom Controller自定义控制器（★★★★★）

只有 CRD 还不够。

CRD 主要解决：

``` text
Kubernetes能够存储和识别这种资源
```

真正实现自动化的是：

``` text
Custom Controller
```

例如：

``` text
MySQLCluster CR

↓

MySQL Controller

↓

StatefulSet
Service
PVC
Secret
ConfigMap
```

因此：

> CRD定义API，Controller实现行为。

------------------------------------------------------------------------

# 8. Operator整体工作原理（★★★★★）

典型流程：

``` text
User
  ↓
kubectl apply
  ↓
Custom Resource
  ↓
Kubernetes API Server
  ↓
Operator Controller
  ↓
Reconcile
  ↓
Create / Update / Delete
  ↓
Kubernetes Resources
```

然后 Controller 持续观察：

``` text
CR变化

子资源变化

外部系统变化
```

并再次进入 Reconcile。

------------------------------------------------------------------------

# 9. Desired State与Actual State（★★★★★）

Kubernetes 声明式模型最核心的两个状态：

``` text
Desired State
```

用户希望系统是什么状态。

例如：

``` text
replicas = 3
```

实际状态：

``` text
Actual State
```

例如：

``` text
running replicas = 2
```

Controller：

``` text
Desired 3
Actual  2

↓

Create 1
```

最终：

``` text
Desired 3
Actual  3
```

------------------------------------------------------------------------

# 10. Reconciliation调谐循环（★★★★★）

Reconciliation 是 Operator 最核心的概念。

典型逻辑：

``` text
读取CR

↓

读取当前资源状态

↓

计算期望状态

↓

比较差异

↓

执行Create / Update / Delete

↓

更新Status

↓

等待下一次Reconcile
```

伪代码：

``` text
reconcile(request):

    cr = getCustomResource()

    actual = getCurrentState()

    desired = calculateDesiredState(cr.spec)

    if actual != desired:
        updateResources()

    updateStatus()
```

核心要求：

> Reconcile 应尽量设计为幂等操作。

------------------------------------------------------------------------

# 11. Watch事件监听机制（★★★★☆）

Controller 需要知道：

``` text
资源什么时候发生变化？
```

Kubernetes API 支持 Watch 机制。

例如：

``` text
MySQLCluster Created

↓

Event

↓

Controller

↓

Reconcile
```

不仅可以 Watch CR，也可以观察：

``` text
StatefulSet
Pod
PVC
Secret
```

这样子资源发生变化时，也能触发调谐。

------------------------------------------------------------------------

# 12. Informer与本地缓存（★★★★☆）

如果 Controller 每次都直接大量查询 API Server：

``` text
Controller

↓

API Server

↓

Controller

↓

API Server
```

会增加 API Server 压力。

Informer 模型通过：

``` text
List + Watch
```

维护本地 Cache。

概念：

``` text
API Server

↓

Informer

↓

Local Cache

↓

Controller
```

Controller 可以优先从缓存读取对象。

优点：

``` text
降低API Server压力

提高读取效率

事件驱动
```

------------------------------------------------------------------------

# 13. WorkQueue工作队列（★★★★☆）

资源事件通常不会直接执行复杂业务逻辑。

常见 Controller 模型：

``` text
Informer

↓

Event Handler

↓

WorkQueue

↓

Worker

↓

Reconcile
```

WorkQueue 可以帮助：

``` text
削峰
重试
去重
异步处理
```

发生错误时：

``` text
Reconcile Failed

↓

Requeue

↓

Retry Later
```

------------------------------------------------------------------------

# 14. Controller处理流程（★★★★★）

完整 Controller 流程：

``` text
API Server
    ↓
List / Watch
    ↓
Informer
    ↓
Cache
    ↓
Event
    ↓
WorkQueue
    ↓
Worker
    ↓
Reconcile
    ↓
Kubernetes API
```

需要记住：

> Watch负责感知变化，Queue负责调度处理，Reconcile负责实现状态收敛。

------------------------------------------------------------------------

# 15. Spec与Status状态模型（★★★★★）

Custom Resource通常包含：

``` text
spec
status
```

## Spec

表示：

> 用户期望状态。

例如：

``` yaml
spec:
  replicas: 3
  version: "8.4"
```

## Status

表示：

> Controller观察到的当前状态。

例如：

``` yaml
status:
  readyReplicas: 3
  phase: Running
```

关系：

``` text
Spec
 ↓
Desired State

Status
 ↓
Observed State
```

这是设计 CRD 时非常重要的原则。

------------------------------------------------------------------------

# 16. Finalizer资源删除控制（★★★★★）

用户删除 CR 时，有时不能立即真正删除。

例如数据库删除前需要：

``` text
创建最终备份
删除外部云资源
清理DNS
释放存储
```

Finalizer 可以让 Controller 在对象真正消失前执行清理。

流程：

``` text
kubectl delete CR

↓

deletionTimestamp设置

↓

Finalizer仍存在

↓

Operator执行Cleanup

↓

移除Finalizer

↓

对象真正删除
```

注意：

> Finalizer逻辑必须可靠，否则资源可能长期停留在Terminating状态。

------------------------------------------------------------------------

# 17. OwnerReference资源所有权（★★★★★）

Operator 创建的子资源可以设置 OwnerReference。

例如：

``` text
MySQLCluster
     │
     ├── StatefulSet
     ├── Service
     └── ConfigMap
```

OwnerReference表达：

``` text
这些资源属于哪个父资源
```

这样 Kubernetes Garbage Collector 可以在合适条件下：

``` text
删除Owner

↓

级联清理Dependent Resources
```

------------------------------------------------------------------------

# 18. Operator管理子资源

一个复杂 Operator 可能管理：

``` text
StatefulSet
Service
PVC
ConfigMap
Secret
ServiceAccount
PodDisruptionBudget
NetworkPolicy
```

例如：

``` text
Database CR

↓

Operator

├── StatefulSet
├── Headless Service
├── PVC
├── Secret
└── Backup Job
```

Operator 应避免：

``` text
用户修改子资源

与

Operator持续覆盖子资源
```

造成职责不清。

需要明确：

> 哪些字段由Operator拥有，哪些字段允许用户配置。

------------------------------------------------------------------------

# 19. Operator生命周期管理

Operator 管理的不只是安装。

完整生命周期可能包括：

``` text
Provision

↓

Configure

↓

Scale

↓

Upgrade

↓

Backup

↓

Restore

↓

Failover

↓

Delete
```

这正是 Operator 与简单模板工具的重要区别。

------------------------------------------------------------------------

# 20. Operator安装与升级

Operator 本身也是 Kubernetes 应用。

通常包含：

``` text
CRD

Deployment

ServiceAccount

Role / ClusterRole

RoleBinding / ClusterRoleBinding
```

升级时需要考虑：

``` text
Operator Version

CRD Version

Existing CR

Managed Application Version
```

因此 Operator 升级可能比普通 Deployment 更复杂。

------------------------------------------------------------------------

# 21. Operator故障恢复（★★★★★）

Operator 自身崩溃后：

``` text
已有业务Pod
```

通常不会因为 Controller 暂时停止就立即消失。

Operator 恢复后：

``` text
重新读取CR

↓

读取Actual State

↓

重新Reconcile
```

因此良好的 Operator 应避免依赖：

``` text
仅存在于Controller内存中的关键状态
```

而应尽量通过：

``` text
Kubernetes API

CR Status

External Durable State
```

恢复控制上下文。

------------------------------------------------------------------------

# 22. Operator与有状态应用（★★★★★）

Operator特别适合：

``` text
Database

Message Queue

Distributed Storage

Search Cluster
```

因为这些应用通常具有：

``` text
节点角色

成员关系

数据复制

主从切换

备份恢复

升级顺序
```

普通 StatefulSet 只能解决其中一部分：

``` text
稳定Pod名称

稳定存储

有序部署
```

但不知道数据库业务语义。

Operator 可以加入：

> Domain Knowledge。

------------------------------------------------------------------------

# 23. 数据库Operator案例（★★★★★）

假设：

``` yaml
apiVersion: database.example.com/v1
kind: DatabaseCluster
metadata:
  name: orders-db

spec:
  replicas: 3
  version: "16"
  storage: 200Gi
```

Operator：

``` text
DatabaseCluster

↓

Reconcile

↓

Create StatefulSet

↓

Create Service

↓

Create PVC

↓

Initialize Cluster

↓

Configure Replication
```

运行过程中：

``` text
Primary Failure

↓

Operator Detect

↓

Select Replica

↓

Promote

↓

Update Cluster Status
```

备份：

``` text
Backup Policy

↓

Operator

↓

Backup Job / External Backup API
```

因此：

> Operator将数据库管理员的一部分重复运维流程编码成自动控制逻辑。

------------------------------------------------------------------------

# 24. Operator SDK开发框架（★★★★☆）

Operator SDK 是用于开发 Kubernetes Operator 的工具体系之一。

可以帮助开发者处理：

``` text
Project Scaffolding

API

Controller

RBAC

Build

Deployment
```

开发者重点实现：

``` text
Custom Resource Model

+

Reconcile Logic
```

而不必从零构建整个 Controller 基础框架。

------------------------------------------------------------------------

# 25. Kubebuilder开发框架（★★★★☆）

Kubebuilder 是构建 Kubernetes API 和 Controller 的常见开发框架。

典型开发流程：

``` text
Create Project

↓

Create API

↓

Generate CRD

↓

Implement Reconcile

↓

Generate Manifests

↓

Build Controller

↓

Deploy
```

其核心理念仍然是：

``` text
Kubernetes API Extension

+

Controller Pattern
```

------------------------------------------------------------------------

# 26. Operator开发基本流程（★★★★★）

可以概括为：

``` text
1. 定义业务领域模型

↓

2. 设计CRD

↓

3. 定义Spec / Status

↓

4. 生成API代码

↓

5. 编写Reconcile

↓

6. 创建/更新子资源

↓

7. 更新Status

↓

8. 增加RBAC

↓

9. 测试

↓

10. 构建Controller Image

↓

11. 部署Operator
```

最难的通常不是：

``` text
生成CRD
```

而是：

> 如何正确设计长期可重复执行的 Reconcile 逻辑。

------------------------------------------------------------------------

# 27. CRD API版本设计（★★★★★）

CRD本质上是API。

因此必须像设计正式API一样考虑：

``` text
Compatibility

Versioning

Validation

Migration
```

例如：

``` text
v1alpha1

↓

v1beta1

↓

v1
```

不要轻易：

``` text
删除字段

修改字段含义

改变默认行为
```

否则已有 CR 可能无法平滑升级。

------------------------------------------------------------------------

# 28. Validation与Defaulting（★★★★☆）

CRD应尽可能限制非法配置。

例如：

``` text
replicas >= 1
```

而不是允许：

``` text
replicas = -10
```

Validation：

> 判断输入是否合法。

Defaulting：

> 用户未提供字段时设置合理默认值。

例如：

``` text
spec.replicas未指定

↓

default = 3
```

良好的API设计可以减少 Controller 中大量异常分支。

------------------------------------------------------------------------

# 29. Admission Webhook（★★★★☆）

Webhook可以在API请求进入持久化流程时进行扩展处理。

常见：

``` text
Validating Webhook

Mutating Webhook
```

## Validating

``` text
Request

↓

是否合法？

↓

Allow / Reject
```

## Mutating

``` text
Request

↓

自动修改 / 补充字段

↓

Persist
```

Webhook适合复杂Validation和Defaulting场景，但也会增加：

``` text
系统依赖

证书管理

可用性要求

故障排查复杂度
```

------------------------------------------------------------------------

# 30. Operator权限与RBAC（★★★★★）

Operator需要访问 Kubernetes API。

例如：

``` text
get
list
watch
create
update
patch
delete
```

但不要简单给予：

``` text
cluster-admin
```

应遵循：

> Least Privilege，最小权限原则。

例如数据库 Operator 只需要管理：

``` text
DatabaseCluster
StatefulSet
Service
PVC
Secret
```

就不应无理由拥有整个集群的所有权限。

------------------------------------------------------------------------

# 31. Operator高可用与Leader Election（★★★★★）

为了高可用，可以运行：

``` text
Operator Replica A
Operator Replica B
Operator Replica C
```

但如果三个实例同时修改同一资源：

``` text
可能产生冲突
```

常见解决：

``` text
Leader Election
```

结构：

``` text
Operator A → Leader

Operator B → Standby

Operator C → Standby
```

Leader故障：

``` text
↓

重新选举

↓

Operator B成为Leader
```

从而提高 Controller 可用性。

------------------------------------------------------------------------

# 32. Operator可观测性（★★★★★）

Operator也必须被监控。

建议关注：

``` text
Reconcile Count

Reconcile Duration

Reconcile Error

Queue Length

Managed Resource Count
```

日志应记录：

``` text
Resource Name

Namespace

Reconcile Result

Error
```

还应暴露：

``` text
CR Status

Conditions
```

例如：

``` text
Ready=True

BackupReady=True

Degraded=False
```

这样用户无需阅读Controller源码就能理解资源状态。

------------------------------------------------------------------------

# 33. Operator与Helm区别（★★★★★）

这是非常重要的区别。

## Helm

核心：

``` text
Chart

+

Values

↓

Render

↓

Install / Upgrade
```

更适合：

``` text
应用打包
配置模板化
安装
升级
Release管理
```

## Operator

核心：

``` text
Custom Resource

↓

Controller

↓

Continuous Reconciliation
```

更适合：

``` text
持续运营
故障恢复
扩缩容
备份
升级编排
领域自动化
```

记忆：

> Helm更擅长"安装应用"，Operator更擅长"长期运营应用"。

二者也可以组合：

``` text
Helm

↓

安装Operator


Operator

↓

管理业务系统
```

------------------------------------------------------------------------

# 34. Operator与GitOps结合（★★★★★）

Operator CR 本身就是声明式 Kubernetes 资源。

因此可以存储到 Git：

``` text
Git

↓

DatabaseCluster.yaml

↓

GitOps Controller

↓

Kubernetes API

↓

Operator

↓

Database Resources
```

这里形成两层调谐：

``` text
GitOps Controller

↓

保证Git中的CR存在于Cluster


Operator

↓

保证CR描述的业务系统达到期望状态
```

非常重要：

``` text
Git Desired State

↓

CR

↓

Operator Desired State

↓

Managed Resources
```

------------------------------------------------------------------------

# 35. Operator适用与不适用场景（★★★★★）

## 适合

``` text
复杂有状态应用

长期生命周期管理

自动故障恢复

复杂扩缩容

备份恢复

有顺序的升级

大量重复运维操作
```

例如：

``` text
Database
Kafka
Storage
Search Cluster
```

## 不一定适合

``` text
简单无状态Web应用

只需要Deployment + Service

没有复杂生命周期

团队没有Controller开发维护能力
```

核心：

> 不要把Operator当成所有应用的默认部署方式。

------------------------------------------------------------------------

# 36. 企业Operator设计规范

建议统一：

``` text
API Group

Kind Naming

Spec Design

Status Conditions

Labels

Annotations

Finalizer

RBAC

Metrics

Logging

Upgrade Policy
```

尤其要保证：

``` text
Spec清晰

Status可观察

Reconcile幂等

错误可重试

升级兼容

删除安全
```

企业级 Operator 应被视为：

> 长期维护的平台软件，而不是一次性自动化脚本。

------------------------------------------------------------------------

# 37. Operator常见问题与排查

## CR创建后没有资源产生

检查：

``` text
Operator Pod是否Running？

CRD是否安装？

RBAC是否正确？

Controller是否Watch正确Namespace？

Controller Logs是否报错？
```

------------------------------------------------------------------------

## Reconcile不断失败

检查：

``` text
日志

Event

外部依赖

权限

字段配置

子资源状态
```

------------------------------------------------------------------------

## CR无法删除

重点检查：

``` text
metadata.finalizers
```

可能是：

``` text
Cleanup失败

↓

Finalizer无法移除

↓

资源一直Terminating
```

------------------------------------------------------------------------

## Operator不断覆盖人工修改

说明：

``` text
人工修改的字段

与

Operator Desired State
```

存在冲突。

解决方向：

> 明确字段所有权，不要绕过Operator修改其受管资源。

------------------------------------------------------------------------

## Operator升级后旧CR异常

检查：

``` text
CRD Version

Conversion

Defaulting

Deprecated Fields

Controller Compatibility
```

------------------------------------------------------------------------

# 38. Operator生产最佳实践

1.  先判断问题是否真的需要Operator；
2.  CRD按正式API设计；
3.  Spec只描述期望状态；
4.  Status真实反映观察状态；
5.  Reconcile必须尽量幂等；
6.  不依赖单次事件保证最终状态；
7.  使用Watch触发调谐，但不要把事件当作唯一事实来源；
8.  关键状态存储在持久化系统中；
9.  合理使用OwnerReference；
10. 删除外部资源时使用Finalizer；
11. Finalizer必须考虑失败恢复；
12. RBAC遵循最小权限；
13. 为Operator启用Leader Election；
14. 提供Metrics、Logs和Status Conditions；
15. 对API升级保持向后兼容；
16. 对Webhook进行高可用设计；
17. 避免Reconcile中执行无限长阻塞任务；
18. 外部API调用需要Timeout和Retry；
19. 对错误使用合理Requeue策略；
20. 为Operator编写单元测试和集成测试；
21. 测试Operator自身升级；
22. 测试CRD版本迁移；
23. 测试备份与恢复；
24. 生产变更纳入GitOps；
25. 明确Operator与人工运维的职责边界。

------------------------------------------------------------------------

# 39. 系统架构设计师考点

## 什么是Operator？

答：

> Operator是Kubernetes控制器模式的扩展，通过CRD定义领域资源，通过自定义Controller持续调谐资源状态，将专业运维知识自动化。

------------------------------------------------------------------------

## CRD与CR区别？

答：

> CRD定义一种新的Kubernetes资源类型，CR是该资源类型的具体实例。

------------------------------------------------------------------------

## CRD和Controller是什么关系？

答：

> CRD负责定义和存储自定义资源API，Controller负责观察这些资源并执行实际业务控制逻辑。

------------------------------------------------------------------------

## 什么是Reconciliation？

答：

> Reconciliation是Controller持续比较期望状态与实际状态，并执行操作使实际状态向期望状态收敛的过程。

------------------------------------------------------------------------

## Spec和Status区别？

答：

> Spec表示用户声明的期望状态，Status表示Controller观察到的当前状态。

------------------------------------------------------------------------

## Finalizer有什么作用？

答：

> Finalizer用于阻止资源立即完成删除，使Controller有机会先执行外部资源释放、最终备份等清理操作，完成后再移除Finalizer。

------------------------------------------------------------------------

## OwnerReference有什么作用？

答：

> OwnerReference描述资源之间的所有权关系，可配合Kubernetes垃圾回收机制管理依赖资源生命周期。

------------------------------------------------------------------------

## Operator与Helm区别？

答：

> Helm主要负责应用模板化、打包、安装和升级；Operator通过持续Reconcile实现复杂应用的长期生命周期管理和领域自动化。

------------------------------------------------------------------------

## Operator为什么适合有状态应用？

答：

> 因为数据库、消息队列等系统包含主从关系、成员管理、故障切换、备份恢复和升级顺序等领域知识，Operator可以将这些运维逻辑编码为自动控制过程。

------------------------------------------------------------------------

# 40. Mermaid Operator调谐架构图

``` mermaid
flowchart TD

U[User / GitOps] --> API[Kubernetes API Server]

API --> CR[Custom Resource]
CR --> C[Operator Controller]

C --> R[Reconcile Loop]

R --> D[Read Desired State / Spec]
R --> A[Observe Actual State]

D --> CMP{Desired = Actual?}
A --> CMP

CMP -->|No| ACT[Create / Update / Delete]
ACT --> RES[Managed Resources]

RES --> STS[StatefulSet]
RES --> SVC[Service]
RES --> PVC[PVC]
RES --> SEC[Secret]

ACT --> STATUS[Update CR Status]
STATUS --> API

CMP -->|Yes| WAIT[Wait for Change]
WAIT --> R

API --> INF[Informer / Watch]
INF --> Q[WorkQueue]
Q --> C
```

------------------------------------------------------------------------

# 41. 本节小结

Operator核心知识：

1.  Operator是Kubernetes控制器模式在特定业务领域的扩展；
2.  Operator将专业运维知识编码成自动化控制逻辑；
3.  CRD用于定义新的Kubernetes资源类型；
4.  CR是CRD定义资源类型的具体实例；
5.  Custom Controller负责真正执行控制逻辑；
6.  Desired State表示用户期望，Actual State表示当前实际状态；
7.  Reconciliation持续使实际状态向期望状态收敛；
8.  Reconcile应尽量保持幂等；
9.  Watch用于感知资源变化；
10. Informer通过List/Watch和缓存提高Controller效率；
11. WorkQueue用于异步调度、重试和削峰；
12. Spec描述期望状态，Status描述观察状态；
13. Finalizer用于资源真正删除前执行清理逻辑；
14. OwnerReference用于表达资源所有权并支持级联回收；
15. Operator可以管理StatefulSet、Service、PVC等多个子资源；
16. Operator适合数据库等复杂有状态应用的生命周期管理；
17. Operator SDK和Kubebuilder可用于构建Operator；
18. CRD应像正式API一样进行版本和兼容性设计；
19. Validation、Defaulting和Webhook可以增强API治理；
20. Operator RBAC应遵循最小权限；
21. Leader Election可支持多副本Controller高可用；
22. Operator需要完善的Metrics、Logs和Status Conditions；
23. Helm更偏向应用安装和模板化，Operator更偏向长期自动运营；
24. GitOps与Operator可以形成两层声明式调谐；
25. 简单无状态应用通常没有必要专门开发Operator。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Kubernetes Operator就是"CRD定义领域API + CR声明期望状态 +
> Controller持续Reconcile + Domain
> Knowledge实现自动运维"；Helm更擅长把应用安装进去，而Operator更擅长在应用运行之后持续完成扩缩容、故障恢复、备份、升级等生命周期管理。
