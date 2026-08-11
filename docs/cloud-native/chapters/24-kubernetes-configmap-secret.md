# 24 Kubernetes ConfigMap 与 Secret 配置管理

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes 配置管理机制，包括
> ConfigMap、Secret、配置与代码分离、环境变量注入、Volume挂载以及生产环境配置管理实践。

------------------------------------------------------------------------

# 目录

1.  Kubernetes配置管理概述
2.  为什么需要配置分离
3.  ConfigMap概述
4.  ConfigMap资源模型
5.  ConfigMap YAML结构
6.  ConfigMap创建方式
7.  ConfigMap注入方式
8.  ConfigMap Volume挂载
9.  Secret概述
10. Secret资源模型
11. Secret数据编码机制
12. Secret使用方式
13. ConfigMap与Secret区别
14. 环境变量配置管理
15. 配置热更新机制
16. 生产环境配置管理实践
17. 系统架构设计师考点
18. Mermaid架构图
19. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes配置管理概述

Kubernetes核心思想：

> 配置与应用代码分离。

传统方式：

``` text
Application

├── Code
└── Config
```

存在问题：

-   环境变化需要重新构建镜像；
-   配置修改困难；
-   敏感信息容易泄露。

Kubernetes方式：

``` text
Application Image

↓

External Configuration

↓

Runtime Injection
```

优势：

-   环境隔离；
-   配置复用；
-   安全管理。

------------------------------------------------------------------------

# 2. 为什么需要配置分离

生产环境通常存在：

-   开发环境；
-   测试环境；
-   生产环境。

代码相同，但配置不同：

``` text
Application

+

Environment Config
```

例如：

数据库：

``` text
dev-db

test-db

prod-db
```

不应该修改镜像，而应该动态注入配置。

------------------------------------------------------------------------

# 3. ConfigMap概述

ConfigMap：

> Kubernetes用于保存普通配置数据的资源对象。

适合保存：

-   配置文件；
-   环境变量；
-   非敏感参数。

例如：

-   数据库地址；
-   服务端口；
-   日志级别。

------------------------------------------------------------------------

# 4. ConfigMap资源模型

ConfigMap结构：

``` text
ConfigMap

├── Metadata
└── Data
```

示例：

``` yaml
apiVersion: v1

kind: ConfigMap

metadata:
  name: app-config

data:
  database_url: mysql
  log_level: info
```

------------------------------------------------------------------------

# 5. ConfigMap YAML结构

典型结构：

``` yaml
apiVersion: v1

kind: ConfigMap

metadata:
  name: application-config

data:
  app.properties: |
    server.port=8080
    log.level=INFO
```

主要字段：

-   metadata；
-   data。

------------------------------------------------------------------------

# 6. ConfigMap创建方式

方式一：

YAML创建：

``` bash
kubectl apply -f configmap.yaml
```

方式二：

命令创建：

``` bash
kubectl create configmap app-config
```

------------------------------------------------------------------------

# 7. ConfigMap注入方式

主要方式：

## 环境变量注入

结构：

``` text
ConfigMap

↓

Environment Variable

↓

Container
```

------------------------------------------------------------------------

## Volume挂载

结构：

``` text
ConfigMap

↓

Volume

↓

Container File
```

------------------------------------------------------------------------

# 8. ConfigMap Volume挂载

应用可以直接读取配置文件：

``` text
Pod

↓

Volume

↓

ConfigMap

↓

Application
```

适合：

-   配置文件；
-   动态配置。

------------------------------------------------------------------------

# 9. Secret概述

Secret：

> Kubernetes用于保存敏感信息的资源对象。

适合：

-   密码；
-   Token；
-   密钥；
-   TLS证书。

结构：

``` text
Secret

↓

Pod

↓

Container
```

------------------------------------------------------------------------

# 10. Secret资源模型

结构：

``` text
Secret

├── Metadata
└── Data
```

示例：

``` yaml
apiVersion: v1

kind: Secret

metadata:
  name: db-secret

data:
  password: xxxx
```

------------------------------------------------------------------------

# 11. Secret数据编码机制

Secret默认：

> 使用Base64编码保存数据。

示例：

``` text
password

↓

Base64

↓

cGFzc3dvcmQ=
```

注意：

Base64：

-   不是加密；
-   只是编码。

生产环境需要：

-   Encryption at Rest；
-   KMS；
-   RBAC权限控制。

------------------------------------------------------------------------

# 12. Secret使用方式

## 环境变量

``` text
Secret

↓

ENV

↓

Application
```

------------------------------------------------------------------------

## Volume挂载

``` text
Secret

↓

Volume

↓

File
```

常用于：

-   TLS证书；
-   SSH Key。

------------------------------------------------------------------------

# 13. ConfigMap与Secret区别

  ConfigMap      Secret
  -------------- -------------------
  普通配置       敏感信息
  非敏感数据     密码、Token、证书
  直接保存配置   Base64编码
  普通权限管理   需要更严格保护

------------------------------------------------------------------------

# 14. 环境变量配置管理

示例：

``` yaml
env:

- name: DB_HOST

  valueFrom:
    configMapKeyRef:
```

流程：

``` text
ConfigMap

↓

Environment Variable

↓

Container
```

------------------------------------------------------------------------

# 15. 配置热更新机制

Volume方式：

``` text
ConfigMap

↓

Volume

↓

Application
```

修改ConfigMap后：

-   文件内容可能自动更新。

环境变量方式：

-   不会自动更新；
-   通常需要重新创建Pod。

------------------------------------------------------------------------

# 16. 生产环境配置管理实践

## 配置分离

代码：

``` text
Container Image
```

配置：

``` text
ConfigMap
```

------------------------------------------------------------------------

## 敏感信息保护

使用：

-   Secret；
-   RBAC；
-   数据加密。

------------------------------------------------------------------------

## 配置版本管理

结合：

-   Git；
-   CI/CD；
-   自动发布流程。

------------------------------------------------------------------------

# 17. 系统架构设计师考点

## ConfigMap作用？

答：

> ConfigMap用于保存非敏感配置数据，实现应用配置与代码分离。

------------------------------------------------------------------------

## Secret作用？

答：

> Secret用于保存敏感信息，例如密码、Token和证书。

------------------------------------------------------------------------

## Secret是否加密？

答：

> Kubernetes
> Secret默认使用Base64编码，并非真正加密，生产环境需要启用数据加密和权限控制。

------------------------------------------------------------------------

## ConfigMap和Secret区别？

答：

> ConfigMap保存普通配置，Secret保存敏感信息。

------------------------------------------------------------------------

# 18. Mermaid架构图

``` mermaid
flowchart TD

A[Kubernetes]

↓

B[ConfigMap]

↓

C[Pod]

↓

D[Container]


E[Secret]

↓

C

D --> F[Application]
```

------------------------------------------------------------------------

# 19. 本节小结

Kubernetes配置管理核心：

1.  配置与代码分离是云原生的重要思想；
2.  ConfigMap用于管理普通配置；
3.  Secret用于管理敏感信息；
4.  配置可以通过环境变量或Volume注入；
5.  Secret默认Base64编码，不等于加密；
6.  生产环境需要结合权限控制和加密机制。

------------------------------------------------------------------------

# 一句话冲刺记忆

> ConfigMap管理普通配置，Secret管理敏感数据，二者共同实现 Kubernetes
> 应用配置与代码分离。
