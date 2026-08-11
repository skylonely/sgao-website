# 27 Kubernetes DaemonSet 节点级服务管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes DaemonSet 节点级服务管理，包括 DaemonSet 与
> Deployment 区别、节点自动部署机制、日志采集、监控
> Agent、网络插件部署等。

------------------------------------------------------------------------

# 目录

1.  DaemonSet概述
2.  为什么需要DaemonSet
3.  DaemonSet应用场景
4.  DaemonSet与Deployment区别
5.  DaemonSet资源模型
6.  DaemonSet YAML结构
7.  节点自动部署机制
8.  Node新增与删除管理
9.  DaemonSet调度机制
10. DaemonSet更新策略
11. DaemonSet典型案例
12. 日志采集架构
13. 监控Agent架构
14. 网络插件部署
15. DaemonSet最佳实践
16. 系统架构设计师考点
17. Mermaid架构图
18. 本节小结

------------------------------------------------------------------------

# 1. DaemonSet概述

DaemonSet：

> Kubernetes中用于确保每个Node节点运行一个Pod副本的控制器。

核心目标：

``` text
一个Node

↓

一个Pod
```

架构：

``` text
DaemonSet

↓

Node

↓

Pod

↓

Container
```

------------------------------------------------------------------------

# 2. 为什么需要DaemonSet

Deployment适合业务应用：

``` text
Deployment

↓

Pod数量控制
```

例如：

-   Web服务；
-   API服务。

但是某些服务需要运行在每个节点：

-   日志采集；
-   监控Agent；
-   网络插件。

因此：

``` text
Node1

↓

Pod


Node2

↓

Pod


Node3

↓

Pod
```

------------------------------------------------------------------------

# 3. DaemonSet应用场景

## 日志采集

例如：

-   Fluent Bit；
-   Filebeat。

架构：

``` text
Node

↓

Log Agent

↓

日志系统
```

------------------------------------------------------------------------

## 监控Agent

例如：

-   Node Exporter。

结构：

``` text
Node

↓

Monitoring Agent

↓

Prometheus
```

------------------------------------------------------------------------

## 网络插件

例如：

-   Calico；
-   Cilium。

每个Node运行网络组件。

------------------------------------------------------------------------

## 安全Agent

例如：

-   主机安全检测；
-   容器安全扫描。

------------------------------------------------------------------------

# 4. DaemonSet与Deployment区别

  Deployment     DaemonSet
  -------------- --------------
  管理应用副本   管理节点副本
  副本数量固定   每个Node一个
  业务服务       节点服务
  Web/API        Agent

------------------------------------------------------------------------

# 5. DaemonSet资源模型

结构：

``` text
DaemonSet

├── Metadata
├── Spec
└── Status
```

Spec包含：

-   selector；
-   template；
-   updateStrategy。

------------------------------------------------------------------------

# 6. DaemonSet YAML结构

示例：

``` yaml
apiVersion: apps/v1

kind: DaemonSet

metadata:
  name: log-agent

spec:
  selector:
    matchLabels:
      app: log-agent

  template:
    metadata:
      labels:
        app: log-agent

    spec:
      containers:
      - name: agent
        image: fluent-bit
```

------------------------------------------------------------------------

# 7. 节点自动部署机制

流程：

``` text
Node加入Cluster

↓

DaemonSet Controller检测

↓

创建Pod

↓

绑定Node
```

------------------------------------------------------------------------

# 8. Node新增与删除管理

新增Node：

``` text
Node4加入

↓

DaemonSet自动创建Pod
```

删除Node：

``` text
Node删除

↓

对应Pod清理
```

------------------------------------------------------------------------

# 9. DaemonSet调度机制

DaemonSet根据：

-   Node条件；
-   Taints；
-   Tolerations；

决定Pod部署位置。

------------------------------------------------------------------------

# 10. DaemonSet更新策略

## RollingUpdate

默认策略：

逐节点更新。

流程：

``` text
Node1

更新Pod

↓

Node2

更新Pod
```

------------------------------------------------------------------------

## OnDelete

手动删除Pod后更新。

------------------------------------------------------------------------

# 11. DaemonSet典型案例

## Fluent Bit日志架构

``` text
Node

↓

Fluent Bit

↓

Kafka

↓

Elasticsearch
```

------------------------------------------------------------------------

## Node Exporter监控

``` text
Node

↓

Node Exporter

↓

Prometheus

↓

Grafana
```

------------------------------------------------------------------------

# 12. 日志采集架构

``` text
Application

↓

Container Log

↓

DaemonSet Agent

↓

Logging System
```

------------------------------------------------------------------------

# 13. 监控Agent架构

``` text
Node

↓

Monitoring Agent

↓

Prometheus

↓

Grafana
```

------------------------------------------------------------------------

# 14. 网络插件部署

CNI网络插件通常采用DaemonSet部署：

``` text
每个Node

↓

Network Agent
```

例如：

-   Calico；
-   Cilium。

------------------------------------------------------------------------

# 15. DaemonSet最佳实践

建议：

-   合理设置资源限制；
-   配置节点选择规则；
-   控制日志Agent资源消耗；
-   使用滚动更新；
-   配合监控告警。

------------------------------------------------------------------------

# 16. 系统架构设计师考点

## DaemonSet作用？

答：

> DaemonSet用于保证集群中的每个Node节点运行一个Pod副本，常用于部署节点级Agent。

------------------------------------------------------------------------

## DaemonSet和Deployment区别？

答：

> Deployment关注应用副本数量，DaemonSet关注每个节点运行一个实例。

------------------------------------------------------------------------

## DaemonSet典型应用？

答：

> 日志采集、监控Agent、网络插件、安全Agent等节点级服务。

------------------------------------------------------------------------

# 17. Mermaid架构图

``` mermaid
flowchart TD

A[DaemonSet Controller]

↓

B[Node 1]

B --> C[Pod Log Agent]


D[Node 2]

D --> E[Pod Log Agent]


F[Node 3]

F --> G[Pod Log Agent]
```

------------------------------------------------------------------------

# 18. 本节小结

DaemonSet核心知识：

1.  DaemonSet保证每个Node运行指定Pod；
2.  适合节点级基础服务；
3.  常用于日志、监控、网络插件；
4.  支持节点自动加入和删除管理；
5.  支持滚动更新。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Deployment管理业务副本，StatefulSet管理有状态服务，DaemonSet管理每个节点必须运行的基础服务。
