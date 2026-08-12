# 37 Kubernetes 日志、监控与可观测性体系

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes 日志、监控与可观测性体系，重点掌握
> Metrics、Logs、Traces 三大支柱，以及 Metrics
> Server、Prometheus、Grafana、集中日志、OpenTelemetry、Alertmanager、SLI/SLO/SLA
> 和生产故障排查方法。

------------------------------------------------------------------------

# 目录

1.  Kubernetes可观测性概述
2.  Monitoring与Observability区别
3.  可观测性三大支柱
4.  Kubernetes可观测性整体架构
5.  Kubernetes Metrics指标体系
6.  Metrics Server资源指标
7.  Prometheus监控体系
8.  Prometheus指标采集机制
9.  Grafana监控可视化
10. Kubernetes核心监控指标
11. Pod与Container监控
12. Node节点监控
13. Control Plane监控
14. Kubernetes日志体系
15. Container日志采集
16. DaemonSet日志采集架构
17. Loki / ELK等集中日志体系
18. 分布式Tracing链路追踪
19. OpenTelemetry可观测性标准
20. Alertmanager告警体系
21. SLI、SLO与SLA
22. Kubernetes故障排查流程
23. 可观测性与HPA关系
24. 企业可观测性架构
25. Kubernetes可观测性最佳实践
26. 系统架构设计师考点
27. Mermaid可观测性架构图
28. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes可观测性概述（★★★★★）

Kubernetes生产环境不仅需要：

``` text
应用能够运行
```

还必须能够回答：

``` text
现在是否正常？

哪里出现异常？

为什么出现异常？

一次请求经过了哪些服务？
```

因此需要建立：

> Observability，可观测性体系。

典型目标：

-   发现故障；
-   定位故障；
-   分析性能；
-   容量规划；
-   趋势分析；
-   自动告警；
-   支撑SLO治理。

------------------------------------------------------------------------

# 2. Monitoring与Observability区别

Monitoring：

> 监控已知指标和已知问题。

例如：

``` text
CPU > 80%

↓

Alert
```

Observability：

> 根据系统产生的外部数据理解系统内部状态，并支持分析未知问题。

可以简单理解：

``` text
Monitoring

告诉你“发生问题了”


Observability

帮助你进一步理解“哪里、为什么、如何发生”
```

两者不是对立关系。

监控是可观测性体系的重要组成部分。

------------------------------------------------------------------------

# 3. 可观测性三大支柱（★★★★★）

传统可观测性通常强调三类核心数据：

``` text
Metrics

Logs

Traces
```

## Metrics

指标。

回答：

``` text
系统现在怎么样？
```

例如：

-   CPU使用率；
-   Memory使用率；
-   QPS；
-   Error Rate；
-   Response Time。

------------------------------------------------------------------------

## Logs

日志。

回答：

``` text
具体发生了什么？
```

例如：

``` text
ERROR

database connection timeout
```

------------------------------------------------------------------------

## Traces

分布式链路追踪。

回答：

``` text
一次请求经过了哪些服务？

时间花在哪里？
```

例如：

``` text
Gateway

↓

Order Service

↓

Payment Service

↓

Database
```

三者结合：

``` text
Metrics发现异常

↓

Logs分析错误

↓

Traces定位调用链
```

------------------------------------------------------------------------

# 4. Kubernetes可观测性整体架构

典型架构：

``` text
Kubernetes Cluster
        │
        ├── Metrics
        │      ↓
        │  Prometheus
        │      ↓
        │   Grafana
        │
        ├── Logs
        │      ↓
        │  Log Agent
        │      ↓
        │ Loki / Elasticsearch
        │
        └── Traces
               ↓
          OpenTelemetry
               ↓
          Trace Backend
```

同时：

``` text
Prometheus

↓

Alertmanager

↓

Notification
```

形成：

``` text
采集

↓

存储

↓

查询

↓

可视化

↓

告警

↓

故障分析
```

------------------------------------------------------------------------

