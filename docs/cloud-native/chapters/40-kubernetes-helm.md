# 40 Kubernetes Helm 包管理与应用模板化部署

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes Helm 包管理与应用模板化部署，重点掌握
> Chart、Release、Repository、values.yaml、templates、模板语法、升级回滚、依赖管理、多环境配置，以及
> Helm 与 Kustomize、GitOps、Argo CD 的关系。

------------------------------------------------------------------------

# 目录

1.  Helm概述
2.  为什么Kubernetes需要Helm
3.  Helm核心概念
4.  Helm整体架构与工作原理
5.  Chart应用包结构
6.  Chart.yaml元数据文件
7.  values.yaml配置体系
8.  templates模板目录
9.  Helm模板语法基础
10. Values变量引用
11. 条件判断与循环
12. 内置对象与常用函数
13. \_helpers.tpl公共模板
14. Helm Release发布模型
15. helm install应用安装
16. helm upgrade应用升级
17. helm rollback版本回滚
18. Helm Release生命周期管理
19. Helm Repository与Chart分发
20. Helm Dependency依赖管理
21. 多环境Values配置管理
22. Helm与Kustomize区别
23. Helm与GitOps结合
24. Helm与Argo CD结合
25. Secret与敏感配置安全
26. Helm Hook生命周期钩子
27. Helm常见问题与排查
28. 企业Helm Chart设计规范
29. Helm生产最佳实践
30. 系统架构设计师考点
31. Mermaid Helm部署架构图
32. 本节小结

------------------------------------------------------------------------

# 1. Helm概述（★★★★★）

Helm通常被称为：

> Kubernetes的包管理工具。

如果把Kubernetes应用理解成软件，那么：

``` text
Chart

≈

应用安装包
```

Helm可以帮助我们：

-   打包Kubernetes应用；
-   参数化YAML；
-   管理应用版本；
-   安装应用；
-   升级应用；
-   回滚Release；
-   管理依赖；
-   分发Chart。

基本关系：

``` text
Helm Chart

↓

Template Rendering

↓

Kubernetes Manifests

↓

Kubernetes API

↓

Application Resources
```

------------------------------------------------------------------------

# 2. 为什么Kubernetes需要Helm（★★★★★）

一个简单应用可能只有：

``` text
Deployment

Service
```

但生产应用通常还包括：

``` text
Deployment
Service
Ingress
ConfigMap
Secret
HPA
ServiceAccount
RBAC
NetworkPolicy
PVC
```

如果为每个环境分别维护：

``` text
deployment-dev.yaml
deployment-test.yaml
deployment-prod.yaml
```

随着资源数量增加：

``` text
大量重复YAML

↓

修改容易遗漏

↓

环境配置逐渐不一致
```

Helm解决思路：

``` text
一套Templates

+

不同Values

↓

生成不同环境配置
```

------------------------------------------------------------------------

# 3. Helm核心概念（★★★★★）

Helm主要需要掌握以下概念：

## Chart

Chart是Helm应用包。

包含：

``` text
Templates

Values

Metadata

Dependencies
```

------------------------------------------------------------------------

## Release

Release：

> 一个Chart安装到Kubernetes集群后形成的应用实例。

例如：

``` text
my-app Chart

↓

helm install dev-my-app

↓

Release: dev-my-app
```

同一个Chart可以产生多个Release：

``` text
my-app Chart
    │
    ├── dev-my-app
    ├── test-my-app
    └── prod-my-app
```

------------------------------------------------------------------------

## Repository

Repository：

> 用于存储和分发Chart的仓库。

------------------------------------------------------------------------

## Values

Values：

> 用于向Chart模板提供配置参数。

------------------------------------------------------------------------

# 4. Helm整体架构与工作原理

整体流程：

``` text
Chart
  │
  ├── Chart.yaml
  ├── values.yaml
  └── templates/
          │
          ↓
     Helm Engine
          │
          ↓
Rendered Kubernetes YAML
          │
          ↓
Kubernetes API
          │
          ↓
Release
```

核心：

> Helm并不是替代Kubernetes资源，而是帮助生成、组织和管理Kubernetes资源。

------------------------------------------------------------------------

# 5. Chart应用包结构（★★★★★）

典型Chart：

