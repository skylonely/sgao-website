# 45 Kubernetes CRD 自定义资源与 API 扩展机制

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇深入介绍 Kubernetes CRD（CustomResourceDefinition）及 API
> 扩展机制，重点掌握 CRD、Custom Resource、API
> Group、Version、Kind、Scope、OpenAPI
> Schema、Spec/Status、Subresources、多版本、Conversion
> Webhook、Admission Webhook、Finalizer、OwnerReference、RBAC，以及 CRD
> 与 Controller、Operator 的关系。

------------------------------------------------------------------------

# 目录

1.  CRD概述
2.  为什么Kubernetes需要API扩展
3.  Kubernetes API资源体系回顾
4.  Built-in Resource与Custom Resource
5.  CRD与CR核心关系
6.  CRD整体工作原理
7.  API Group、Version与Kind
8.  Resource与Plural资源名称
9.  Namespaced与Cluster Scope
10. CRD基本结构
11. OpenAPI Schema字段定义
12. Spec期望状态设计
13. Status实际状态设计
14. Subresources子资源机制
15. Status Subresource
16. Scale Subresource
17. Validation字段校验
18. Defaulting默认值
19. AdditionalPrinterColumns
20. CRD多版本管理
21. Served与Storage Version
22. CRD版本升级策略
23. Conversion Webhook
24. Admission Webhook
25. Finalizer删除控制
26. OwnerReference资源所有权
27. CRD与Controller关系
28. CRD与Operator关系
29. CRD权限与RBAC
30. CRD API设计原则
31. CRD兼容性与演进
32. CRD常见问题与排查
33. 企业CRD设计规范
34. CRD生产最佳实践
35. 系统架构设计师考点
36. Mermaid CRD API扩展架构图
37. 本节小结

------------------------------------------------------------------------

# 1. CRD概述（★★★★★）

CRD：CustomResourceDefinition，自定义资源定义。

Kubernetes 原生提供 Pod、Deployment、Service、StatefulSet 等资源；CRD
允许平台继续定义 MySQLCluster、RedisCluster、Backup、Application
等领域资源。

``` text
CRD
 ↓
定义新的资源类型
 ↓
Custom Resource
 ↓
创建具体资源实例
```

例如：

``` text
CRD: MySQLCluster
CR:  production-db
```

------------------------------------------------------------------------

# 2. 为什么Kubernetes需要API扩展（★★★★★）

Kubernetes 不可能原生理解所有业务领域。它知道 StatefulSet，却不知道一个
MySQL 集群应如何初始化、复制、备份、恢复和故障切换。

CRD 可以把领域概念直接变成 Kubernetes API：

``` text
业务领域模型
     ↓
Custom Resource
     ↓
Kubernetes声明式API
```

这使 Kubernetes 不仅是容器编排平台，也可以成为声明式基础设施与平台 API
的基础。

------------------------------------------------------------------------

# 3. Kubernetes API资源体系回顾（★★★★★）

例如：

``` yaml
apiVersion: apps/v1
kind: Deployment
```

可以拆成：

``` text
API Group = apps
Version   = v1
Kind      = Deployment
```

核心模型：

``` text
Group
  ↓
Version
  ↓
Resource / Kind
```

CRD 本质上就是在该体系中增加新的 API Resource。

------------------------------------------------------------------------

# 4. Built-in Resource与Custom Resource（★★★★★）

``` text
Kubernetes API

├── Built-in Resources
│   ├── Pod
│   ├── Deployment
│   ├── Service
│   └── StatefulSet
│
└── Custom Resources
    ├── MySQLCluster
    ├── RedisCluster
    └── Backup
```

Built-in Resource 由 Kubernetes 原生提供；Custom Resource 由用户通过 CRD
扩展。

------------------------------------------------------------------------

# 5. CRD与CR核心关系（★★★★★）

CRD 定义：

-   资源名称；
-   API Group；
-   Version；
-   字段 Schema；
-   Scope；
-   校验规则。

CR 是具体实例。

``` text
CRD ≈ 类型定义
CR  ≈ 资源实例
```

例如：

``` text
CRD: MySQLCluster
      ↓
CR: production-db
```

------------------------------------------------------------------------

# 6. CRD整体工作原理（★★★★★）

