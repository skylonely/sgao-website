# 36 Kubernetes NetworkPolicy 网络安全与访问控制

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇介绍 Kubernetes NetworkPolicy 网络安全与访问控制机制，重点掌握
> Ingress、Egress、podSelector、namespaceSelector、ipBlock、Default
> Deny、CNI 支持，以及企业生产环境中的零信任网络隔离设计。

------------------------------------------------------------------------

# 目录

1.  NetworkPolicy概述
2.  为什么需要NetworkPolicy
3.  Kubernetes默认网络通信模型
4.  NetworkPolicy工作原理
5.  NetworkPolicy资源模型
6.  podSelector选择Pod
7.  policyTypes策略类型
8.  Ingress入站流量控制
9.  Egress出站流量控制
10. namespaceSelector命名空间选择
11. ipBlock IP网段控制
12. ports与protocol端口协议控制
13. Default Deny默认拒绝策略
14. Default Deny + Explicit Allow白名单模型
15. 前端、后端、数据库三层网络隔离
16. 跨Namespace访问控制
17. DNS与Egress访问问题
18. NetworkPolicy与CNI关系
19. NetworkPolicy与Service关系
20. NetworkPolicy常见问题与排查
21. 零信任网络模型
22. 企业生产环境网络安全设计
23. NetworkPolicy最佳实践
24. 系统架构设计师考点
25. Mermaid网络安全架构图
26. 本节小结

------------------------------------------------------------------------

# 1. NetworkPolicy概述（★★★★★）

NetworkPolicy：

> Kubernetes用于控制Pod网络通信的资源对象。

它主要解决：

``` text
谁可以访问这个Pod？

以及

这个Pod可以访问谁？
```

对应两个方向：

``` text
Ingress

入站流量


Egress

出站流量
```

NetworkPolicy可以根据：

-   Pod标签；
-   Namespace标签；
-   IP网段；
-   端口；
-   协议；

定义允许的通信路径。

------------------------------------------------------------------------

# 2. 为什么需要NetworkPolicy

假设一个集群中存在：

``` text
Frontend

Backend

Database
```

业务真正需要：

``` text
Frontend

↓

Backend

↓

Database
```

如果网络没有合理隔离，其他不相关Pod也可能尝试访问Database。

风险：

``` text
某个Pod被攻击

↓

攻击者横向扫描

↓

访问其他Pod

↓

尝试访问数据库

↓

扩大攻击范围
```

因此需要：

``` text
NetworkPolicy

↓

限制横向通信

↓

减少攻击面
```

------------------------------------------------------------------------

# 3. Kubernetes默认网络通信模型

Kubernetes网络模型强调Pod之间具有直接通信能力。

但：

> 是否存在默认网络隔离，以及NetworkPolicy是否真正生效，还取决于集群使用的网络实现和CNI插件。

在支持NetworkPolicy的网络环境中，可以通过策略逐步建立：

``` text
默认拒绝

↓

显式允许
```

而不是依赖应用自身承担全部网络访问控制责任。

------------------------------------------------------------------------

# 4. NetworkPolicy工作原理（★★★★★）

NetworkPolicy本身描述：

``` text
哪些Pod受到策略约束

+

允许哪些流量
```

基本流程：

``` text
NetworkPolicy

↓

podSelector选择目标Pod

↓

policyTypes定义方向

↓

ingress / egress定义允许规则

↓

CNI实现网络控制
```

注意：

> Kubernetes
> API负责保存NetworkPolicy对象，真正的数据面流量控制通常由支持NetworkPolicy的网络插件实现。

------------------------------------------------------------------------

# 5. NetworkPolicy资源模型

基本结构：

``` yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy

metadata:
  name: backend-policy
  namespace: production

spec:
  podSelector:
    matchLabels:
      app: backend

  policyTypes:
    - Ingress
    - Egress

  ingress:
    # 入站允许规则

  egress:
    # 出站允许规则
```

核心字段：

``` text
podSelector

↓

保护哪些Pod


policyTypes

↓

控制Ingress还是Egress


ingress / egress

↓

具体允许规则
```

------------------------------------------------------------------------

# 6. podSelector选择Pod（★★★★★）

podSelector：

> 根据Pod Label选择NetworkPolicy作用的目标Pod。

例如：

``` yaml
podSelector:
  matchLabels:
    app: backend
```

表示：

``` text
app=backend

↓

这些Pod受到当前NetworkPolicy约束
```

如果：

