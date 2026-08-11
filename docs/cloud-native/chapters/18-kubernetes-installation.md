# 18 Kubernetes 安装与集群部署

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes
> 集群安装流程，包括部署方式、kubeadm、containerd、Control
> Plane初始化、Worker节点加入、CNI网络插件、高可用部署以及生产环境建议。

------------------------------------------------------------------------

# 目录

1.  Kubernetes安装概述
2.  Kubernetes部署方式
3.  kubeadm介绍
4.  Kubernetes安装架构
5.  环境准备
6.  Linux系统配置
7.  Container Runtime安装
8.  containerd配置
9.  kubeadm kubelet kubectl安装
10. Control Plane初始化
11. Worker Node加入集群
12. CNI网络插件安装
13. Kubernetes集群验证
14. Kubernetes组件检查
15. 高可用集群部署
16. 生产环境部署建议
17. 常见安装问题
18. 系统架构设计师考点
19. Mermaid部署流程图
20. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes安装概述

Kubernetes集群部署目标：

> 构建一个能够运行容器化应用的分布式集群环境。

基本结构：

``` text
Kubernetes Cluster

Control Plane

↓

Worker Nodes

↓

Containers
```

------------------------------------------------------------------------

# 2. Kubernetes部署方式

常见部署方式：

## kubeadm

官方推荐工具。

适合：

-   学习环境；
-   测试环境；
-   生产基础部署。

------------------------------------------------------------------------

## 二进制安装

特点：

-   高度可控；
-   灵活配置。

缺点：

-   部署复杂；
-   运维成本较高。

------------------------------------------------------------------------

## 托管Kubernetes

例如云厂商提供的Kubernetes服务。

优势：

-   控制平面自动维护；
-   降低运维成本。

------------------------------------------------------------------------

# 3. kubeadm介绍

kubeadm：

> Kubernetes官方提供的集群初始化工具。

主要功能：

-   初始化Control Plane；
-   创建集群配置；
-   生成证书；
-   加入Worker节点。

流程：

``` text
kubeadm init

↓

Control Plane

↓

kubeadm join

↓

Worker Node
```

------------------------------------------------------------------------

# 4. Kubernetes安装架构

典型结构：

``` text
Kubernetes Cluster

        Control Plane

   kube-apiserver
   etcd
   scheduler
   controller


        Worker Node

   kubelet
   kube-proxy
   containerd
```

------------------------------------------------------------------------

# 5. 环境准备

准备内容：

## 节点规划

示例：

``` text
Control Plane

192.168.1.10


Worker1

192.168.1.11


Worker2

192.168.1.12
```

------------------------------------------------------------------------

## 基础要求

包括：

-   Linux系统；
-   网络连通；
-   时间同步；
-   足够CPU和内存。

------------------------------------------------------------------------

# 6. Linux系统配置

安装前通常需要：

## 关闭Swap

原因：

Kubernetes需要准确管理资源。

------------------------------------------------------------------------

## 内核参数配置

包括：

-   网络转发；
-   Bridge过滤。

------------------------------------------------------------------------

## 时间同步

保证：

-   证书有效；
-   日志时间一致。

------------------------------------------------------------------------

# 7. Container Runtime安装

Kubernetes不直接运行容器。

架构：

``` text
Kubernetes

↓

CRI

↓

Container Runtime

↓

Container
```

常见Runtime：

-   containerd；
-   CRI-O。

------------------------------------------------------------------------

# 8. containerd配置

现代Kubernetes推荐：

``` text
Kubernetes

↓

containerd

↓

Container
```

containerd负责：

-   镜像管理；
-   容器生命周期管理。

------------------------------------------------------------------------

# 9. kubeadm、kubelet、kubectl安装

三个核心工具：

  工具      作用
  --------- ----------
  kubeadm   创建集群
  kubelet   节点代理
  kubectl   管理集群

关系：

``` text
kubectl

↓

API Server

↓

kubelet

↓

Container
```

------------------------------------------------------------------------

# 10. Control Plane初始化

初始化命令：

``` bash
kubeadm init
```

完成：