# 5. Kubernetes Metrics指标体系

Kubernetes环境中的指标可以分为：

## 基础资源指标

``` text
CPU

Memory
```

------------------------------------------------------------------------

## Kubernetes对象状态指标

例如：

``` text
Pod状态

Deployment副本状态

Node状态
```

------------------------------------------------------------------------

## 应用指标

例如：

``` text
HTTP Requests

QPS

Error Rate

Latency
```

------------------------------------------------------------------------

## 业务指标

例如：

``` text
订单量

支付成功率

队列积压量
```

成熟的可观测性体系不能只关注CPU和Memory。

------------------------------------------------------------------------

# 6. Metrics Server资源指标（★★★★★）

Metrics Server主要提供Kubernetes资源指标能力。

典型指标：

-   CPU；
-   Memory。

可以支持：

``` bash
kubectl top nodes
```

以及：

``` bash
kubectl top pods
```

同时资源指标可以用于：

``` text
HPA
```

典型关系：

``` text
Kubelet

↓

Metrics Server

↓

Metrics API

↓

HPA
```

需要注意：

> Metrics Server不是完整的长期监控平台。

它主要服务于Kubernetes资源指标场景。

------------------------------------------------------------------------

# 7. Prometheus监控体系（★★★★★）

Prometheus是云原生环境中非常常见的指标监控系统。

核心能力：

``` text
Metrics Collection

↓

Time Series Storage

↓

PromQL

↓

Alerting / Visualization
```

典型架构：

``` text
Application / Exporter

↓

Prometheus

↓

Grafana


Prometheus

↓

Alertmanager
```

Prometheus适合：

-   Kubernetes监控；
-   Node监控；
-   应用监控；
-   业务指标；
-   告警规则。

------------------------------------------------------------------------

# 8. Prometheus指标采集机制

Prometheus典型模式：

> Pull。

即：

``` text
Prometheus

↓

定期抓取

↓

Metrics Endpoint
```

例如应用暴露：

``` text
/metrics
```

Prometheus定期采集：

``` text
http_requests_total

http_request_duration

process_cpu
```

形成时间序列数据。

------------------------------------------------------------------------

# 9. Grafana监控可视化

Grafana主要用于：

> 将指标等数据通过Dashboard进行可视化。

结构：

``` text
Prometheus

↓

Grafana

↓

Dashboard
```

常见Dashboard：

-   Cluster Overview；
-   Node Overview；
-   Pod Overview；
-   Application Dashboard；
-   Business Dashboard。

例如：

``` text
CPU趋势

Memory趋势

QPS趋势

Latency趋势

Error Rate趋势
```

相比单个指标：

> 趋势图更适合分析性能变化和异常时间点。

------------------------------------------------------------------------

# 10. Kubernetes核心监控指标（★★★★★）

生产环境通常需要关注多个层次。

## Cluster

-   Node数量；
-   Pod数量；
-   Pending Pod；
-   资源总体使用率。

## Node

-   CPU；
-   Memory；
-   Disk；
-   Network；
-   Load；
-   Node Condition。

## Pod

-   CPU；
-   Memory；
-   Restart Count；
-   Pod Phase；
-   OOMKilled。

## Application

-   QPS；
-   Error Rate；
-   Latency；
-   Active Connections。

------------------------------------------------------------------------

# 11. Pod与Container监控

Pod是Kubernetes最重要的工作负载运行单元。

重点关注：

``` text
CPU Usage

Memory Usage

Restart Count

Pod Status

Container Status
```

典型异常：

``` text
CrashLoopBackOff

ImagePullBackOff

OOMKilled

Pending
```

例如：

``` text
Restart Count持续增加

↓

检查Container状态

↓

检查Logs

↓

定位应用异常
```

------------------------------------------------------------------------

# 12. Node节点监控

Node承载多个Pod。

Node异常可能影响：

``` text
大量Pod
```

重点指标：

-   CPU；
-   Memory；
-   Disk；
-   Network；
-   Filesystem；
-   Load；
-   Node Condition。