``` text
CRD Manifest
     ↓
API Server
     ↓
注册新的API资源
     ↓
Custom Resource API
     ↓
Create / Get / Update / Delete / Watch
```

安装 CRD 后，可以出现类似：

``` bash
kubectl get mysqlclusters
```

如果再配合 Controller：

``` text
Custom Resource
      ↓
Controller Watch
      ↓
Reconcile
      ↓
创建/更新实际资源
```

------------------------------------------------------------------------

# 7. API Group、Version与Kind（★★★★★）

例如：

``` yaml
apiVersion: database.example.com/v1
kind: MySQLCluster
```

对应：

``` text
Group   = database.example.com
Version = v1
Kind    = MySQLCluster
```

企业应为 API Group 建立稳定命名规范，避免频繁修改。

------------------------------------------------------------------------

# 8. Resource与Plural资源名称（★★★★☆）

Kind 通常采用单数 PascalCase：

``` text
MySQLCluster
```

REST Resource 通常采用小写复数：

``` text
mysqlclusters
```

所以：

``` bash
kubectl get mysqlclusters
```

CRD 还可以定义 singular、shortNames、categories 等信息，改善 CLI
使用体验。

------------------------------------------------------------------------

# 9. Namespaced与Cluster Scope（★★★★★）

CRD 必须明确作用域。

Namespaced：

``` text
Namespace
└── Custom Resource
```

适合应用、数据库实例、租户资源等。

Cluster：

``` text
Cluster
└── Global Custom Resource
```

适合集群级资源。

原则：

> 如果资源天然属于团队、租户或应用空间，通常优先考虑 Namespaced。

------------------------------------------------------------------------

# 10. CRD基本结构（★★★★★）

``` yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: mysqlclusters.database.example.com
spec:
  group: database.example.com
  scope: Namespaced
  names:
    plural: mysqlclusters
    singular: mysqlcluster
    kind: MySQLCluster
    shortNames:
      - mysql
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
```

核心字段：

``` text
group
scope
names
versions
schema
```

------------------------------------------------------------------------

# 11. OpenAPI Schema字段定义（★★★★★）

CRD 使用 OpenAPI v3 Schema 描述字段：

``` yaml
schema:
  openAPIV3Schema:
    type: object
    properties:
      spec:
        type: object
        properties:
          replicas:
            type: integer
          version:
            type: string
          storage:
            type: string
```

价值：

``` text
字段校验
API契约
工具支持
API稳定性
```

------------------------------------------------------------------------

# 12. Spec期望状态设计（★★★★★）

Spec 描述用户期望状态：

``` yaml
spec:
  replicas: 3
  version: "8.4"
  storage: 100Gi
```

声明式 API 应描述：

``` text
What
```

而不是：

``` text
How
```

即用户描述最终希望系统达到什么状态，而不是列出逐步执行命令。

------------------------------------------------------------------------

# 13. Status实际状态设计（★★★★★）

Status 表示 Controller 观察到的状态：

``` yaml
status:
  readyReplicas: 3
  phase: Running
```

关系：

``` text
Spec
 ↓
Desired State

Status
 ↓
Observed State
```

如果：

``` text
spec.replicas = 3
status.readyReplicas = 2
```

说明系统尚未完全收敛。

------------------------------------------------------------------------

# 14. Subresources子资源机制（★★★★☆）

CRD 可以暴露子资源，例如：

``` text
/status
/scale
```

子资源可以用于：

``` text
权限分离
状态更新隔离
扩缩容工具集成
```

------------------------------------------------------------------------

# 15. Status Subresource（★★★★★）

启用 Status Subresource 后：

``` text
用户 / GitOps
     ↓
    Spec

Controller
     ↓
   Status
```

这样 Controller 更新 Status 时，不需要把 Spec 当作普通业务字段一起改写。

这是标准 Kubernetes API 设计的重要模式。

------------------------------------------------------------------------

# 16. Scale Subresource（★★★★☆）

Scale Subresource 可以为适合扩缩容的自定义资源暴露统一接口：

``` text
Custom Resource
      ↓
    /scale
      ↓
desired replicas
current replicas
selector
```

使部分通用扩缩容机制更容易与自定义资源协作。

------------------------------------------------------------------------

# 17. Validation字段校验（★★★★★）

