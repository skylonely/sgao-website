# 38 Kubernetes 备份、恢复与灾难恢复

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes 备份、恢复与灾难恢复体系，重点掌握 etcd
> Snapshot、Kubernetes 资源备份、PV 持久化数据保护、Volume
> Snapshot、Velero、RPO、RTO、3-2-1 备份原则，以及企业级灾备架构设计。

------------------------------------------------------------------------

# 目录

1.  Kubernetes备份与灾难恢复概述
2.  为什么Kubernetes需要备份
3.  Kubernetes需要备份哪些数据
4.  Kubernetes备份整体架构
5.  etcd在备份体系中的核心地位
6.  etcd Snapshot快照备份
7.  etcd Snapshot恢复流程
8.  Kubernetes资源对象备份
9.  YAML与GitOps配置备份
10. PersistentVolume持久化数据备份
11. Volume Snapshot存储快照
12. 应用一致性备份
13. Velero备份与恢复机制
14. Velero整体架构
15. Namespace级备份与恢复
16. Cluster级备份与恢复
17. 跨集群迁移与恢复
18. RPO恢复点目标
19. RTO恢复时间目标
20. Backup与High Availability区别
21. Disaster Recovery灾难恢复体系
22. 同城与异地灾备架构
23. 备份策略与生命周期管理
24. 3-2-1备份原则
25. Kubernetes恢复演练
26. 常见备份恢复问题
27. 企业生产环境灾备设计
28. Kubernetes备份恢复最佳实践
29. 系统架构设计师考点
30. Mermaid灾备架构图
31. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes备份与灾难恢复概述（★★★★★）

Kubernetes 可以通过
Deployment、StatefulSet、多副本和控制器提高系统可用性，但：

> 高可用并不等于数据备份，也不等于灾难恢复。

例如数据库运行3个副本：

``` text
Database

├── Replica A
├── Replica B
└── Replica C
```

如果发生：

``` text
管理员误删除业务数据

↓

删除操作同步到所有副本
```

此时多副本无法找回历史数据。

因此仍然需要：

``` text
Backup

+

Recovery

+

Disaster Recovery
```

------------------------------------------------------------------------

# 2. 为什么Kubernetes需要备份

生产环境可能遇到：

-   etcd损坏；
-   集群误操作；
-   Namespace误删除；
-   Deployment配置错误；
-   Secret丢失；
-   PV数据损坏；
-   数据库误删除；
-   Node或存储故障；
-   数据中心故障；
-   勒索或供应链安全事件。

因此备份体系的目标不是：

``` text
永远不发生故障
```

而是：

> 故障发生后，能够在业务要求的时间和数据损失范围内恢复系统。

------------------------------------------------------------------------

# 3. Kubernetes需要备份哪些数据（★★★★★）

可以将数据分为三大类：

``` text
Kubernetes Backup

├── Cluster State
│      └── etcd
│
├── Resource Configuration
│      ├── Deployment
│      ├── Service
│      ├── ConfigMap
│      ├── Secret
│      └── RBAC
│
└── Application Data
       ├── PersistentVolume
       ├── Database
       └── Object / File Data
```

因此：

> 只备份etcd并不等于完整备份整个业务系统。

完整恢复通常还需要考虑：

``` text
集群状态

+

资源定义

+

持久化业务数据

+

外部依赖
```

------------------------------------------------------------------------

# 4. Kubernetes备份整体架构

典型备份架构：

``` text
Production Kubernetes Cluster
            │
     ┌──────┼─────────┐
     ↓      ↓         ↓
   etcd   Resources   PV
     │      │         │
     └──────┼─────────┘
            ↓
      Backup System
            ↓
      Backup Storage
            ↓
        DR Cluster
            ↓
          Restore
```

备份存储通常应与生产故障域隔离。

否则：

``` text
生产存储故障

↓

备份同时丢失
```

就失去了备份意义。

------------------------------------------------------------------------

# 5. etcd在备份体系中的核心地位（★★★★★）

etcd保存Kubernetes控制面的核心状态。

例如：

-   Pod定义；
-   Deployment；
-   StatefulSet；
-   Service；
-   ConfigMap；
-   Secret；
-   RBAC；
-   Namespace；
-   CRD相关对象状态。

结构：

``` text
kube-apiserver

↓

etcd

↓

Cluster State
```

因此：

