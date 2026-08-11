# 10 Docker Compose 多容器应用编排

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Docker Compose 的多容器应用编排机制，包括 Compose
> 核心概念、YAML
> 配置、服务依赖、网络与存储、生命周期管理、工程实践，以及它与
> Kubernetes 的关系。

------------------------------------------------------------------------

# 目录

1.  Docker Compose概述
2.  为什么需要Docker Compose
3.  Docker Compose核心模型
4.  Compose配置文件结构
5.  services服务定义
6.  ports端口映射
7.  volumes数据持久化
8.  networks网络管理
9.  environment环境变量
10. depends_on服务依赖
11. 多容器应用案例
12. Compose生命周期管理
13. Compose常用命令
14. Docker Compose与CI/CD
15. Docker Compose最佳实践
16. Docker Compose与Kubernetes关系
17. 系统架构设计师考点
18. Mermaid知识结构图
19. 本节小结

------------------------------------------------------------------------

# 1. Docker Compose概述

Docker Compose用于定义和运行多容器应用。

单个Docker容器适合运行单一服务，但一个完整系统通常包含多个组件，例如：

``` text
Frontend

↓

Backend API

↓

Database

↓

Cache
```

如果分别通过大量 `docker run` 命令管理，会增加配置和维护成本。

Docker Compose通过声明式配置统一描述这些服务。

核心思想：

> 使用一个Compose配置文件描述多个容器服务及其网络、存储和依赖关系，再通过统一命令管理整个应用。

------------------------------------------------------------------------

# 2. 为什么需要Docker Compose

假设一个Web系统包含：

-   Web前端；
-   API服务；
-   MySQL；
-   Redis。

手动管理时需要分别处理：

-   镜像；
-   容器；
-   端口；
-   Volume；
-   Network；
-   环境变量；
-   启动顺序。

Docker Compose将这些配置统一写入YAML文件。

``` text
compose.yaml

↓

Service定义

↓

Network定义

↓

Volume定义

↓

docker compose up

↓

启动整个应用
```

------------------------------------------------------------------------

# 3. Docker Compose核心模型（★★★★★）

Compose主要围绕三个核心对象：

``` text
Compose Application

├── Services
├── Networks
└── Volumes
```

## Services

描述应用中的各个服务。

例如：

-   web；
-   api；
-   db；
-   redis。

## Networks

定义服务之间的通信网络。

## Volumes

定义需要持久化的数据存储。

------------------------------------------------------------------------

# 4. Compose配置文件结构

现代Compose项目通常使用：

``` text
compose.yaml
```

也经常可以看到：

``` text
docker-compose.yml
```

示例：

``` yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"

  api:
    build: ./api

  db:
    image: mysql

volumes:
  db-data:

networks:
  app-network:
```

整体结构：

``` text
Compose File

├── services
├── networks
└── volumes
```

------------------------------------------------------------------------

# 5. services服务定义（★★★★★）

`services` 是Compose配置的核心。

示例：

``` yaml
services:
  web:
    image: nginx:1.27
```

一个Service通常可以配置：

-   image；
-   build；
-   ports；
-   volumes；
-   networks；
-   environment；
-   depends_on；
-   restart。

------------------------------------------------------------------------

## image

指定服务使用的镜像：

``` yaml
services:
  web:
    image: nginx:1.27
```

------------------------------------------------------------------------

## build

通过Dockerfile构建镜像：

``` yaml
services:
  api:
    build: ./api
```

关系：

``` text
Dockerfile

↓

Compose build

↓

Image

↓

Service Container
```

------------------------------------------------------------------------

# 6. ports端口映射

示例：

``` yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

含义：

``` text
Host:8080

↓

Container:80
```

外部客户端访问宿主机8080端口，即可访问容器中的80端口服务。

------------------------------------------------------------------------

# 7. volumes数据持久化（★★★★★）

数据库等有状态服务通常需要Volume。

示例：

``` yaml
services:
  db:
    image: mysql
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:
```

结构：

``` text
Database Container