特别关注：

``` text
MemoryPressure

DiskPressure

PIDPressure

NotReady
```

典型链路：

``` text
Node MemoryPressure

↓

Pod Eviction

↓

业务副本减少

↓

服务风险
```

------------------------------------------------------------------------

# 13. Control Plane监控

Control Plane是Kubernetes集群控制核心。

需要关注：

``` text
API Server

etcd

Scheduler

Controller Manager
```

例如：

## API Server

关注：

-   请求量；
-   延迟；
-   错误率。

## etcd

关注：

-   存储容量；
-   请求延迟；
-   集群健康。

## Scheduler

关注：

-   调度延迟；
-   调度失败。

Control Plane异常可能影响整个Cluster管理能力。

------------------------------------------------------------------------

# 14. Kubernetes日志体系（★★★★★）

日志通常来自：

``` text
Application

Container

Node

Kubernetes Components
```

应用日志推荐：

``` text
Application

↓

stdout / stderr

↓

Container Runtime

↓

Node Log

↓

Log Agent

↓

Central Log System
```

优势：

> 应用不需要自行管理复杂日志文件生命周期。

------------------------------------------------------------------------

# 15. Container日志采集

Container通常将日志写入：

``` text
stdout

stderr
```

查看：

``` bash
kubectl logs pod-name
```

指定Container：

``` bash
kubectl logs pod-name -c container-name
```

查看前一个Container实例：

``` bash
kubectl logs pod-name --previous
```

这对排查：

``` text
CrashLoopBackOff
```

非常有用。

------------------------------------------------------------------------

# 16. DaemonSet日志采集架构（★★★★★）

前面学习过：

> DaemonSet保证每个符合条件的Node运行一个Pod副本。

因此非常适合部署日志Agent。

例如：

``` text
Node 1

↓

Fluent Bit


Node 2

↓

Fluent Bit


Node 3

↓

Fluent Bit
```

统一发送：

``` text
Log Backend
```

整体：

``` text
Node

↓

Container Logs

↓

DaemonSet Log Agent

↓

Central Log Storage
```

这是DaemonSet最典型的生产场景之一。

------------------------------------------------------------------------

# 17. Loki / ELK等集中日志体系

日志集中化的核心目标：

``` text
所有Node日志

↓

统一采集

↓

统一存储

↓

统一搜索
```

常见方案包括：

## Loki体系

``` text
Log Agent

↓

Loki

↓

Grafana
```

## ELK / Elastic Stack思路

``` text
Log Agent

↓

Elasticsearch

↓

Kibana
```

集中日志可以支持：

-   全局搜索；
-   错误分析；
-   安全审计；
-   多Pod关联分析。

------------------------------------------------------------------------

# 18. 分布式Tracing链路追踪（★★★★★）

微服务请求可能经过：

``` text
Gateway

↓

User Service

↓

Order Service

↓

Payment Service

↓

Database
```

如果总耗时：

``` text
2 Seconds
```

仅靠日志很难快速判断：

``` text
哪一层最慢？
```

Tracing可以记录：

``` text
Trace

↓

Span

↓

Service调用关系
```

例如：

``` text
Gateway       50ms

Order         200ms

Payment       1500ms

Database      100ms
```

可以快速发现：

``` text
Payment Service

↓

主要延迟来源
```

------------------------------------------------------------------------

# 19. OpenTelemetry可观测性标准（★★★★★）

OpenTelemetry：

> 用于生成、采集和传输Metrics、Logs、Traces等遥测数据的开放可观测性框架。

典型架构：

``` text
Application

↓

OpenTelemetry SDK

↓

OpenTelemetry Collector

↓

Observability Backend
```

Collector可以承担：

-   接收；
-   处理；
-   转换；
-   导出；

遥测数据。

优势：

> 降低应用与具体可观测性后端之间的耦合。

------------------------------------------------------------------------

# 20. Alertmanager告警体系（★★★★★）

