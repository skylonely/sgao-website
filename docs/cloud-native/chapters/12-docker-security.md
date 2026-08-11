# 12 Docker 安全模型与容器安全实践

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇从系统架构与企业治理视角介绍 Docker
> 安全体系，重点覆盖容器隔离、最小权限、Linux
> Capabilities、Seccomp、AppArmor/SELinux、Rootless
> Docker、镜像供应链安全、Secret
> 管理、资源限制、运行时防护以及企业容器安全治理。

------------------------------------------------------------------------

# 目录

1.  Docker安全概述
2.  Docker安全边界与共享内核风险
3.  Docker安全模型
4.  Namespace隔离安全
5.  Cgroups资源安全
6.  Linux Capabilities最小权限
7.  Seccomp系统调用过滤
8.  AppArmor与SELinux
9.  Root用户与Rootless Docker
10. Docker Daemon与Socket安全
11. 镜像与供应链安全
12. 容器运行时安全
13. Secret与敏感配置管理
14. 网络与端口安全
15. Volume与文件系统安全
16. DoS与资源限制
17. 企业Docker安全治理
18. Docker安全与Kubernetes关系
19. 常见错误配置
20. 系统架构设计师考点
21. Mermaid安全架构图
22. 本节小结

------------------------------------------------------------------------

# 1. Docker安全概述

Docker安全不是单一机制，而是由多个层次共同组成。

核心原则：

> 隔离 + 最小权限 + 可信镜像 + 资源限制 + 持续治理。

整体可以理解为：

``` text
Application Security

↓

Container Security

↓

Image Security

↓

Docker Runtime Security

↓

Host OS Security

↓

Infrastructure Security
```

任何一层出现严重问题，都可能影响整体容器平台安全。

------------------------------------------------------------------------

# 2. Docker安全边界与共享内核风险（★★★★★）

虚拟机通常拥有独立Guest OS，而Docker容器共享宿主机Linux Kernel。

``` text
Container A     Container B     Container C
     \              |              /
              Linux Kernel
                   ↓
                Hardware
```

这也是容器轻量化的重要原因。

但从安全角度看：

> 容器隔离并不等于虚拟机级别的完整硬件虚拟化隔离。

因此需要结合：

-   Namespace；
-   Cgroups；
-   Capabilities；
-   Seccomp；
-   LSM；
-   文件系统权限；

构建纵深防御体系。

------------------------------------------------------------------------

# 3. Docker安全模型

Docker安全可以划分为五个主要层次：

``` text
Docker Security

├── Host Security
├── Image Security
├── Runtime Security
├── Network Security
└── Data Security
```

其中：

  安全层    主要关注点
  --------- --------------------------
  Host      宿主机、Daemon、Kernel
  Image     镜像来源、漏洞、供应链
  Runtime   权限、系统调用、进程行为
  Network   端口暴露、网络隔离
  Data      Volume、Secret、文件权限

------------------------------------------------------------------------

# 4. Namespace隔离安全（★★★★★）

Namespace是Docker容器隔离的重要基础。

主要包括：

-   PID Namespace；
-   Network Namespace；
-   Mount Namespace；
-   IPC Namespace；
-   UTS Namespace；
-   User Namespace。

例如：

``` text
Container A
├── PID Namespace
├── Network Namespace
└── Mount Namespace

Container B
├── PID Namespace
├── Network Namespace
└── Mount Namespace
```

作用：

> 让不同容器看到不同的系统资源视图。

但Namespace主要解决"隔离"问题，并不能单独构成完整安全体系。

------------------------------------------------------------------------

# 5. Cgroups资源安全（★★★★★）

Cgroups负责资源限制和统计。

可控制：

-   CPU；
-   Memory；
-   Block IO；
-   进程数量等资源。

例如：

``` bash
docker run --memory=512m --cpus=1 nginx
```

作用：

``` text
Container

↓

Cgroups

↓

Resource Limit

↓

Host Protection
```

安全意义：