``` text
my-app/
├── Chart.yaml
├── values.yaml
├── charts/
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── _helpers.tpl
│   └── NOTES.txt
└── .helmignore
```

主要目录：

  文件/目录       作用
  --------------- ------------------
  Chart.yaml      Chart元数据
  values.yaml     默认配置
  templates/      Kubernetes模板
  charts/         依赖Chart
  \_helpers.tpl   公共模板定义
  NOTES.txt       安装后的提示信息
  .helmignore     打包时忽略文件

------------------------------------------------------------------------

# 6. Chart.yaml元数据文件

示例：

``` yaml
apiVersion: v2
name: my-app
description: A Helm chart for my application
type: application
version: 1.2.0
appVersion: "2.5.0"
```

重点区分：

``` text
version

↓

Chart自身版本


appVersion

↓

应用版本信息
```

二者不是同一个概念。

------------------------------------------------------------------------

# 7. values.yaml配置体系（★★★★★）

`values.yaml`保存Chart默认参数。

例如：

``` yaml
replicaCount: 3

image:
  repository: example/my-app
  tag: "1.0.0"

service:
  type: ClusterIP
  port: 80

resources:
  requests:
    cpu: 100m
    memory: 128Mi
```

模板可以读取这些值。

这样就将：

``` text
固定YAML

↓

参数化YAML
```

------------------------------------------------------------------------

# 8. templates模板目录

`templates/`中保存Kubernetes资源模板。

例如：

``` text
templates/

├── deployment.yaml
├── service.yaml
├── ingress.yaml
└── hpa.yaml
```

模板经过Helm渲染：

``` text
Template

+

Values

↓

Rendered Manifest
```

最终生成普通Kubernetes YAML。

------------------------------------------------------------------------

# 9. Helm模板语法基础（★★★★★）

Helm模板基于Go Template体系。

例如：

``` yaml
metadata:
  name: {{ .Release.Name }}
```

变量表达式：

``` text
{{ ... }}
```

例如：

``` yaml
spec:
  replicas: {{ .Values.replicaCount }}
```

渲染后可能变成：

``` yaml
spec:
  replicas: 3
```

------------------------------------------------------------------------

# 10. Values变量引用

假设：

``` yaml
image:
  repository: nginx
  tag: "1.27"
```

模板：

``` yaml
containers:
  - name: app
    image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

渲染：

``` yaml
containers:
  - name: app
    image: "nginx:1.27"
```

核心：

``` text
.Values

↓

访问values配置
```

------------------------------------------------------------------------

# 11. 条件判断与循环

## 条件判断

例如：

``` yaml
{{- if .Values.ingress.enabled }}
...
{{- end }}
```

可以根据配置决定：

``` text
是否生成Ingress
```

------------------------------------------------------------------------

## range循环

例如：

``` yaml
{{- range .Values.env }}
- name: {{ .name }}
  value: {{ .value | quote }}
{{- end }}
```

适合生成：

-   环境变量；
-   多端口；
-   多Host；
-   多规则。

模板的价值是：

> 将重复配置抽象成可复用逻辑。

------------------------------------------------------------------------

# 12. 内置对象与常用函数

常见内置对象：

``` text
.Release
.Values
.Chart
.Capabilities
.Template
```

例如：

``` text
.Release.Name

.Chart.Name

.Chart.Version
```

常见函数包括：

``` text
default
quote
required
include
toYaml
indent
nindent
```

例如：

``` yaml
resources:
{{ toYaml .Values.resources | nindent 10 }}
```

模板应优先保持：

``` text
简单

清晰

可维护
```

避免把Chart写成复杂程序。

------------------------------------------------------------------------

# 13. \_helpers.tpl公共模板（★★★★☆）

多个资源经常重复：

``` text
name

labels

selectorLabels
```

可以在：

``` text
templates/_helpers.tpl
```

中定义公共模板。

例如概念上：

``` text
my-app.fullname

my-app.labels

my-app.selectorLabels
```

然后使用：

``` text
include
```

进行复用。

优点：

``` text
统一命名

+

减少重复

+

方便维护
```

------------------------------------------------------------------------

# 14. Helm Release发布模型（★★★★★）

Chart与Release必须区分。

``` text
Chart

↓

