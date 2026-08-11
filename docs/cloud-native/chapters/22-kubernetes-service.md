# 22 Kubernetes Service 服务发现与负载均衡

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes Service 核心概念，包括 Service 与 Pod
> 的关系、服务发现、负载均衡、Service 类型、kube-proxy 工作机制以及
> Kubernetes DNS。

------------------------------------------------------------------------

# 目录

1.  Service概述
2.  为什么需要Service
3.  Service与Pod关系
4.  Service核心设计思想
5.  Service资源模型
6.  Service YAML结构
7.  Label与Selector关联机制
8.  ClusterIP服务类型
9.  NodePort服务类型
10. LoadBalancer服务类型
11. ExternalName服务类型
12. Service访问流程
13. kube-proxy工作机制
14. Service负载均衡
15. Kubernetes DNS服务发现
16. Headless Service
17. Service最佳实践
18. 系统架构设计师考点
19. Mermaid架构图
20. 本节小结

------------------------------------------------------------------------

# 1. Service概述

Service：

> Kubernetes中用于提供稳定网络访问入口的资源对象。

主要解决：

-   Pod IP动态变化；
-   服务发现；
-   请求负载均衡。

基本关系：

``` text
Client

↓

Service

↓

Pod
```

------------------------------------------------------------------------

# 2. 为什么需要Service

Pod特点：

-   生命周期短；
-   IP动态变化；
-   经常被创建和删除。

例如：

``` text
Pod A

10.1.1.5
```

删除后：

``` text
Pod B

10.1.2.8
```

访问地址发生变化。

因此需要：

``` text
固定访问入口

↓

Service

↓

动态Pod集合
```

------------------------------------------------------------------------

# 3. Service与Pod关系

Service通过Label Selector选择Pod。

结构：

``` text
Service

↓

Selector

↓

Pod Labels
```

例如：

Service：

``` yaml
selector:
  app: nginx
```

Pod：

``` yaml
labels:
  app: nginx
```

------------------------------------------------------------------------

# 4. Service核心设计思想

Service提供：

## 稳定访问地址

包括：

-   ClusterIP；
-   DNS名称。

------------------------------------------------------------------------

## 服务发现

例如：

``` text
Frontend

↓

Backend

↓

Database
```

------------------------------------------------------------------------

## 负载均衡

多个Pod：

``` text
Service

├── Pod1
├── Pod2
└── Pod3
```

------------------------------------------------------------------------

# 5. Service资源模型

Service对象结构：

``` text
Service

├── Metadata
├── Spec
└── Status
```

Spec主要包含：

-   selector；
-   ports；
-   type。

------------------------------------------------------------------------

# 6. Service YAML结构

示例：

``` yaml
apiVersion: v1

kind: Service

metadata:
  name: nginx-service

spec:
  selector:
    app: nginx

  ports:
  - port: 80
    targetPort: 80

  type: ClusterIP
```

------------------------------------------------------------------------

# 7. Label与Selector关联机制

Service不会直接绑定Pod。

流程：

``` text
Pod

labels:
app=nginx


↓

Selector匹配


↓

Service管理访问
```

优势：

-   动态发现Pod；
-   支持扩缩容；
-   解耦应用和网络。

------------------------------------------------------------------------

# 8. ClusterIP服务类型

默认类型：

``` yaml
type: ClusterIP
```

特点：

-   集群内部访问；
-   自动分配虚拟IP。

结构：

``` text
Pod

↓

ClusterIP

↓

Pod Group
```

适合：

-   微服务内部调用。

------------------------------------------------------------------------

# 9. NodePort服务类型

NodePort：

> 将Service暴露到每个Node固定端口。

结构：

``` text
Client

↓

Node IP:Port

↓

Service

↓

Pod
```

特点：

-   支持外部访问；
-   配置简单。

------------------------------------------------------------------------

# 10. LoadBalancer服务类型

LoadBalancer用于云环境。

结构：

``` text
Internet

↓

Cloud LoadBalancer

↓

Service

↓

Pod
```

特点：

-   云厂商提供外部负载均衡；
-   适合公网服务。

------------------------------------------------------------------------

# 11. ExternalName服务类型

ExternalName用于映射外部服务。

示例：

``` text
Service

↓

external.database.com
```

应用：

-   外部数据库；
-   第三方服务。

------------------------------------------------------------------------

# 12. Service访问流程

完整流程：

``` text
Client

↓

Service IP

↓

kube-proxy

↓

Pod

↓

Container
```

------------------------------------------------------------------------

# 13. kube-proxy工作机制

kube-proxy负责：

-   Service流量转发；
-   网络规则维护；
-   负载均衡。

常见实现：

## iptables

通过Linux网络规则转发。

------------------------------------------------------------------------

## IPVS

提供更高性能负载均衡。

------------------------------------------------------------------------

# 14. Service负载均衡

多个Pod：

``` text
Service

├── Pod1
├── Pod2
└── Pod3
```

请求：

``` text
Request

↓

Service

↓

Pod
```

实现：

-   请求分发；
-   应用扩展。

------------------------------------------------------------------------

# 15. Kubernetes DNS服务发现

Kubernetes提供内部DNS。

格式：

``` text
service-name.namespace.svc.cluster.local
```

例如：

``` text
backend.default.svc.cluster.local
```

解析到：

``` text
Service IP
```

------------------------------------------------------------------------

# 16. Headless Service

Headless Service：

``` yaml
clusterIP: None
```

特点：

-   不分配ClusterIP；
-   直接返回Pod地址。

常用于：

-   StatefulSet；
-   数据库集群。

------------------------------------------------------------------------

# 17. Service最佳实践

建议：

-   使用Service访问Pod；
-   合理设计Label；
-   规范端口管理；
-   内外服务隔离；
-   配合Ingress管理外部访问。

------------------------------------------------------------------------

# 18. 系统架构设计师考点

## Service作用？

答：

> Service用于提供稳定网络访问入口，实现服务发现和Pod负载均衡。

------------------------------------------------------------------------

## 为什么需要Service？

答：

> Pod生命周期动态变化，IP地址不固定，Service提供稳定访问地址。

------------------------------------------------------------------------

## ClusterIP和NodePort区别？

答：

> ClusterIP用于集群内部访问，NodePort通过节点端口向外暴露服务。

------------------------------------------------------------------------

## Service如何找到Pod？

答：

> Service通过Label Selector匹配具有指定Label的Pod。

------------------------------------------------------------------------

# 19. Mermaid架构图

``` mermaid
flowchart TD

A[Client]

↓

B[Service]

↓

C[kube-proxy]

↓

D[Pod 1]

D --> E[Container]

C --> F[Pod 2]

F --> G[Container]

C --> H[Pod 3]

H --> I[Container]
```

------------------------------------------------------------------------

# 20. 本节小结

Service核心知识：

1.  Service提供稳定访问入口；
2.  Service通过Selector关联Pod；
3.  Service解决Pod IP变化问题；
4.  ClusterIP用于内部访问；
5.  NodePort用于节点端口暴露；
6.  LoadBalancer用于云环境外部访问；
7.  kube-proxy负责流量转发；
8.  Kubernetes DNS提供服务发现。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Pod负责运行应用，Service负责提供稳定访问入口，Selector连接Service与Pod，kube-proxy负责流量转发。