> 防止单个容器过度消耗宿主机资源，降低资源耗尽型DoS风险。

------------------------------------------------------------------------

# 6. Linux Capabilities最小权限（★★★★★）

传统Linux权限模型中，root拥有大量特权。

Linux Capabilities将root权限拆分为更细粒度能力。

例如：

-   NET_ADMIN；
-   SYS_ADMIN；
-   CHOWN；
-   NET_BIND_SERVICE。

Docker默认不会向容器开放所有Capability。

可以进一步删除能力：

``` bash
docker run --cap-drop ALL nginx
```

按需增加：

``` bash
docker run \
  --cap-drop ALL \
  --cap-add NET_BIND_SERVICE \
  nginx
```

核心原则：

> 只授予应用运行所必需的最小权限。

------------------------------------------------------------------------

# 7. Seccomp系统调用过滤（★★★★★）

容器最终需要通过Linux系统调用访问Kernel。

路径：

``` text
Container Process

↓

System Call

↓

Linux Kernel
```

Seccomp可以限制进程允许调用的系统调用。

安全模型：

``` text
Container

↓

Seccomp Profile

↓

Allowed Syscalls

↓

Linux Kernel
```

作用：

-   缩小攻击面；
-   阻止部分高风险系统调用；
-   增强容器运行时隔离。

------------------------------------------------------------------------

# 8. AppArmor与SELinux

AppArmor和SELinux属于Linux安全模块体系的重要实现。

可以进一步限制：

-   文件访问；
-   进程行为；
-   系统资源访问。

结构：

``` text
Container Process

↓

Security Policy

↓

Host Resources
```

它们与Namespace、Capabilities、Seccomp形成多层防御。

------------------------------------------------------------------------

# 9. Root用户与Rootless Docker（★★★★★）

## 容器内Root风险

如果应用没有必要使用root，应避免：

``` dockerfile
USER root
```

推荐创建专用用户：

``` dockerfile
RUN useradd -m appuser

USER appuser
```

------------------------------------------------------------------------

## Rootless Docker

Rootless模式允许Docker Daemon和容器在非root用户权限下运行。

安全价值：

> 即使Docker组件或容器出现漏洞，也可以降低攻击者直接获得宿主机root权限的风险。

但Rootless模式在部分网络、存储和系统能力方面可能存在限制，需要根据场景评估。

------------------------------------------------------------------------

# 10. Docker Daemon与Socket安全（★★★★★）

Docker Daemon通常拥有较高宿主机权限。

Docker Socket：

``` text
/var/run/docker.sock
```

能够控制Docker Daemon。

因此：

> Docker Socket应视为高权限管理接口。

不应随意将其挂载进入普通业务容器：

``` text
Container

↓

docker.sock

↓

Docker Daemon

↓

Host
```

错误配置可能使容器获得极高的宿主机控制能力。

------------------------------------------------------------------------

# 11. 镜像与供应链安全（★★★★★）

镜像安全是容器安全的重要入口。

风险包括：

-   基础镜像漏洞；
-   恶意镜像；
-   过期依赖；
-   镜像被篡改；
-   构建流程被污染。

推荐流程：

``` text
Source Code

↓

Docker Build

↓

Dependency Scan

↓

Image Scan

↓

Sign

↓

Registry

↓

Verify

↓

Deploy
```

最佳实践：

-   使用可信基础镜像；
-   固定镜像版本；
-   定期更新基础镜像；
-   扫描已知漏洞；
-   对重要镜像进行签名和验证；
-   保留构建和发布审计记录。

------------------------------------------------------------------------

# 12. 容器运行时安全

容器启动后仍需要持续关注运行行为。

重点包括：

-   异常进程；
-   异常网络连接；
-   敏感文件修改；
-   权限提升；
-   可疑系统调用。

安全体系：

``` text
Container

↓

Runtime Monitoring

↓

Behavior Detection

↓

Alert / Block
```

企业安全不能只在镜像构建阶段扫描一次。

------------------------------------------------------------------------

