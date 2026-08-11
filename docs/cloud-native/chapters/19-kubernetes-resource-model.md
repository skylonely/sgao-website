# 19 Kubernetes 资源模型与对象体系

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes 资源模型、对象体系以及声明式管理思想，重点讲解
> Object、Metadata、Spec、Status、Namespace、Label、Selector、Annotation
> 等核心概念。

------------------------------------------------------------------------

# 目录

1.  Kubernetes资源模型概述
2.  Kubernetes对象(Object)
3.  Kubernetes API Resource体系
4.  Object基本结构
5.  Metadata元数据
6.  Spec期望状态
7.  Status实际状态
8.  Declarative API声明式管理
9.  Namespace资源隔离
10. Label标签体系
11. Selector选择器
12. Annotation注解
13. Resource生命周期
14. Kubernetes资源类型
15. YAML资源描述模型
16. kubectl资源管理
17. Kubernetes控制循环
18. 系统架构设计师考点
19. Mermaid对象模型图
20. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes资源模型概述

Kubernetes采用：

> 面向对象 + 声明式管理模型。

用户不是直接管理Container，而是描述资源对象的目标状态。

例如：

``` yaml
replicas: 3
```

表示：

> 希望系统运行3个副本。

Kubernetes通过控制器自动完成实际状态调整。

------------------------------------------------------------------------

# 2. Kubernetes对象(Object)

Kubernetes对象：

> 是 Kubernetes API 中用于描述系统状态的持久化实体。

常见对象：

-   Pod；
-   Deployment；
-   Service；
-   ConfigMap；
-   Secret；
-   Namespace。

对象模型：

``` text
Kubernetes Object

├── Metadata
├── Spec
└── Status
```

------------------------------------------------------------------------

# 3. Kubernetes API Resource体系

Kubernetes通过API管理资源：

``` text
kubectl

↓

API Server

↓

Resource Object

↓

etcd
```

API资源主要通过：

-   /api；
-   /apis；

进行组织。

------------------------------------------------------------------------

# 4. Object基本结构

典型YAML：

``` yaml
apiVersion: apps/v1

kind: Deployment

metadata:
  name: nginx

spec:
  replicas: 3
```

对象主要组成：

``` text
Object

├── apiVersion
├── kind
├── metadata
├── spec
└── status
```

------------------------------------------------------------------------

# 5. Metadata元数据

Metadata描述对象身份信息。

包括：

-   name；
-   namespace；
-   labels；
-   annotations；
-   uid。

示例：

``` yaml
metadata:
  name: nginx
  namespace: default
```

------------------------------------------------------------------------

# 6. Spec期望状态

Spec表示：

> 用户希望 Kubernetes 达到的目标状态。

例如：

``` yaml
spec:
  replicas: 3
```

表示希望运行3个副本。

------------------------------------------------------------------------

# 7. Status实际状态

Status表示：

> Kubernetes当前实际运行状态。

例如：

``` yaml
status:
  availableReplicas: 3
```

核心关系：

``` text
Spec

↓

Controller

↓

Status
```

------------------------------------------------------------------------

# 8. Declarative API声明式管理

传统命令式：

``` text
创建一个容器

启动一个服务
```

声明式：

``` yaml
replicas: 3
```

用户描述目标状态。

Kubernetes自动调整：

``` text
Desired State

↓

Controller

↓

Actual State
```

------------------------------------------------------------------------

# 9. Namespace资源隔离

Namespace：

> Kubernetes中的逻辑资源隔离机制。

示例：

``` text
Cluster

├── dev
├── test
└── production
```

作用：

-   多环境隔离；
-   多租户管理；
-   权限控制。

------------------------------------------------------------------------

# 10. Label标签体系

Label：

> 用于给资源对象添加标识信息。

示例：

``` yaml
labels:
  app: nginx
  version: v1
```

用途：

-   查询资源；
-   分组管理；
-   Selector匹配。

------------------------------------------------------------------------

# 11. Selector选择器

Selector：

> 根据Label选择资源。

例如：

``` yaml
selector:
  app: nginx
```

匹配：

``` text
Pod

label:
app=nginx
```

关系：

``` text
Service

↓

Selector

↓

Pod
```

------------------------------------------------------------------------

# 12. Annotation注解

Annotation：

用于保存额外描述信息。

例如：

-   描述信息；
-   版本信息；
-   工具配置。

区别：

  Label          Annotation
  -------------- --------------
  用于选择对象   用于记录信息
  参与查询       不参与选择

------------------------------------------------------------------------

# 13. Resource生命周期

资源生命周期：

``` text
Create

↓

Persist

↓

Observe

↓

Update

↓

Delete
```

资源状态存储在etcd中。

------------------------------------------------------------------------

# 14. Kubernetes资源类型

## 工作负载资源

包括：

-   Pod；
-   Deployment；
-   StatefulSet；
-   DaemonSet。

------------------------------------------------------------------------

## 服务资源

包括：

-   Service；
-   Ingress。

------------------------------------------------------------------------

## 配置资源

包括：

-   ConfigMap；
-   Secret。

------------------------------------------------------------------------

## 存储资源

包括：

-   Volume；
-   PV；
-   PVC。

------------------------------------------------------------------------

# 15. YAML资源描述模型

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

特点：

-   人类可读；
-   支持版本管理；
-   描述目标状态。

------------------------------------------------------------------------

# 16. kubectl资源管理

查看：

``` bash
kubectl get pods
```

创建：

``` bash
kubectl apply -f app.yaml
```

删除：

``` bash
kubectl delete -f app.yaml
```

------------------------------------------------------------------------

# 17. Kubernetes控制循环

核心机制：

``` text
用户提交对象

↓

API Server

↓

Controller

↓

调整资源

↓

达到目标状态
```

------------------------------------------------------------------------

# 18. 系统架构设计师考点

## Kubernetes对象由哪些部分组成？

答：

> Kubernetes对象通常包含apiVersion、kind、metadata、spec和status，其中spec描述期望状态，status描述实际状态。

------------------------------------------------------------------------

## Spec和Status区别？

答：

> Spec表示用户声明的目标状态，Status表示系统当前实际状态，Controller负责使两者最终一致。

------------------------------------------------------------------------

## Label作用？

答：

> Label用于给资源对象添加标识信息，Selector通过Label选择和关联资源。

------------------------------------------------------------------------

## Namespace作用？

答：

> Namespace用于实现Kubernetes资源逻辑隔离，支持多环境和多租户管理。

------------------------------------------------------------------------

# 19. Mermaid对象模型图

``` mermaid
flowchart TD

A[Kubernetes Object]

A --> B[Metadata]

A --> C[Spec]

A --> D[Status]

B --> B1[Name]
B --> B2[Namespace]
B --> B3[Labels]
B --> B4[Annotations]

C --> E[Desired State]

D --> F[Actual State]

E --> G[Controller]

G --> F
```

------------------------------------------------------------------------

# 20. 本节小结

Kubernetes资源模型核心：

1.  Kubernetes通过对象模型管理系统状态；
2.  Object由Metadata、Spec、Status组成；
3.  Spec表示期望状态；
4.  Status表示实际状态；
5.  Controller负责状态收敛；
6.  Namespace实现资源隔离；
7.  Label和Selector实现对象关联；
8.  YAML是声明式资源描述方式。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Kubernetes管理的不是Container，而是Resource
> Object；Spec描述目标，Status描述现实，Controller负责让二者保持一致。