> etcd是Kubernetes控制面灾难恢复的核心对象之一。

需要注意：

etcd主要保存Kubernetes API对象状态，并不会自动包含PV中真正的业务数据。

------------------------------------------------------------------------

# 6. etcd Snapshot快照备份（★★★★★）

etcd可以通过Snapshot进行备份。

概念流程：

``` text
etcd

↓

Snapshot

↓

snapshot.db

↓

安全备份存储
```

常见操作思路：

``` bash
etcdctl snapshot save snapshot.db
```

然后检查快照状态或完整性。

实际命令参数需要根据：

-   etcd版本；
-   TLS配置；
-   endpoint；
-   Kubernetes部署方式；

进行调整。

生产环境应：

``` text
定时Snapshot

↓

校验

↓

复制到独立备份位置
```

------------------------------------------------------------------------

# 7. etcd Snapshot恢复流程（★★★★★）

etcd恢复不能只理解为"把文件复制回去"。

概念流程：

``` text
Control Plane Failure

↓

停止或隔离相关组件

↓

准备有效Snapshot

↓

恢复etcd数据目录

↓

调整etcd配置

↓

启动etcd

↓

启动/验证Control Plane

↓

检查Cluster State
```

恢复后需要验证：

``` text
Nodes

Pods

Deployments

Services

Secrets

RBAC

CRDs
```

重要原则：

> 备份文件存在不代表一定能够恢复，必须定期进行恢复演练。

------------------------------------------------------------------------

# 8. Kubernetes资源对象备份

除了etcd，也可以对Kubernetes资源定义进行逻辑备份。

例如：

``` text
Deployment

Service

Ingress

ConfigMap

RBAC

CRD
```

逻辑备份优势：

-   可读；
-   易审计；
-   易迁移；
-   便于选择性恢复。

但要注意：

> 简单导出YAML不一定包含所有恢复所需信息，也不等同于完整集群备份。

------------------------------------------------------------------------

# 9. YAML与GitOps配置备份（★★★★★）

推荐将声明式资源配置存储在Git中：

``` text
Git Repository

↓

Deployment YAML

Service YAML

Ingress YAML

ConfigMap Template

NetworkPolicy

RBAC
```

发生故障：

``` text
New Cluster

↓

Git Repository

↓

Reapply

↓

Rebuild Desired State
```

这体现GitOps思想：

> Git保存期望状态，集群根据声明式配置重建资源。

但仍要注意：

``` text
GitOps

≠

业务数据备份
```

Git无法替代数据库和PV数据备份。

------------------------------------------------------------------------

# 10. PersistentVolume持久化数据备份（★★★★★）

Stateful应用的数据通常保存在：

``` text
PVC

↓

PV

↓

Storage Backend
```

例如：

-   MySQL；
-   PostgreSQL；
-   Redis持久化；
-   文件服务。

如果只恢复：

``` text
StatefulSet YAML
```

而没有恢复：

``` text
PV Data
```

应用仍然无法恢复到原有业务状态。

因此：

> Kubernetes资源备份与业务数据备份必须结合。

------------------------------------------------------------------------

# 11. Volume Snapshot存储快照

Kubernetes可以结合CSI能力使用Volume Snapshot。

基本关系：

``` text
PVC

↓

VolumeSnapshot

↓

Storage Snapshot
```

优势：

-   快速创建；
-   恢复速度较快；
-   与存储系统能力结合。

典型资源包括：

``` text
VolumeSnapshot

VolumeSnapshotClass

VolumeSnapshotContent
```

但：

> 是否支持Volume Snapshot取决于具体CSI驱动和存储系统。

------------------------------------------------------------------------

# 12. 应用一致性备份（★★★★★）

存储快照并不天然等于应用一致性备份。

例如数据库正在执行：

``` text
Transaction

↓

Write

↓

Snapshot
```

如果快照时间点不合适，可能得到：

``` text
Crash-Consistent
```

而不是：

``` text
Application-Consistent
```

对于数据库等关键系统，可能需要：

``` text
数据库原生备份

+

日志/WAL/Binlog

+

存储快照
```

根据应用特性设计。

核心：

> 备份不仅要"有数据"，还要确保恢复后的数据可用且一致。

------------------------------------------------------------------------

# 13. Velero备份与恢复机制（★★★★★）

Velero是Kubernetes环境中常见的备份、恢复和迁移工具。

