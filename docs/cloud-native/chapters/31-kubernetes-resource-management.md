# 31 Kubernetes 资源管理与 QoS 模型

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes 的 CPU、Memory 资源管理机制，以及
> requests、limits、QoS、ResourceQuota、LimitRange、OOM 与 Pod
> 驱逐等生产环境核心知识。

------------------------------------------------------------------------

# 目录

1.  Kubernetes资源管理概述
2.  为什么需要资源管理
3.  CPU与Memory资源模型
4.  requests资源请求
5.  limits资源限制
6.  requests与limits区别
7.  Scheduler与requests的关系
8.  CPU资源限制机制
9.  Memory资源限制与OOM
10. Kubernetes QoS模型
11. Guaranteed等级
12. Burstable等级
13. BestEffort等级
14. QoS与Pod驱逐
15. ResourceQuota命名空间资源配额
16. LimitRange默认资源限制
17. 资源利用率与超卖
18. 生产环境资源规划
19. Kubernetes资源管理最佳实践
20. 系统架构设计师考点
21. Mermaid资源管理架构图
22. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes资源管理概述

Kubernetes集群中的CPU和内存属于有限资源。

如果Pod不进行资源约束：

``` text
Pod A

大量占用CPU / Memory

↓

影响Pod B、Pod C

↓

Node稳定性下降
```

因此Kubernetes提供完整的资源治理体系：

``` text
requests

↓

调度资源基线


limits

↓

运行时资源上限


QoS

↓

资源保障等级


ResourceQuota / LimitRange

↓

Namespace级资源治理
```

核心目标：

> 在保证关键业务稳定性的同时，提高集群整体资源利用率。

------------------------------------------------------------------------

# 2. 为什么需要资源管理

生产集群通常运行大量工作负载：

``` text
Node

├── Pod A
├── Pod B
├── Pod C
└── Pod D
```

如果所有Pod都可以无限制使用资源，容易产生：

-   CPU争抢；
-   内存耗尽；
-   OOM；
-   节点压力；
-   关键业务被非关键任务影响。

因此需要明确：

``` text
Pod需要多少资源？

Pod最多可以使用多少资源？
```

对应：

``` text
requests

limits
```

------------------------------------------------------------------------

# 3. CPU与Memory资源模型

Kubernetes最常见的两类计算资源：

-   CPU；
-   Memory。

## CPU

CPU属于可压缩资源。

例如：

``` yaml
cpu: "500m"
```

其中：

``` text
1000m = 1 CPU

500m = 0.5 CPU

250m = 0.25 CPU
```

当CPU达到限制时，通常表现为：

> CPU使用受到限制或节流，而不是直接杀死容器。

------------------------------------------------------------------------

## Memory

Memory属于不可压缩资源。

例如：

``` yaml
memory: "512Mi"
```

常见单位：

``` text
Ki
Mi
Gi
```

当容器内存超过限制时，可能触发：

``` text
OOM

↓

Container终止
```

------------------------------------------------------------------------

# 4. requests资源请求（★★★★★）

requests：

> Pod声明运行所需要的资源基线。

示例：

``` yaml
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
```

表示：

``` text
CPU请求：0.5核

Memory请求：512Mi
```

requests的重要作用：

``` text
Pod

↓

requests

↓

Scheduler

↓

判断Node是否具有足够可分配资源
```

因此：

> requests主要影响调度和资源保障基线。

------------------------------------------------------------------------

# 5. limits资源限制（★★★★★）

limits：

> Container运行过程中允许使用的资源上限。

示例：

``` yaml
resources:
  limits:
    cpu: "1"
    memory: "1Gi"
```

表示：

``` text
CPU最多使用约1核的配额

Memory最多使用1Gi
```

超过CPU limit：

``` text
CPU Throttling
```

超过Memory limit：

``` text
OOM Kill
```

------------------------------------------------------------------------

# 6. requests与limits区别（★★★★★）

  项目                requests         limits
  ------------------- ---------------- ------------------------------------------------
  含义                资源请求基线     资源使用上限
  主要作用阶段        调度             运行
  Scheduler是否关注   是               资源策略中也可能涉及，但调度核心依据是requests
  CPU                 影响可调度容量   超过后可能被节流
  Memory              影响可调度容量   超过后可能OOM

一句话：

> requests决定"需要多少"，limits决定"最多能用多少"。

------------------------------------------------------------------------

# 7. Scheduler与requests的关系

假设Node剩余可分配资源：

``` text
CPU：2 Core

Memory：4Gi
```

Pod请求：

