# 43 Kubernetes Service Mesh 与微服务通信治理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes Service Mesh 服务网格与微服务通信治理，重点掌握
> Data Plane、Control Plane、Sidecar
> Proxy、Envoy、Istio、流量治理、超时重试、熔断、故障注入、灰度发布、mTLS、身份认证、访问授权、可观测性，以及
> Service Mesh 与 Ingress、NetworkPolicy、GitOps 的关系。

------------------------------------------------------------------------

# 目录

1.  Service Mesh概述
2.  为什么微服务需要Service Mesh
3.  Kubernetes原生服务通信的局限
4.  Service Mesh整体架构
5.  Data Plane与Control Plane
6.  Sidecar Proxy代理模式
7.  Envoy代理核心原理
8.  Istio概述
9.  Istio整体架构
10. Istiod控制平面
11. Service Mesh流量治理
12. VirtualService流量规则
13. DestinationRule目标策略
14. Gateway入口流量管理
15. 服务负载均衡
16. Timeout超时控制
17. Retry重试机制
18. Circuit Breaker熔断机制
19. Fault Injection故障注入
20. Canary金丝雀发布
21. Traffic Splitting流量拆分
22. mTLS服务间安全通信
23. Authentication身份认证
24. Authorization访问授权
25. Service Mesh可观测性
26. Metrics、Logs与Tracing
27. Service Mesh与OpenTelemetry
28. Service Mesh与NetworkPolicy区别
29. Service Mesh与Ingress区别
30. Sidecar模式的成本与问题
31. Sidecarless与Ambient Mesh
32. Service Mesh与GitOps
33. 企业Service Mesh架构设计
34. Service Mesh适用与不适用场景
35. Service Mesh常见问题与排查
36. Service Mesh生产最佳实践
37. 系统架构设计师考点
38. Mermaid Service Mesh架构图
39. 本节小结

------------------------------------------------------------------------

# 1. Service Mesh概述（★★★★★）

Service Mesh：

> 服务网格，是用于治理微服务之间通信的一层基础设施。

在大型微服务系统中，服务之间不仅需要"能够通信"，还需要：

``` text
Service Discovery

Load Balancing

Timeout

Retry

Circuit Breaking

Traffic Splitting

mTLS

Authorization

Metrics

Tracing
```

如果这些能力全部由每个业务应用自行实现：

``` text
Service A
├── Business Logic
├── Retry
├── Timeout
├── TLS
└── Tracing

Service B
├── Business Logic
├── Retry
├── Timeout
├── TLS
└── Tracing
```

会导致大量重复。

Service Mesh的思想：

``` text
Business Application
        │
        ↓
Communication Proxy
        │
        ↓
Network
```

将通用通信治理能力从业务代码中分离。

------------------------------------------------------------------------

# 2. 为什么微服务需要Service Mesh（★★★★★）

单体应用内部调用通常是：

``` text
Function A

↓

Function B
```

微服务则变成：

``` text
Service A

↓

Network

↓

Service B
```

网络会带来：

-   延迟；
-   超时；
-   丢包；
-   服务实例变化；
-   部分故障；
-   安全风险。

当系统只有几个服务时，可以在应用中解决。

但当系统达到：

``` text
10 Services

↓

100 Services

↓

500 Services
```

服务通信关系迅速复杂化。

因此需要：

> 将微服务通信治理变成平台能力。

------------------------------------------------------------------------

# 3. Kubernetes原生服务通信的局限

Kubernetes已经提供：

``` text
Service

DNS

Ingress / Gateway

NetworkPolicy
```

可以解决：

``` text
服务发现

基础负载均衡

入口访问

网络访问控制
```

但复杂微服务治理还可能需要：

``` text
按比例分流

按Header路由

精细Retry

Timeout

Circuit Breaking

mTLS

调用链可观测
```

Service Mesh主要在这些更细粒度的服务通信治理场景中发挥作用。

注意：

> Service Mesh不是Kubernetes运行应用的必需组件。

------------------------------------------------------------------------

# 4. Service Mesh整体架构（★★★★★）

典型架构：

``` text
                Control Plane
                     │
                     ↓
             Configuration
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
    Proxy A       Proxy B       Proxy C
       │             │             │
  Service A      Service B      Service C

       └─────────────┬─────────────┘
                     ↓
                 Data Plane
```