安装模板


Release

↓

Chart的一次安装实例
```

例如：

``` text
Chart: redis

↓

Release A: redis-dev

Release B: redis-prod
```

Release拥有自己的：

-   名称；
-   Namespace；
-   Values；
-   Revision；
-   状态。

------------------------------------------------------------------------

# 15. helm install应用安装（★★★★★）

典型命令：

``` bash
helm install my-app ./my-app
```

指定Namespace：

``` bash
helm install my-app ./my-app \
  --namespace production \
  --create-namespace
```

指定Values：

``` bash
helm install my-app ./my-app \
  -f values-prod.yaml
```

安装流程：

``` text
Chart

↓

Values

↓

Render

↓

Kubernetes API

↓

Release Revision 1
```

------------------------------------------------------------------------

# 16. helm upgrade应用升级（★★★★★）

修改Chart或Values后：

``` bash
helm upgrade my-app ./my-app
```

常见组合：

``` bash
helm upgrade --install my-app ./my-app \
  -f values-prod.yaml
```

`upgrade --install`可以实现：

``` text
Release存在

↓

Upgrade


Release不存在

↓

Install
```

非常适合自动化流程。

------------------------------------------------------------------------

# 17. helm rollback版本回滚（★★★★★）

Helm会维护Release Revision历史。

例如：

``` text
Revision 1

↓

Upgrade

↓

Revision 2

↓

Upgrade

↓

Revision 3
```

查看历史：

``` bash
helm history my-app
```

发生问题后：

``` bash
helm rollback my-app 2
```

实现：

``` text
当前版本

↓

恢复到指定历史Revision对应配置
```

需要注意：

> Helm回滚主要针对Kubernetes资源配置，不代表数据库业务数据会自动回滚。

------------------------------------------------------------------------

# 18. Helm Release生命周期管理

典型生命周期：

``` text
Install

↓

Upgrade

↓

Upgrade

↓

Rollback

↓

Uninstall
```

常见命令：

``` bash
helm list
```

``` bash
helm status my-app
```

``` bash
helm history my-app
```

``` bash
helm uninstall my-app
```

Release管理使Helm不仅是：

``` text
YAML生成工具
```

还是：

``` text
Kubernetes应用生命周期管理工具
```

------------------------------------------------------------------------

# 19. Helm Repository与Chart分发

Chart可以存储在仓库中进行分发。

典型流程：

``` text
Chart Source

↓

Package

↓

Repository / Registry

↓

helm install
```

可以将企业内部公共组件封装成Chart，例如：

``` text
Redis

Ingress Controller

Monitoring Stack

Company Application
```

从而形成：

> Kubernetes应用包标准化。

------------------------------------------------------------------------

# 20. Helm Dependency依赖管理（★★★★☆）

一个Chart可能依赖其他Chart。

例如：

``` text
my-app

├── Application
└── Redis Dependency
```

可以在Chart元数据中定义依赖。

概念结构：

``` yaml
dependencies:
  - name: redis
    version: "..."
    repository: "..."
```

然后：

``` text
Parent Chart

↓

Dependency Charts
```

适合组合式应用部署。

但生产环境应谨慎判断：

> 数据库等基础设施是否真的应该作为业务Chart的强绑定依赖。

------------------------------------------------------------------------

# 21. 多环境Values配置管理（★★★★★）

典型结构：

``` text
my-app/

├── values.yaml
├── values-dev.yaml
├── values-test.yaml
└── values-prod.yaml
```

例如：

``` text
values-dev.yaml

replicaCount: 1
```

生产：

``` text
values-prod.yaml

replicaCount: 5
```

最终：

``` text
同一个Chart

+

不同Values

↓

不同环境
```

这可以大幅减少重复YAML。

------------------------------------------------------------------------

# 22. Helm与Kustomize区别（★★★★★）

## Helm

核心思想：

``` text
Template

+

Values

↓

Generate YAML
```

适合：

-   应用打包；
-   参数化；
-   Chart分发；
-   Release管理。

## Kustomize

核心思想：

``` text
Base

+

Overlay

↓

Customized YAML
```

适合：

-   基础YAML复用；
-   环境差异Patch；
-   不希望大量模板语法的场景。

记忆：

``` text
Helm