应尽量在 API 层阻止非法输入。

例如：

``` yaml
replicas:
  type: integer
  minimum: 1
```

如果提交：

``` yaml
replicas: -5
```

应在 API 校验阶段直接失败。

原则：

> 能在 Schema 层发现的问题，不应全部推迟到 Controller。

------------------------------------------------------------------------

# 18. Defaulting默认值（★★★★☆）

如果用户没有指定某些字段，可以提供合理默认值。

例如：

``` text
spec.replicas未指定
        ↓
Default = 3
```

默认值应保持：

``` text
安全
稳定
语义明确
```

因为默认行为一旦被大量用户依赖，后续修改也属于 API 兼容性问题。

------------------------------------------------------------------------

# 19. AdditionalPrinterColumns（★★★★☆）

可以改善：

``` bash
kubectl get mysqlclusters
```

的显示效果，例如：

``` text
NAME            VERSION   REPLICAS   READY   STATUS
production-db   8.4       3          3       Running
```

这比只显示 NAME、AGE 更适合日常运维。

------------------------------------------------------------------------

# 20. CRD多版本管理（★★★★★）

CRD 可以支持：

``` text
v1alpha1
   ↓
v1beta1
   ↓
v1
```

同一个 CRD 可以在迁移期间同时提供多个版本。

核心目标：

> API 可以演进，但不能随意破坏已有客户端和资源。

------------------------------------------------------------------------

# 21. Served与Storage Version（★★★★★）

每个 Version 可以定义：

``` text
served
storage
```

Served：

``` text
客户端是否可以通过该版本访问API
```

Storage：

``` text
对象持久化使用哪个版本
```

记忆：

``` text
Served
↓
对外服务版本

Storage
↓
内部持久化版本
```

多个版本中只能有一个 Storage Version。

------------------------------------------------------------------------

# 22. CRD版本升级策略（★★★★★）

例如：

``` text
v1beta1
   ↓
v1
```

不能简单修改版本字符串，还要考虑：

``` text
字段变化
默认值变化
Schema兼容
旧客户端
已有对象
存储版本
```

推荐思路：

``` text
增加新版本
    ↓
新旧版本同时Served
    ↓
迁移客户端
    ↓
迁移存储对象
    ↓
停止旧版本Served
```

------------------------------------------------------------------------

# 23. Conversion Webhook（★★★★★）

不同版本 Schema 发生变化时，需要版本转换。

例如：

``` text
v1beta1
size

↓

Conversion

↓

v1
storageSize
```

概念：

``` text
Client Version
      ↓
API Server
      ↓
Conversion Webhook
      ↓
Storage / Requested Version
```

Conversion Webhook 应重点考虑：

``` text
高可用
证书
超时
兼容性
双向转换
```

------------------------------------------------------------------------

# 24. Admission Webhook（★★★★★）

Admission Webhook 与 Conversion Webhook 不同。

Validating Webhook：

``` text
Request
   ↓
是否合法？
   ↓
Allow / Reject
```

Mutating Webhook：

``` text
Request
   ↓
补充或修改字段
   ↓
继续处理
```

记忆：

``` text
Admission
↓
请求准入

Conversion
↓
API版本转换
```

------------------------------------------------------------------------

# 25. Finalizer删除控制（★★★★★）

如果 CR 对应外部资源：

``` text
Cloud Database
DNS
Storage
Backup
```

删除 CR 时可能需要先清理。

``` text
Delete Request
      ↓
deletionTimestamp
      ↓
Finalizer仍存在
      ↓
Controller Cleanup
      ↓
Remove Finalizer
      ↓
真正删除
```

Finalizer 的清理逻辑必须具备可重试能力。

------------------------------------------------------------------------

# 26. OwnerReference资源所有权（★★★★★）

Custom Resource 创建的子资源可以建立 OwnerReference：

``` text
Custom Resource
      │
      ├── StatefulSet
      ├── Service
      └── ConfigMap
```

Kubernetes Garbage Collector 可以根据所有权关系处理依赖资源生命周期。

设计时必须遵守 Kubernetes 对 Namespace 与集群级资源所有权的作用域规则。

------------------------------------------------------------------------

# 27. CRD与Controller关系（★★★★★）

只有 CRD：