核心分为：

``` text
Control Plane

+

Data Plane
```

------------------------------------------------------------------------

# 5. Data Plane与Control Plane（★★★★★）

## Data Plane

数据平面负责：

> 真正处理服务之间的网络流量。

例如：

``` text
Routing

Load Balancing

Retry

Timeout

mTLS

Telemetry
```

------------------------------------------------------------------------

## Control Plane

控制平面负责：

``` text
配置

策略

服务信息

证书

治理规则
```

然后将配置下发给Data Plane。

记忆：

``` text
Control Plane

决定“怎么处理流量”


Data Plane

真正“处理流量”
```

------------------------------------------------------------------------

# 6. Sidecar Proxy代理模式（★★★★★）

经典Service Mesh通常采用Sidecar模式。

一个Pod：

``` text
Pod
│
├── Application Container
│
└── Sidecar Proxy
```

服务之间通信：

``` text
Application A

↓

Proxy A

↓

Proxy B

↓

Application B
```

这样应用本身不需要直接实现：

``` text
Retry

Timeout

mTLS

Traffic Policy
```

而由Proxy统一处理。

------------------------------------------------------------------------

# 7. Envoy代理核心原理（★★★★☆）

Envoy是云原生环境中常见的高性能代理。

在Service Mesh中，Envoy可承担：

``` text
L4 / L7 Proxy

HTTP Routing

Load Balancing

Retry

Timeout

Circuit Breaking

TLS

Telemetry
```

典型：

``` text
App

↓

Envoy

↓

Network

↓

Envoy

↓

App
```

Envoy并不负责业务逻辑。

它关注的是：

> 服务通信。

------------------------------------------------------------------------

# 8. Istio概述（★★★★★）

Istio是常见的Service Mesh实现之一。

主要提供：

``` text
Traffic Management

Security

Observability

Policy
```

典型能力：

-   流量路由；
-   灰度发布；
-   Timeout；
-   Retry；
-   Fault Injection；
-   mTLS；
-   Authorization；
-   Telemetry。

------------------------------------------------------------------------

# 9. Istio整体架构

概念架构：

``` text
                    Istiod
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
       Proxy A     Proxy B     Proxy C
          │           │           │
       Service A   Service B   Service C
```

其中：

``` text
Istiod

↓

Control Plane
```

Proxy组成：

``` text
Data Plane
```

------------------------------------------------------------------------

# 10. Istiod控制平面（★★★★★）

Istiod承担Istio控制平面的核心能力。

可以概念化理解为：

``` text
Kubernetes / Mesh Configuration

↓

Istiod

↓

Configuration Distribution

↓

Data Plane Proxies
```

同时还涉及：

``` text
Service Discovery

Certificate / Identity

Configuration Validation
```

因此：

> Istiod主要负责控制和配置，而不是承载普通业务请求的数据转发。

------------------------------------------------------------------------

# 11. Service Mesh流量治理（★★★★★）

Service Mesh最重要的能力之一：

> Traffic Management。

可以控制：

``` text
请求发送到哪个版本？

多少比例进入新版本？

超时多久？

失败是否重试？

出现异常是否熔断？
```

例如：

``` text
User Request
     │
     ├── 90% → V1
     │
     └── 10% → V2
```

这为：

``` text
Canary Release
```

提供基础能力。

------------------------------------------------------------------------

# 12. VirtualService流量规则（★★★★★）

在Istio中，VirtualService常用于描述：

> 请求如何路由。

例如概念上：

``` text
Host: my-service

↓

Route

├── V1 90%
└── V2 10%
```

还可以根据：

``` text
URI

Header

Method

Source
```

等条件进行路由。

例如：

``` text
Header:

x-user-type: beta

↓

V2
```

其他用户：

``` text
↓

V1
```

------------------------------------------------------------------------

# 13. DestinationRule目标策略（★★★★★）

VirtualService更关注：

``` text
流量去哪里
```

DestinationRule则常用于定义目标服务相关策略，例如：

``` text
Subsets

Load Balancing

Connection Pool

Outlier Detection

TLS
```

例如：

``` text
my-service

├── subset: v1
└── subset: v2
```

然后VirtualService可以引用：

``` text
v1

v2
```

进行分流。

