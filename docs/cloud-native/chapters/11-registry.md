# 11 Docker Registry 镜像仓库与企业镜像管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇从企业级镜像交付角度介绍 Docker
> Registry，包括镜像仓库架构、镜像分发流程、Docker
> Hub、私有Registry、Harbor、镜像版本管理、安全治理以及CI/CD集成。

------------------------------------------------------------------------

# 目录

1.  Docker Registry概述
2.  为什么需要镜像仓库
3.  Registry整体架构
4.  Docker镜像分发流程
5.  Docker Hub公共仓库
6.  Docker Registry私有仓库
7.  Harbor企业镜像仓库
8.  镜像Tag与版本管理
9.  镜像上传与下载流程
10. 镜像权限管理
11. 镜像安全扫描
12. 镜像签名与可信发布
13. Registry与CI/CD流水线
14. 企业镜像治理体系
15. Registry高可用架构
16. Docker Registry与Kubernetes关系
17. 系统架构设计师考点
18. Mermaid知识结构图
19. 本节小结

------------------------------------------------------------------------

# 1. Docker Registry概述

Docker Registry：

> 用于存储、管理和分发Docker镜像的服务。

主要作用：

-   保存镜像；
-   管理版本；
-   提供镜像下载；
-   支撑自动化部署。

架构：

``` text
开发人员

↓

Docker Image

↓

Registry

↓

部署环境

↓

Container
```

------------------------------------------------------------------------

# 2. 为什么需要镜像仓库

没有Registry：

``` text
开发机器

↓

手动复制镜像

↓

服务器
```

问题：

-   版本难管理；
-   分发效率低；
-   无统一权限控制。

使用Registry：

``` text
Build Image

↓

Push Registry

↓

Pull Image

↓

Deploy
```

------------------------------------------------------------------------

# 3. Registry整体架构

核心组成：

``` text
Registry

├── API Server
├── Authentication
├── Metadata
└── Image Storage
```

客户端通过Registry API完成：

-   登录；
-   上传；
-   下载；
-   查询。

------------------------------------------------------------------------

# 4. Docker镜像分发流程

上传：

``` text
docker build

↓

docker tag

↓

docker push

↓

Registry
```

下载：

``` text
docker pull

↓

Registry

↓

Image Layers

↓

Local Image
```

------------------------------------------------------------------------

# 5. Docker Hub公共仓库

Docker Hub是公共镜像服务。

提供：

-   官方镜像；
-   社区镜像；
-   镜像搜索；
-   自动构建。

常见镜像：

-   nginx；
-   mysql；
-   redis；
-   node。

------------------------------------------------------------------------

# 6. Docker Registry私有仓库

企业通常部署私有Registry。

优势：

-   镜像私有化；
-   内网访问；
-   权限控制；
-   安全管理。

------------------------------------------------------------------------

# 7. Harbor企业镜像仓库

Harbor是在Registry基础上的企业增强平台。

能力：

## 镜像管理

-   项目管理；
-   Tag管理；
-   镜像复制。

## 安全能力

-   漏洞扫描；
-   镜像签名；
-   安全策略。

## 权限管理

-   用户管理；
-   RBAC权限控制。

架构：

``` text
Developer

↓

Harbor

├── Registry
├── Database
├── Scanner
└── Authentication

↓

Kubernetes
```

------------------------------------------------------------------------

# 8. 镜像Tag与版本管理

Tag用于标识镜像版本。

例如：

``` text
nginx:1.27
```

推荐：

``` text
app:v1.0.0
```

不推荐：

``` text
app:latest
```

原因：

-   不可追踪；
-   不易回滚；
-   环境不稳定。

------------------------------------------------------------------------

# 9. 镜像权限管理

企业需要：

-   身份认证；
-   RBAC权限；
-   项目隔离。

例如：

``` text
开发环境

↓

dev项目


生产环境

↓

prod项目
```

------------------------------------------------------------------------

# 10. 镜像安全扫描

镜像可能包含：

-   系统漏洞；
-   依赖漏洞；
-   配置风险。

流程：

``` text
Image

↓

Scanner

↓

漏洞报告

↓

修复
```

------------------------------------------------------------------------

# 11. 镜像签名与可信发布

目标：

保证镜像来源可信。

流程：

``` text
Build

↓

Sign

↓

Registry

↓

Verify

↓

Deploy
```

------------------------------------------------------------------------

# 12. Registry与CI/CD

典型流程：

``` text
代码提交

↓

CI Build

↓

Docker Image

↓

Security Scan

↓

Push Registry

↓

Kubernetes Deploy
```

Registry是持续交付的重要制品中心。

------------------------------------------------------------------------

# 13. 企业镜像治理体系

包括：

## 构建治理

-   Dockerfile规范；
-   基础镜像管理。

## 发布治理

-   Tag规范；
-   版本控制。

## 安全治理

-   漏洞扫描；
-   签名验证。

## 生命周期治理

-   镜像清理；
-   镜像归档。

------------------------------------------------------------------------

# 14. Docker Registry与Kubernetes关系

部署流程：

``` text
Developer

↓

Registry

↓

Kubernetes Node

↓

Container Runtime

↓

Pod
```

Kubernetes通过镜像仓库获取应用运行所需镜像。

------------------------------------------------------------------------

# 15. 系统架构设计师考点

## 为什么需要Registry？

答：

> Registry用于集中管理Docker镜像，实现镜像存储、版本控制和分发，是容器持续交付的重要基础设施。

------------------------------------------------------------------------

## Harbor相比Registry优势？

答：

> Harbor增加权限管理、漏洞扫描、镜像签名和企业治理能力，更适合生产环境。

------------------------------------------------------------------------

## 为什么生产环境不推荐latest？

答：

> latest无法明确对应具体版本，容易导致部署不可控和回滚困难。

------------------------------------------------------------------------

# 16. Mermaid知识结构图

``` mermaid
mindmap
  root((Docker Registry))
    基础能力
      Image Storage
      API
      Distribution
    类型
      Docker Hub
      Private Registry
      Harbor
    管理
      Tag
      Version
      Permission
    安全
      Scan
      Signature
      Audit
    DevOps
      CI/CD
      Build
      Deploy
    Kubernetes
      Image Pull
      Container Runtime
```

------------------------------------------------------------------------

# 本节小结

Docker Registry是云原生应用交付的重要基础设施。

核心知识：

1.  Registry负责镜像存储和分发；
2.  Docker Hub适合公共镜像共享；
3.  企业通常使用私有Registry或Harbor；
4.  Tag规范保证版本可控；
5.  镜像扫描和签名提升安全性；
6.  Registry连接CI/CD和Kubernetes部署流程。

下一篇：

📄 `12-docker-security.md`

内容：

-   Docker安全模型；
-   容器隔离安全；
-   镜像安全；
-   权限控制；
-   企业安全实践。
