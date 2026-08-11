# 08 Docker 数据持久化与存储管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇从容器存储架构角度介绍 Docker
> 数据持久化机制，包括容器临时存储、Storage Driver、Volume、Bind
> Mount、数据备份、企业存储方案以及与 Kubernetes 存储体系的关系。

------------------------------------------------------------------------

# 目录

1.  Docker存储概述
2.  容器数据为什么会丢失
3.  Docker存储模型
4.  Storage Driver存储驱动
5.  Volume数据卷
6.  Bind Mount绑定挂载
7.  tmpfs临时存储
8.  Volume生命周期管理
9.  数据备份与恢复
10. 容器存储最佳实践
11. Docker存储与数据库应用
12. Docker存储与Kubernetes关系
13. 常用Volume管理命令
14. 企业级存储方案
15. 系统架构设计师考点
16. Mermaid知识结构图
17. 本节小结

------------------------------------------------------------------------

# 1. Docker存储概述

Docker容器默认具有临时性。

容器内部产生的数据：

-   保存在容器可写层；
-   生命周期与容器绑定；
-   删除容器后可能丢失。

结构：

``` text
Container

↓

Writable Layer

↓

删除Container

↓

数据丢失
```

因此生产环境需要独立的数据持久化机制。

------------------------------------------------------------------------

# 2. 容器数据为什么会丢失

Docker镜像：

-   只读；
-   不保存运行时修改。

容器运行时：

``` text
Image Layer

+

Writable Container Layer
```

当容器删除：

``` text
Container Delete

↓

Writable Layer Delete

↓

数据丢失
```

------------------------------------------------------------------------

# 3. Docker存储模型

Docker存储主要包括：

``` text
Container

↓

Storage Driver

↓

Host Filesystem
```

组成：

-   Image Layer；
-   Container Layer；
-   Volume。

------------------------------------------------------------------------

# 4. Storage Driver存储驱动

Storage Driver负责：

-   镜像Layer管理；
-   文件系统叠加；
-   容器读写操作。

常见：

-   Overlay2；
-   AUFS；
-   Device Mapper。

------------------------------------------------------------------------

## Overlay2

当前Linux环境常用方案。

特点：

-   性能较好；
-   社区支持广泛；
-   适合生产环境。

------------------------------------------------------------------------

# 5. Volume数据卷（★★★★★）

Volume是Docker推荐的数据持久化方式。

结构：

``` text
Container

↓

Volume

↓

Host Storage
```

特点：

-   生命周期独立于容器；
-   支持多个容器共享；
-   方便备份恢复。

------------------------------------------------------------------------

创建Volume：

``` bash
docker volume create data
```

查看：

``` bash
docker volume ls
```

删除：

``` bash
docker volume rm data
```

------------------------------------------------------------------------

挂载Volume：

``` bash
docker run \
-v data:/data \
mysql
```

------------------------------------------------------------------------

# 6. Bind Mount绑定挂载

Bind Mount直接映射宿主机目录。

结构：

``` text
Host Directory

↓

Container Directory
```

示例：

``` bash
docker run \
-v /host/app:/app \
nginx
```

------------------------------------------------------------------------

优点：

-   开发调试方便；
-   文件实时同步。

缺点：

-   依赖宿主机目录；
-   可移植性较差。

------------------------------------------------------------------------

# 7. tmpfs临时存储

tmpfs将数据保存于内存。

特点：

-   访问速度快；
-   容器删除后数据消失。

适用：

-   临时缓存；
-   敏感临时数据。

------------------------------------------------------------------------

# 8. Volume生命周期管理

Volume独立于Container：

``` text
Create Volume

↓

Attach Container

↓

Delete Container

↓

Volume Still Exists
```

优势：

-   数据独立管理；
-   支持容器重建。

------------------------------------------------------------------------

# 9. 数据备份与恢复

备份流程：

``` text
Volume

↓

tar

↓

Backup File
```

恢复流程：

``` text
Backup File

↓

Volume

↓

Container
```

------------------------------------------------------------------------

# 10. 容器存储最佳实践

## 数据与容器分离

不要：

``` text
Application

+

Data

+

Container
```

全部绑定。

推荐：

``` text
Application Container

↓

External Storage
```

------------------------------------------------------------------------

## 数据库使用Volume

例如：

-   MySQL；
-   PostgreSQL；
-   MongoDB。

结构：

``` text
Database Container

↓

Volume

↓

Persistent Storage
```

------------------------------------------------------------------------

## 定期备份

包括：

-   数据备份；
-   快照；
-   恢复测试。

------------------------------------------------------------------------

# 11. Docker存储与数据库应用

数据库具有：

-   数据量大；
-   持久化要求高；
-   恢复要求高。

因此通常：

``` text
数据库服务

↓

Volume

↓

可靠存储系统
```

------------------------------------------------------------------------

# 12. Docker存储与Kubernetes关系

Docker Volume是云原生存储基础。

演进：

``` text
Docker Volume

↓

Kubernetes Volume

↓

Persistent Volume(PV)

↓

Persistent Volume Claim(PVC)

↓

CSI
```

------------------------------------------------------------------------

# 13. 常用Volume管理命令

查看Volume：

``` bash
docker volume ls
```

创建：

``` bash
docker volume create volume_name
```

查看详情：

``` bash
docker volume inspect volume_name
```

删除：

``` bash
docker volume rm volume_name
```

------------------------------------------------------------------------

# 14. 企业级存储方案

生产环境常结合：

-   NFS；
-   NAS；
-   SAN；
-   云存储。

架构：

``` text
Container

↓

Container Platform

↓

Storage Interface

↓

Cloud Storage
```

Kubernetes环境通常通过：

-   CSI插件；
-   云厂商存储服务。

------------------------------------------------------------------------

# 15. 系统架构设计师考点

## 为什么容器需要数据持久化？

答：

> 容器生命周期具有临时性，通过Volume等机制将应用数据与容器生命周期解耦，实现数据长期保存。

------------------------------------------------------------------------

## Volume相比容器存储有什么优势？

答：

> Volume生命周期独立于容器，可以跨容器共享数据，并支持备份和恢复。

------------------------------------------------------------------------

## Storage Driver作用？

答：

> Storage
> Driver负责镜像Layer管理和容器文件系统读写，实现Docker存储管理。

------------------------------------------------------------------------

# 16. Mermaid知识结构图

``` mermaid
mindmap
  root((Docker Storage))
    存储模型
      Image Layer
      Container Layer
      Volume
    持久化方式
      Volume
      Bind Mount
      tmpfs
    存储驱动
      Overlay2
      AUFS
      Device Mapper
    企业应用
      Database
      Backup
      Cloud Storage
    Kubernetes
      PV
      PVC
      CSI
```

------------------------------------------------------------------------

# 本节小结

Docker存储核心：

1.  容器默认数据存储在可写层，生命周期短；
2.  Volume实现容器数据持久化；
3.  Bind Mount适合开发调试；
4.  Storage Driver负责镜像和文件系统管理；
5.  Kubernetes通过PV、PVC、CSI扩展云原生存储能力。

下一篇：

📄 `09-network.md`

内容：

-   Docker网络模型；
-   Bridge网络；
-   Host网络；
-   Overlay网络；
-   容器通信机制。