``` yaml
podSelector: {}
```

通常表示：

> 选择当前Namespace中的所有Pod。

------------------------------------------------------------------------

# 7. policyTypes策略类型

NetworkPolicy主要有两种策略方向：

``` yaml
policyTypes:
  - Ingress
  - Egress
```

## Ingress

控制：

> 谁可以访问目标Pod？

## Egress

控制：

> 目标Pod可以访问谁？

可以记忆：

``` text
           Pod
            │
    ┌───────┴───────┐
    ↓               ↓

Ingress           Egress

进入Pod           离开Pod
```

------------------------------------------------------------------------

# 8. Ingress入站流量控制（★★★★★）

假设Backend只允许Frontend访问。

Frontend：

``` text
app=frontend
```

Backend：

``` text
app=backend
```

示例：

``` yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy

metadata:
  name: backend-ingress
  namespace: production

spec:
  podSelector:
    matchLabels:
      app: backend

  policyTypes:
    - Ingress

  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
```

效果：

``` text
Frontend

──── TCP 8080 ────>

Backend
```

其他不符合规则的入站流量会受到限制。

------------------------------------------------------------------------

# 9. Egress出站流量控制（★★★★★）

Egress用于限制：

> Pod主动访问哪些目标。

例如：

Backend只允许访问Database：

``` yaml
egress:
  - to:
      - podSelector:
          matchLabels:
            app: database
    ports:
      - protocol: TCP
        port: 5432
```

关系：

``` text
Backend

──── TCP 5432 ────>

Database
```

Egress控制对防止：

-   恶意外联；
-   横向移动；
-   数据泄露；

具有重要意义。

------------------------------------------------------------------------

# 10. namespaceSelector命名空间选择

namespaceSelector：

> 根据Namespace Label选择通信来源或目标。

例如Namespace：

``` text
name=frontend-team
```

可以配置：

``` yaml
from:
  - namespaceSelector:
      matchLabels:
        team: frontend
```

表示：

``` text
具有team=frontend标签的Namespace中的Pod

↓

可以匹配该来源规则
```

适合：

-   团队隔离；
-   环境隔离；
-   跨Namespace通信。

------------------------------------------------------------------------

# 11. ipBlock IP网段控制

ipBlock：

> 根据CIDR控制IP地址范围。

示例：

``` yaml
egress:
  - to:
      - ipBlock:
          cidr: 10.10.0.0/16
```

也可以使用except排除部分地址：

``` yaml
ipBlock:
  cidr: 10.10.0.0/16
  except:
    - 10.10.10.0/24
```

结构：

``` text
10.10.0.0/16

↓

允许

但

10.10.10.0/24

↓

排除
```

------------------------------------------------------------------------

# 12. ports与protocol端口协议控制

NetworkPolicy不仅可以控制：

``` text
谁访问谁
```

还可以控制：

``` text
通过什么端口和协议访问
```

例如：

``` yaml
ports:
  - protocol: TCP
    port: 443
```

表示允许：

``` text
TCP 443
```

而不是开放目标Pod的所有端口。

核心原则：

> 网络访问控制应尽可能细化到必要的通信对象、端口和协议。

------------------------------------------------------------------------

# 13. Default Deny默认拒绝策略（★★★★★）

生产环境常见安全策略：

> 默认拒绝，然后显式允许。

Ingress Default Deny示例：

``` yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy

metadata:
  name: default-deny-ingress

spec:
  podSelector: {}

  policyTypes:
    - Ingress
```

含义：

``` text
当前Namespace所有Pod

↓

Ingress默认拒绝
```

类似地可以建立Egress默认拒绝。

------------------------------------------------------------------------

# 14. Default Deny + Explicit Allow白名单模型（★★★★★）

推荐安全模型：

``` text
Default Deny

↓

Explicit Allow
```

例如：

``` text
默认

所有通信禁止


然后允许

Frontend → Backend

Backend → Database

Application → DNS
```

这是一种典型白名单思想。

相比：

``` text
默认全部允许

↓

再逐个禁止
```

安全边界更加明确。

------------------------------------------------------------------------

# 15. 前端、后端、数据库三层网络隔离（★★★★★）

典型三层应用：

``` text
Internet

↓

Frontend

↓

Backend

↓

Database
```

网络策略目标：

``` text
Frontend

只能访问Backend业务端口


Backend

只能访问Database业务端口


Database

拒绝Frontend直接访问


其他Pod

不能直接访问Database
```

形成：