模板化 + 包管理


Kustomize

Base + Overlay
```

两者也可以根据工程体系组合使用。

------------------------------------------------------------------------

# 23. Helm与GitOps结合（★★★★★）

上一章学习：

``` text
Git

↓

Desired State

↓

GitOps Controller

↓

Kubernetes
```

Helm可以负责：

``` text
Chart

+

Values

↓

Rendered Manifests
```

组合：

``` text
Git Repository

↓

Helm Chart + Values

↓

GitOps Controller

↓

Render / Reconcile

↓

Kubernetes
```

因此：

> Helm解决"如何模板化和打包应用"，GitOps解决"如何持续让集群状态与Git中的期望状态保持一致"。

------------------------------------------------------------------------

# 24. Helm与Argo CD结合（★★★★★）

典型结构：

``` text
Git Repository

├── Chart
└── values-prod.yaml
        │
        ↓
     Argo CD
        │
        ↓
   Helm Render
        │
        ↓
Kubernetes Resources
```

Argo CD可以持续比较：

``` text
Git Desired State

与

Cluster Actual State
```

出现漂移：

``` text
OutOfSync
```

再根据同步策略处理。

注意：

> 在GitOps场景下，应明确谁负责Release/资源生命周期，避免传统Helm操作与GitOps控制器同时修改同一批资源而造成管理边界混乱。

------------------------------------------------------------------------

# 25. Secret与敏感配置安全（★★★★★）

不要直接在：

``` text
values.yaml
```

中提交：

``` text
Password

Token

Private Key

API Key
```

尤其不能把生产明文Secret提交Git。

错误：

``` yaml
database:
  password: super-secret-password
```

安全思路：

``` text
External Secret Manager

Encrypted Secret

Sealed Secret等机制
```

核心：

> Helm负责模板化，不应该成为明文密钥存储系统。

------------------------------------------------------------------------

# 26. Helm Hook生命周期钩子（★★★★☆）

Hook可以在Release生命周期的特定阶段执行资源。

常见场景：

``` text
Install之前

↓

准备任务


Upgrade之后

↓

Migration / Validation
```

典型用途：

-   数据库迁移Job；
-   初始化Job；
-   安装前检查；
-   测试任务。

但Hook会增加部署流程复杂度。

生产环境应：

``` text
谨慎使用

+

保证幂等

+

明确失败处理策略
```

------------------------------------------------------------------------

# 27. Helm常见问题与排查

## 问题一：模板渲染错误

先检查：

``` bash
helm template my-app ./my-app
```

观察生成的YAML。

------------------------------------------------------------------------

## 问题二：Chart语法或结构问题

可以：

``` bash
helm lint ./my-app
```

进行基础检查。

------------------------------------------------------------------------

## 问题三：Values没有生效

检查：

``` text
Values文件是否正确？

字段路径是否正确？

模板是否引用正确？

是否被其他值覆盖？
```

------------------------------------------------------------------------

## 问题四：Upgrade失败

检查：

``` text
helm status

helm history

Kubernetes Events

Pod Logs
```

------------------------------------------------------------------------

## 问题五：Rollback后业务仍然异常

可能是：

``` text
Kubernetes Manifest恢复了

但

Database Schema / Data没有恢复
```

因此：

> Helm Release回滚不能替代业务数据恢复。

------------------------------------------------------------------------

# 28. 企业Helm Chart设计规范

建议Chart遵循统一规范：

``` text
Chart Naming

Labels

Annotations

Image

Resources

Probes

SecurityContext

Service

Ingress

HPA

PDB
```

例如所有业务Chart统一支持：

``` text
resources.requests

resources.limits

readinessProbe

livenessProbe

securityContext

podSecurityContext
```

这样可以形成：

> 企业级应用部署标准。

还可以沉淀：

``` text
Company Base Chart

↓