↓

Named Volume

↓

Persistent Data
```

作用：

> 将数据生命周期与容器生命周期解耦。

------------------------------------------------------------------------

# 8. networks网络管理（★★★★★）

Compose可以为服务定义网络。

示例：

``` yaml
services:
  web:
    networks:
      - app-network

  api:
    networks:
      - app-network

networks:
  app-network:
```

结构：

``` text
Web

↓

app-network

↓

API
```

同一Compose网络中的服务可以通过服务名进行通信。

例如：

``` text
http://api:8080
```

而不是依赖固定容器IP。

------------------------------------------------------------------------

# 9. environment环境变量

示例：

``` yaml
services:
  api:
    environment:
      NODE_ENV: production
      DB_HOST: db
```

作用：

-   注入运行配置；
-   区分不同环境；
-   避免将部分配置写死在镜像中。

敏感信息不应直接硬编码进公开的Compose配置文件，应采用更合适的Secret或外部配置管理方式。

------------------------------------------------------------------------

# 10. depends_on服务依赖

示例：

``` yaml
services:
  api:
    depends_on:
      - db
      - redis
```

表示：

``` text
db / redis

↓

api
```

需要注意：

> 服务启动顺序不等同于业务已经真正"就绪"。

数据库容器进程启动后，数据库服务可能仍在初始化。

因此实际工程中还需要结合：

-   healthcheck；
-   应用重试；
-   就绪检测。

------------------------------------------------------------------------

# 11. 多容器应用案例（★★★★★）

典型三层应用：

``` text
Browser

↓

Nginx

↓

Node API

↓

MySQL
```

Compose示例：

``` yaml
services:
  web:
    image: nginx:1.27
    ports:
      - "8080:80"
    depends_on:
      - api

  api:
    build: ./api
    environment:
      DB_HOST: db
    depends_on:
      - db

  db:
    image: mysql:8
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:
```

通过一个配置文件即可描述：

-   服务组成；
-   镜像；
-   构建；
-   端口；
-   服务依赖；
-   数据持久化。

------------------------------------------------------------------------

# 12. Compose生命周期管理

典型生命周期：

``` text
定义Compose配置

↓

构建镜像

↓

创建服务

↓

启动容器

↓

查看状态

↓

停止服务

↓

删除资源
```

------------------------------------------------------------------------

# 13. Compose常用命令

启动：

``` bash
docker compose up
```

后台启动：

``` bash
docker compose up -d
```

构建：

``` bash
docker compose build
```

查看服务：

``` bash
docker compose ps
```

查看日志：

``` bash
docker compose logs
```

停止：

``` bash
docker compose stop
```

停止并删除Compose创建的容器和网络等资源：

``` bash
docker compose down
```

------------------------------------------------------------------------

# 14. Docker Compose与CI/CD

Compose常用于：

-   本地开发环境；
-   自动化测试环境；
-   集成测试；
-   中小规模应用部署。

CI流程：

``` text
代码提交

↓

构建Image

↓

docker compose up

↓

集成测试

↓

测试完成

↓

