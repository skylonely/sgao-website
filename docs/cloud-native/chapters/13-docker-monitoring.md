# 13 Docker 日志、监控与可观测性

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇从企业容器平台运维与可观测性架构角度介绍 Docker
> 日志、指标、链路监控体系，以及
> Prometheus、Grafana、日志采集和告警体系。

------------------------------------------------------------------------

# 目录

1.  Docker可观测性概述
2.  为什么需要容器监控
3.  Docker日志体系
4.  Docker Logging Driver
5.  docker logs机制
6.  容器日志采集架构
7.  Docker指标监控
8.  CPU与Memory监控
9.  容器资源统计
10. Prometheus监控体系
11. Grafana可视化
12. 日志、指标、链路三大可观测性
13. Docker事件监控
14. 容器健康检查
15. 告警体系设计
16. 企业Docker监控架构
17. Docker与Kubernetes可观测性关系
18. 系统架构设计师考点
19. Mermaid架构图
20. 本节小结

------------------------------------------------------------------------

# 1. Docker可观测性概述

可观测性（Observability）：

> 通过系统输出的信息分析系统内部运行状态的能力。

云原生环境主要关注：

``` text
Observability

├── Logs
├── Metrics
└── Traces
```

三类信息：

  类型      作用
  --------- --------------
  Logs      记录系统事件
  Metrics   描述系统状态
  Traces    分析调用链

------------------------------------------------------------------------

# 2. 为什么需要容器监控

容器环境具有：

-   生命周期短；
-   实例动态变化；
-   数量变化频繁；
-   网络地址变化。

传统服务器监控：

``` text
Server

↓

Application
```

容器环境：

``` text
Host

↓

Docker

↓

Container A

Container B

Container C
```

因此需要：

-   自动发现；
-   自动采集；
-   自动告警。

------------------------------------------------------------------------

# 3. Docker日志体系

Docker推荐应用将日志输出到：

-   stdout；
-   stderr。

流程：

``` text
Application

↓

stdout/stderr

↓

Docker Logging Driver

↓

日志系统
```

------------------------------------------------------------------------

# 4. Docker Logging Driver

常见日志驱动：

  Driver      用途
  ----------- ---------------
  json-file   默认日志
  journald    Linux日志系统
  syslog      系统日志
  fluentd     日志采集
  awslogs     云日志

结构：

``` text
Container

↓

Logging Driver

↓

Log Platform
```

------------------------------------------------------------------------

# 5. docker logs机制

查看日志：

``` bash
docker logs container_id
```

实时查看：

``` bash
docker logs -f container_id
```

用途：

-   排查启动失败；
-   定位运行异常。

------------------------------------------------------------------------

# 6. 容器日志采集架构

典型ELK：

``` text
Container

↓

Log Collector

↓

Elasticsearch

↓

Kibana
```

云原生常见：

``` text
Container

↓

Fluent Bit

↓

Loki

↓

Grafana
```

------------------------------------------------------------------------

# 7. Docker指标监控

主要指标：

## CPU

关注：

-   使用率；
-   限制；
-   负载。

## Memory

关注：

-   使用量；
-   OOM；
-   内存限制。

## Network

关注：

-   流量；
-   丢包；
-   错误。

## Disk

关注：

-   IO；
-   空间。

------------------------------------------------------------------------

# 8. 容器资源统计

Docker提供：

``` bash
docker stats
```

查看：

-   CPU；
-   Memory；
-   Network；
-   Block IO。

------------------------------------------------------------------------

# 9. Prometheus监控体系

Prometheus是云原生主流指标监控系统。

特点：

-   Pull模型；
-   时间序列存储；
-   灵活查询。

架构：

``` text
Container

↓

Exporter

↓

Prometheus

↓

Grafana
```

------------------------------------------------------------------------

# 10. Grafana可视化

Grafana负责：

-   Dashboard；
-   图表展示；
-   告警展示。

结构：

``` text
Prometheus

↓

Grafana

↓

Dashboard
```

------------------------------------------------------------------------

# 11. 日志、指标、链路三大可观测性

完整体系：

``` text
Observability

├── Logs
├── Metrics
└── Traces
```

例如：

请求异常：

Metrics：

> CPU升高。

Logs：

> 输出错误信息。

Traces：

> 定位具体调用链。

------------------------------------------------------------------------

# 12. Docker事件监控

命令：

``` bash
docker events
```

监控：

-   创建；
-   启动；
-   停止；
-   删除。

流程：

``` text
Container Event

↓

Monitoring System

↓

Alert
```

------------------------------------------------------------------------

# 13. 容器健康检查

流程：

``` text
Container

↓

Health Check

↓

Healthy / Unhealthy
```

作用：

-   判断服务状态；
-   支撑自动恢复。

------------------------------------------------------------------------

# 14. 告警体系设计

流程：

``` text
Metric

↓

Rule

↓

Alert

↓

Notification
```

例如：

``` text
Memory > 90%

↓

Alert

↓

通知管理员
```

------------------------------------------------------------------------

# 15. 企业Docker监控架构

典型架构：

``` text
Container

↓

Collector

↓

Metrics / Logs Platform

↓

Visualization

↓

Alert
```

常见组件：

-   Prometheus；
-   Grafana；
-   AlertManager；
-   ELK；
-   Loki。

------------------------------------------------------------------------

# 16. Docker与Kubernetes可观测性关系

Docker：

``` text
docker logs

docker stats

docker events
```

Kubernetes：

``` text
Metrics Server

+

Prometheus

+

Grafana

+

Logging System
```

演进：

``` text
Docker Monitoring

↓

Container Monitoring

↓

Cloud Native Observability
```

------------------------------------------------------------------------

# 17. 系统架构设计师考点

## 什么是可观测性？

答：

> 可观测性是通过日志、指标和链路信息分析系统内部运行状态的能力。

------------------------------------------------------------------------

## 为什么容器需要专门监控？

答：

> 容器具有生命周期短、实例动态变化等特点，需要自动发现和动态采集机制。

------------------------------------------------------------------------

## Prometheus特点？

答：

> Prometheus采用Pull模型采集时间序列指标数据，适合云原生动态环境。

------------------------------------------------------------------------

## Logs、Metrics、Traces区别？

答：

> Logs记录事件，Metrics描述状态，Traces分析调用链，三者共同构成可观测体系。

------------------------------------------------------------------------

# 18. Mermaid架构图

``` mermaid
flowchart TD
    A[Container]

    A --> B[Logs]
    A --> C[Metrics]
    A --> D[Traces]

    B --> E[Log Collector]
    E --> F[ELK / Loki]

    C --> G[Exporter]
    G --> H[Prometheus]
    H --> I[Grafana]

    D --> J[Tracing System]
```

------------------------------------------------------------------------

# 本节小结

Docker可观测性核心：

1.  Logs用于记录事件；
2.  Metrics用于描述系统状态；
3.  Traces用于分析调用链；
4.  Docker提供logs、stats、events基础能力；
5.  Prometheus和Grafana构成云原生指标监控体系；
6.  企业环境需要建立日志、指标、链路统一观测平台。

下一篇：

📄 `14-docker-swarm.md`

内容：

-   Docker Swarm架构；
-   Manager与Worker节点；
-   Service调度；
-   集群管理；
-   Swarm与Kubernetes比较。
