# 21 Kubernetes Deployment 应用管理与滚动更新

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes Deployment 工作负载对象，包括 Deployment 与
> Pod、ReplicaSet
> 的关系、副本管理、声明式应用管理、滚动更新、版本回滚以及生产实践。

------------------------------------------------------------------------

# 目录

1.  Deployment概述
2.  为什么需要Deployment
3.  Deployment与Pod关系
4.  Deployment与ReplicaSet关系
5.  Deployment资源模型
6.  Deployment YAML结构
7.  副本管理机制
8.  声明式应用管理
9.  滚动更新机制
10. 发布策略
11. Deployment版本管理
12. 应用回滚机制
13. 更新参数配置
14. Deployment扩缩容
15. Deployment状态管理
16. Deployment最佳实践
17. 系统架构设计师考点
18. Mermaid架构图
19. 本节小结

------------------------------------------------------------------------

# 1. Deployment概述

Deployment：

> Kubernetes中用于管理无状态应用生命周期的高级控制器。

主要能力：

-   创建Pod；
-   管理副本；
-   自动恢复；
-   滚动升级；
-   版本回滚。

架构：

``` text
Deployment

↓

ReplicaSet

↓

Pod

↓

Container
```

------------------------------------------------------------------------

# 2. 为什么需要Deployment

直接创建Pod：

``` text
Pod

↓

Container
```

存在问题：

-   Pod异常无法自动恢复；
-   缺少副本管理；
-   无升级机制；
-   无版本回滚。

Deployment解决：

``` text
Application

↓

Deployment

↓

Multiple Pods
```

------------------------------------------------------------------------

# 3. Deployment与Pod关系

关系：

``` text
Deployment

↓

ReplicaSet

↓

Pod

↓

Container
```

职责：

  对象         职责
  ------------ --------------
  Deployment   应用发布管理
  ReplicaSet   保证Pod数量
  Pod          运行应用
  Container    执行程序

------------------------------------------------------------------------

# 4. Deployment与ReplicaSet关系

ReplicaSet：

> 保证指定数量Pod副本始终运行。

例如：

``` yaml
replicas: 3
```

目标：

``` text
Pod

Pod

Pod
```

如果Pod异常：

``` text
Pod故障

↓

ReplicaSet

↓

创建新Pod
```

------------------------------------------------------------------------

# 5. Deployment资源模型

Deployment结构：

``` text
Deployment

├── Metadata
├── Spec
└── Status
```

Spec包含：

-   replicas；
-   selector；
-   template；
-   strategy。

------------------------------------------------------------------------

# 6. Deployment YAML结构

示例：

``` yaml
apiVersion: apps/v1

kind: Deployment

metadata:
  name: nginx

spec:
  replicas: 3

  selector:
    matchLabels:
      app: nginx

  template:
    metadata:
      labels:
        app: nginx

    spec:
      containers:
      - name: nginx
        image: nginx
```

------------------------------------------------------------------------

# 7. 副本管理机制

目标：

``` text
replicas: 3
```

实际：

``` text
Pod1

Pod2

Pod3
```

控制流程：

``` text
Desired State

↓

ReplicaSet

↓

Pod数量调整
```

------------------------------------------------------------------------

# 8. 声明式应用管理

用户描述目标：

``` yaml
replicas: 5
```

Kubernetes自动：

-   创建Pod；
-   删除Pod；
-   调整数量。

核心：

``` text
声明目标

↓

自动收敛
```

------------------------------------------------------------------------

# 9. 滚动更新机制

Deployment默认策略：

> RollingUpdate（滚动更新）

旧版本：

``` text
Pod v1

Pod v1

Pod v1
```

逐步替换：

``` text
Pod v1

Pod v1

Pod v2
```

最终：

``` text
Pod v2

Pod v2

Pod v2
```

特点：

-   服务不中断；
-   平滑升级；
-   降低发布风险。

------------------------------------------------------------------------

# 10. 发布策略

## RollingUpdate

默认方式：

-   分批替换旧版本Pod。

------------------------------------------------------------------------

## Recreate

流程：

``` text
删除旧Pod

↓

创建新Pod
```

特点：

-   实现简单；
-   存在停机时间。

------------------------------------------------------------------------

# 11. Deployment版本管理

查看历史：

``` bash
kubectl rollout history deployment nginx
```

查看状态：

``` bash
kubectl rollout status deployment nginx
```

------------------------------------------------------------------------

# 12. 应用回滚机制

回滚：

``` bash
kubectl rollout undo deployment nginx
```

流程：

``` text
Version 2

↓

Rollback

↓

Version 1
```

用途：

-   新版本异常恢复；
-   快速故障处理。

------------------------------------------------------------------------

# 13. 更新参数配置

滚动更新常用参数：

## maxSurge

允许超过期望副本数创建的Pod数量。

------------------------------------------------------------------------

## maxUnavailable

允许不可用Pod数量。

示例：

``` yaml
strategy:
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

表示：

-   最多额外创建1个Pod；
-   不允许服务不可用。

------------------------------------------------------------------------

# 14. Deployment扩缩容

扩容：

``` bash
kubectl scale deployment nginx \
--replicas=5
```

效果：

``` text
3 Pods

↓

5 Pods
```

------------------------------------------------------------------------

# 15. Deployment状态管理

查看：

``` bash
kubectl get deployment
```

状态：

-   Available；
-   Progressing；
-   Failed。

------------------------------------------------------------------------

# 16. Deployment最佳实践

建议：

-   不直接创建裸Pod；
-   使用Deployment管理无状态应用；
-   设置资源限制；
-   配置健康检查；
-   使用版本化镜像；
-   保留发布历史。

------------------------------------------------------------------------

# 17. 系统架构设计师考点

## Deployment作用？

答：

> Deployment用于管理无状态应用生命周期，实现Pod副本管理、滚动更新和版本回滚。

------------------------------------------------------------------------

## Deployment和ReplicaSet关系？

答：

> Deployment通过ReplicaSet管理Pod副本，ReplicaSet负责保证Pod数量满足期望状态。

------------------------------------------------------------------------

## 为什么需要滚动更新？

答：

> 滚动更新可以逐步替换旧版本应用，实现服务不中断升级。

------------------------------------------------------------------------

## Deployment和Pod区别？

答：

> Pod负责运行应用实例，Deployment负责管理应用生命周期和Pod副本。

------------------------------------------------------------------------

# 18. Mermaid架构图

``` mermaid
flowchart TD

A[Deployment]

↓

B[ReplicaSet]

↓

C[Pod 1]

C --> D[Container]

B --> E[Pod 2]

E --> F[Container]

B --> G[Pod 3]

G --> H[Container]
```

------------------------------------------------------------------------

# 19. 本节小结

Deployment核心知识：

1.  Deployment用于管理无状态应用；
2.  Deployment通过ReplicaSet控制Pod副本；
3.  ReplicaSet保证Pod数量符合目标状态；
4.  Deployment支持滚动更新；
5.  Deployment支持版本回滚；
6.  声明式管理是Kubernetes核心思想。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Deployment负责应用发布，ReplicaSet负责副本数量，Pod负责运行实例，滚动更新保证应用平滑升级。