``` text
Frontend

──── 8080 ────>

Backend

──── 5432 ────>

Database
```

禁止：

``` text
Frontend

──── X ────>

Database
```

这可以显著降低横向攻击风险。

------------------------------------------------------------------------

# 16. 跨Namespace访问控制

假设：

``` text
Namespace: frontend

Namespace: backend
```

如果Backend只允许Frontend Namespace访问，可以组合：

``` text
namespaceSelector

+

podSelector
```

例如：

``` yaml
from:
  - namespaceSelector:
      matchLabels:
        environment: production
    podSelector:
      matchLabels:
        app: frontend
```

表示同时满足：

``` text
指定Namespace条件

AND

指定Pod条件
```

的来源才能匹配。

注意：

> YAML层级和选择器组合方式会影响"AND"与"OR"语义，生产配置需要特别仔细。

------------------------------------------------------------------------

# 17. DNS与Egress访问问题（★★★★★）

这是NetworkPolicy最常见的生产踩坑之一。

假设配置：

``` text
Default Deny Egress
```

那么应用可能出现：

``` text
Pod

↓

无法访问DNS

↓

域名无法解析

↓

访问外部API失败
```

因此需要根据集群DNS部署方式允许必要DNS通信。

例如概念上：

``` text
Application Pod

↓

UDP/TCP 53

↓

Cluster DNS
```

注意：

> DNS
> Pod标签、Namespace和具体网络路径可能因集群环境而不同，策略应按实际部署配置。

------------------------------------------------------------------------

# 18. NetworkPolicy与CNI关系（★★★★★）

NetworkPolicy能否生效：

> 依赖集群网络插件是否支持NetworkPolicy。

架构：

``` text
NetworkPolicy YAML

↓

Kubernetes API

↓

CNI / Network Plugin

↓

实际流量控制
```

因此可能出现：

``` text
NetworkPolicy创建成功

↓

但是网络插件不支持

↓

实际流量没有被限制
```

部署前必须确认CNI能力。

------------------------------------------------------------------------

# 19. NetworkPolicy与Service关系

Service解决：

> 如何找到和访问一组Pod。

NetworkPolicy解决：

> 这次通信是否被允许。

关系：

``` text
Client Pod

↓

Service

↓

Backend Pod

↓

NetworkPolicy检查通信是否允许
```

可以记忆：

``` text
Service

解决连接与服务发现


NetworkPolicy

解决网络访问控制
```

二者不是替代关系。

------------------------------------------------------------------------

# 20. NetworkPolicy常见问题与排查

## 问题一：策略创建了但没有效果

检查：

``` text
CNI是否支持NetworkPolicy？
```

------------------------------------------------------------------------

## 问题二：应用突然无法解析域名

检查：

``` text
Egress策略

↓

是否允许DNS？
```

------------------------------------------------------------------------

## 问题三：podSelector匹配不到

检查Pod Label：

``` bash
kubectl get pods --show-labels
```

------------------------------------------------------------------------

## 问题四：Namespace规则不生效

检查Namespace Label：

``` bash
kubectl get namespaces --show-labels
```

------------------------------------------------------------------------

## 问题五：Service能解析但连接失败

排查：

``` text
DNS

↓

Service

↓

Endpoint

↓

NetworkPolicy

↓

应用端口
```

不要只检查Service本身。

------------------------------------------------------------------------

# 21. 零信任网络模型（★★★★★）

传统网络思想：

``` text
内网

≈

可信
```

零信任思想：

``` text
任何网络位置

↓

默认不信任

↓

只允许明确授权通信
```

Kubernetes中可以通过：

``` text
Default Deny

+

Explicit Allow

+

身份与权限控制

+

运行时监控
```

逐步建立零信任安全模型。

核心：

> 网络"在集群内部"并不等于网络"天然可信"。

------------------------------------------------------------------------

# 22. 企业生产环境网络安全设计

企业环境可以按层设计：

``` text
Cluster

├── frontend Namespace
├── backend Namespace
├── data Namespace
└── monitoring Namespace
```

建立：

``` text
Default Deny

↓

按业务流量开放
```

例如：

``` text
Internet

↓

Ingress Gateway

↓

Frontend

↓

Backend

↓

Database
```

监控系统：

``` text
Monitoring

↓

只允许必要指标采集
```

不同环境：

``` text
dev

test

prod
```

也应避免不必要的跨环境访问。

------------------------------------------------------------------------

# 23. NetworkPolicy最佳实践

