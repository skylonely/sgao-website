# 09 Docker 网络模型与容器通信机制

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇从容器网络架构角度介绍 Docker 网络模型，包括 Network
> Namespace、veth pair、Linux Bridge、iptables、Bridge/Host/None/Overlay
> 网络模式，以及 Docker 网络与 Kubernetes CNI 网络体系的关系。

------------------------------------------------------------------------

# 目录

1.  Docker网络概述
2.  容器网络基础原理
3.  Docker网络架构
4.  Network Namespace网络隔离
5.  Docker网络驱动模型
6.  Bridge网络
7.  Host网络
8.  None网络
9.  Overlay网络
10. 容器之间通信机制
11. 容器访问外部网络
12. 端口映射机制
13. Docker网络管理命令
14. Docker网络最佳实践
15. Docker网络与Kubernetes关系
16. 系统架构设计师考点
17. Mermaid知识结构图
18. 本节小结

------------------------------------------------------------------------

# 1. Docker网络概述

Docker网络负责：

-   容器之间通信；
-   容器访问外部网络；
-   服务发现；
-   网络隔离。

基本模型：

``` text
Container

↓

Docker Network

↓

Host Network

↓

External Network
```

------------------------------------------------------------------------

# 2. 容器网络基础原理

Docker网络依赖Linux网络技术：

-   Network Namespace；
-   veth pair；
-   Linux Bridge；
-   iptables。

基本结构：

``` text
Container

↓

veth pair

↓

Linux Bridge

↓

Host Network
```

------------------------------------------------------------------------

# 3. Docker网络架构

Docker网络主要由：

-   网络命名空间；
-   网络驱动；
-   虚拟网卡；
-   网络规则；

组成。

整体：

``` text
Container

↓

Network Namespace

↓

Docker Network Driver

↓

Host Network Stack
```

------------------------------------------------------------------------

# 4. Network Namespace网络隔离（★★★★★）

Network Namespace用于隔离容器网络环境。

每个容器拥有：

-   独立网络接口；
-   独立IP地址；
-   独立路由表；
-   独立iptables规则。

结构：

``` text
Container A

↓

Network Namespace A


Container B

↓

Network Namespace B
```

------------------------------------------------------------------------

# 5. Docker网络驱动模型

Docker常见网络驱动：

  驱动      作用
  --------- ----------------
  bridge    单机容器通信
  host      共享宿主机网络
  none      关闭网络
  overlay   跨主机通信
  macvlan   接入物理网络

------------------------------------------------------------------------

# 6. Bridge网络（★★★★★）

Bridge是Docker默认网络模式。

架构：

``` text
Container A

↓

veth

↓

docker0 Bridge

↓

Host Network
```

特点：

-   默认创建；
-   适合单机部署；
-   支持容器互通。

------------------------------------------------------------------------

# 7. Host网络

Host模式让容器直接使用宿主机网络。

结构：

``` text
Container

↓

Host Network
```

优势：

-   性能高；
-   无NAT转换。

不足：

-   网络隔离降低；
-   端口容易冲突。

------------------------------------------------------------------------

# 8. None网络

None模式关闭容器网络。

结构：

``` text
Container

↓

No Network
```

适用于：

-   高安全隔离；
-   自定义网络环境。

------------------------------------------------------------------------

# 9. Overlay网络（★★★★★）

Overlay用于跨主机容器通信。

结构：

``` text
Host A

Container

↓

Overlay Network

↓

Host B

Container
```

特点：

-   支持分布式部署；
-   实现跨节点通信；
-   适用于容器集群。

------------------------------------------------------------------------

# 10. 容器之间通信机制

## 同网络通信

``` text
Container A

↓

Docker Network

↓

Container B
```

------------------------------------------------------------------------

## 不同网络通信

需要：

-   网络连接；
-   路由配置。

------------------------------------------------------------------------

# 11. 容器访问外部网络

流程：

``` text
Container

↓

docker0

↓

iptables NAT

↓

Host

↓

Internet
```

Docker通过NAT实现：

-   容器私网地址转换；
-   外部网络访问。

------------------------------------------------------------------------

# 12. 端口映射机制

例如：

``` bash
docker run -p 8080:80 nginx
```

结构：

``` text
Client

↓

Host:8080

↓

Container:80
```

作用：

将宿主机端口映射到容器服务端口。

------------------------------------------------------------------------

# 13. Docker网络管理命令

查看网络：

``` bash
docker network ls
```

创建网络：

``` bash
docker network create my-net
```

查看详情：

``` bash
docker network inspect my-net
```

连接网络：

``` bash
docker network connect my-net container
```

------------------------------------------------------------------------

# 14. Docker网络最佳实践

## 使用自定义网络

优势：

-   更好的服务隔离；
-   更清晰的网络管理。

------------------------------------------------------------------------

## 合理暴露端口

避免：

-   不必要服务暴露；
-   安全风险。

------------------------------------------------------------------------

## 业务网络隔离

不同业务使用不同网络：

``` text
业务A Network

业务B Network
```

------------------------------------------------------------------------

# 15. Docker网络与Kubernetes关系（★★★★★）

Docker：

``` text
Docker Network

↓

Bridge / Overlay
```

Kubernetes：

``` text
Pod Network

↓

CNI插件

↓

Container Network
```

演进：

``` text
Docker Network

↓

Kubernetes CNI

↓

Cloud Native Network
```

------------------------------------------------------------------------

# 16. 系统架构设计师考点

## Docker网络如何实现隔离？

答：

> Docker通过Network
> Namespace为容器创建独立网络环境，实现网络接口、IP地址和路由表隔离。

------------------------------------------------------------------------

## Bridge网络特点？

答：

> Bridge是Docker默认网络模式，通过Linux网桥实现单机容器之间通信。

------------------------------------------------------------------------

## Overlay网络作用？

答：

> Overlay网络用于跨主机容器通信，为分布式容器平台提供统一网络。

------------------------------------------------------------------------

## 容器访问外部网络如何实现？

答：

> Docker通过iptables NAT实现容器私有地址到宿主机地址转换。

------------------------------------------------------------------------

# 17. Mermaid知识结构图

``` mermaid
mindmap
  root((Docker Network))
    网络基础
      Namespace
      veth pair
      Bridge
      iptables
    网络模式
      Bridge
      Host
      None
      Overlay
      Macvlan
    通信机制
      Container Communication
      Port Mapping
      NAT
    云原生
      Kubernetes
      CNI
      Service Network
```

------------------------------------------------------------------------

# 本节小结

Docker网络核心：

1.  Network Namespace实现网络隔离；
2.  veth pair连接容器与宿主机网络；
3.  Bridge适用于单机容器通信；
4.  Overlay支持跨主机容器通信；
5.  iptables NAT实现容器访问外部网络；
6.  Kubernetes通过CNI扩展云原生网络能力。

下一篇：

📄 `10-docker-compose.md`

内容：

-   Docker Compose概念；
-   多容器应用编排；
-   YAML配置；
-   服务依赖管理；
-   Compose与Kubernetes关系。
