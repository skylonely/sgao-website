# 34 Kubernetes RBAC 权限控制与访问管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes RBAC（Role-Based Access
> Control，基于角色的访问控制），重点掌握
> Authentication、Authorization、Admission Control，以及
> Role、ClusterRole、RoleBinding、ClusterRoleBinding、ServiceAccount
> 和最小权限原则。

------------------------------------------------------------------------

# 目录

1.  Kubernetes访问控制概述
2.  Authentication、Authorization与Admission Control
3.  RBAC基本概念
4.  RBAC权限模型
5.  Role角色
6.  ClusterRole集群角色
7.  RoleBinding角色绑定
8.  ClusterRoleBinding集群角色绑定
9.  Role与ClusterRole区别
10. RoleBinding与ClusterRoleBinding区别
11. User、Group与ServiceAccount
12. ServiceAccount工作机制
13. RBAC YAML配置
14. Namespace级权限控制
15. Cluster级权限控制
16. 最小权限原则
17. 企业多租户权限设计
18. RBAC常见问题与排查
19. Kubernetes RBAC最佳实践
20. 系统架构设计师考点
21. Mermaid权限模型架构图
22. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes访问控制概述

Kubernetes集群中存在大量敏感操作：

-   创建和删除Pod；
-   修改Deployment；
-   读取Secret；
-   管理Node；
-   修改集群配置。

因此不能允许所有用户拥有相同权限。

访问控制核心问题：

``` text
谁？

↓

可以对什么资源？

↓

执行什么操作？
```

例如：

``` text
developer

↓

Namespace: dev

↓

get / list / watch Pods
```

RBAC的目标：

> 根据用户或工作负载所承担的角色授予相应权限。

------------------------------------------------------------------------

# 2. Authentication、Authorization与Admission Control（★★★★★）

一个典型Kubernetes API请求会经历：

``` text
API Request

↓

Authentication

↓

Authorization

↓

Admission Control

↓

API Resource
```

## Authentication

Authentication：

> 身份认证，解决"你是谁"。

例如：

-   客户端证书；
-   Token；
-   ServiceAccount凭据；
-   外部身份认证系统。

------------------------------------------------------------------------

## Authorization

Authorization：

> 授权，解决"你能做什么"。

RBAC属于：

``` text
Authorization
```

------------------------------------------------------------------------

## Admission Control

Admission Control：

> 在请求通过身份认证和授权之后，对资源创建或修改请求进行进一步校验或变更。

因此可以记忆：

``` text
Authentication

你是谁？


Authorization

你能做什么？


Admission Control

这个请求是否满足集群准入规则？
```

------------------------------------------------------------------------

# 3. RBAC基本概念（★★★★★）

RBAC：

> Role-Based Access Control，基于角色的访问控制。

核心思想：

不是直接给每个用户逐条配置权限，而是：

``` text
Permission

↓

Role

↓

Subject
```

例如：

``` text
Pod只读权限

↓

developer-role

↓

Developer用户
```

优势：

-   权限集中管理；
-   易于复用；
-   易于审计；
-   适合团队和企业权限体系。

------------------------------------------------------------------------

# 4. RBAC权限模型

Kubernetes RBAC核心对象：

``` text
Role
ClusterRole

RoleBinding
ClusterRoleBinding
```

基本关系：

``` text
Subject

↓

Binding

↓

Role

↓

Permissions
```

其中Subject可以是：

-   User；
-   Group；
-   ServiceAccount。

一句话：

> Role / ClusterRole定义"能做什么"，Binding定义"谁获得这些权限"。

------------------------------------------------------------------------

# 5. Role角色（★★★★★）

Role：

> 定义某个Namespace范围内的一组权限规则。

例如：

``` text
Namespace: dev

↓

Role: pod-reader

↓

get
list
watch

↓

Pods
```

YAML：

``` yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role

metadata:
  namespace: dev
  name: pod-reader

rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

------------------------------------------------------------------------

# 6. ClusterRole集群角色（★★★★★）

ClusterRole：

> 集群范围的角色定义，也可以被不同Namespace中的RoleBinding复用。

典型用途：

-   Node资源访问；
-   Namespace资源管理；
-   PersistentVolume等集群级资源；
-   定义跨Namespace可复用的权限集合。

示例：

``` yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole

metadata:
  name: node-reader

rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
```

------------------------------------------------------------------------

# 7. RoleBinding角色绑定

RoleBinding：

> 在指定Namespace中，将Role或ClusterRole授予某个Subject。

关系：

``` text
User / Group / ServiceAccount

↓

RoleBinding

↓

Role

↓

Namespace权限
```

示例：

``` yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding

metadata:
  name: read-pods
  namespace: dev

subjects:
- kind: User
  name: developer
  apiGroup: rbac.authorization.k8s.io

roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

------------------------------------------------------------------------

# 8. ClusterRoleBinding集群角色绑定（★★★★★）