docker compose down
```

优势：

> 可以快速构建与生产架构相近的多服务测试环境。

------------------------------------------------------------------------

# 15. Docker Compose最佳实践

## 1. 固定镜像版本

推荐：

``` yaml
image: nginx:1.27
```

避免无控制地依赖：

``` yaml
image: nginx:latest
```

------------------------------------------------------------------------

## 2. 数据使用Volume

数据库数据不要只保存在容器可写层。

------------------------------------------------------------------------

## 3. 使用自定义Network

根据系统边界划分网络，减少不必要的服务互通。

------------------------------------------------------------------------

## 4. 配置健康检查

不能仅依赖容器"已经启动"判断服务可用。

------------------------------------------------------------------------

## 5. 配置与镜像分离

镜像负责：

``` text
Application
+
Runtime
```

配置负责：

``` text
Environment Configuration
```

------------------------------------------------------------------------

## 6. 避免明文保存敏感信息

例如：

-   数据库密码；
-   API Token；
-   私钥。

应采用适当的Secret管理方案。

------------------------------------------------------------------------

# 16. Docker Compose与Kubernetes关系（★★★★★）

Docker Compose解决的是：

> 多容器应用定义和管理问题。

Kubernetes解决的是：

> 集群级容器编排、调度、弹性伸缩、故障恢复和服务治理问题。

对比：

  能力               Docker Compose   Kubernetes
  ------------------ ---------------- ------------
  多容器定义         支持             支持
  单机开发环境       非常适合         较重
  集群调度           不是核心能力     支持
  自动扩缩容         有限             支持
  故障自愈           有限             支持
  服务治理           基础             完整
  生产级大规模编排   不作为主要定位   适合

技术演进：

``` text
Docker

↓

Docker Compose

↓

Kubernetes

↓

Cloud Native Platform
```

Compose帮助理解Kubernetes中的很多概念：

``` text
Compose Service
        ↓
Kubernetes Workload / Service

Compose Network
        ↓
Kubernetes Network

Compose Volume
        ↓
Kubernetes Volume / PV / PVC
```

二者概念并非完全一一对应，但学习Compose有助于理解容器编排思想。

------------------------------------------------------------------------

# 17. 系统架构设计师考点

## 考点1：为什么需要Docker Compose？

答：

> Docker
> Compose通过声明式配置统一管理多个容器服务、网络、存储和依赖关系，降低多容器应用部署和运维复杂度。

------------------------------------------------------------------------

## 考点2：Compose核心对象有哪些？

答：

> Docker Compose主要通过Services、Networks和Volumes描述多容器应用。

------------------------------------------------------------------------

## 考点3：Compose如何实现服务通信？

答：

> Compose可以将多个服务加入同一Docker网络，并通过服务名进行服务发现和通信，避免依赖动态变化的容器IP地址。

------------------------------------------------------------------------

## 考点4：depends_on能否保证服务已经可用？

答：

> depends_on主要用于描述服务之间的启动依赖关系，不能简单等同于业务服务已经就绪，实际系统还应结合健康检查和应用重试机制。

------------------------------------------------------------------------

## 考点5：Docker Compose与Kubernetes的区别

答：

> Docker
> Compose适合开发、测试及相对简单的多容器应用管理；Kubernetes面向集群级容器编排，提供调度、弹性伸缩、自愈和服务治理等能力。

------------------------------------------------------------------------

# 18. Mermaid知识结构图

``` mermaid
mindmap
  root((Docker Compose))
    核心对象
      Services
      Networks
      Volumes
    服务配置
      image
      build
      ports
      environment
      depends_on
    生命周期
      up
      ps
      logs
      stop
      down
    工程实践
      Development
      Integration Test
      CI/CD
      Health Check
    云原生演进
      Docker
      Compose
      Kubernetes
```

------------------------------------------------------------------------

# 19. 本节小结

Docker Compose是从单容器管理迈向容器编排的重要一步。

核心知识：

1.  Compose使用声明式YAML描述多容器应用；
2.  Services、Networks、Volumes是核心对象；
3.  Service负责应用服务定义；
4.  Network负责服务之间通信；
5.  Volume负责数据持久化；
6.  depends_on描述依赖关系，但不能代替健康检查；
7.  Compose非常适合开发、测试和集成环境；
8.  Kubernetes进一步解决集群调度、自愈、弹性伸缩和生产级编排问题。

下一篇：

📄 `11-registry.md（Docker Registry镜像仓库与企业镜像管理）`

内容：

-   Registry架构；
-   Docker Hub；
-   私有Registry；
-   Harbor；
-   镜像Tag与版本管理；
-   镜像分发；
-   企业镜像治理。
