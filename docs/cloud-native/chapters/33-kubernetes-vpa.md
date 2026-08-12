# 33 Kubernetes VPA 垂直自动扩缩容与资源优化

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes Vertical Pod
> Autoscaler（VPA）垂直自动扩缩容，包括资源推荐、核心组件、更新模式、Pod重建机制，以及
> VPA 与 HPA、Cluster Autoscaler 的区别和协同关系。

------------------------------------------------------------------------

# 目录

1.  VPA概述
2.  为什么需要VPA
3.  垂直扩缩容基本原理
4.  VPA整体架构
5.  VPA核心组件
6.  VPA工作流程
7.  VPA资源推荐机制
8.  CPU与Memory资源优化
9.  VPA更新模式
10. VPA YAML配置
11. VPA与requests的关系
12. VPA与Pod更新机制
13. VPA与HPA区别
14. VPA与HPA协同问题
15. VPA与Cluster Autoscaler
16. Kubernetes三层弹性体系
17. VPA典型应用场景
18. VPA局限与注意事项
19. VPA生产环境最佳实践
20. 系统架构设计师考点
21. Mermaid架构图
22. 本节小结

------------------------------------------------------------------------

# 1. VPA概述（★★★★★）

VPA：

> Vertical Pod Autoscaler，垂直Pod自动扩缩容。

核心目标：

> 根据工作负载的历史和当前资源使用情况，为Pod推荐或调整CPU、Memory等资源请求。

例如：

``` text
原Pod

CPU Request = 500m
Memory Request = 512Mi

↓

VPA分析资源使用

↓

推荐/调整

↓

CPU Request = 1 Core
Memory Request = 1Gi
```

与HPA最大的区别：

``` text
HPA

Pod数量变化


VPA

单个Pod资源配置变化
```

一句话：

> HPA让Pod变多或变少，VPA让Pod变大或变小。

------------------------------------------------------------------------

# 2. 为什么需要VPA

生产环境中，requests经常难以一次设置准确。

设置过大：

``` text
实际CPU = 200m

Request = 2 Core

↓

大量资源被预留

↓

集群利用率降低
```

设置过小：

``` text
实际CPU = 1 Core

Request = 200m

↓

资源保障不足

↓

节点资源竞争风险增加
```

VPA通过持续分析实际资源使用，帮助优化：

-   CPU requests；
-   Memory requests；
-   资源利用率；
-   容量规划。

------------------------------------------------------------------------

# 3. 垂直扩缩容基本原理

所谓垂直扩缩容：

> 调整单个Pod可申请或使用的计算资源，而不是改变Pod副本数量。

示意：

``` text
Pod

CPU 500m
Memory 512Mi

↓

Vertical Scaling

↓

Pod

CPU 1 Core
Memory 1Gi
```

对应：

``` text
水平扩容

3 Pods → 6 Pods


垂直扩容

500m CPU → 1000m CPU
```

------------------------------------------------------------------------

# 4. VPA整体架构

VPA典型架构：

``` text
Pod Metrics

↓

VPA Recommender

↓

资源推荐

↓

VPA Updater

↓

需要时更新Pod

↓

Admission Controller

↓

为新Pod应用推荐资源
```

核心思想：

``` text
监控

↓

分析

↓

推荐

↓

更新

↓

持续优化
```

------------------------------------------------------------------------

# 5. VPA核心组件（★★★★★）

VPA主要由三个核心组件组成。

## 5.1 Recommender

职责：

> 根据资源使用情况计算CPU和Memory推荐值。

流程：

``` text
Metrics

↓

Recommender

↓

Recommendation
```

它是VPA资源决策的核心组件。

------------------------------------------------------------------------

## 5.2 Updater

职责：

> 判断已有Pod是否需要根据新的推荐值进行更新，并在相应模式下协调Pod更新。

结构：

``` text
Recommendation

↓

Updater

↓

Pod需要调整

↓

触发更新流程
```

------------------------------------------------------------------------

## 5.3 Admission Controller

职责：

> 在Pod创建过程中，根据VPA推荐结果修改Pod资源请求。

流程：

``` text
Pod Create

↓

Admission Controller

↓

注入推荐requests

↓

Pod运行
```

------------------------------------------------------------------------

# 6. VPA工作流程

典型流程：

``` text
Pod运行

↓

采集CPU / Memory指标

↓

Recommender分析

↓

生成资源推荐

↓

Updater判断是否需要更新

↓

Pod重新创建或应用新的资源配置

↓

Admission Controller设置新的requests
```

形成闭环：

``` text
运行

↓

监控

↓

推荐

↓

更新

↓

再次运行
```

------------------------------------------------------------------------

# 7. VPA资源推荐机制

VPA会根据工作负载资源使用情况生成推荐值。

通常可以关注：

-   target；
-   lowerBound；
-   upperBound；
-   uncappedTarget。

可以理解为：

``` text
lowerBound

↓

target

↓

upperBound
```

其中：

