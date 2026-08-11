# 25 Kubernetes 存储模型与数据持久化

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes 存储模型，包括
> Volume、PersistentVolume（PV）、PersistentVolumeClaim（PVC）、StorageClass、CSI以及有状态应用存储设计。

------------------------------------------------------------------------

# 目录

1.  Kubernetes存储概述
2.  为什么需要持久化存储
3.  Container存储问题
4.  Kubernetes Volume模型
5.  Volume生命周期
6.  emptyDir临时存储
7.  hostPath本地存储
8.  PersistentVolume概述
9.  PersistentVolume资源模型
10. PersistentVolumeClaim概述
11. PV与PVC绑定机制
12. StorageClass动态存储
13. CSI存储接口
14. 云环境存储方案
15. Stateful应用存储
16. Kubernetes存储最佳实践
17. 系统架构设计师考点
18. Mermaid存储架构图
19. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes存储概述

Kubernetes存储目标：

> 将数据生命周期与Pod生命周期解耦。

传统方式：

``` text
Pod

↓

Container

↓

Data
```

问题：

-   Pod删除可能导致数据丢失；
-   数据无法共享；
-   应用迁移困难。

Kubernetes通过Volume体系提供持久化能力：

``` text
Application

↓

Volume

↓

Persistent Storage
```

------------------------------------------------------------------------

# 2. 为什么需要持久化存储

无状态应用：

``` text
Frontend

Backend API
```

通常可以直接重新创建。

但是数据库等有状态应用：

``` text
MySQL

Redis

MongoDB
```

需要：

-   数据保存；
-   故障恢复；
-   数据迁移。

------------------------------------------------------------------------

# 3. Container存储问题

容器默认文件系统：

``` text
Container

↓

Writable Layer
```

特点：

-   临时存在；
-   生命周期绑定容器。

问题：

``` text
Container Delete

↓

Data Lost
```

因此需要独立存储。

------------------------------------------------------------------------

# 4. Kubernetes Volume模型

Volume：

> Kubernetes提供给Pod使用的存储抽象。

结构：

``` text
Pod

↓

Volume

↓

Container
```

特点：

-   可以被多个Container共享；
-   生命周期独立于Container。

------------------------------------------------------------------------

# 5. Volume生命周期

基本关系：

``` text
Pod

↓

Volume

↓

Container
```

Volume通常与Pod关联。

Pod删除后，不同类型Volume表现不同：

-   临时Volume删除；
-   持久Volume保留数据。

------------------------------------------------------------------------

# 6. emptyDir临时存储

emptyDir：

> Pod创建时自动生成的临时目录。

结构：

``` text
Pod

├── Container A
├── Container B

↓

emptyDir
```

特点：

-   Pod运行期间存在；
-   Pod删除后数据消失。

适合：

-   临时缓存；
-   中间数据；
-   临时文件。

------------------------------------------------------------------------

# 7. hostPath本地存储

hostPath：

> 使用Node节点本地目录作为Pod存储。

结构：

``` text
Node

↓

hostPath

↓

Pod
```

优点：

-   简单；
-   性能较高。

缺点：

-   与Node绑定；
-   不适合大规模生产环境。

------------------------------------------------------------------------

# 8. PersistentVolume概述（★★★★★）

PersistentVolume（PV）：

> Kubernetes管理员创建的持久化存储资源。

特点：

-   独立于Pod；
-   独立生命周期；
-   可被PVC申请使用。

结构：

``` text
Storage

↓

PV

↓

Pod
```

------------------------------------------------------------------------

# 9. PersistentVolume资源模型

PV描述：

-   存储容量；
-   访问模式；
-   存储类型。

示例：

``` yaml
capacity:

accessModes:

storageClassName:
```

常见访问模式：

-   ReadWriteOnce；
-   ReadOnlyMany；
-   ReadWriteMany。

------------------------------------------------------------------------

# 10. PersistentVolumeClaim概述

PVC：

> 用户申请存储资源的对象。

关系：

``` text
User

↓

PVC

↓

PV

↓

Storage
```

优势：

应用无需关注底层存储实现。

------------------------------------------------------------------------

# 11. PV与PVC绑定机制（★★★★★）

流程：

``` text
PVC创建

↓

寻找匹配PV

↓

绑定

↓

Pod使用
```

完整模型：

``` text
Pod

↓

PVC

↓

PV

↓

Storage
```

------------------------------------------------------------------------

# 12. StorageClass动态存储

传统方式：

管理员提前创建PV。

问题：

-   管理复杂；
-   扩展困难。

StorageClass：

> 根据PVC需求自动创建存储资源。

流程：

``` text
PVC

↓

StorageClass

↓

Dynamic Provisioning

↓

PV
```

------------------------------------------------------------------------

# 13. CSI存储接口

CSI：

> Container Storage Interface。

作用：

提供统一存储接口。

结构：

``` text
Kubernetes

↓

CSI

↓

Storage Provider
```

支持：

-   云存储；
-   网络存储；
-   分布式存储。

------------------------------------------------------------------------

# 14. 云环境存储方案

常见方案：

-   AWS EBS；
-   Azure Disk；
-   Google Persistent Disk；
-   Ceph；
-   NFS。

------------------------------------------------------------------------

# 15. Stateful应用存储

有状态应用：

例如：

-   MySQL；
-   Kafka；
-   Elasticsearch。

通常结合：

``` text
StatefulSet

↓

PVC

↓

PV
```

保证：

-   稳定身份；
-   固定存储；
-   数据持久化。

------------------------------------------------------------------------

# 16. Kubernetes存储最佳实践

建议：

-   不使用hostPath作为核心生产数据库存储；
-   使用PVC抽象存储；
-   使用StorageClass自动供应；
-   定期备份数据；
-   设计灾备方案。

------------------------------------------------------------------------

# 17. 系统架构设计师考点

## Volume作用？

答：

> Volume用于为Pod提供存储能力，实现容器数据持久化和共享。

------------------------------------------------------------------------

## PV和PVC区别？

答：

> PV表示管理员提供的存储资源，PVC表示用户申请存储资源的请求。

------------------------------------------------------------------------

## StorageClass作用？

答：

> StorageClass用于实现存储动态供应，根据PVC请求自动创建PV。

------------------------------------------------------------------------

## 为什么需要PVC？

答：

> PVC将应用与底层存储解耦，使用户无需关注具体存储实现。

------------------------------------------------------------------------

# 18. Mermaid存储架构图

``` mermaid
flowchart TD

A[Application Pod]

↓

B[PVC]

↓

C[PersistentVolume]

↓

D[StorageClass]

↓

E[Storage Provider]

↓

F[Physical Storage]
```

------------------------------------------------------------------------

# 19. 本节小结

Kubernetes存储核心：

1.  Volume解决容器临时存储问题；
2.  PV提供持久化存储资源；
3.  PVC实现应用与存储解耦；
4.  StorageClass实现动态存储供应；
5.  CSI统一管理不同存储后端；
6.  Stateful应用通常结合StatefulSet和PVC。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Volume提供存储能力，PV代表存储资源，PVC申请存储，StorageClass实现自动供应，CSI连接外部存储系统。