ClusterRoleBinding：

> 将ClusterRole授予Subject，并使权限作用于集群范围。

关系：

``` text
Subject

↓

ClusterRoleBinding

↓

ClusterRole

↓

Cluster Scope
```

示例：

``` yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding

metadata:
  name: read-nodes

subjects:
- kind: User
  name: platform-admin
  apiGroup: rbac.authorization.k8s.io

roleRef:
  kind: ClusterRole
  name: node-reader
  apiGroup: rbac.authorization.k8s.io
```

------------------------------------------------------------------------

# 9. Role与ClusterRole区别（★★★★★）

  Role                   ClusterRole
  ---------------------- ----------------------------------
  Namespace级角色        集群级角色
  必须属于Namespace      不属于某个Namespace
  管理命名空间范围权限   可管理集群级资源或作为可复用角色
  适合项目权限           适合集群管理与通用权限

记忆：

``` text
Role

Namespace


ClusterRole

Cluster
```

------------------------------------------------------------------------

# 10. RoleBinding与ClusterRoleBinding区别

  RoleBinding                                    ClusterRoleBinding
  ---------------------------------------------- --------------------
  作用于指定Namespace                            作用于整个Cluster
  可引用Role                                     引用ClusterRole
  也可引用ClusterRole并限制在当前Namespace使用   授予集群范围权限

一个重要场景：

``` text
ClusterRole

↓

RoleBinding

↓

只在某个Namespace内生效
```

这样可以复用统一的权限模板，同时保持Namespace隔离。

------------------------------------------------------------------------

# 11. User、Group与ServiceAccount

RBAC授权对象通常称为Subject。

主要包括：

## User

代表真实用户或外部身份。

例如：

``` text
developer
admin
ops-user
```

------------------------------------------------------------------------

## Group

代表一组用户。

例如：

``` text
developers
platform-team
auditors
```

适合企业团队权限管理。

------------------------------------------------------------------------

## ServiceAccount

代表：

> Kubernetes中的工作负载身份。

例如：

``` text
Pod

↓

ServiceAccount

↓

RBAC

↓

API Server
```

------------------------------------------------------------------------

# 12. ServiceAccount工作机制（★★★★★）

应用运行在Pod中时，如果需要访问Kubernetes
API，通常应使用ServiceAccount身份。

结构：

``` text
Pod

↓

ServiceAccount

↓

RoleBinding / ClusterRoleBinding

↓

Role / ClusterRole

↓

Kubernetes API
```

例如：

监控组件需要：

``` text
list Pods

get Nodes
```

就应只授予这些必要权限。

这体现：

> 最小权限原则。

------------------------------------------------------------------------

# 13. RBAC YAML配置

完整Namespace级示例：

## Role

``` yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role

metadata:
  namespace: dev
  name: deployment-reader

rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]
```

## RoleBinding

``` yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding

metadata:
  namespace: dev
  name: developer-read-deployment

subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io

roleRef:
  kind: Role
  name: deployment-reader
  apiGroup: rbac.authorization.k8s.io
```

结果：

``` text
developers Group

↓

可以读取dev Namespace中的Deployment
```

------------------------------------------------------------------------

# 14. Namespace级权限控制

企业项目常见：

``` text
Cluster

├── dev
├── test
└── prod
```

权限可以设计为：

``` text
开发人员

↓

dev

↓

读写


test

↓

部分权限


prod

↓

只读或无权限
```

Namespace + RBAC可以实现：

> 项目级和环境级权限隔离。

------------------------------------------------------------------------

# 15. Cluster级权限控制

某些资源没有Namespace边界。

例如：

-   Node；
-   PersistentVolume；
-   Namespace本身。

这些通常需要：

``` text
ClusterRole

+

ClusterRoleBinding
```

但集群级权限风险更高。

原则：

> 能使用Namespace级权限解决的问题，不要轻易授予Cluster级权限。

------------------------------------------------------------------------

# 16. 最小权限原则（★★★★★）

Least Privilege：

> 只授予完成任务所需要的最小权限。

错误示例：

``` text
普通应用

↓

cluster-admin
```

风险：

``` text
应用被攻击

↓

攻击者获得集群管理员权限
```

正确设计：

``` text
Application

↓

ServiceAccount

↓

只允许get/list指定资源
```

避免大量使用：

``` yaml
resources: ["*"]
verbs: ["*"]
```

尤其不要将高权限角色随意绑定给：

-   普通用户；
-   默认ServiceAccount；
-   普通业务Pod。

------------------------------------------------------------------------

# 17. 企业多租户权限设计

假设企业有：

``` text
Team A
Team B
Platform Team
```

可以设计：

``` text
Kubernetes Cluster

├── Namespace team-a
│      └── Team A RBAC
│
├── Namespace team-b
│      └── Team B RBAC
│
└── Platform Team
       └── Cluster级管理权限
```