只有Dashboard是不够的。

生产环境需要：

``` text
异常

↓

自动发现

↓

主动通知
```

典型：

``` text
Prometheus

↓

Alert Rule

↓

Alertmanager

↓

Notification
```

告警场景：

``` text
Node NotReady

Pod Restart异常

CPU持续过高

Memory接近上限

API Error Rate过高
```

告警设计应避免：

``` text
大量无意义告警

↓

Alert Fatigue
```

即：

> 告警疲劳。

------------------------------------------------------------------------

# 21. SLI、SLO与SLA（★★★★★）

这是系统架构设计和SRE中的重要概念。

## SLI

Service Level Indicator。

> 服务水平指标。

例如：

``` text
Availability

Latency

Error Rate
```

------------------------------------------------------------------------

## SLO

Service Level Objective。

> 服务水平目标。

例如：

``` text
月可用性 ≥ 99.9%
```

------------------------------------------------------------------------

## SLA

Service Level Agreement。

> 服务水平协议。

通常属于：

``` text
服务提供方

与

客户
```

之间的正式约定。

记忆：

``` text
SLI

测什么


SLO

目标是多少


SLA

对外承诺什么
```

------------------------------------------------------------------------

# 22. Kubernetes故障排查流程（★★★★★）

推荐形成标准化流程。

## 第一步：查看整体状态

``` bash
kubectl get pods
```

查看：

-   Running；
-   Pending；
-   CrashLoopBackOff；
-   Error。

------------------------------------------------------------------------

## 第二步：查看资源详情

``` bash
kubectl describe pod pod-name
```

重点：

``` text
Events
```

------------------------------------------------------------------------

## 第三步：查看日志

``` bash
kubectl logs pod-name
```

------------------------------------------------------------------------

## 第四步：查看Metrics

检查：

``` text
CPU

Memory

Restart

Node Pressure
```

------------------------------------------------------------------------

## 第五步：检查依赖链路

``` text
Service

DNS

NetworkPolicy

Database

External API
```

------------------------------------------------------------------------

## 第六步：使用Tracing定位调用链

``` text
Trace

↓

Slow Span

↓

Root Cause
```

完整思路：

``` text
告警

↓

Metrics

↓

Pod / Node定位

↓

Logs

↓

Traces

↓

根因

↓

修复

↓

指标验证
```

------------------------------------------------------------------------

# 23. 可观测性与HPA关系

前面学习HPA：

``` text
Metrics

↓

HPA

↓

调整Replicas
```

例如：

``` text
CPU升高

↓

HPA

↓

3 Pods → 8 Pods
```

因此：

> 可观测性数据不仅用于人类观察，也可以直接参与自动化控制。

形成：

``` text
Observe

↓

Decide

↓

Act
```

即：

``` text
观测

↓

决策

↓

执行
```

------------------------------------------------------------------------

# 24. 企业可观测性架构

企业级架构可以设计：

``` text
                 Kubernetes Cluster
                         │
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
    Metrics             Logs             Traces
       │                 │                 │
       ↓                 ↓                 ↓
  Prometheus          Log Agent       OpenTelemetry
       │                 │                 │
       ↓                 ↓                 ↓
    Grafana        Log Backend       Trace Backend
       │
       ↓
 Alertmanager
       │
       ↓
 Notification
```

上层形成统一：

``` text
Dashboard

Alert

Search

Trace

SLO
```

------------------------------------------------------------------------

# 25. Kubernetes可观测性最佳实践

建议：

1.  同时建设Metrics、Logs、Traces；
2.  不要只监控CPU和Memory；
3.  为核心业务定义SLI和SLO；
4.  统一日志格式；
5.  日志中加入请求或Trace关联信息；
6.  使用DaemonSet采集节点日志；
7.  对Node、Pod、Control Plane分层监控；
8.  对业务接口监控QPS、Latency和Error Rate；
9.  告警应关注用户影响和可操作性；
10. 避免告警疲劳；
11. 为日志和指标设置合理保留周期；
12. 控制高基数Metrics；
13. 建立标准故障排查流程；
14. 将可观测性配置纳入版本管理；
15. 通过Dashboard与告警持续验证系统健康；
16. 将HPA等自动化机制与可靠指标结合。