-   API Server部署；
-   etcd部署；
-   Scheduler部署；
-   Controller部署。

结果：

``` text
Control Plane Ready
```

------------------------------------------------------------------------

# 11. Worker Node加入集群

Worker执行：

``` bash
kubeadm join
```

流程：

``` text
Worker Node

↓

Authentication

↓

Join Cluster

↓

Ready
```

------------------------------------------------------------------------

# 12. CNI网络插件安装

Kubernetes默认不提供Pod网络。

需要安装CNI插件：

-   Calico；
-   Flannel；
-   Cilium。

作用：

-   Pod通信；
-   网络配置；
-   网络策略。

结构：

``` text
Pod

↓

CNI

↓

Cluster Network
```

------------------------------------------------------------------------

# 13. Kubernetes集群验证

节点检查：

``` bash
kubectl get nodes
```

Pod检查：

``` bash
kubectl get pods -A
```

查看集群状态：

``` bash
kubectl cluster-info
```

------------------------------------------------------------------------

# 14. Kubernetes组件检查

重点关注：

-   API Server；
-   Scheduler；
-   Controller Manager；
-   etcd。

确保控制平面正常运行。

------------------------------------------------------------------------

# 15. 高可用集群部署

生产环境：

``` text
             Load Balancer

                  ↓

 API Server  API Server  API Server

                  ↓

              etcd Cluster
```

特点：

-   多Control Plane；
-   API Server负载均衡；
-   etcd集群。

------------------------------------------------------------------------

# 16. 生产环境部署建议

## 节点规划

合理规划：

-   CPU；
-   Memory；
-   Storage。

------------------------------------------------------------------------

## 网络规划

关注：

-   Pod CIDR；
-   Service CIDR；
-   CNI方案。

------------------------------------------------------------------------

## 安全规划

包括：

-   RBAC；
-   TLS；
-   Secret管理。

------------------------------------------------------------------------

## 运维规划

包括：

-   日志；
-   监控；
-   备份；
-   灾备。

------------------------------------------------------------------------

# 17. 常见安装问题

## kubelet启动失败

可能原因：

-   Swap未关闭；
-   配置错误；
-   Runtime异常。

------------------------------------------------------------------------

## Pod无法启动

检查：

-   镜像；
-   网络；
-   Runtime。

------------------------------------------------------------------------

## Node NotReady

常见原因：

-   CNI未安装；
-   kubelet异常；
-   网络问题。

------------------------------------------------------------------------

# 18. 系统架构设计师考点

## kubeadm作用？

答：

> kubeadm是Kubernetes官方提供的集群初始化工具，用于创建Control
> Plane并加入Worker节点。

------------------------------------------------------------------------

## kubelet作用？

答：

> kubelet运行在每个节点，负责接收Pod定义并管理容器生命周期。

------------------------------------------------------------------------

## 为什么需要CNI？

答：

> Kubernetes通过CNI插件实现Pod网络配置和集群内部通信。

------------------------------------------------------------------------

## containerd作用？

答：

> containerd负责容器镜像管理和生命周期运行，是Kubernetes常用容器运行时。

------------------------------------------------------------------------

# 19. Mermaid部署流程图

``` mermaid
flowchart TD

A[Prepare Linux Nodes]

↓

B[Install containerd]

↓

C[Install kubeadm kubelet kubectl]

↓

D[kubeadm init]

↓

E[Control Plane Ready]

↓

F[kubeadm join]

↓

G[Worker Nodes Join]

↓

H[Install CNI]

↓

I[Kubernetes Cluster Ready]
```

------------------------------------------------------------------------

# 20. 本节小结

Kubernetes安装核心流程：

1.  准备Linux节点环境；
2.  安装Container Runtime；
3.  安装kubeadm、kubelet、kubectl；
4.  初始化Control Plane；
5.  Worker节点加入集群；
6.  安装CNI网络插件；
7.  验证集群状态。

------------------------------------------------------------------------

# 一句话冲刺记忆

> kubeadm负责建集群，kubelet负责节点执行，kubectl负责管理，containerd负责运行容器，CNI负责Pod网络。
