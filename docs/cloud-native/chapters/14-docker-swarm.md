# 14 Docker Swarm 集群编排与管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇从容器集群编排演进角度介绍 Docker Swarm，包括 Swarm
> 架构、Manager/Worker 节点、Service 模型、Task 调度、Overlay
> 网络、滚动更新、Secret 管理，以及 Swarm 与 Kubernetes 的区别。

------------------------------------------------------------------------

# 目录

1.  Docker Swarm概述
2.  为什么需要容器编排
3.  Docker Swarm整体架构
4.  Manager节点与Worker节点
5.  Swarm集群初始化
6.  Node节点管理
7.  Service服务模型
8.  Task任务调度机制
9.  Service副本管理
10. Swarm调度策略
11. Overlay网络
12. Service发现机制
13. 滚动更新与回滚
14. Secret管理
15. Swarm集群安全
16. Docker Swarm与Kubernetes比较
17. Swarm应用场景
18. 系统架构设计师考点
19. Mermaid架构图
20. 本节小结

------------------------------------------------------------------------

# 1. Docker Swarm概述

Docker Swarm：

> Docker官方提供的原生容器集群编排工具，用于将多个Docker节点组成统一资源池。

核心能力：

-   集群管理；
-   服务调度；
-   服务发现；
-   副本管理；
-   滚动更新。

架构：

``` text
Docker Host

↓

Swarm Cluster

↓

Container Services
```

------------------------------------------------------------------------

# 2. 为什么需要容器编排

单机Docker：

``` text
Host

├── Container A
├── Container B
└── Container C
```

问题：

-   单点故障；
-   无统一调度；
-   扩展困难；
-   缺少自动恢复能力。

集群编排：

``` text
Node A

Node B

Node C

↓

Container Platform
```

提供：

-   自动调度；
-   高可用；
-   弹性扩展。

------------------------------------------------------------------------

# 3. Docker Swarm整体架构

Swarm由：

``` text
Swarm Cluster

├── Manager Node
└── Worker Node
```

组成。

架构：

``` text
             Manager

                ↓

--------------------------------

Node1        Node2        Node3

Worker       Worker       Worker
```

------------------------------------------------------------------------

# 4. Manager节点与Worker节点

## Manager节点

负责：

-   集群状态管理；
-   任务调度；
-   Raft一致性；
-   API管理。

------------------------------------------------------------------------

## Worker节点

负责：

-   执行任务；
-   运行容器。

关系：

``` text
Manager

↓

Task

↓

Worker

↓

Container
```

------------------------------------------------------------------------

# 5. Swarm集群初始化

初始化：

``` bash
docker swarm init
```

生成：

-   Manager节点；
-   Join Token。

Worker加入：

``` bash
docker swarm join
```

------------------------------------------------------------------------

# 6. Node节点管理

查看节点：

``` bash
docker node ls
```

节点状态：

-   Ready；
-   Down；
-   Drain。

Drain模式：

> 节点停止接收新的任务，常用于维护操作。

------------------------------------------------------------------------

# 7. Service服务模型

Swarm中：

> Service描述应用期望运行状态。

例如：

``` text
Web Service

↓

3 Replica

↓

3 Container
```

创建：

``` bash
docker service create nginx
```

------------------------------------------------------------------------

# 8. Task任务调度机制

关系：

``` text
Service

↓

Task

↓

Container
```

例如：

``` text
nginx Service

↓

Task1

Task2

Task3

↓

Container
```

Task是Swarm调度的基本执行单元。

------------------------------------------------------------------------

# 9. Service副本管理

创建副本：

``` bash
docker service create \
--replicas 3 \
nginx
```

效果：

``` text
Service

├── Replica1
├── Replica2
└── Replica3
```

优势：

-   高可用；
-   故障自动补充。

------------------------------------------------------------------------

# 10. Swarm调度策略

Scheduler根据：

-   CPU资源；
-   内存资源；
-   节点状态；

选择运行节点。

流程：

``` text
Service

↓

Scheduler

↓

Available Node

↓

Task
```