``` text
Kubernetes可以
Create
Read
Update
Delete
Watch
Validate
```

但是：

``` text
不会自动执行领域业务行为
```

例如：

``` text
MySQLCluster
replicas = 3
```

没有 Controller，就不会自动产生数据库集群。

Controller 才负责：

``` text
Watch
 ↓
Reconcile
 ↓
Create / Update / Delete
```

记忆：

``` text
CRD
↓
定义API

Controller
↓
实现行为
```

------------------------------------------------------------------------

# 28. CRD与Operator关系（★★★★★）

Operator 通常可以理解为：

``` text
CRD
 +
Controller
 +
Domain Knowledge
 ↓
Operator
```

例如：

``` text
DatabaseCluster CR
        ↓
Database Operator
        ↓
Provision
Scale
Backup
Restore
Failover
Upgrade
```

因此：

> CRD 是 Operator 的重要基础，但 CRD 本身不等于 Operator。

------------------------------------------------------------------------

# 29. CRD权限与RBAC（★★★★★）

Custom Resource 同样受 Kubernetes RBAC 控制。

权限包括：

``` text
get
list
watch
create
update
patch
delete
```

可以根据：

``` text
API Group
Resource
Namespace
```

进行授权。

企业多租户场景尤其应该遵循最小权限原则。

------------------------------------------------------------------------

# 30. CRD API设计原则（★★★★★）

CRD 应作为正式 API 设计。

核心原则：

``` text
1. 声明式
2. Spec / Status分离
3. 字段语义稳定
4. 合理Default
5. 尽早Validation
6. 考虑Version演进
7. Status可观察
8. 保持向后兼容
```

不要把 CRD 设计成：

``` text
一组远程执行命令
```

而应设计成：

``` text
领域期望状态模型
```

------------------------------------------------------------------------

# 31. CRD兼容性与演进（★★★★★）

CRD 一旦进入生产：

``` text
CRD
 ↓
Platform API Contract
```

会被：

``` text
GitOps
Automation
Controller
CLI
External Integration
```

依赖。

因此应避免：

``` text
随意重命名字段
修改字段类型
改变默认语义
直接删除字段
```

合理方式：

``` text
Deprecated
   ↓
Migration Window
   ↓
New Version
   ↓
Remove Old Version
```

------------------------------------------------------------------------

# 32. CRD常见问题与排查

CRD 创建失败：

``` text
检查Schema
检查names
检查versions
检查storage version
检查YAML
```

CR 无法创建：

``` text
检查Validation
Required Fields
Enum
Type
Admission Webhook
```

CR 一直 Terminating：

``` text
检查metadata.finalizers
检查Controller Cleanup
```

CR 存在但没有业务资源：

``` text
检查Controller
检查RBAC
检查Watch Scope
检查Reconcile日志
```

Conversion 失败：

``` text
检查Webhook Service
Certificate
Conversion Logic
Network
Timeout
```

------------------------------------------------------------------------

# 33. 企业CRD设计规范

建议统一：

``` text
API Group Naming
Version Strategy
Kind Naming
Plural / Singular
ShortName
Scope
Spec Structure
Status Conditions
Validation
Defaulting
Printer Columns
Finalizer Naming
```

并建立：

``` text
API Review
Compatibility Review
Deprecation Policy
Version Migration Policy
```

让 CRD 真正成为企业内部平台 API。

------------------------------------------------------------------------

# 34. CRD生产最佳实践

1.  CRD 按正式 API 进行设计；
2.  优先采用声明式模型；
3.  Spec 只表达期望状态；
4.  Status 表达观察状态；
5.  使用 Status Subresource；
6.  使用 OpenAPI Schema；
7.  尽量在 Schema 层完成 Validation；
8.  默认值必须安全且稳定；
9.  谨慎选择 Namespaced 与 Cluster Scope；
10. API Group 命名保持长期稳定；
11. Kind 清晰表达领域语义；
12. 提供实用的 Printer Columns；
13. 多版本升级保持兼容；
14. 明确 Served 与 Storage Version；
15. Conversion Webhook 需要高可用；
16. Admission Webhook 避免成为单点故障；
17. Finalizer 清理逻辑必须可重试；
18. OwnerReference 遵守资源作用域规则；
19. CRD RBAC 遵循最小权限；
20. 测试 CRD 与 Controller 的版本兼容性；
21. 对已有 CR 执行升级测试；
22. GitOps 环境验证旧 Manifest 兼容性；
23. 废弃字段提供迁移窗口；
24. 建立 API 生命周期文档；
25. 不把复杂命令式流程直接设计成 Spec。

