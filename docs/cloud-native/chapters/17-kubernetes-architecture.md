# 17 Kubernetes 整体架构与核心组件

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes
> 整体架构、控制平面、工作节点以及核心组件运行机制，是理解
> Pod、Deployment、Service 等 Kubernetes 核心资源对象的基础。

------------------------------------------------------------------------

# 目录

1.  Kubernetes整体架构概述
2.  Kubernetes集群组成
3.  Control Plane控制平面
4.  Worker Node工作节点
5.  kube-apiserver
6.  etcd数据存储
7.  kube-scheduler调度器
8.  kube-controller-manager控制器管理器
9.  kubelet节点代理
10. kube-proxy网络代理
11. Container Runtime容器运行时
12. Kubernetes请求处理流程
13. Pod创建完整流程
14. Controller控制机制
15. Kubernetes高可用架构
16. Kubernetes组件通信关系
17. Kubernetes与Docker架构对比
18. 系统架构设计师考点
19. Mermaid架构图
20. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes整体架构概述

Kubernetes采用：

> 控制平面（Control Plane）+ 工作节点（Worker Node）的分布式架构。

整体：

``` text
Kubernetes Cluster

├── Control Plane
│
└── Worker Node
```

Control Plane负责管理集群。

Worker Node负责运行应用容器。

------------------------------------------------------------------------

# 2. Kubernetes集群组成

完整结构：

``` text
                 Kubernetes Cluster


              Control Plane

        ┌──────────────────┐
        │ kube-apiserver   │
        │ etcd             │
        │ scheduler        │
        │ controller       │
        └──────────────────┘


              Worker Node

        ┌──────────────────┐
        │ kubelet          │
        │ kube-proxy       │
        │ Container Runtime│
        └──────────────────┘
```

------------------------------------------------------------------------

# 3. Control Plane控制平面

Control Plane是 Kubernetes 的管理中心。

主要职责：

-   接收用户请求；
-   保存集群状态；
-   调度应用；
-   维护期望状态。

核心组件：

``` text
Control Plane

├── kube-apiserver
├── etcd
├── kube-scheduler
└── kube-controller-manager
```

------------------------------------------------------------------------

# 4. Worker Node工作节点

Worker Node负责实际运行应用。

组件：

``` text
Worker Node

├── kubelet
├── kube-proxy
└── Container Runtime
```

工作流程：

``` text
Control Plane

↓

kubelet

↓

Container Runtime

↓

Container
```

------------------------------------------------------------------------

# 5. kube-apiserver（★★★★★）

kube-apiserver：

> Kubernetes所有操作的统一入口。

职责：

-   提供REST API；
-   身份认证；
-   权限控制；
-   数据校验；
-   集群状态访问。

流程：

``` text
kubectl

↓

API Server

↓

Kubernetes Cluster
```

所有组件通常通过 API Server 进行通信。

------------------------------------------------------------------------

# 6. etcd数据存储（★★★★★）

etcd：

> Kubernetes使用的分布式键值存储系统。

保存：

-   集群状态；
-   配置信息；
-   元数据。

结构：

``` text
API Server

↓

etcd

↓

Cluster State
```

特点：

-   分布式；
-   强一致性；
-   高可靠。

生产环境通常采用 etcd 集群保证可靠性。

------------------------------------------------------------------------

# 7. kube-scheduler调度器

Scheduler负责：

> 为Pod选择合适的Node运行。

流程：

``` text
Pod Pending

↓

Scheduler

↓

Node Selection

↓

Pod Assigned
```

调度考虑：

-   CPU资源；
-   Memory资源；
-   节点标签；
-   亲和性规则；
-   污点与容忍。

------------------------------------------------------------------------

# 8. kube-controller-manager控制器管理器

Controller负责：

> 持续保证实际状态符合期望状态。

模型：

``` text
Desired State

↓

Controller

↓

Actual State
```

例如：

期望：

``` text
replicas = 3
```

实际：

``` text
running pods = 2
```

Controller：

``` text
创建新的Pod
```

------------------------------------------------------------------------

# 9. kubelet节点代理

kubelet运行在每个Worker Node上。

职责：

-   接收Pod定义；
-   管理容器生命周期；
-   上报节点状态。

流程：

``` text
API Server

↓

kubelet

↓

Container Runtime

↓

Container
```

------------------------------------------------------------------------

# 10. kube-proxy网络代理

kube-proxy负责：

-   Service网络访问；
-   流量转发；
-   网络规则维护。

结构：