``` yaml
requests:
  cpu: "1"
  memory: "2Gi"
```

则Scheduler可以考虑将Pod调度到该Node。

如果Pod请求：

``` yaml
requests:
  cpu: "4"
  memory: "8Gi"
```

Node资源不足：

``` text
Scheduler

↓

过滤该Node
```

因此调度判断核心是：

``` text
Pod Requests

<=

Node Allocatable剩余可承诺资源
```

------------------------------------------------------------------------

# 8. CPU资源限制机制

CPU属于：

> 可压缩资源。

当应用CPU使用超过limit：

``` text
Application

↓

CPU Limit

↓

CPU Throttling

↓

执行速度下降
```

一般不会仅因为超过CPU limit直接发生OOM式终止。

生产环境如果CPU limit设置过低，可能出现：

-   请求延迟升高；
-   吞吐下降；
-   CPU Throttling严重。

------------------------------------------------------------------------

# 9. Memory资源限制与OOM（★★★★★）

Memory属于：

> 不可压缩资源。

当容器超过memory limit：

``` text
Container

↓

Memory Limit

↓

OOM

↓

Container被终止
```

常见现象：

``` text
OOMKilled
```

因此Memory limit需要谨慎设置。

设置过小：

``` text
频繁OOM

↓

容器重启

↓

业务不稳定
```

------------------------------------------------------------------------

# 10. Kubernetes QoS模型（★★★★★）

Kubernetes根据Pod资源配置，将Pod划分为QoS等级。

主要包括：

``` text
Guaranteed

Burstable

BestEffort
```

用于：

-   资源保障；
-   节点压力下的驱逐决策。

------------------------------------------------------------------------

# 11. Guaranteed等级

Guaranteed：

> CPU和Memory均为Pod中相关容器设置requests与limits，并满足对应request等于limit等条件。

典型示例：

``` yaml
resources:
  requests:
    cpu: "1"
    memory: "1Gi"

  limits:
    cpu: "1"
    memory: "1Gi"
```

特点：

-   资源配置明确；
-   保障程度最高；
-   适合核心业务。

------------------------------------------------------------------------

# 12. Burstable等级

Burstable：

> Pod设置了CPU或Memory资源请求/限制，但不满足Guaranteed条件。

例如：

``` yaml
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"

  limits:
    cpu: "1"
    memory: "1Gi"
```

特点：

``` text
requests < limits
```

允许：

> 在资源允许时使用超过requests的资源，直到受到limit等约束。

适合多数普通生产业务。

------------------------------------------------------------------------

# 13. BestEffort等级

BestEffort：

> Pod中的容器没有设置CPU和Memory requests与limits。

例如：

``` yaml
resources: {}
```

特点：

-   没有明确资源保障；
-   节点资源紧张时风险较高。

适合：

-   非关键任务；
-   临时测试。

生产核心服务通常不建议使用。

------------------------------------------------------------------------

# 14. QoS与Pod驱逐

当Node发生资源压力：

``` text
MemoryPressure

↓

Eviction Manager

↓

评估Pod

↓

驱逐部分Pod
```

QoS会影响驱逐风险，但实际驱逐还会结合：

-   Pod Priority；
-   资源使用是否超过requests；
-   资源压力类型；
-   实际资源使用量。

因此不能简单理解为：

``` text
BestEffort一定先于所有Burstable被驱逐
```

更准确的理解是：

> Kubernetes会综合QoS、Priority、资源请求与实际使用情况进行驱逐决策。

------------------------------------------------------------------------

# 15. ResourceQuota命名空间资源配额（★★★★★）

ResourceQuota：

> 用于限制Namespace整体可使用的资源。

例如：

``` yaml
apiVersion: v1
kind: ResourceQuota

metadata:
  name: compute-quota

spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
```

结构：

``` text
Namespace

↓

ResourceQuota

↓

限制全部Pod总体资源
```

作用：

-   防止单个团队占满集群；
-   实现多租户资源隔离；
-   控制资源成本。

------------------------------------------------------------------------

# 16. LimitRange默认资源限制

LimitRange：

> 用于在Namespace中约束或默认设置单个Pod/Container的资源范围。

例如可以定义：

-   默认request；
-   默认limit；
-   最小资源；
-   最大资源。

关系：

``` text
Namespace

↓

LimitRange

↓

Pod / Container资源规则
```

ResourceQuota和LimitRange区别：

  ResourceQuota       LimitRange
  ------------------- ----------------------
  限制Namespace整体   限制单个对象资源范围
  总量控制            单体控制
  团队级治理          Pod/Container级治理