记忆：

``` text
VirtualService

路由规则


DestinationRule

目标服务策略
```

------------------------------------------------------------------------

# 14. Gateway入口流量管理

Service Mesh也可以管理进入Mesh的流量。

概念：

``` text
Internet

↓

Gateway

↓

VirtualService

↓

Service

↓

Pod
```

Gateway定义：

``` text
端口

协议

Host

TLS
```

VirtualService进一步决定：

``` text
请求路由到哪个服务
```

------------------------------------------------------------------------

# 15. 服务负载均衡

一个Service可能有：

``` text
Pod A

Pod B

Pod C
```

Proxy可以根据策略进行：

``` text
Load Balancing
```

例如概念上：

``` text
Round Robin

Random

Least Request
```

具体能力取决于Service Mesh和代理实现。

------------------------------------------------------------------------

# 16. Timeout超时控制（★★★★★）

分布式系统中必须设置合理Timeout。

如果没有Timeout：

``` text
Service A

↓

等待Service B

↓

B无响应

↓

A持续等待

↓

线程 / 连接 / 资源耗尽
```

设置：

``` text
Timeout = 2s
```

意味着：

``` text
超过2秒

↓

停止等待

↓

快速失败
```

核心：

> Timeout是防止故障无限传播的重要机制。

------------------------------------------------------------------------

# 17. Retry重试机制（★★★★★）

Retry可以应对：

``` text
临时网络抖动

瞬时错误

短暂服务不可用
```

例如：

``` text
Request

↓

Failed

↓

Retry

↓

Success
```

但Retry必须谨慎。

错误配置：

``` text
大量请求失败

↓

所有请求自动重试

↓

流量倍增

↓

下游更严重
```

形成：

> Retry Storm，重试风暴。

因此Retry应结合：

``` text
Timeout

Retry Count

Backoff

Idempotency
```

设计。

------------------------------------------------------------------------

# 18. Circuit Breaker熔断机制（★★★★★）

熔断的核心：

> 当下游服务持续异常时，暂时停止继续向其发送大量请求。

流程：

``` text
Service B持续失败

↓

Failure Threshold

↓

Circuit Open

↓

快速失败

↓

等待恢复

↓

尝试探测

↓

恢复流量
```

作用：

``` text
防止故障扩散

保护下游服务

降低资源浪费
```

------------------------------------------------------------------------

# 19. Fault Injection故障注入（★★★★☆）

Fault Injection：

> 主动模拟故障，用于验证系统容错能力。

例如：

``` text
Delay

Abort
```

模拟：

``` text
20%的请求延迟3秒
```

或者：

``` text
5%的请求返回错误
```

用途：

-   测试Timeout；
-   测试Retry；
-   测试熔断；
-   验证应用容错能力。

这与混沌工程思想存在联系。

------------------------------------------------------------------------

# 20. Canary金丝雀发布（★★★★★）

上一章CI/CD学习过Canary。

Service Mesh可以提供更细粒度流量控制。

开始：

``` text
V1 = 100%

V2 = 0%
```

发布：

``` text
V1 = 95%

V2 = 5%
```

观察：

``` text
Error Rate

Latency

Business Metrics
```

正常：

``` text
V2

5%

↓

20%

↓

50%

↓

100%
```

异常：

``` text
V2

↓

0%
```

实现快速停止放量。

------------------------------------------------------------------------

# 21. Traffic Splitting流量拆分（★★★★★）

Traffic Splitting：

``` text
Traffic
   │
   ├── 80% → V1
   └── 20% → V2
```

不仅可以按权重，还可能按：

``` text
Header

Cookie

URI

User Group
```

进行路由。

例如：

``` text
Internal User

↓

V2


Normal User

↓

V1
```

这使发布策略更加灵活。

------------------------------------------------------------------------

# 22. mTLS服务间安全通信（★★★★★）

mTLS：

> Mutual TLS，双向TLS。

普通TLS：

``` text
Client

↓

验证Server
```

mTLS：

``` text
Client验证Server

+

Server验证Client
```

Service Mesh中：

``` text
Service A

↓

Proxy A

⇄ mTLS ⇄

Proxy B

↓

Service B
```

可以提供：

``` text
Encryption

Identity Authentication

Integrity
```

即：

``` text
加密

身份认证

完整性保护
```