权限分层：

``` text
开发人员

↓

业务Namespace


运维人员

↓

多个Namespace


平台管理员

↓

Cluster
```

实现：

-   团队隔离；
-   环境隔离；
-   权限分级；
-   降低误操作风险。

------------------------------------------------------------------------

# 18. RBAC常见问题与排查

## Forbidden

典型错误：

``` text
Error from server (Forbidden)
```

通常说明：

``` text
Authentication成功

↓

Authorization失败
```

需要检查：

-   当前用户是谁；
-   当前ServiceAccount是谁；
-   Role是否包含资源；
-   verbs是否正确；
-   Binding是否存在；
-   Namespace是否正确。

------------------------------------------------------------------------

## 权限检查

常用：

``` bash
kubectl auth can-i get pods
```

检查指定操作：

``` bash
kubectl auth can-i create deployments
```

检查Namespace：

``` bash
kubectl auth can-i get pods -n dev
```

------------------------------------------------------------------------

## 权限过大

可以重点检查：

``` text
cluster-admin

*

verbs: ["*"]

resources: ["*"]
```

避免无必要的超级权限。

------------------------------------------------------------------------

# 19. Kubernetes RBAC最佳实践

建议：

1.  遵循最小权限原则；
2.  优先使用Group进行人员授权；
3.  Pod使用独立ServiceAccount；
4.  不要随意授予cluster-admin；
5.  尽量避免通配符权限；
6.  优先使用Namespace级权限；
7.  将开发、测试、生产权限分离；
8.  定期审计RoleBinding和ClusterRoleBinding；
9.  删除不再使用的权限绑定；
10. 使用`kubectl auth can-i`辅助排查授权问题；
11. 对敏感资源如Secret设置更严格权限；
12. 将RBAC配置纳入版本控制和变更审计。

------------------------------------------------------------------------

# 20. 系统架构设计师考点

## 什么是RBAC？

答：

> RBAC是基于角色的访问控制机制，通过角色定义权限，再将角色绑定给用户、组或ServiceAccount。

------------------------------------------------------------------------

## Role和ClusterRole区别？

答：

> Role主要定义Namespace范围内的权限，ClusterRole用于定义集群范围权限或可在多个Namespace中复用的权限集合。

------------------------------------------------------------------------

## RoleBinding作用？

答：

> RoleBinding在指定Namespace中将Role或ClusterRole授予用户、组或ServiceAccount。

------------------------------------------------------------------------

## ClusterRoleBinding作用？

答：

> ClusterRoleBinding将ClusterRole授予Subject，并使权限在整个集群范围生效。

------------------------------------------------------------------------

## ServiceAccount作用？

答：

> ServiceAccount为Pod等工作负载提供访问Kubernetes API时使用的身份。

------------------------------------------------------------------------

## RBAC中Role和Binding分别解决什么问题？

答：

> Role或ClusterRole定义"允许做什么"，RoleBinding或ClusterRoleBinding定义"谁拥有这些权限"。

------------------------------------------------------------------------

## Authentication和Authorization区别？

答：

> Authentication解决"你是谁"，Authorization解决"你能做什么"。

------------------------------------------------------------------------

## 什么是最小权限原则？

答：

> 只授予用户或应用完成其任务所必需的最少权限，减少误操作和安全攻击带来的影响范围。

------------------------------------------------------------------------

# 21. Mermaid权限模型架构图

``` mermaid
flowchart TD

A[API Request] --> B[Authentication 身份认证]

B --> C[Authorization 授权]

C --> D[RBAC]

D --> E[Role]
D --> F[ClusterRole]

G[User] --> H[RoleBinding]
I[Group] --> H
J[ServiceAccount] --> H

H --> E

G --> K[ClusterRoleBinding]
I --> K
J --> K

K --> F

E --> L[Namespace Resources]
F --> M[Cluster / Reusable Permissions]

C --> N[Admission Control]
N --> O[Kubernetes Resource]
```

------------------------------------------------------------------------

# 22. 本节小结

Kubernetes RBAC核心知识：

1.  Authentication负责身份认证；
2.  Authorization负责权限判断；
3.  Admission Control负责请求准入校验或变更；
4.  RBAC属于Authorization机制；
5.  Role定义Namespace级权限；
6.  ClusterRole定义集群级或可复用权限；
7.  RoleBinding负责Namespace范围授权；
8.  ClusterRoleBinding负责集群范围授权；
9.  Subject包括User、Group和ServiceAccount；
10. ServiceAccount是Pod访问Kubernetes API的重要身份机制；
11. 企业权限设计应遵循最小权限原则；
12. Namespace + RBAC可以实现团队和环境隔离。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Authentication回答"你是谁"，Authorization回答"你能做什么"；在RBAC中，Role/ClusterRole定义权限，RoleBinding/ClusterRoleBinding把权限授予User、Group或ServiceAccount。