# 13. Secret与敏感配置管理

不应把以下内容直接写入Dockerfile：

-   密码；
-   Token；
-   API Key；
-   私钥。

错误：

``` dockerfile
ENV DB_PASSWORD=123456
```

因为敏感数据可能进入：

-   镜像层；
-   构建历史；
-   Registry；
-   日志。

推荐：

``` text
Secret Management

↓

Runtime Injection

↓

Container
```

核心原则：

> 镜像与Secret分离。

------------------------------------------------------------------------

# 14. 网络与端口安全

容器不应暴露不必要端口。

例如：

``` bash
docker run -p 8080:80 nginx
```

需要明确：

``` text
External Network

↓

Host Port

↓

Container Port
```

安全实践：

-   只开放必要端口；
-   使用自定义网络隔离业务；
-   限制管理接口访问；
-   配合防火墙和访问控制策略。

------------------------------------------------------------------------

# 15. Volume与文件系统安全

Volume可能使容器访问宿主机数据。

风险：

``` text
Container

↓

Bind Mount

↓

Sensitive Host Directory
```

应避免不必要的高权限挂载。

可以根据场景使用只读挂载：

``` bash
docker run \
  -v /host/config:/app/config:ro \
  app
```

还可以考虑只读根文件系统：

``` bash
docker run --read-only app
```

原则：

> 容器只获得业务运行所需要的文件系统访问权限。

------------------------------------------------------------------------

# 16. DoS与资源限制

如果不限制资源：

``` text
Container

↓

Unlimited CPU / Memory

↓

Host Resource Exhaustion

↓

Other Services Failure
```

应根据业务配置：

-   CPU Limit；
-   Memory Limit；
-   PID Limit。

例如：

``` bash
docker run \
  --memory=512m \
  --cpus=1 \
  --pids-limit=200 \
  app
```

这体现了：

> 最小资源授权。

------------------------------------------------------------------------

# 17. 企业Docker安全治理

企业容器安全应贯穿完整生命周期：

``` text
Development

↓

Build

↓

Scan

↓

Registry

↓

Deploy

↓

Runtime

↓

Audit
```

可以分为：

## 开发阶段

-   Dockerfile安全规范；
-   禁止硬编码Secret；
-   使用可信依赖。

## 构建阶段

-   自动化漏洞扫描；
-   SBOM管理；
-   构建环境隔离。

## Registry阶段

-   RBAC；
-   镜像签名；
-   Tag治理；
-   镜像生命周期管理。

## 部署阶段

-   最小权限；
-   资源限制；
-   网络隔离。

## 运行阶段

-   日志；
-   监控；
-   异常检测；
-   安全审计。

------------------------------------------------------------------------

# 18. Docker安全与Kubernetes关系

Docker安全知识会直接延伸到Kubernetes安全。

对应关系：

``` text
Docker Security
        ↓
Container Security
        ↓
Kubernetes Security
```

例如：

  Docker概念       Kubernetes对应方向
  ---------------- ---------------------------------
  Container User   securityContext
  Capabilities     securityContext.capabilities
  Seccomp          seccompProfile
  Resource Limit   resources.limits
  Network隔离      NetworkPolicy
  Secret           Kubernetes Secret
  Registry权限     imagePullSecrets / Registry认证

因此Docker安全是学习Kubernetes安全的重要基础。

------------------------------------------------------------------------

# 19. 常见错误配置

## 错误1：长期使用root运行

风险：

-   权限过高；
-   漏洞影响扩大。

------------------------------------------------------------------------

## 错误2：使用--privileged

`--privileged`会显著扩大容器权限。

除非确有必要，否则不应使用。

------------------------------------------------------------------------

## 错误3：挂载Docker Socket

``` text
/var/run/docker.sock
```

属于高风险操作。

------------------------------------------------------------------------

## 错误4：Secret写入镜像

可能导致敏感信息长期存在于镜像历史和仓库中。

------------------------------------------------------------------------

## 错误5：不设置资源限制