------------------------------------------------------------------------

# 23. Authentication身份认证

Authentication解决：

> 你是谁？

在Service Mesh中可以基于：

``` text
Workload Identity

Certificate

JWT
```

等方式建立身份。

例如：

``` text
Service A

↓

Authenticated Identity

↓

Service B
```

这为后续Authorization提供基础。

------------------------------------------------------------------------

# 24. Authorization访问授权（★★★★★）

Authorization解决：

> 你能做什么？

例如：

``` text
Frontend

↓

允许访问

↓

Order Service
```

但：

``` text
Unknown Service

↓

禁止访问

↓

Order Service
```

典型安全模型：

``` text
Authenticate

↓

Authorize

↓

Allow / Deny
```

这与Zero Trust思想高度相关：

> 不因为服务位于集群内部就默认可信。

------------------------------------------------------------------------

# 25. Service Mesh可观测性（★★★★★）

因为大量流量经过Proxy：

``` text
Service A

↓

Proxy A

↓

Proxy B

↓

Service B
```

Proxy天然可以观察：

``` text
Request Count

Latency

Error Rate

Traffic
```

因此Service Mesh可以提供：

``` text
服务调用指标

调用拓扑

错误率

延迟

Tracing信息
```

而业务代码无需为每个网络指标重复实现采集逻辑。

------------------------------------------------------------------------

# 26. Metrics、Logs与Tracing

Service Mesh仍然遵循可观测性三大支柱：

``` text
Metrics

Logs

Traces
```

Metrics：

``` text
QPS

Latency

Error Rate
```

Logs：

``` text
Access Log
```

Tracing：

``` text
Service A

↓

Service B

↓

Service C
```

通过三者结合：

``` text
Metrics发现异常

↓

Logs分析请求

↓

Tracing定位调用链
```

------------------------------------------------------------------------

# 27. Service Mesh与OpenTelemetry

OpenTelemetry负责：

``` text
Telemetry Generation

Collection

Processing

Export
```

Service Mesh可以产生网络层遥测数据。

应用还可以产生：

``` text
Business Span

Application Metrics

Application Logs
```

最终：

``` text
Application Telemetry

+

Mesh Telemetry

↓

OpenTelemetry

↓

Observability Backend
```

这样可以形成更完整的调用链分析。

------------------------------------------------------------------------

# 28. Service Mesh与NetworkPolicy区别（★★★★★）

两者经常混淆。

## NetworkPolicy

主要关注：

``` text
L3 / L4网络访问控制
```

例如：

``` text
哪些Pod

可以访问

哪些Pod / Port
```

------------------------------------------------------------------------

## Service Mesh

更关注：

``` text
L7服务通信治理
```

例如：

``` text
HTTP Route

Retry

Timeout

Canary

mTLS

Identity Authorization
```

记忆：

``` text
NetworkPolicy

网络层访问边界


Service Mesh

服务通信治理
```

二者通常可以组合使用。

------------------------------------------------------------------------

# 29. Service Mesh与Ingress区别（★★★★★）

Ingress / Gateway主要解决：

``` text
North-South Traffic
```

即：

``` text
External

↓

Cluster
```

Service Mesh主要关注：

``` text
East-West Traffic
```

即：

``` text
Service A

↓

Service B
```

但现代Service Mesh也可能提供入口/出口Gateway能力。

因此更准确地说：

> Ingress/Gateway关注入口流量管理，Service
> Mesh提供更完整的服务间通信治理体系。

------------------------------------------------------------------------

# 30. Sidecar模式的成本与问题（★★★★★）

Sidecar并不是没有成本。

每个Pod增加Proxy：

``` text
Application Container

+

Proxy Container
```

意味着：

``` text
更多CPU

更多Memory

更多连接

更多运维复杂度
```

还可能带来：

``` text
网络路径复杂

调试困难

启动顺序问题

升级Proxy成本
```

如果：

``` text
1000 Pods
```

可能意味着大量Sidecar实例。

因此：

> 不是所有Kubernetes集群都需要Service Mesh。

------------------------------------------------------------------------

# 31. Sidecarless与Ambient Mesh（★★★★☆）

为降低Sidecar模型的资源和运维成本，Service Mesh生态也出现了：

``` text
Sidecarless

Ambient Mesh
```