## target

推荐的目标资源值。

## lowerBound

较低的资源建议边界。

## upperBound

较高的资源建议边界。

------------------------------------------------------------------------

# 8. CPU与Memory资源优化

例如某服务：

``` text
CPU Request = 2 Core

实际长期使用 = 400m
```

VPA可能建议降低CPU request：

``` text
2 Core

↓

600m
```

减少资源浪费。

另一种情况：

``` text
Memory Request = 512Mi

实际长期使用接近1Gi
```

VPA可能建议：

``` text
512Mi

↓

1Gi或更高
```

降低资源不足风险。

因此VPA既可以：

``` text
向上调整

也可以

向下优化
```

------------------------------------------------------------------------

# 9. VPA更新模式（★★★★★）

VPA的具体可用模式与版本有关，但学习时需要掌握几个核心思路。

## Off

只提供推荐：

``` text
VPA

↓

Recommendation

↓

不自动修改Pod
```

非常适合：

-   初期观察；
-   容量分析；
-   生产环境评估。

------------------------------------------------------------------------

## 自动应用推荐

在允许自动更新的模式下，VPA可以根据推荐值调整Pod资源。

传统实现中，已有Pod的部分资源调整可能需要：

``` text
Pod终止

↓

重新创建Pod

↓

应用新requests
```

现代Kubernetes也在持续演进原地资源调整能力，因此生产使用时应结合实际Kubernetes与VPA版本确认行为。

------------------------------------------------------------------------

# 10. VPA YAML配置

示例：

``` yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler

metadata:
  name: web-vpa

spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web

  updatePolicy:
    updateMode: "Off"
```

含义：

``` text
targetRef

↓

指定优化对象


updatePolicy

↓

定义资源推荐如何应用
```

使用Off模式时：

> VPA主要用于生成资源推荐，不自动修改正在运行的工作负载。

------------------------------------------------------------------------

# 11. VPA与requests的关系（★★★★★）

VPA优化的重点之一：

``` text
resources.requests
```

例如原配置：

``` yaml
resources:
  requests:
    cpu: "200m"
    memory: "256Mi"
```

VPA分析后可能推荐：

``` yaml
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
```

requests变化又会影响：

``` text
Scheduler

↓

Node资源匹配

↓

Pod调度
```

因此：

> VPA不仅影响单Pod资源配置，也会间接影响集群调度和容量利用。

------------------------------------------------------------------------

# 12. VPA与Pod更新机制

传统场景中，如果需要修改已有Pod的资源请求：

``` text
旧Pod

↓

终止/替换

↓

新Pod

↓

使用新的requests
```

这意味着VPA可能对业务产生：

-   Pod重建；
-   短暂容量变化；
-   启动延迟。

因此生产环境需要配合：

-   多副本；
-   PodDisruptionBudget；
-   Readiness Probe；
-   合理更新策略。

------------------------------------------------------------------------

# 13. VPA与HPA区别（★★★★★）

  机制       HPA                       VPA
  ---------- ------------------------- ----------------
  扩缩对象   Pod数量                   单Pod资源
  扩容方式   水平                      垂直
  典型变化   3 Pods → 8 Pods           500m → 1 CPU
  关注指标   CPU、Memory、业务指标等   资源使用与推荐
  主要目标   处理负载变化              优化资源配置

记忆：

``` text
HPA

Pod变多 / 变少


VPA

Pod变大 / 变小
```

------------------------------------------------------------------------

# 14. VPA与HPA协同问题（★★★★★）

如果HPA和VPA同时基于相同CPU或Memory信号进行调整，可能产生相互影响。

例如：

``` text
CPU升高

↓

HPA认为需要增加Pod


同时


VPA认为需要增加CPU Request
```

两种控制器同时改变系统状态：

``` text
副本数变化

+

资源请求变化
```

可能增加调优复杂度。

常见设计思路：

``` text
HPA

使用业务/外部指标


VPA

优化CPU / Memory requests
```

或者：

> 根据业务特点明确两种Autoscaler的职责边界。

------------------------------------------------------------------------

# 15. VPA与Cluster Autoscaler

VPA调整：

``` text
Pod资源
```

Cluster Autoscaler调整：

``` text
Node数量
```

关系示例：

``` text
VPA提高Pod Request

↓

现有Node无法容纳Pod

↓

Pod Pending

↓

Cluster Autoscaler增加Node

↓

Scheduler完成调度
```

因此二者可以形成：

``` text
Pod资源优化

+

集群容量弹性
```

------------------------------------------------------------------------

# 16. Kubernetes三层弹性体系（★★★★★）

可以把Kubernetes弹性理解为三层：

``` text
第一层：HPA

Pod数量变化


第二层：VPA

Pod资源变化


第三层：Cluster Autoscaler

Node数量变化
```

完整关系：

``` text
业务负载

↓

HPA / VPA

↓

Pod层资源变化

↓

Scheduler

↓

Node容量不足

↓

Cluster Autoscaler

↓

Node扩容
```