可以用于保护：

``` text
Kubernetes Resources

+

Persistent Data
```

典型用途：

-   Namespace备份；
-   集群资源备份；
-   恢复误删除资源；
-   集群迁移；
-   灾难恢复。

概念流程：

``` text
Kubernetes API

↓

Velero

↓

Resource Backup

+

Volume Backup / Snapshot

↓

Backup Storage
```

------------------------------------------------------------------------

# 14. Velero整体架构

典型结构：

``` text
Kubernetes Cluster

↓

Velero Server

├── Kubernetes Resources
│
└── Volume Data / Snapshot

↓

Object Storage / Snapshot Backend
```

恢复：

``` text
Backup Storage

↓

Velero Restore

↓

Kubernetes Resources

+

Persistent Data
```

实际能力取决于：

-   Velero版本；
-   云平台；
-   CSI；
-   存储插件；
-   对象存储。

------------------------------------------------------------------------

# 15. Namespace级备份与恢复

很多业务按Namespace隔离：

``` text
Cluster

├── team-a
├── team-b
└── production
```

因此可以：

``` text
Backup

↓

Namespace: production
```

当production被误删除：

``` text
Restore

↓

Resources

+

Persistent Data
```

这种方式适合：

-   项目级恢复；
-   环境恢复；
-   单业务迁移。

------------------------------------------------------------------------

# 16. Cluster级备份与恢复

集群级灾难恢复需要考虑更多内容：

``` text
Cluster State

Namespaces

CRDs

RBAC

Storage

Secrets

Applications

Networking
```

还可能涉及：

``` text
DNS

Load Balancer

Certificate

External Database

Object Storage

External Secrets
```

因此：

> Kubernetes集群恢复不应只关注Kubernetes内部对象，还必须考虑外部依赖。

------------------------------------------------------------------------

# 17. 跨集群迁移与恢复

备份系统也可以用于：

``` text
Cluster A

↓

Backup

↓

Backup Storage

↓

Cluster B

↓

Restore
```

典型场景：

-   集群升级；
-   云平台迁移；
-   Region迁移；
-   灾备切换。

需要检查：

``` text
StorageClass是否一致？

Ingress是否一致？

LoadBalancer实现是否一致？

Secret和证书是否可用？

外部依赖地址是否变化？
```

因此跨集群恢复通常需要：

> 环境适配。

------------------------------------------------------------------------

# 18. RPO恢复点目标（★★★★★）

RPO：

> Recovery Point Objective，恢复点目标。

解决：

``` text
最多允许丢失多少时间范围的数据？
```

例如：

``` text
RPO = 10分钟
```

意味着发生灾难后：

> 业务最多接受最近约10分钟的数据无法恢复。

RPO越小：

``` text
备份/复制频率通常越高

↓

成本越高

↓

技术复杂度越高
```

------------------------------------------------------------------------

# 19. RTO恢复时间目标（★★★★★）

RTO：

> Recovery Time Objective，恢复时间目标。

解决：

``` text
发生故障后

↓

最多允许多久恢复服务？
```

例如：

``` text
RTO = 30分钟
```

意味着目标是：

> 在灾难发生后30分钟内恢复业务服务。

RTO越小，通常需要：

-   更高自动化程度；
-   更完善灾备环境；
-   更快数据恢复；
-   更成熟演练机制。

------------------------------------------------------------------------

# 20. Backup与High Availability区别（★★★★★）

这是非常重要的架构考点。

## High Availability

目标：

``` text
减少服务中断
```

例如：

``` text
3 Pods

3 Control Plane Nodes

Database Replicas
```

------------------------------------------------------------------------

## Backup

目标：

``` text
保存历史恢复点
```

例如：

``` text
每天数据库备份

每小时增量备份
```

------------------------------------------------------------------------

## Disaster Recovery

目标：

``` text
重大灾难发生后

↓

恢复完整业务系统
```

三者关系：

``` text
HA

降低故障发生时的中断概率


Backup

提供历史数据恢复能力


DR

提供灾难后的整体业务恢复能力
```

------------------------------------------------------------------------

# 21. Disaster Recovery灾难恢复体系（★★★★★）

完整灾备体系：

``` text
Production

↓

Backup / Replication

↓

Remote Storage / DR Site

↓

Disaster

↓

Recovery Process

↓

DR Environment

↓

Traffic Switch

↓

Service Recovery
```