等方向。

核心思想：

> 不再要求每个应用Pod都必须拥有独立Sidecar代理，而是将部分Mesh能力下沉或共享。

概念：

``` text
Traditional

Pod
├── App
└── Sidecar


Alternative

Pod
└── App

    ↓

Shared / Node-Level Mesh Layer
```

需要注意：

> 不同Service Mesh实现的具体架构不同，应根据实际版本和产品能力判断。

------------------------------------------------------------------------

# 32. Service Mesh与GitOps（★★★★☆）

Service Mesh配置同样可以声明式管理。

例如：

``` text
VirtualService

DestinationRule

Gateway

AuthorizationPolicy
```

都可以：

``` text
Git

↓

Pull Request

↓

Review

↓

GitOps Controller

↓

Kubernetes
```

这样：

``` text
流量规则

安全策略

灰度策略
```

都可以版本化、审计和回滚。

------------------------------------------------------------------------

# 33. 企业Service Mesh架构设计（★★★★★）

典型架构：

``` text
                        Internet
                           │
                           ↓
                      Mesh Gateway
                           │
                           ↓
              ┌──────── Traffic ────────┐
              ↓                         ↓
          Service A                 Service B
              │                         │
           Proxy A ←──── mTLS ────→ Proxy B
              │                         │
              └──────────┬──────────────┘
                         ↓
                     Service C
                         │
                      Proxy C

                    Control Plane
                         │
                         ↓
                       Istiod
```

外围：

``` text
GitOps

Observability

OpenTelemetry

Prometheus

Tracing Backend

Security Policy
```

共同形成微服务治理平台。

------------------------------------------------------------------------

# 34. Service Mesh适用与不适用场景（★★★★★）

## 适合

``` text
大量微服务

复杂服务调用

强安全要求

mTLS

复杂灰度

多团队治理

统一可观测性
```

------------------------------------------------------------------------

## 不一定适合

``` text
少量服务

简单内部系统

资源非常有限

团队缺少Mesh运维经验

没有复杂流量治理需求
```

核心：

> Service Mesh解决复杂性，但Service Mesh本身也会引入新的复杂性。

------------------------------------------------------------------------

# 35. Service Mesh常见问题与排查

## 服务无法通信

检查：

``` text
Service / Endpoint

Proxy状态

Routing Rule

DestinationRule

AuthorizationPolicy

mTLS

NetworkPolicy
```

------------------------------------------------------------------------

## 请求返回503

可能涉及：

``` text
Upstream不存在

Pod未Ready

Subset Label不匹配

路由错误

连接失败
```

------------------------------------------------------------------------

## Canary流量比例异常

检查：

``` text
VirtualService Weight

DestinationRule Subset

Pod Labels

实际请求样本量
```

------------------------------------------------------------------------

## mTLS失败

检查：

``` text
Certificate

Identity

Peer Authentication

Proxy Configuration

Clock
```

------------------------------------------------------------------------

## 延迟增加

检查：

``` text
Proxy Resource

Retry

Timeout

Tracing Sampling

Network

Application
```

------------------------------------------------------------------------

# 36. Service Mesh生产最佳实践

1.  不要为了使用Service Mesh而使用Service Mesh；
2.  先明确需要解决的通信治理问题；
3.  从少量业务逐步接入；
4.  对Control Plane进行高可用设计；
5.  为Proxy配置合理CPU和Memory；
6.  Retry必须设置上限；
7.  Retry与Timeout结合设计；
8.  注意请求幂等性；
9.  熔断策略根据真实业务指标设计；
10. Canary发布必须结合可观测性；
11. 使用mTLS保护服务间通信；
12. Authorization遵循最小权限；
13. Service Mesh与NetworkPolicy组合使用；
14. 流量规则纳入Git版本控制；
15. 生产策略通过Code Review；
16. 建立Mesh监控和告警；
17. 控制Tracing采样率；
18. 避免过度复杂的流量规则；
19. 定期验证证书和身份体系；
20. 评估Sidecar资源成本与Sidecarless方案。

------------------------------------------------------------------------

# 37. 系统架构设计师考点

## 什么是Service Mesh？

答：

> Service
> Mesh是用于治理微服务之间通信的基础设施层，通过代理和控制平面统一提供流量管理、安全和可观测性能力。

