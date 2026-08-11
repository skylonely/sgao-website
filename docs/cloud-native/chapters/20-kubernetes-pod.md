# 20 Kubernetes Pod 核心概念与生命周期管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes 最核心的资源对象 Pod，包括 Pod 与 Container
> 的关系、设计思想、生命周期、网络、存储、健康检查以及调度基础。

------------------------------------------------------------------------

# 目录

1.  Pod概述
2.  为什么需要Pod
3.  Pod与Container关系
4.  Pod核心设计思想
5.  Pod基本结构
6.  Pod YAML定义
7.  Pod生命周期
8.  Pod状态模型
9.  Container生命周期
10. Init Container初始化容器
11. Sidecar模式
12. Pod网络模型
13. Pod存储模型
14. Pod健康检查
15. Pod资源管理
16. Pod调度基础
17. Pod最佳实践
18. 系统架构设计师考点
19. Mermaid架构图
20. 本节小结

------------------------------------------------------------------------

# 1. Pod概述

Pod：

> Kubernetes中最小的可部署计算单元。

注意：

Pod不是Container。

关系：

``` text
Kubernetes

↓

Pod

↓

Container
```

Kubernetes通过Pod管理容器，而不是直接管理单独的Container。

------------------------------------------------------------------------

# 2. 为什么需要Pod

Docker时代：

``` text
Container

↓

Application
```

但是企业应用通常包含多个紧密关联组件：

-   主业务程序；
-   日志采集代理；
-   监控代理；
-   配置同步组件。

因此：

``` text
Pod

├── Main Container
├── Sidecar Container
└── Helper Container
```

这些Container共享：

-   网络；
-   存储；
-   生命周期。

------------------------------------------------------------------------

# 3. Pod与Container关系

Pod可以包含一个或多个Container。

结构：

``` text
Pod

├── Container A
├── Container B
└── Container C
```

## 共享网络

同一个Pod中的Container：

-   共享同一个IP；
-   可以通过localhost通信。

示例：

``` text
Container A

localhost

↓

Container B
```

------------------------------------------------------------------------

## 共享存储

多个Container可以挂载同一个Volume：

``` text
Container

↓

Volume

↓

Shared Data
```

------------------------------------------------------------------------

# 4. Pod核心设计思想

Pod代表：

> 一个应用运行环境。

Pod封装：

-   应用容器；
-   网络环境；
-   存储资源；
-   生命周期。

------------------------------------------------------------------------

# 5. Pod基本结构

Pod对象结构：

``` text
Pod

├── Metadata
├── Spec
└── Status
```

其中：

Spec定义：

-   Container；
-   Volume；
-   网络；
-   资源限制。

------------------------------------------------------------------------

# 6. Pod YAML定义

示例：

``` yaml
apiVersion: v1

kind: Pod

metadata:
  name: nginx

spec:
  containers:
  - name: nginx
    image: nginx
```

组成：

``` text
Pod

├── apiVersion
├── kind
├── metadata
└── spec
```

------------------------------------------------------------------------

# 7. Pod生命周期

Pod生命周期：

``` text
Pending

↓

Running

↓

Succeeded

↓

Failed
```

------------------------------------------------------------------------

## Pending

表示：

-   Pod已经创建；
-   等待调度；
-   等待资源准备。

------------------------------------------------------------------------

## Running

表示：

-   Pod已经绑定Node；
-   Container正在运行。

------------------------------------------------------------------------

## Succeeded

表示：

-   Container正常结束。

------------------------------------------------------------------------

## Failed

表示：

-   Container执行失败。

------------------------------------------------------------------------

# 8. Pod状态模型

Pod Phase：

  状态        说明
  ----------- ----------
  Pending     等待调度
  Running     运行中
  Succeeded   成功结束
  Failed      失败
  Unknown     状态未知

------------------------------------------------------------------------

# 9. Container生命周期

Container状态：

``` text
Waiting

↓

Running

↓

Terminated
```