灾难恢复需要同时考虑：

``` text
Compute

Storage

Network

Configuration

Identity

DNS

Certificate

Data

Traffic
```

因此DR是：

> 系统级能力，而不是单一备份工具。

------------------------------------------------------------------------

# 22. 同城与异地灾备架构

可以按照故障范围设计不同灾备层级。

## 同城灾备

用于应对：

-   单机房故障；
-   局部基础设施故障。

结构：

``` text
Site A

↓

Site B
```

通常网络延迟较低。

------------------------------------------------------------------------

## 异地灾备

用于应对：

-   城市级灾难；
-   区域级云服务故障；
-   大范围基础设施故障。

结构：

``` text
Region A

↓

Remote Backup / Replication

↓

Region B
```

核心：

> 灾备位置不能与生产环境共享全部故障域。

------------------------------------------------------------------------

# 23. 备份策略与生命周期管理

备份策略需要定义：

``` text
备份什么？

多久备份一次？

保存多久？

保存在哪里？

如何加密？

谁可以访问？

如何删除过期备份？
```

例如：

``` text
Hourly

↓

Daily

↓

Weekly

↓

Monthly
```

不同级别设置不同保留周期。

还应考虑：

``` text
Retention Policy

Encryption

Access Control

Integrity Verification
```

------------------------------------------------------------------------

# 24. 3-2-1备份原则（★★★★★）

经典3-2-1原则：

``` text
3

至少3份数据副本


2

至少使用2种不同存储介质或存储类型


1

至少1份位于异地或独立故障域
```

目的：

> 防止单一存储、单一设备或单一地点故障导致所有数据同时丢失。

在云原生环境中可以理解为：

``` text
Production Data

+

Local/Primary Backup

+

Remote Backup
```

具体实现应根据企业基础设施和合规要求设计。

------------------------------------------------------------------------

# 25. Kubernetes恢复演练（★★★★★）

很多系统的问题不是：

``` text
没有Backup
```

而是：

``` text
从未验证Restore
```

正确做法：

``` text
Backup

↓

Integrity Check

↓

Restore Test

↓

Application Verification

↓

Record RTO / RPO

↓

Improve
```

恢复演练应验证：

-   etcd是否能恢复；
-   Kubernetes资源是否完整；
-   PV数据是否可用；
-   Secret是否正确；
-   DNS是否正常；
-   Ingress是否可访问；
-   应用是否能启动；
-   数据库是否一致；
-   RTO是否达标。

------------------------------------------------------------------------

# 26. 常见备份恢复问题

## 问题一：只备份YAML

结果：

``` text
应用资源可以重建

但

业务数据丢失
```

------------------------------------------------------------------------

## 问题二：只备份PV

结果：

``` text
数据还在

但

集群配置和应用资源恢复困难
```

------------------------------------------------------------------------

## 问题三：备份和生产在同一故障域

结果：

``` text
Storage Failure

↓

Production + Backup

↓

同时丢失
```

------------------------------------------------------------------------

## 问题四：从不做恢复演练

结果：

``` text
真正灾难发生

↓

发现Backup不可用
```

------------------------------------------------------------------------

## 问题五：忽略外部依赖

例如：

``` text
Kubernetes恢复成功

↓

External Database不可用

↓

业务仍然失败
```

------------------------------------------------------------------------

# 27. 企业生产环境灾备设计

典型企业架构：

``` text
Primary Kubernetes Cluster
            │
      ┌─────┼─────┐
      ↓     ↓     ↓
    etcd   YAML   PV/Data
      │     │     │
      └─────┼─────┘
            ↓
       Backup Platform
            ↓
       Object Storage
            ↓
     Cross-Region Copy
            ↓
      DR Kubernetes
```

发生灾难：

``` text
Primary Failure

↓

Declare Disaster

↓

Restore / Activate DR

↓

Validate Application

↓

Switch DNS / Traffic

↓

Business Recovery
```

------------------------------------------------------------------------

# 28. Kubernetes备份恢复最佳实践

建议：