------------------------------------------------------------------------

# 11. Overlay网络

Swarm支持跨节点通信。

结构：

``` text
Node A

Container

↓

Overlay Network

↓

Node B

Container
```

作用：

-   实现跨主机通信；
-   支持Service发现。

------------------------------------------------------------------------

# 12. Service发现机制

Swarm提供内部服务发现。

流程：

``` text
service-name

↓

Service IP

↓

Container
```

应用不需要依赖固定容器IP。

------------------------------------------------------------------------

# 13. 滚动更新与回滚

更新：

``` bash
docker service update
```

流程：

``` text
Old Container

↓

New Container

↓

逐步替换
```

优势：

-   降低发布风险；
-   减少服务中断。

回滚：

``` bash
docker service rollback
```

------------------------------------------------------------------------

# 14. Secret管理

Secret用于保存：

-   密码；
-   Token；
-   密钥。

流程：

``` text
Secret

↓

Service

↓

Container
```

避免：

-   写入镜像；
-   明文配置。

------------------------------------------------------------------------

# 15. Swarm集群安全

包括：

-   节点认证；
-   TLS通信；
-   Secret管理；
-   权限控制。

------------------------------------------------------------------------

# 16. Docker Swarm与Kubernetes比较

  能力             Swarm   Kubernetes
  ---------------- ------- ------------
  学习成本         低      较高
  集群管理         支持    支持
  服务编排         支持    强大
  自动扩缩容       基础    完善
  生态             较小    丰富
  大规模生产环境   较少    主流

技术演进：

``` text
Docker

↓

Docker Compose

↓

Docker Swarm

↓

Kubernetes

↓

Cloud Native Platform
```

------------------------------------------------------------------------

# 17. Swarm应用场景

适合：

-   小规模集群；
-   快速部署；
-   Docker生态环境。

不足：

-   生态规模较小；
-   高级治理能力有限。

------------------------------------------------------------------------

# 18. 系统架构设计师考点

## Docker Swarm作用？

答：

> Docker
> Swarm是Docker原生容器编排工具，用于将多个Docker节点组成集群，实现服务部署、任务调度和高可用管理。

------------------------------------------------------------------------

## Manager节点作用？

答：

> Manager节点负责集群状态维护、任务调度、节点管理以及控制面功能。

------------------------------------------------------------------------

## Service和Task关系？

答：

> Service描述应用运行目标，Task是Service调度产生的执行单元，最终运行Container。

------------------------------------------------------------------------

## Overlay网络作用？

答：

> Overlay网络用于实现跨Docker节点的容器通信，是Swarm集群服务通信的重要基础。

------------------------------------------------------------------------

## Swarm为什么逐渐被Kubernetes替代？

答：

> Kubernetes提供更完善的集群调度、弹性伸缩、自愈、服务治理和生态支持，更适合大规模生产环境。

------------------------------------------------------------------------

# 19. Mermaid架构图

``` mermaid
flowchart TD

    A[Swarm Cluster]

    A --> B[Manager Node]

    A --> C[Worker Node 1]
    A --> D[Worker Node 2]
    A --> E[Worker Node 3]

    B --> F[Scheduler]

    F --> G[Task]

    G --> C
    G --> D
    G --> E

    C --> H[Container]
    D --> I[Container]
    E --> J[Container]
```

------------------------------------------------------------------------

# 20. 本节小结

Docker Swarm是Docker生态中的集群编排方案。

核心知识：

1.  Swarm将多个Docker节点组成统一集群；
2.  Manager负责控制面和调度；
3.  Worker负责执行任务；
4.  Service描述应用运行目标；
5.  Task是实际执行单元；
6.  Overlay网络支持跨节点通信；
7.  Secret用于安全管理敏感数据；
8.  Swarm适合简单场景，而Kubernetes更适合大规模云原生平台。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Swarm中Manager管调度，Worker跑任务，Service定义目标，Task执行实例，Overlay负责通信，Secret保护敏感数据。

下一篇：

📄 `15-docker-best-practice.md（Docker企业最佳实践与生产部署规范）`