------------------------------------------------------------------------

# 10. Init Container初始化容器

Init Container：

> 在应用Container启动之前执行初始化任务的特殊Container。

流程：

``` text
Init Container

↓

Application Container
```

用途：

-   初始化配置；
-   等待依赖服务；
-   数据准备。

------------------------------------------------------------------------

# 11. Sidecar模式

Sidecar：

> 辅助容器模式。

结构：

``` text
Pod

├── Application Container

└── Sidecar Container
```

常见用途：

-   日志采集；
-   服务代理；
-   监控Agent。

------------------------------------------------------------------------

# 12. Pod网络模型

Kubernetes核心原则：

> 一个Pod拥有一个独立网络空间。

结构：

``` text
Pod IP

↓

Container A

Container B
```

Pod内部：

``` text
localhost通信
```

------------------------------------------------------------------------

# 13. Pod存储模型

Pod通过Volume实现数据共享。

结构：

``` text
Pod

↓

Volume

↓

Container
```

常见Volume：

-   emptyDir；
-   hostPath；
-   PersistentVolume。

------------------------------------------------------------------------

# 14. Pod健康检查

Kubernetes提供三类探针。

------------------------------------------------------------------------

## Liveness Probe

判断：

> 容器是否存活。

失败：

``` text
Restart Container
```

------------------------------------------------------------------------

## Readiness Probe

判断：

> 应用是否可以接收流量。

失败：

``` text
Remove From Service
```

------------------------------------------------------------------------

## Startup Probe

判断：

> 应用是否完成启动。

------------------------------------------------------------------------

# 15. Pod资源管理

资源配置：

``` yaml
resources:

  requests:

  limits:
```

包括：

-   CPU；
-   Memory。

作用：

-   保证资源；
-   防止资源争抢。

------------------------------------------------------------------------

# 16. Pod调度基础

Scheduler考虑：

-   CPU；
-   Memory；
-   Node Label；
-   Affinity；
-   Taint/Toleration。

流程：

``` text
Pod

↓

Scheduler

↓

Node

↓

kubelet

↓

Container
```

------------------------------------------------------------------------

# 17. Pod最佳实践

建议：

-   不直接创建裸Pod；
-   使用Deployment管理；
-   设置资源限制；
-   配置健康检查；
-   合理使用Sidecar。

------------------------------------------------------------------------

# 18. 系统架构设计师考点

## Pod是什么？

答：

> Pod是Kubernetes中最小的可部署计算单元，一个Pod可以包含一个或多个共享网络和存储的Container。

------------------------------------------------------------------------

## 为什么需要Pod？

答：

> Pod用于封装紧密关联的多个Container，使它们共享网络、存储和生命周期。

------------------------------------------------------------------------

## Pod和Container区别？

答：

> Container是实际运行应用的单位，而Pod是Kubernetes管理和调度的最小单位。

------------------------------------------------------------------------

## Liveness和Readiness区别？

答：

> Liveness判断容器是否存活，Readiness判断应用是否可以接收请求。

------------------------------------------------------------------------

# 19. Mermaid架构图

``` mermaid
flowchart TD

A[Kubernetes]

↓

B[Pod]

B --> C[Container A]

B --> D[Container B]

B --> E[Shared Network]

B --> F[Shared Volume]

C --> G[Application]

D --> H[Sidecar]
```

------------------------------------------------------------------------

# 20. 本节小结

Pod核心知识：

1.  Pod是Kubernetes最小部署单元；
2.  Pod可以包含多个共享资源的Container；
3.  Pod中的Container共享网络和存储；
4.  Pod通过声明式方式描述运行状态；
5.  Init Container负责初始化任务；
6.  Sidecar提供辅助能力；
7.  Probe用于健康检查；
8.  Scheduler负责选择运行节点。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Container负责运行应用，Pod负责封装应用运行环境，Kubernetes通过Pod实现容器编排管理。