可能导致单个容器耗尽宿主机资源。

------------------------------------------------------------------------

## 错误6：长期使用过期基础镜像

容易积累已知漏洞。

------------------------------------------------------------------------

# 20. 系统架构设计师考点

## 考点1：Docker如何实现容器安全隔离？

答：

> Docker利用Namespace实现进程、网络和文件系统等资源隔离，通过Cgroups控制资源使用，并结合Capabilities、Seccomp以及Linux安全模块构建多层安全防护体系。

------------------------------------------------------------------------

## 考点2：为什么容器不能简单等同于虚拟机安全隔离？

答：

> Docker容器共享宿主机操作系统内核，虽然通过Namespace等机制实现逻辑隔离，但多个容器仍共享Kernel，因此需要通过最小权限、系统调用过滤和宿主机安全等机制加强防护。

------------------------------------------------------------------------

## 考点3：为什么不推荐容器以root运行？

答：

> root权限会扩大安全漏洞造成的影响范围。生产环境应遵循最小权限原则，尽可能使用非root用户运行应用。

------------------------------------------------------------------------

## 考点4：镜像安全如何治理？

答：

> 应采用可信基础镜像、固定版本、漏洞扫描、镜像签名、Registry权限控制和生命周期治理，建立完整的软件供应链安全体系。

------------------------------------------------------------------------

## 考点5：Docker Socket为什么危险？

答：

> Docker Socket能够调用Docker
> Daemon的高权限管理能力，若被普通业务容器或攻击者访问，可能进一步获得对宿主机和其他容器的控制能力。

------------------------------------------------------------------------

## 考点6：Docker安全设计的核心原则是什么？

答：

> Docker安全应遵循纵深防御和最小权限原则，从宿主机、镜像、运行时、网络、存储和供应链多个层次共同建立安全体系。

------------------------------------------------------------------------

# 21. Mermaid安全架构图

``` mermaid
flowchart TD
    A[应用与代码安全] --> B[镜像与供应链安全]
    B --> C[Registry安全]
    C --> D[容器运行时安全]
    D --> E[Linux安全机制]
    E --> F[宿主机安全]

    E --> E1[Namespace]
    E --> E2[Cgroups]
    E --> E3[Capabilities]
    E --> E4[Seccomp]
    E --> E5[AppArmor / SELinux]

    D --> D1[非Root运行]
    D --> D2[资源限制]
    D --> D3[只读文件系统]
    D --> D4[网络隔离]

    B --> B1[漏洞扫描]
    B --> B2[镜像签名]
    B --> B3[可信基础镜像]
    B --> B4[SBOM]
```

------------------------------------------------------------------------

# 22. 本节小结

Docker安全不是依靠某一个功能完成，而是完整的纵深防御体系。

核心知识：

1.  Namespace负责容器资源隔离；
2.  Cgroups负责资源控制和DoS风险限制；
3.  Capabilities用于细粒度拆分root权限；
4.  Seccomp限制容器可使用的系统调用；
5.  AppArmor/SELinux进一步限制进程行为；
6.  生产容器应尽可能使用非root用户；
7.  Docker Socket属于高权限接口，应严格保护；
8.  镜像需要进行漏洞扫描、版本治理和可信验证；
9.  Secret不应直接写入Dockerfile和镜像；
10. Docker安全应覆盖开发、构建、Registry、部署和运行完整生命周期。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Namespace管隔离，Cgroups管资源，Capabilities管权限，Seccomp管系统调用，镜像扫描管供应链，最小权限与纵深防御贯穿Docker安全全生命周期。

------------------------------------------------------------------------

下一篇：

📄 `13-docker-monitoring.md（Docker日志、监控与可观测性）`

重点：

-   Docker日志体系；
-   Logging Driver；
-   容器指标监控；
-   CPU/Memory监控；
-   Prometheus；
-   Grafana；
-   日志、指标、链路三大可观测性体系；
-   Docker到Kubernetes可观测性的演进。