------------------------------------------------------------------------

## Data Plane和Control Plane区别？

答：

> Data Plane负责真正处理服务网络流量；Control
> Plane负责配置、策略、服务信息和证书等控制能力。

------------------------------------------------------------------------

## Sidecar Proxy有什么作用？

答：

> Sidecar
> Proxy与业务容器共同运行，代理服务通信，并统一实现负载均衡、超时、重试、mTLS和Telemetry等能力。

------------------------------------------------------------------------

## VirtualService与DestinationRule区别？

答：

> VirtualService主要描述流量如何路由，DestinationRule主要定义目标服务的Subset、负载均衡、连接和TLS等策略。

------------------------------------------------------------------------

## Timeout与Retry为什么要一起设计？

答：

> Timeout限制单次请求等待时间，Retry用于处理瞬时故障；如果缺少合理限制，过度重试可能导致流量放大和重试风暴。

------------------------------------------------------------------------

## 什么是mTLS？

答：

> mTLS是双向TLS，通信双方相互验证身份，同时提供通信加密和完整性保护。

------------------------------------------------------------------------

## Service Mesh与NetworkPolicy区别？

答：

> NetworkPolicy主要解决L3/L4网络访问控制，而Service
> Mesh更侧重L7服务路由、重试、超时、灰度、安全身份和可观测性治理。

------------------------------------------------------------------------

## Service Mesh与Ingress区别？

答：

> Ingress/Gateway主要关注外部进入集群的入口流量，而Service
> Mesh主要解决服务之间的通信治理，并可扩展到入口和出口流量管理。

------------------------------------------------------------------------

# 38. Mermaid Service Mesh架构图

``` mermaid
flowchart TD

CP[Istiod / Control Plane]

CP --> PA[Proxy A]
CP --> PB[Proxy B]
CP --> PC[Proxy C]

A[Service A] --> PA
PA --> PB
PB --> B[Service B]

PB --> PC
PC --> C[Service C]

GW[Mesh Gateway] --> PA

PA <-->|mTLS| PB
PB <-->|mTLS| PC

PA --> OBS[Metrics / Logs / Traces]
PB --> OBS
PC --> OBS

OBS --> OT[OpenTelemetry / Observability Backend]

GIT[Git Repository] --> GITOPS[GitOps Controller]
GITOPS --> CP
```

------------------------------------------------------------------------

# 39. 本节小结

Service Mesh核心知识：

1.  Service Mesh用于统一治理微服务之间的通信；
2.  Service Mesh通常分为Control Plane和Data Plane；
3.  Data Plane负责处理实际流量；
4.  Control Plane负责配置、策略、服务信息和证书；
5.  Sidecar模式通过代理将通信能力从业务代码中分离；
6.  Envoy是常见的云原生代理；
7.  Istio是常见Service Mesh实现；
8.  Istiod承担Istio核心控制平面能力；
9.  VirtualService主要负责流量路由；
10. DestinationRule主要负责目标服务策略；
11. Timeout可以防止请求无限等待；
12. Retry可以处理瞬时故障，但可能产生重试风暴；
13. Circuit Breaker用于降低下游持续故障造成的级联影响；
14. Fault Injection用于主动验证容错能力；
15. Service Mesh可以实现精细Canary和Traffic Splitting；
16. mTLS提供双向身份认证、加密和完整性保护；
17. Service Mesh可以统一产生服务通信Telemetry；
18. NetworkPolicy偏向L3/L4访问控制，Service Mesh偏向L7服务治理；
19. Ingress/Gateway主要关注入口流量，Service
    Mesh主要关注服务间通信治理；
20. Sidecar会带来额外资源和运维成本；
21. Sidecarless/Ambient Mesh试图降低Sidecar模式的部分成本；
22. Service Mesh策略可以通过GitOps进行版本化管理；
23. Service Mesh适合复杂微服务体系，但并非所有Kubernetes集群都需要。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Service Mesh通过"Control Plane统一下发策略 + Data
> Plane代理实际流量"，把Retry、Timeout、熔断、灰度、mTLS和可观测性等微服务通信能力从业务代码中抽离出来；CI/CD解决"版本如何发布"，Service
> Mesh进一步解决"发布后流量如何安全、可靠、可观测地流转"。