------------------------------------------------------------------------

# 35. 系统架构设计师考点

## 什么是CRD？

> CRD 即 CustomResourceDefinition，是 Kubernetes 提供的 API
> 扩展机制，用于定义新的自定义资源类型。

## CRD与CR区别？

> CRD 定义资源类型、字段结构和 API 信息；CR 是按照 CRD
> 创建的具体资源实例。

## CRD与Controller区别？

> CRD 负责定义 API 和保存自定义资源；Controller
> 负责观察资源并实现对应的自动化行为。

## CRD与Operator区别？

> CRD 是 Operator 体系中的 API 定义部分，Operator 通常由 CRD、自定义
> Controller 和领域运维知识共同组成。

## Spec与Status区别？

> Spec 描述用户期望状态，Status 描述 Controller 观察到的当前状态。

## Served与Storage区别？

> Served 表示该 API Version 是否对客户端提供服务；Storage
> 表示对象持久化使用的版本。

## Conversion与Admission Webhook区别？

> Conversion Webhook 负责不同 API Version 之间的对象转换；Admission
> Webhook 负责资源创建或更新过程中的校验和修改。

------------------------------------------------------------------------

# 36. Mermaid CRD API扩展架构图

``` mermaid
flowchart TD

A[CRD Manifest] --> B[Kubernetes API Server]
B --> C[Register Custom API]

C --> D[Custom Resource API]
D --> E[Custom Resource]

U[User / kubectl / GitOps] --> D

E --> V[Validation / Defaulting]
V --> S[Persistent Storage]

E --> W[Watch]
W --> CTRL[Custom Controller]
CTRL --> R[Reconcile]

R --> DEP[Deployment / StatefulSet]
R --> SVC[Service]
R --> PVC[PVC]
R --> SEC[Secret]

R --> STATUS[Update Status]
STATUS --> D

MV[Multiple API Versions] --> CONV[Conversion Webhook]
CONV --> D

ADM[Admission Webhook] --> D
```

------------------------------------------------------------------------

# 37. 本节小结

CRD 核心知识：

1.  CRD 是 Kubernetes 重要的 API 扩展机制；
2.  CRD 定义资源类型，CR 是具体资源实例；
3.  Custom Resource 可以像原生资源一样通过 Kubernetes API 管理；
4.  API 资源通常由 Group、Version、Resource 和 Kind 组成；
5.  CRD 需要明确 Namespaced 或 Cluster Scope；
6.  OpenAPI Schema 描述和校验字段；
7.  Spec 描述期望状态，Status 描述观察状态；
8.  Status Subresource 分离用户配置与 Controller 状态更新；
9.  Scale Subresource 可提供统一扩缩容接口；
10. Validation 应尽早阻止非法配置；
11. Defaulting 用于补充稳定合理的默认值；
12. AdditionalPrinterColumns 改善 kubectl 使用体验；
13. CRD 支持多个 API Version；
14. Served 表示版本是否对客户端提供；
15. Storage 表示持久化使用的版本；
16. Conversion Webhook 处理版本转换；
17. Admission Webhook 负责准入校验或修改；
18. Finalizer 支持删除前清理；
19. OwnerReference 表达资源所有权；
20. CRD 定义 API，Controller 实现行为；
21. Operator 通常是 CRD + Controller + Domain Knowledge；
22. Custom Resource 同样受 RBAC 控制；
23. CRD 进入生产后应作为正式 API 契约治理；
24. 企业 CRD 必须重视兼容性、版本升级和废弃策略。

------------------------------------------------------------------------

# 一句话冲刺记忆

> CRD 的本质是"把新的领域对象注册成 Kubernetes API 资源"：CRD
> 定义类型，CR 创建实例，Controller 实现行为，Operator 再把
> CRD、Controller 和领域运维知识组合起来；当 CRD
> 进入生产后，它就不再只是一个
> YAML，而是一份需要版本、兼容性和生命周期治理的 API 契约。