------------------------------------------------------------------------

# 26. 系统架构设计师考点

## 什么是可观测性？

答：

> 可观测性是通过系统产生的Metrics、Logs、Traces等外部数据理解系统内部运行状态和故障原因的能力。

------------------------------------------------------------------------

## 可观测性三大支柱是什么？

答：

> Metrics、Logs和Traces。

------------------------------------------------------------------------

## Metrics Server和Prometheus区别？

答：

> Metrics Server主要提供Kubernetes CPU和Memory等资源指标，常用于kubectl
> top和HPA；Prometheus是更完整的时序指标监控系统，可用于基础设施、应用和业务指标的采集、查询和告警。

------------------------------------------------------------------------

## 为什么日志Agent适合使用DaemonSet？

答：

> 因为DaemonSet可以保证每个符合条件的Node运行一个日志Agent，从而采集该节点上的Container日志。

------------------------------------------------------------------------

## Prometheus和Grafana区别？

答：

> Prometheus主要负责指标采集、存储和查询，Grafana主要负责数据可视化和Dashboard展示。

------------------------------------------------------------------------

## Tracing解决什么问题？

答：

> Tracing记录一次请求在多个服务之间的调用链和耗时，可以用于定位分布式系统中的延迟和故障位置。

------------------------------------------------------------------------

## OpenTelemetry作用？

答：

> OpenTelemetry提供统一的遥测数据生成、采集和传输框架，支持Metrics、Logs和Traces等可观测性数据。

------------------------------------------------------------------------

## SLI、SLO和SLA区别？

答：

> SLI表示实际测量的服务水平指标，SLO表示目标值，SLA表示服务提供方与客户之间的服务水平约定。

------------------------------------------------------------------------

# 27. Mermaid可观测性架构图

``` mermaid
flowchart TD

A[Kubernetes Cluster]

A --> B[Metrics]
A --> C[Logs]
A --> D[Traces]

B --> E[Prometheus]
E --> F[Grafana]
E --> G[Alertmanager]
G --> H[Notification]

C --> I[DaemonSet Log Agent]
I --> J[Loki / Elasticsearch]
J --> F

D --> K[OpenTelemetry]
K --> L[Trace Backend]

M[Metrics Server] --> N[Metrics API]
N --> O[HPA]

A --> M

F --> P[Dashboard]
L --> Q[Distributed Trace]
```

------------------------------------------------------------------------

# 28. 本节小结

Kubernetes可观测性核心知识：

1.  Monitoring是可观测性体系的重要组成部分；
2.  可观测性传统三大支柱是Metrics、Logs、Traces；
3.  Metrics Server主要提供CPU和Memory等资源指标；
4.  Prometheus负责完整的指标采集、时序存储和查询；
5.  Grafana负责Dashboard可视化；
6.  Pod、Node和Control Plane都需要监控；
7.  Kubernetes应用日志通常通过stdout/stderr输出；
8.  DaemonSet非常适合部署节点级日志采集Agent；
9.  Loki和Elastic体系可用于集中日志管理；
10. Tracing用于分析微服务调用链和延迟；
11. OpenTelemetry提供统一遥测标准与采集体系；
12. Alertmanager负责告警路由与通知；
13. SLI是指标，SLO是目标，SLA是服务协议；
14. 故障排查应结合Metrics、Logs和Traces；
15. 可观测性数据还可以驱动HPA等自动化机制；
16. 企业可观测性最终目标是提升系统可靠性、故障定位效率和服务质量。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Metrics告诉你"系统发生了什么"，Logs帮助分析"为什么发生"，Traces告诉你"请求在哪里出了问题"；Prometheus、日志系统和OpenTelemetry共同构成Kubernetes可观测性基础。
