# 23 Kubernetes Ingress 外部访问与流量管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes Ingress 外部访问机制，包括
> Ingress、Service、Ingress Controller、HTTP/HTTPS路由、TLS配置以及
> Gateway API 演进。

------------------------------------------------------------------------

# 目录

1.  Ingress概述
2.  为什么需要Ingress
3.  Ingress与Service关系
4.  Ingress核心架构
5.  Ingress资源模型
6.  Ingress YAML结构
7.  Ingress Controller
8.  Nginx Ingress Controller
9.  HTTP路由规则
10. 域名路由
11. Path路径路由
12. TLS HTTPS配置
13. Ingress访问流程
14. Ingress负载均衡
15. Ingress与LoadBalancer区别
16. Gateway API演进
17. Ingress最佳实践
18. 系统架构设计师考点
19. Mermaid架构图
20. 本节小结

------------------------------------------------------------------------

# 1. Ingress概述

Ingress：

> Kubernetes中用于管理集群外部HTTP/HTTPS访问的API对象。

主要功能：

-   域名访问；
-   路径转发；
-   TLS终止；
-   流量路由。

基本结构：

``` text
Internet

↓

Ingress

↓

Service

↓

Pod
```

------------------------------------------------------------------------

# 2. 为什么需要Ingress

Service可以提供服务访问入口，但是多个业务服务时会产生问题：

-   多个公网入口；
-   IP管理复杂；
-   HTTPS配置重复。

没有Ingress：

``` text
Client

↓

Service A


Client

↓

Service B


Client

↓

Service C
```

使用Ingress：

``` text
Internet

↓

Ingress

↓

Service A / Service B / Service C
```

实现统一入口。

------------------------------------------------------------------------

# 3. Ingress与Service关系

关系：

``` text
Ingress

↓

Service

↓

Pod
```

职责：

  对象      作用
  --------- ------------------------
  Ingress   七层HTTP/HTTPS流量管理
  Service   服务访问抽象
  Pod       运行应用

------------------------------------------------------------------------

# 4. Ingress核心架构

完整流程：

``` text
Client

↓

Ingress Controller

↓

Ingress Rule

↓

Service

↓

Pod
```

注意：

> Ingress对象只是规则描述，真正处理请求的是Ingress Controller。

------------------------------------------------------------------------

# 5. Ingress资源模型

Ingress对象：

``` text
Ingress

├── Metadata
├── Spec
└── Status
```

Spec主要包含：

-   Rules；
-   Backend；
-   TLS。

------------------------------------------------------------------------

# 6. Ingress YAML结构

示例：

``` yaml
apiVersion: networking.k8s.io/v1

kind: Ingress

metadata:
  name: app-ingress

spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        backend:
          service:
            name: nginx-service
            port:
              number: 80
```

------------------------------------------------------------------------

# 7. Ingress Controller

Ingress Controller：

> 负责监听Ingress规则并实际处理网络请求的组件。

常见实现：

-   Nginx Ingress Controller；
-   Traefik；
-   HAProxy；
-   Kong。

流程：

``` text
Ingress Rule

↓

Controller监听

↓

生成代理配置

↓

转发请求
```

------------------------------------------------------------------------

# 8. Nginx Ingress Controller

常见生产方案：

``` text
Internet

↓

Nginx Ingress Controller

↓

Service

↓

Pod
```

能力：

-   HTTP代理；
-   HTTPS；
-   负载均衡；
-   路径重写。

------------------------------------------------------------------------

# 9. HTTP路由规则

Ingress支持：

## Host路由

例如：

``` text
api.example.com

↓

API Service
```

------------------------------------------------------------------------

## Path路由

例如：

``` text
example.com/user

↓

User Service


example.com/order

↓

Order Service
```

------------------------------------------------------------------------

# 10. 域名路由

示例：

``` text
www.example.com

↓

Frontend Service


api.example.com

↓

Backend Service
```

通过域名实现不同服务分发。

------------------------------------------------------------------------

# 11. Path路径路由

示例：

``` text
/example

↓

service-a


/api

↓

service-b
```

适合：

-   微服务网关；
-   多业务入口。

------------------------------------------------------------------------

# 12. TLS HTTPS配置

Ingress支持HTTPS：

``` text
HTTPS Request

↓

Ingress Controller

↓

TLS Termination

↓

Service
```

证书通常存储：

``` text
Secret

↓

Ingress

↓

Controller
```

------------------------------------------------------------------------

# 13. Ingress访问流程

完整流程：

``` text
Client

↓

DNS

↓

LoadBalancer

↓

Ingress Controller

↓

Ingress Rule

↓

Service

↓

Pod
```

------------------------------------------------------------------------

# 14. Ingress负载均衡

请求流程：

``` text
Request

↓

Ingress Controller

↓

Service

↓

Pod1

Pod2

Pod3
```

实现：

-   请求分发；
-   服务隔离；
-   统一入口。

------------------------------------------------------------------------

# 15. Ingress与LoadBalancer区别

  Ingress            LoadBalancer
  ------------------ ------------------
  七层HTTP路由       四层网络转发
  支持域名           主要基于IP
  支持路径规则       通常暴露单个服务
  多个服务共享入口   服务独立暴露

------------------------------------------------------------------------

# 16. Gateway API演进

Ingress主要面向HTTP场景。

新的方向：

``` text
Ingress

↓

Gateway API
```

Gateway API支持：

-   HTTP；
-   TCP；
-   UDP；
-   更丰富流量控制。

------------------------------------------------------------------------

# 17. Ingress最佳实践

建议：

-   使用统一入口管理服务；
-   配置HTTPS；
-   自动化证书管理；
-   增加访问控制；
-   配合日志和监控。

------------------------------------------------------------------------

# 18. 系统架构设计师考点

## Ingress作用？

答：

> Ingress用于管理Kubernetes集群外部HTTP/HTTPS访问，实现域名路由、路径转发和TLS配置。

------------------------------------------------------------------------

## Ingress和Service区别？

答：

> Ingress负责七层流量入口管理，Service负责服务访问抽象和Pod负载均衡。

------------------------------------------------------------------------

## Ingress Controller作用？

答：

> Ingress Controller负责监听Ingress规则，并实际处理外部请求转发。

------------------------------------------------------------------------

## 为什么需要Ingress？

答：

> 当多个Service需要统一对外暴露时，Ingress提供统一入口和灵活路由能力。

------------------------------------------------------------------------

# 19. Mermaid架构图

``` mermaid
flowchart TD

A[Internet]

↓

B[LoadBalancer]

↓

C[Ingress Controller]

↓

D[Ingress Rule]

↓

E[Service A]

↓

F[Pod A]

D --> G[Service B]

G --> H[Pod B]
```

------------------------------------------------------------------------

# 20. 本节小结

Ingress核心知识：

1.  Ingress管理外部HTTP/HTTPS访问；
2.  Ingress通过Controller实现流量处理；
3.  Ingress位于Service之上；
4.  支持域名和路径路由；
5.  支持TLS HTTPS；
6.  可以统一多个Service入口；
7.  Gateway API是未来演进方向。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Service解决服务访问，Ingress解决外部访问入口；Ingress定义规则，Ingress
> Controller负责真正转发流量。
