# 26 Kubernetes StatefulSet 有状态应用管理

> 本文属于「Docker + Kubernetes 云原生专题」。

## 1. StatefulSet概述

StatefulSet 是 Kubernetes 用于管理有状态应用的工作负载控制器。

主要能力：

-   稳定身份；
-   稳定网络；
-   稳定存储；
-   有序部署。

架构：

``` text
StatefulSet

↓

Pod

↓

PVC

↓

Persistent Storage
```

------------------------------------------------------------------------

## 2. 为什么需要StatefulSet

Deployment适合无状态应用：

``` text
Pod

Pod

Pod
```

但是数据库等应用需要：

-   固定身份；
-   固定网络；
-   固定存储。

例如：

``` text
mysql-0

mysql-1

mysql-2
```

------------------------------------------------------------------------

## 3. 无状态与有状态应用区别

  无状态           有状态
  ---------------- --------------
  不保存本地数据   保存业务数据
  Pod可替换        需要固定身份
  Deployment       StatefulSet
  Web/API          数据库

------------------------------------------------------------------------

## 4. StatefulSet与Deployment区别

  Deployment         StatefulSet
  ------------------ ----------------
  无状态应用         有状态应用
  Pod名称随机        Pod名称固定
  无序创建           有序创建
  通常不需要持久化   需要持久化存储

------------------------------------------------------------------------

## 5. StatefulSet核心能力

### 稳定网络身份

例如：

``` text
mysql-0
mysql-1
mysql-2
```

### 稳定存储

``` text
Pod

↓

PVC

↓

PV
```

### 有序操作

启动：

``` text
Pod-0

↓

Pod-1

↓

Pod-2
```

------------------------------------------------------------------------

## 6. StatefulSet资源模型

结构：

``` text
StatefulSet

├── Metadata
├── Spec
└── Status
```

------------------------------------------------------------------------

## 7. StatefulSet YAML结构

``` yaml
apiVersion: apps/v1

kind: StatefulSet

metadata:
  name: mysql

spec:
  serviceName: mysql
  replicas: 3
```

------------------------------------------------------------------------

## 8. Headless Service

StatefulSet通常配合Headless Service。

配置：

``` yaml
clusterIP: None
```

作用：

-   提供稳定DNS；
-   返回Pod真实地址。

------------------------------------------------------------------------

## 9. 稳定存储管理

通过：

``` yaml
volumeClaimTemplates
```

自动创建PVC。

关系：

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

## 10. Pod命名规则

规则：

``` text
<statefulset-name>-序号
```

例如：

``` text
redis-0
redis-1
redis-2
```

------------------------------------------------------------------------

## 11. 有序部署与扩缩容

创建：

``` text
Pod-0

↓

Pod-1

↓

Pod-2
```

删除：

``` text
Pod-2

↓

Pod-1

↓

Pod-0
```

------------------------------------------------------------------------

## 12. 数据库集群应用

典型：

-   MySQL；
-   Redis；
-   Kafka；
-   Elasticsearch；
-   ZooKeeper。

------------------------------------------------------------------------

## 13. 更新策略

### RollingUpdate

逐步更新Pod。

### OnDelete

删除Pod后更新。

------------------------------------------------------------------------

## 14. 系统架构设计师考点

### StatefulSet作用？

StatefulSet用于管理有状态应用，为Pod提供稳定网络标识、稳定存储以及有序部署能力。

### StatefulSet和Deployment区别？

Deployment适用于无状态应用，StatefulSet适用于需要稳定身份和持久化存储的有状态应用。

### 为什么需要Headless Service？

Headless
Service用于为StatefulSet提供稳定DNS解析，使每个Pod拥有固定网络标识。

------------------------------------------------------------------------

## 15. Mermaid架构图

``` mermaid
flowchart TD

A[StatefulSet]

↓

B[Headless Service]

↓

C[Pod mysql-0]

C --> D[PVC]

D --> E[PV]

B --> F[Pod mysql-1]

F --> G[PVC]

G --> H[PV]
```

------------------------------------------------------------------------

## 本节小结

StatefulSet核心：

1.  管理有状态应用；
2.  提供稳定身份；
3.  提供稳定网络；
4.  使用PVC保证数据持久化；
5.  支持有序部署和扩缩容。

一句话记忆：

> Deployment管理无状态应用，StatefulSet管理有状态应用；通过固定身份、稳定网络和持久化存储保证可靠运行。