建议：

1.  确认CNI支持NetworkPolicy；
2.  从Default Deny建立安全基线；
3.  只开放必要通信路径；
4.  同时考虑Ingress与Egress；
5.  Egress策略不要遗漏DNS；
6.  使用明确的Pod Label；
7.  使用Namespace Label进行环境和团队隔离；
8.  只开放必要端口；
9.  避免过大的CIDR范围；
10. 对Database等敏感服务实施严格隔离；
11. 将NetworkPolicy纳入Git版本控制；
12. 在测试环境验证策略后再进入生产；
13. 建立网络策略变更审计；
14. 配合RBAC、Pod Security和Runtime Security形成纵深防御。

------------------------------------------------------------------------

# 24. 系统架构设计师考点

## 什么是NetworkPolicy？

答：

> NetworkPolicy是Kubernetes用于控制Pod网络通信的资源对象，可以根据Pod、Namespace、IP网段、端口和协议等条件限制Ingress与Egress流量。

------------------------------------------------------------------------

## Ingress和Egress区别？

答：

> Ingress控制进入目标Pod的流量，Egress控制目标Pod向外发出的流量。

------------------------------------------------------------------------

## podSelector作用？

答：

> podSelector通过Pod
> Label选择NetworkPolicy作用的目标Pod或规则中的通信对象。

------------------------------------------------------------------------

## namespaceSelector作用？

答：

> namespaceSelector通过Namespace Label选择允许通信的Namespace范围。

------------------------------------------------------------------------

## ipBlock作用？

答：

> ipBlock通过CIDR定义允许或排除的IP地址范围。

------------------------------------------------------------------------

## 什么是Default Deny？

答：

> Default
> Deny表示默认拒绝某个范围内的网络流量，然后通过其他NetworkPolicy显式开放必要通信路径。

------------------------------------------------------------------------

## 为什么Egress策略容易导致DNS故障？

答：

> 因为Default Deny
> Egress可能同时阻止Pod访问集群DNS服务，导致域名解析失败，因此需要显式考虑必要的DNS通信。

------------------------------------------------------------------------

## NetworkPolicy和Service有什么区别？

答：

> Service主要解决服务发现和访问入口问题，NetworkPolicy负责控制Pod之间的网络通信是否被允许。

------------------------------------------------------------------------

## NetworkPolicy为什么依赖CNI？

答：

> NetworkPolicy对象本身描述网络访问规则，真正的数据面流量控制需要由支持NetworkPolicy的网络插件实现。

------------------------------------------------------------------------

# 25. Mermaid网络安全架构图

``` mermaid
flowchart TD

A[Internet] --> B[Ingress / Gateway]

B --> C[Frontend Pod]

C -->|Allow TCP 8080| D[Backend Pod]

D -->|Allow TCP 5432| E[Database Pod]

C -. Deny .-> E

F[Other Pod] -. Deny .-> D
F -. Deny .-> E

C -->|Allow DNS| G[Cluster DNS]
D -->|Allow DNS| G

H[NetworkPolicy] --> C
H --> D
H --> E

I[podSelector] --> H
J[namespaceSelector] --> H
K[ipBlock] --> H

L[CNI Plugin] --> H
```

------------------------------------------------------------------------

# 26. 本节小结

NetworkPolicy核心知识：

1.  NetworkPolicy用于控制Pod网络通信；
2.  Ingress控制进入Pod的流量；
3.  Egress控制Pod发出的流量；
4.  podSelector通过Pod Label选择对象；
5.  namespaceSelector通过Namespace Label控制跨Namespace通信；
6.  ipBlock通过CIDR控制IP网段；
7.  ports和protocol可以进一步限制端口和协议；
8.  生产环境推荐Default Deny + Explicit Allow；
9.  三层应用应只开放Frontend → Backend → Database等必要路径；
10. Egress Default Deny必须考虑DNS访问；
11. NetworkPolicy是否生效依赖CNI网络插件能力；
12. Service解决服务访问，NetworkPolicy解决网络访问权限；
13. NetworkPolicy是Kubernetes零信任和纵深防御的重要组成部分。

------------------------------------------------------------------------

# 一句话冲刺记忆

> NetworkPolicy解决Kubernetes中"谁可以访问谁"的问题：通过Ingress和Egress控制流量方向，通过podSelector、namespaceSelector和ipBlock选择通信对象，并以Default
> Deny + Explicit Allow建立最小网络权限和零信任隔离。
