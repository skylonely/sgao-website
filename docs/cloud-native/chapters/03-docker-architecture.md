# 03 Docker 整体架构与运行机制

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Docker 整体架构，包括 Docker Client、Docker
> Daemon、containerd、runc 等核心组件，以及 docker run
> 背后的完整执行流程。

------------------------------------------------------------------------

# 目录

1.  Docker整体架构概述
2.  Docker架构组成
3.  Docker Client
4.  Docker Daemon
5.  Docker Engine
6.  containerd
7.  runc
8.  Docker镜像运行流程
9.  docker run执行流程
10. Docker组件关系
11. 系统架构设计师考点
12. Mermaid架构图
13. 本节小结

------------------------------------------------------------------------

# 1. Docker整体架构概述

Docker采用客户端-服务端架构（Client-Server Architecture）。

整体结构：

``` text
Docker Client

↓

Docker Daemon

↓

Container Runtime

↓

Linux Kernel

↓

Container
```

Docker通过多个组件协同完成：

-   镜像管理；
-   容器创建；
-   网络配置；
-   存储管理；
-   容器生命周期控制。

------------------------------------------------------------------------

# 2. Docker架构组成

Docker主要包括：

``` text
Docker Client

Docker Host

Docker Registry
```

------------------------------------------------------------------------

## Docker Client

负责：

-   接收用户命令；
-   向Docker Daemon发送请求。

例如：

``` bash
docker run nginx
```

------------------------------------------------------------------------

## Docker Host

Docker运行环境。

包含：

-   Docker Daemon；
-   Containers；
-   Images。

------------------------------------------------------------------------

## Docker Registry

镜像仓库。

作用：

-   存储镜像；
-   下载镜像；
-   上传镜像。

常见：

-   Docker Hub；
-   企业私有镜像仓库。

------------------------------------------------------------------------

# 3. Docker Client

Docker Client是用户操作Docker的入口。

常见命令：

``` bash
docker build

docker pull

docker run

docker ps

docker stop
```

工作流程：

``` text
用户输入命令

↓

Docker Client

↓

Docker Daemon API
```

------------------------------------------------------------------------

# 4. Docker Daemon

Docker Daemon是Docker核心后台服务。

负责：

-   管理镜像；
-   管理容器；
-   管理网络；
-   管理存储。

运行位置：

通常运行在Docker Host。

------------------------------------------------------------------------

Docker Daemon架构：

``` text
Docker API

↓

Docker Daemon

↓

Container Management
```

------------------------------------------------------------------------

# 5. Docker Engine

Docker Engine是Docker核心执行环境。

主要负责：

-   接收API请求；
-   创建容器；
-   管理资源；
-   调用底层运行时。

组成：

``` text
Docker CLI

↓

Docker Daemon

↓

containerd

↓

runc
```

------------------------------------------------------------------------

# 6. containerd

containerd是工业级容器运行管理组件。

负责：

-   镜像管理；
-   容器生命周期管理；
-   存储管理。

Docker与Kubernetes都可以使用containerd。

架构：

``` text
Docker

↓

containerd

↓

runc

↓

Container
```

------------------------------------------------------------------------

# 7. runc

runc是OCI标准容器运行时。

负责：

-   创建容器进程；
-   配置Namespace；
-   配置Cgroups；
-   启动应用。

运行流程：

``` text
containerd

↓

runc

↓

Linux Kernel

↓

Container Process
```

------------------------------------------------------------------------

# 8. Docker镜像运行流程

当运行：

``` bash
docker run nginx
```

流程：

``` text
检查本地镜像

↓

不存在则从Registry下载

↓

创建Container

↓

配置Namespace

↓

配置Cgroups

↓

挂载文件系统

↓

启动应用
```

------------------------------------------------------------------------

# 9. docker run执行流程（★★★★★）

完整流程：

``` text
用户

↓

docker run

↓

Docker Client

↓

Docker Daemon

↓

containerd

↓

runc

↓

Linux Kernel

↓

创建Container

↓

运行应用
```

------------------------------------------------------------------------

# 10. Docker组件关系

整体关系：

``` text
Docker Client

↓

Docker Daemon

↓

containerd

↓

runc

↓

Namespace

↓

Cgroups

↓

Container
```

对应职责：

  组件         职责
  ------------ --------------
  Client       用户交互
  Daemon       Docker管理
  containerd   容器生命周期
  runc         运行容器
  Kernel       提供隔离能力

------------------------------------------------------------------------

# 11. 系统架构设计师考点

## 考点1：Docker架构模式

关键词：

-   Client-Server；
-   API通信；
-   Daemon管理。

------------------------------------------------------------------------

## 考点2：Docker核心组件职责

Docker Client：

> 用户操作入口。

Docker Daemon：

> Docker后台管理服务。

containerd：

> 管理容器生命周期。

runc：

> 创建和运行容器。

------------------------------------------------------------------------

## 考点3：容器启动过程

答：

> 用户通过Docker Client发送请求，Docker
> Daemon调用containerd和runc，最终利用Linux
> Kernel提供的Namespace和Cgroups创建容器。

------------------------------------------------------------------------

# 12. Mermaid架构图

``` mermaid
flowchart TD
    A[Docker Client]
    B[Docker Daemon]
    C[containerd]
    D[runc]
    E[Linux Kernel]
    F[Container]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
```

------------------------------------------------------------------------

# 本节小结

Docker整体架构核心：

1.  Docker采用Client-Server架构；
2.  Docker Client负责发送用户请求；
3.  Docker Daemon负责Docker资源管理；
4.  containerd负责容器生命周期管理；
5.  runc负责创建和运行容器；
6.  Linux Kernel通过Namespace和Cgroups提供底层能力。

下一篇：

📄 `04-docker-installation.md`

内容：

-   Docker安装方式；
-   Docker环境配置；
-   Docker命令基础；
-   Docker运行验证。