这是云原生弹性架构的重要思路。

------------------------------------------------------------------------

# 17. VPA典型应用场景

## 场景一：资源配置不明确

新应用上线：

``` text
不知道应该配置多少CPU / Memory
```

先使用：

``` text
VPA Off
```

观察推荐值。

------------------------------------------------------------------------

## 场景二：长期稳定工作负载

例如：

-   内部后台服务；
-   企业管理系统；
-   稳定周期任务。

VPA可以根据历史数据持续优化requests。

------------------------------------------------------------------------

## 场景三：资源浪费治理

大量Pod：

``` text
Request远大于实际使用
```

VPA帮助识别：

``` text
资源过度申请
```

提高集群利用率。

------------------------------------------------------------------------

# 18. VPA局限与注意事项

VPA并不是所有场景都适合。

需要关注：

## Pod更新影响

资源变化可能涉及Pod更新或重建。

------------------------------------------------------------------------

## HPA冲突

需要避免两个Autoscaler对相同资源信号进行不合理的同时控制。

------------------------------------------------------------------------

## 应用自身限制

有些应用：

``` text
增加CPU

并不会提高性能
```

例如瓶颈可能来自：

-   数据库；
-   网络；
-   外部API；
-   锁竞争。

------------------------------------------------------------------------

## Node容量限制

VPA增加资源后：

``` text
Pod Request > Node剩余容量

↓

Pod Pending
```

因此需要结合集群容量设计。

------------------------------------------------------------------------

# 19. VPA生产环境最佳实践

建议：

1.  初期优先使用推荐模式观察；
2.  根据历史数据验证推荐值；
3.  核心服务采用多副本；
4.  配合PodDisruptionBudget；
5.  关注Pod更新对业务的影响；
6.  避免与HPA产生资源指标控制冲突；
7.  配合Cluster Autoscaler考虑节点容量；
8.  持续监控CPU、Memory和OOM情况；
9.  不要把VPA当成解决应用性能问题的万能工具；
10. 根据实际Kubernetes和VPA版本确认更新模式与原地资源调整能力。

------------------------------------------------------------------------

# 20. 系统架构设计师考点

## 什么是VPA？

答：

> VPA是Kubernetes垂直Pod自动扩缩容机制，通过分析资源使用情况，为Pod推荐或调整CPU、Memory等资源请求。

------------------------------------------------------------------------

## VPA核心组件有哪些？

答：

> 主要包括Recommender、Updater和Admission Controller。

------------------------------------------------------------------------

## Recommender作用？

答：

> 根据Pod资源使用情况计算CPU和Memory推荐值。

------------------------------------------------------------------------

## VPA和HPA区别？

答：

> HPA通过增加或减少Pod数量进行水平扩缩容，VPA通过调整单个Pod资源请求进行垂直资源优化。

------------------------------------------------------------------------

## VPA和Cluster Autoscaler区别？

答：

> VPA调整Pod资源配置，Cluster Autoscaler调整集群Node数量。

------------------------------------------------------------------------

## 为什么VPA可能导致Pod更新？

答：

> 因为资源请求发生变化时，传统场景可能需要重新创建Pod才能应用新的资源配置。

------------------------------------------------------------------------

## Kubernetes三层弹性是什么？

答：

> HPA负责Pod数量弹性，VPA负责Pod资源弹性，Cluster
> Autoscaler负责Node容量弹性。

------------------------------------------------------------------------

# 21. Mermaid架构图

``` mermaid
flowchart TD

A[Pod资源指标] --> B[VPA Recommender]

B --> C[CPU/Memory Recommendation]

C --> D[VPA Updater]

D --> E{是否需要更新}

E -->|否| F[继续监控]
E -->|是| G[Pod更新/替换]

G --> H[Admission Controller]

H --> I[应用新的Requests]

I --> J[Pod运行]

J --> A

K[HPA] --> L[调整Pod数量]
M[Cluster Autoscaler] --> N[调整Node数量]
```

------------------------------------------------------------------------

# 22. 本节小结

VPA核心知识：

1.  VPA实现Pod垂直资源优化；
2.  主要调整CPU和Memory requests；
3.  Recommender负责计算资源推荐；
4.  Updater负责判断和协调已有Pod更新；
5.  Admission Controller负责为新Pod应用推荐资源；
6.  Off模式适合生产环境前期观察和容量分析；
7.  VPA资源调整可能涉及Pod更新或重建；
8.  HPA负责Pod数量，VPA负责Pod资源；
9.  Cluster Autoscaler负责Node数量；
10. HPA、VPA和Cluster Autoscaler共同构成Kubernetes多层弹性体系。

------------------------------------------------------------------------

# 一句话冲刺记忆

> HPA让Pod"变多或变少"，VPA让Pod"变大或变小"，Cluster
> Autoscaler让Node"变多或变少"；三者共同构成Kubernetes应用、资源与集群容量的弹性体系。