------------------------------------------------------------------------

# 17. 资源利用率与超卖

如果：

``` text
requests < limits
```

多个Pod可以共享节点上的空闲能力。

例如：

``` text
Node CPU = 8 Core

Pod A request = 2
Pod B request = 2
Pod C request = 2
```

Scheduler按requests进行资源承诺。

实际运行时，各Pod可能根据空闲资源进行突发使用。

优势：

-   提高资源利用率；
-   降低资源浪费。

风险：

-   高峰期资源竞争；
-   CPU节流；
-   内存压力。

因此资源规划需要在：

``` text
稳定性

与

资源利用率
```

之间取得平衡。

------------------------------------------------------------------------

# 18. 生产环境资源规划

生产环境建议首先建立：

``` text
监控数据

↓

历史资源使用

↓

容量分析

↓

requests / limits设置
```

例如：

业务实际CPU：

``` text
平均：300m

P95：600m

峰值：900m
```

可以结合业务SLA设置合理资源值，而不是直接拍脑袋配置。

同时需要考虑：

-   应用启动峰值；
-   JVM/Node.js等运行时特征；
-   流量高峰；
-   故障切换后的额外负载；
-   节点预留资源。

------------------------------------------------------------------------

# 19. Kubernetes资源管理最佳实践

建议：

1.  生产Pod尽量设置requests；
2.  Memory limit需要结合实际峰值；
3.  避免requests设置过大造成资源浪费；
4.  避免requests设置过小造成节点过度承诺；
5.  核心服务采用更明确的资源保障策略；
6.  使用ResourceQuota限制团队总体资源；
7.  使用LimitRange规范默认配置；
8.  配合Prometheus等监控持续优化资源参数；
9.  将Pod Priority、QoS和驱逐策略结合考虑。

------------------------------------------------------------------------

# 20. 系统架构设计师考点

## requests作用？

答：

> requests表示Pod运行所请求的资源基线，是Scheduler判断节点是否具有足够可分配资源的重要依据。

------------------------------------------------------------------------

## limits作用？

答：

> limits限制Container运行过程中可使用的资源上限。

------------------------------------------------------------------------

## requests和limits区别？

答：

> requests主要用于资源调度和保障基线，limits主要用于限制运行时资源使用上限。

------------------------------------------------------------------------

## Kubernetes QoS有哪些等级？

答：

> Guaranteed、Burstable和BestEffort。

------------------------------------------------------------------------

## Guaranteed特点？

答：

> 对CPU和Memory设置明确且满足request等于limit等条件，资源保障程度最高。

------------------------------------------------------------------------

## ResourceQuota作用？

答：

> ResourceQuota用于限制Namespace整体可使用的资源总量。

------------------------------------------------------------------------

## LimitRange作用？

答：

> LimitRange用于限制或默认设置Namespace内单个Pod或Container的资源范围。

------------------------------------------------------------------------

## CPU和Memory超过limit有什么区别？

答：

> CPU超过限制通常会受到节流，而Memory超过限制可能触发OOM并导致容器被终止。

------------------------------------------------------------------------

# 21. Mermaid资源管理架构图

``` mermaid
flowchart TD

A[Pod资源配置]

A --> B[requests]
A --> C[limits]

B --> D[Scheduler]
D --> E[Node选择]

C --> F[运行时资源控制]
F --> G[CPU Throttling]
F --> H[Memory OOM]

A --> I[QoS Class]

I --> J[Guaranteed]
I --> K[Burstable]
I --> L[BestEffort]

M[Namespace] --> N[ResourceQuota]
M --> O[LimitRange]

N --> P[总体资源治理]
O --> Q[Pod/Container资源规则]
```

------------------------------------------------------------------------

# 22. 本节小结

Kubernetes资源管理核心知识：

1.  CPU和Memory是最重要的计算资源；
2.  requests表示资源请求基线；
3.  limits表示资源使用上限；
4.  Scheduler主要根据requests进行节点资源匹配；
5.  CPU超过limit通常产生节流；
6.  Memory超过limit可能触发OOM；
7.  QoS分为Guaranteed、Burstable和BestEffort；
8.  ResourceQuota控制Namespace总体资源；
9.  LimitRange控制单个Pod/Container资源范围；
10. 生产环境需要根据监控数据持续优化资源配置。

------------------------------------------------------------------------

# 一句话冲刺记忆

> requests决定Pod"需要多少资源"，limits决定"最多使用多少资源"，QoS决定资源保障等级，ResourceQuota和LimitRange负责Namespace资源治理。