Business Charts
```

减少重复工程工作。

------------------------------------------------------------------------

# 29. Helm生产最佳实践

1.  Chart保持单一职责；
2.  Chart版本与应用版本分开管理；
3.  values.yaml提供合理默认值；
4.  不在模板中写过度复杂逻辑；
5.  使用_helpers.tpl复用公共模板；
6.  多环境使用独立Values；
7.  对关键参数使用明确命名；
8.  不在Git保存明文Secret；
9.  镜像版本尽量明确；
10. 为Pod配置requests和limits；
11. 配置readinessProbe和livenessProbe；
12. 普通应用使用安全SecurityContext；
13. 使用`helm lint`检查Chart；
14. 使用`helm template`检查渲染结果；
15. 升级前评估资源变更；
16. 建立Release回滚流程；
17. 数据库升级与Helm回滚分开设计；
18. GitOps环境中避免绕过Git直接长期修改生产配置；
19. Chart进入生产前进行测试；
20. 对公共Chart实施版本化治理。

------------------------------------------------------------------------

# 30. 系统架构设计师考点

## 什么是Helm？

答：

> Helm是Kubernetes常用的包管理工具，通过Chart组织应用资源，通过模板和Values实现参数化部署，并支持Release的安装、升级和回滚。

------------------------------------------------------------------------

## Chart和Release区别？

答：

> Chart是应用安装包和模板，Release是Chart安装到Kubernetes集群后形成的一次具体实例。

------------------------------------------------------------------------

## values.yaml作用？

答：

> values.yaml用于保存Chart默认配置参数，并向templates中的模板提供变量值。

------------------------------------------------------------------------

## Helm为什么适合多环境？

答：

> 因为可以复用同一套Chart模板，通过不同环境的Values文件生成Dev、Test、Prod等环境所需的配置。

------------------------------------------------------------------------

## Helm与Kustomize区别？

答：

> Helm主要采用模板加Values的方式进行应用参数化和包管理；Kustomize主要通过Base加Overlay对原生YAML进行定制。

------------------------------------------------------------------------

## Helm和GitOps是什么关系？

答：

> Helm负责应用模板化、打包和配置生成，GitOps负责以Git为期望状态来源持续同步和调谐Kubernetes集群。

------------------------------------------------------------------------

## Helm回滚能否恢复数据库？

答：

> 通常不能。Helm主要回滚Kubernetes资源配置，数据库Schema和业务数据需要独立的备份、迁移和恢复策略。

------------------------------------------------------------------------

# 31. Mermaid Helm部署架构图

``` mermaid
flowchart TD

A[Helm Chart]

A --> B[Chart.yaml]
A --> C[values.yaml]
A --> D[templates/]
A --> E[Dependencies]

C --> F[Helm Template Engine]
D --> F
E --> F

F --> G[Rendered Kubernetes Manifests]
G --> H[Kubernetes API]
H --> I[Release]

I --> J[Deployment]
I --> K[Service]
I --> L[Ingress]
I --> M[ConfigMap / Other Resources]

N[values-dev.yaml] --> F
O[values-test.yaml] --> F
P[values-prod.yaml] --> F

Q[Git Repository] --> R[GitOps Controller / Argo CD]
A --> Q
P --> Q
R --> H
```

------------------------------------------------------------------------

# 32. 本节小结

Helm核心知识：

1.  Helm是Kubernetes常用包管理工具；
2.  Chart是应用包，Release是Chart的一次安装实例；
3.  Chart.yaml保存Chart元数据；
4.  values.yaml保存默认配置；
5.  templates目录保存Kubernetes资源模板；
6.  Helm使用模板语法将Values渲染为Kubernetes YAML；
7.  条件、循环和公共模板可以减少重复配置；
8.  Helm支持Install、Upgrade、Rollback和Uninstall；
9.  Release通过Revision维护发布历史；
10. Repository用于Chart分发；
11. Dependency用于管理Chart依赖；
12. 多环境可以通过同一Chart加不同Values实现；
13. Helm强调模板化和包管理，Kustomize强调Base加Overlay；
14. Helm可以与GitOps和Argo CD结合；
15. Secret不应以明文形式直接保存在Values和Git中；
16. Hook可处理特定生命周期任务，但应谨慎使用；
17. Helm回滚不等于数据库数据回滚；
18. 企业可以通过统一Chart规范沉淀Kubernetes部署标准。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Helm通过"Chart + Templates +
> Values"将Kubernetes应用模板化和标准化，并通过Release完成安装、升级和回滚；它解决的是应用如何打包与参数化部署，而GitOps解决的是这些期望配置如何持续同步到Kubernetes集群。