``` text
Client

↓

Service

↓

Pod
```

它帮助实现 Kubernetes 服务发现和负载均衡。

------------------------------------------------------------------------

# 11. Container Runtime容器运行时

Container Runtime负责：

> 真正创建和运行容器。

常见：

-   containerd；
-   CRI-O。

关系：

``` text
Kubernetes

↓

CRI

↓

Container Runtime

↓

Container
```

------------------------------------------------------------------------

# 12. Kubernetes请求处理流程

例如创建应用：

``` text
kubectl

↓

kube-apiserver

↓

etcd

↓

controller-manager

↓

scheduler

↓

kubelet

↓

container runtime

↓

Pod
```

------------------------------------------------------------------------

# 13. Pod创建完整流程

步骤：

``` text
1. 用户提交YAML

↓

2. API Server接收请求

↓

3. 保存状态到etcd

↓

4. Controller发现期望状态

↓

5. Scheduler选择Node

↓

6. kubelet创建Pod

↓

7. Runtime启动Container
```

------------------------------------------------------------------------

# 14. Controller控制机制

Kubernetes核心思想：

> 控制器不断比较当前状态和目标状态。

流程：

``` text
Desired State

↓

Controller Loop

↓

Actual State

↓

Adjustment
```

这种机制称为：

> 控制循环（Control Loop）

------------------------------------------------------------------------

# 15. Kubernetes高可用架构

生产环境通常：

``` text
             Load Balancer

                   ↓

        ┌─────────────────┐
        │ API Server 1    │
        │ API Server 2    │
        │ API Server 3    │
        └─────────────────┘

                   ↓

              etcd Cluster
```

关键：

-   多Master；
-   API Server负载均衡；
-   etcd高可用。

------------------------------------------------------------------------

# 16. Kubernetes组件通信关系

整体：

``` text
kubectl

↓

API Server

↓

etcd

↓

Controller / Scheduler

↓

kubelet

↓

Container Runtime
```

API Server是整个系统的重要通信中心。

------------------------------------------------------------------------

# 17. Kubernetes与Docker架构对比

Docker：

``` text
Docker Host

├── Docker Daemon
├── Image
└── Container
```

Kubernetes：

``` text
Cluster

├── Control Plane
└── Worker Node
```

区别：

  Docker          Kubernetes
  --------------- ---------------------------
  运行容器        管理容器集群
  单机能力强      集群能力强
  关注Container   关注Application Lifecycle

------------------------------------------------------------------------

# 18. 系统架构设计师考点

## Kubernetes核心组件有哪些？

答：

> Kubernetes核心组件包括
> kube-apiserver、etcd、kube-scheduler、kube-controller-manager、kubelet、kube-proxy
> 和 Container Runtime。

------------------------------------------------------------------------

## etcd作用？

答：

> etcd用于保存 Kubernetes 集群状态和配置数据，是控制平面的数据存储中心。

------------------------------------------------------------------------

## Scheduler作用？

答：

> Scheduler负责根据资源和调度策略选择合适节点运行Pod。

------------------------------------------------------------------------

## Controller作用？

答：

> Controller持续监控实际状态，通过创建、删除资源使系统达到期望状态。

------------------------------------------------------------------------

# 19. Mermaid架构图

``` mermaid
flowchart TB

    subgraph ControlPlane
        API[kube-apiserver]
        ETCD[etcd]
        SCH[kube-scheduler]
        CTRL[kube-controller-manager]
    end

    subgraph WorkerNode1
        K1[kubelet]
        P1[kube-proxy]
        R1[Container Runtime]
    end

    subgraph WorkerNode2
        K2[kubelet]
        P2[kube-proxy]
        R2[Container Runtime]
    end

    API --> ETCD
    API --> SCH
    API --> CTRL

    SCH --> K1
    SCH --> K2

    K1 --> R1
    K2 --> R2
```

------------------------------------------------------------------------

# 20. 本节小结

Kubernetes架构核心：

1.  Control Plane负责控制和管理；
2.  Worker Node负责运行应用；
3.  API Server是统一入口；
4.  etcd保存集群状态；
5.  Scheduler负责Pod调度；
6.  Controller保证期望状态；
7.  kubelet管理节点容器生命周期；
8.  kube-proxy负责服务网络；
9.  Container Runtime负责真正运行容器。

------------------------------------------------------------------------

# 一句话冲刺记忆

> API
> Server负责沟通，etcd负责存储，Scheduler负责调度，Controller负责纠偏，kubelet负责执行，Runtime负责运行。