1.  同时保护etcd、资源配置和业务数据；
2.  将声明式配置纳入Git版本控制；
3.  定期执行etcd Snapshot；
4.  对PV设计独立备份策略；
5.  数据库优先结合数据库原生备份能力；
6.  使用Volume Snapshot时确认CSI支持；
7.  对关键备份进行完整性校验；
8.  备份数据与生产环境隔离故障域；
9.  对备份进行加密；
10. 严格控制备份访问权限；
11. 定义明确RPO和RTO；
12. 建立备份保留与生命周期策略；
13. 定期执行恢复演练；
14. 记录实际恢复耗时；
15. 将DNS、证书、Secret和外部依赖纳入DR计划；
16. 对关键系统准备自动化恢复脚本或流程；
17. 监控备份任务失败；
18. 灾备方案应持续更新，而不是一次性建设。

------------------------------------------------------------------------

# 29. 系统架构设计师考点

## Kubernetes为什么需要备份？

答：

> 高可用主要解决服务连续性和单点故障问题，但无法替代历史数据恢复，因此Kubernetes仍需要对集群状态、资源配置和业务数据建立备份与灾难恢复体系。

------------------------------------------------------------------------

## etcd为什么重要？

答：

> etcd保存Kubernetes控制面的核心状态，是集群控制面恢复的重要数据来源。

------------------------------------------------------------------------

## 只备份etcd是否足够？

答：

> 不一定。etcd保存Kubernetes
> API对象状态，但PV中的业务数据、外部数据库以及其他外部依赖通常需要独立保护。

------------------------------------------------------------------------

## RPO是什么？

答：

> RPO是恢复点目标，用于描述灾难发生后业务最多可以接受丢失多少时间范围的数据。

------------------------------------------------------------------------

## RTO是什么？

答：

> RTO是恢复时间目标，用于描述灾难发生后业务必须在多长时间内恢复。

------------------------------------------------------------------------

## HA和Backup区别？

答：

> HA主要减少服务中断，Backup提供历史数据恢复能力，两者不能相互替代。

------------------------------------------------------------------------

## 为什么要进行恢复演练？

答：

> 因为备份成功并不能证明恢复一定成功，只有通过定期恢复测试才能验证备份完整性、恢复流程和实际RTO。

------------------------------------------------------------------------

## 3-2-1备份原则是什么？

答：

> 至少保留3份数据副本，使用至少2种不同存储介质或类型，并至少保留1份在异地或独立故障域。

------------------------------------------------------------------------

# 30. Mermaid灾备架构图

``` mermaid
flowchart TD

A[Production Kubernetes Cluster]

A --> B[etcd Snapshot]
A --> C[Kubernetes Resources]
A --> D[Persistent Data]

C --> E[Git / GitOps]
B --> F[Backup Platform]
D --> F

F --> G[Backup Storage]
G --> H[Remote / Cross-Region Backup]

H --> I[DR Kubernetes Cluster]
E --> I

I --> J[Restore Resources]
I --> K[Restore Persistent Data]

J --> L[Application Validation]
K --> L

L --> M[DNS / Traffic Switch]
M --> N[Business Recovery]

O[RPO] --> F
P[RTO] --> I
```

------------------------------------------------------------------------

# 31. 本节小结

Kubernetes备份与灾难恢复核心知识：

1.  高可用不等于备份，也不等于灾难恢复；
2.  Kubernetes备份需要同时考虑集群状态、资源配置和业务数据；
3.  etcd是控制面状态恢复的核心数据；
4.  etcd Snapshot需要定期创建并验证；
5.  GitOps适合保护声明式资源期望状态，但不能替代业务数据备份；
6.  PV数据需要独立保护；
7.  Volume Snapshot依赖CSI和底层存储能力；
8.  数据库备份需要关注应用一致性；
9.  Velero可用于Kubernetes资源、持久化数据保护及迁移场景；
10. RPO描述允许的数据损失范围；
11. RTO描述允许的业务恢复时间；
12. HA解决连续性，Backup解决历史恢复，DR解决重大灾难后的整体恢复；
13. 备份应与生产环境隔离故障域；
14. 3-2-1原则是经典备份设计原则；
15. 必须定期执行恢复演练；
16. 企业DR还需要考虑DNS、证书、Secret、网络和外部依赖。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Kubernetes灾备不能只备份YAML或etcd，而应同时保护"集群状态 +
> 声明式配置 +
> 持久化业务数据"，并以RPO控制可接受的数据损失、以RTO控制可接受的恢复时间，通过异地备份和定期恢复演练确保真正可恢复。
