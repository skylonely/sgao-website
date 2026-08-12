# 49 Kubernetes 生产故障排查与问题诊断

> 本文属于「Docker + Kubernetes 云原生专题」。
>
> 本篇以生产实战为核心，系统整理 Kubernetes
> 常见故障的诊断思路、命令、故障链路与处理方法。重点不是"记住所有命令"，而是建立稳定的排障模型：**先确认影响范围，再看状态与事件，然后沿
> Pod → Node → Network → Storage → Control Plane 逐层定位，最后结合
> Metrics、Logs、Traces 找到 Root Cause。**

------------------------------------------------------------------------

# 目录

1.  Kubernetes故障排查概述
2.  Kubernetes故障排查核心思路
3.  从现象到根因的排查方法
4.  Kubernetes故障分层模型
5.  kubectl常用诊断命令
6.  kubectl get资源状态检查
7.  kubectl describe事件诊断
8.  kubectl logs日志排查
9.  kubectl exec容器内部诊断
10. kubectl debug调试机制
11. Events事件体系
12. Pod Pending故障排查
13. Pod ContainerCreating故障排查
14. Pod CrashLoopBackOff故障排查
15. Pod ImagePullBackOff故障排查
16. Pod OOMKilled故障排查
17. Pod Evicted故障排查
18. Pod Terminating故障排查
19. Pod Ready 0/1故障排查
20. Liveness / Readiness / Startup Probe故障
21. Deployment发布失败排查
22. Deployment滚动更新卡住
23. StatefulSet故障排查
24. DaemonSet故障排查
25. Job / CronJob故障排查
26. Service访问失败排查
27. Endpoint / EndpointSlice异常
28. DNS解析故障排查
29. CoreDNS故障排查
30. Ingress / Gateway访问故障
31. NetworkPolicy网络阻断排查
32. CNI网络故障排查
33. 跨Node网络故障
34. PVC Pending故障排查
35. Volume挂载失败排查
36. PV / PVC / StorageClass故障链路
37. CSI存储插件故障排查
38. Node NotReady故障排查
39. Node资源压力与Pressure状态
40. CPU资源问题排查
41. Memory资源问题排查
42. DiskPressure与磁盘故障
43. kubelet故障排查
44. Container Runtime故障排查
45. Scheduler调度失败排查
46. Taint / Toleration调度问题
47. Affinity / Anti-Affinity调度问题
48. RBAC Forbidden权限故障
49. ServiceAccount与Token故障
50. Admission Webhook导致发布失败
51. API Server故障排查
52. etcd故障与性能问题
53. Controller Manager故障
54. Scheduler组件故障
55. Control Plane整体故障
56. 证书过期故障排查
57. 集群性能下降排查
58. API Server请求延迟排查
59. 大规模集群资源异常排查
60. 应用发布后故障快速回滚
61. GitOps同步异常排查
62. Helm部署故障排查
63. Operator / CRD故障排查
64. 多集群故障定位
65. 监控、日志与Tracing联合诊断
66. Kubernetes生产事故处理流程
67. 故障现场保护与证据收集
68. Root Cause Analysis根因分析
69. Kubernetes故障排查决策树
70. 十大生产故障案例
71. 高频错误信息速查表
72. Kubernetes排障命令速查表
73. 系统架构设计师考点
74. Mermaid生产故障排查流程图
75. 本节小结

------------------------------------------------------------------------

# 1. Kubernetes故障排查概述（★★★★★）

Kubernetes 是一个分布式系统。

一次"应用访问失败"，可能来自：

``` text
Application
Pod
Probe
Deployment
Scheduler
Node
kubelet
Container Runtime
CNI
Service
DNS
Ingress / Gateway
NetworkPolicy
Storage
CSI
RBAC
Admission
API Server
etcd
```

所以排障不能只看：

``` text
Pod有没有Running
```

而应建立完整故障链路。

------------------------------------------------------------------------

# 2. Kubernetes故障排查核心思路（★★★★★）

推荐固定顺序：

``` text
发现异常
   ↓
确认影响范围
   ↓
确认最近变更
   ↓
查看资源状态
   ↓
查看Events
   ↓
查看Logs
   ↓
定位故障层级
   ↓
验证假设
   ↓
实施修复
   ↓
验证恢复
   ↓
RCA
```

核心原则：

> 先收集证据，再执行破坏现场的操作。

不要一出现问题就：

``` bash
kubectl delete pod
```

因为重建 Pod 可能暂时恢复服务，却丢失重要现场。

------------------------------------------------------------------------

# 3. 从现象到根因的排查方法（★★★★★）

生产排障要区分：

``` text
Symptom
↓
现象

Root Cause
↓
根因
```

例如：

``` text
现象：
Pod Pending

根因可能是：
CPU不足
Memory不足
Taint
Affinity
PVC未绑定
NodeSelector错误
```

所以：

``` text
Pending ≠ 根因
```

同理：

``` text
CrashLoopBackOff
```

只是 Kubernetes 告诉你：

``` text
容器反复启动失败并进入退避重启
```

真正根因可能是：

``` text
配置错误
依赖不可达
权限不足
程序异常
端口冲突
```

------------------------------------------------------------------------

# 4. Kubernetes故障分层模型（★★★★★）

可以把故障划分为：

``` text
Layer 1：Application
Layer 2：Workload
Layer 3：Scheduling
Layer 4：Node / Runtime
Layer 5：Network
Layer 6：Storage
Layer 7：Security / Policy
Layer 8：Control Plane
Layer 9：External Infrastructure
```

排障时尽快判断：

``` text
问题属于哪一层？
```

可以显著缩小范围。

------------------------------------------------------------------------

# 5. kubectl常用诊断命令（★★★★★）

最常用：

``` bash
kubectl get
kubectl describe
kubectl logs
kubectl exec
kubectl debug
kubectl top
kubectl auth can-i
kubectl events
```

进一步：

``` bash
kubectl get pods -o wide
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl get pod <pod> -o yaml
kubectl get endpointslices
kubectl get nodes
```

生产排障首先要熟练：

``` text
get
describe
logs
```

------------------------------------------------------------------------

# 6. kubectl get资源状态检查（★★★★★）

第一步通常：

``` bash
kubectl get pods -n <namespace>
```

查看：

``` text
READY
STATUS
RESTARTS
AGE
```

进一步：

``` bash
kubectl get pods -n <namespace> -o wide
```

可以看到：

``` text
Pod IP
Node
```

再检查：

``` bash
kubectl get deploy,rs,pod -n <namespace>
```

建立：

``` text
Deployment
   ↓
ReplicaSet
   ↓
Pod
```

关系。

------------------------------------------------------------------------

# 7. kubectl describe事件诊断（★★★★★）

例如：

``` bash
kubectl describe pod <pod> -n <namespace>
```

重点看：

``` text
State
Last State
Reason
Conditions
Volumes
Events
```

Events 往往直接出现：

``` text
FailedScheduling
FailedMount
FailedAttachVolume
FailedCreatePodSandBox
Failed
BackOff
Unhealthy
```

原则：

> Pod 状态异常时，describe 通常比反复 get 更接近根因。

------------------------------------------------------------------------

# 8. kubectl logs日志排查（★★★★★）

当前容器：

``` bash
kubectl logs <pod> -n <namespace>
```

指定容器：

``` bash
kubectl logs <pod> -c <container> -n <namespace>
```

CrashLoopBackOff 特别重要：

``` bash
kubectl logs <pod> -c <container> --previous -n <namespace>
```

`--previous`：

> 查看前一个已终止容器实例的日志。

多容器 Pod 必须确认：

``` text
到底哪个Container异常
```

------------------------------------------------------------------------

# 9. kubectl exec容器内部诊断（★★★★☆）

进入运行中的容器：

``` bash
kubectl exec -it <pod> -n <namespace> -- sh
```

可以检查：

``` text
Environment
DNS
Configuration
Files
Processes
Network
```

例如：

``` bash
env
cat /etc/resolv.conf
```

但很多生产镜像采用：

``` text
Distroless
Minimal Image
```

可能没有：

``` text
sh
curl
ping
```

这时应该考虑 `kubectl debug`。

------------------------------------------------------------------------

# 10. kubectl debug调试机制（★★★★★）

`kubectl debug` 可以用于：

``` text
Ephemeral Container
Pod Debug
Node Debug
```

例如：

``` bash
kubectl debug -it <pod> --image=busybox
```

可以临时增加调试容器。

Node：

``` bash
kubectl debug node/<node> -it --image=ubuntu
```

价值：

> 不需要为了排障把大量调试工具永久塞进生产业务镜像。

------------------------------------------------------------------------

# 11. Events事件体系（★★★★★）

查看：

``` bash
kubectl get events -n <namespace> --sort-by=.metadata.creationTimestamp
```

或：

``` bash
kubectl events -n <namespace>
```

常见 Reason：

``` text
FailedScheduling
FailedMount
FailedAttachVolume
FailedCreatePodSandBox
BackOff
Unhealthy
Evicted
Killing
```

注意：

> Events 通常有保留周期，不能把它当成长期日志系统。

------------------------------------------------------------------------

# 12. Pod Pending故障排查（★★★★★）

状态：

``` text
Pending
```

首先：

``` bash
kubectl describe pod <pod>
```

重点查看：

``` text
Events
```

常见：

``` text
Insufficient cpu
Insufficient memory
Untolerated taint
Node affinity mismatch
PVC Pending
NodeSelector mismatch
```

排查：

``` text
Pod Pending
   ↓
FailedScheduling?
   ├── Yes → Scheduler / Resource / Taint / Affinity
   └── No
        ↓
      PVC?
        ↓
      Storage
```

------------------------------------------------------------------------

# 13. Pod ContainerCreating故障排查（★★★★★）

长期：

``` text
ContainerCreating
```

常见原因：

``` text
Image Pull
Volume Mount
CNI
Secret / ConfigMap
Container Runtime
```

检查：

``` bash
kubectl describe pod <pod>
```

典型 Events：

``` text
FailedMount
FailedCreatePodSandBox
FailedAttachVolume
```

------------------------------------------------------------------------

# 14. Pod CrashLoopBackOff故障排查（★★★★★）

含义：

``` text
Container Start
   ↓
Crash
   ↓
Restart
   ↓
Crash
   ↓
Backoff
```

第一检查：

``` bash
kubectl logs <pod> --previous
```

然后：

``` bash
kubectl describe pod <pod>
```

检查：

``` text
Exit Code
Reason
Last State
Restart Count
```

常见根因：

``` text
Application Error
Config Error
Missing Secret
Dependency Failure
Permission
Probe
OOM
```

------------------------------------------------------------------------

# 15. Pod ImagePullBackOff故障排查（★★★★★）

常见：

``` text
ErrImagePull
ImagePullBackOff
```

检查：

``` bash
kubectl describe pod <pod>
```

常见原因：

``` text
Image不存在
Tag错误
Registry不可达
认证失败
imagePullSecret错误
DNS问题
网络问题
```

重点确认：

``` text
Image Name
Tag
Registry
Credential
```

------------------------------------------------------------------------

# 16. Pod OOMKilled故障排查（★★★★★）

查看：

``` bash
kubectl describe pod <pod>
```

可能看到：

``` text
Reason: OOMKilled
Exit Code: 137
```

常见链路：

``` text
Application Memory
       ↓
超过Container Memory Limit
       ↓
OOM Kill
       ↓
Container Restart
```

需要分析：

``` text
Memory Limit是否过低
应用是否内存泄漏
JVM / Node.js等Runtime是否合理感知容器限制
峰值内存是否异常
```

不要简单：

``` text
无限提高Memory Limit
```

否则可能把问题转移到 Node。

------------------------------------------------------------------------

# 17. Pod Evicted故障排查（★★★★★）

Evicted 常见原因：

``` text
MemoryPressure
DiskPressure
Ephemeral Storage
```

检查：

``` bash
kubectl describe pod <pod>
kubectl describe node <node>
```

关注：

``` text
Node Conditions
```

以及：

``` text
memory
disk
ephemeral-storage
```

------------------------------------------------------------------------

# 18. Pod Terminating故障排查（★★★★★）

Pod 长时间：

``` text
Terminating
```

检查：

``` bash
kubectl get pod <pod> -o yaml
```

重点：

``` text
deletionTimestamp
finalizers
terminationGracePeriodSeconds
```

还要检查：

``` text
PreStop Hook
Application Shutdown
Volume Unmount
Node Reachability
```

不要第一时间：

``` bash
kubectl delete pod --force --grace-period=0
```

除非已经理解强制删除可能造成的后果。

------------------------------------------------------------------------

# 19. Pod Ready 0/1故障排查（★★★★★）

例如：

``` text
NAME   READY   STATUS
app    0/1     Running
```

说明：

``` text
Container可能Running
```

但：

``` text
Pod没有Ready
```

优先检查：

``` text
Readiness Probe
```

``` bash
kubectl describe pod <pod>
```

查看：

``` text
Readiness probe failed
```

------------------------------------------------------------------------

# 20. Liveness / Readiness / Startup Probe故障（★★★★★）

三种 Probe：

``` text
Startup
↓
应用是否完成启动

Readiness
↓
是否可以接收流量

Liveness
↓
是否需要重启
```

典型误配置：

``` text
应用启动需要60秒
Liveness 10秒开始
```

结果：

``` text
启动未完成
↓
Liveness失败
↓
Container被重启
↓
永远无法完成启动
```

慢启动应用应合理使用：

``` text
startupProbe
```

------------------------------------------------------------------------

# 21. Deployment发布失败排查（★★★★★）

检查：

``` bash
kubectl rollout status deployment/<name>
kubectl describe deployment <name>
kubectl get rs
kubectl get pods
```

链路：

``` text
Deployment
   ↓
ReplicaSet
   ↓
Pod
```

最终通常仍需定位：

``` text
Pod为什么没有Ready？
```

------------------------------------------------------------------------

# 22. Deployment滚动更新卡住（★★★★★）

常见：

``` text
ProgressDeadlineExceeded
```

检查：

``` bash
kubectl rollout status deployment/<name>
kubectl describe deployment <name>
```

常见根因：

``` text
新Pod无法调度
新Pod CrashLoop
Readiness失败
ImagePull失败
maxSurge / maxUnavailable约束
资源不足
```

必要时：

``` bash
kubectl rollout undo deployment/<name>
```

生产事故中：

> 先恢复服务，再继续深入 RCA。

------------------------------------------------------------------------

# 23. StatefulSet故障排查（★★★★☆）

重点：

``` text
Pod Identity
PVC
Ordered Lifecycle
Headless Service
```

检查：

``` bash
kubectl get sts
kubectl describe sts <name>
kubectl get pods
kubectl get pvc
```

某个序号 Pod 异常时，可能影响后续有序创建或更新。

------------------------------------------------------------------------

# 24. DaemonSet故障排查（★★★★☆）

检查：

``` bash
kubectl get ds
kubectl describe ds <name>
```

重点：

``` text
DESIRED
CURRENT
READY
AVAILABLE
```

某 Node 没有 DaemonSet Pod：

``` text
Taint
NodeSelector
Affinity
Node Condition
Resource
```

常见系统 DaemonSet：

``` text
CNI
Logging Agent
Monitoring Agent
```

------------------------------------------------------------------------

# 25. Job / CronJob故障排查（★★★★☆）

Job：

``` bash
kubectl get jobs
kubectl describe job <name>
```

CronJob：

``` bash
kubectl get cronjobs
kubectl describe cronjob <name>
```

重点：

``` text
Failed Pods
BackoffLimit
Schedule
ConcurrencyPolicy
Suspend
Deadline
```

最终仍然需要检查 Job 创建的 Pod 日志。

------------------------------------------------------------------------

# 26. Service访问失败排查（★★★★★）

固定链路：

``` text
Client
  ↓
Service
  ↓
EndpointSlice
  ↓
Pod IP
  ↓
Container Port
```

排查：

``` bash
kubectl get svc
kubectl describe svc <service>
kubectl get endpointslices
kubectl get pods -o wide
```

检查：

``` text
Selector
Port
TargetPort
Pod Label
Readiness
```

------------------------------------------------------------------------

# 27. Endpoint / EndpointSlice异常（★★★★★）

Service 存在但：

``` text
没有后端Endpoint
```

通常检查：

``` text
Service Selector
       ↓
Pod Labels
```

例如：

``` text
Service:
app=web

Pod:
app=api
```

则：

``` text
Service
↓
No Endpoint
```

另外：

``` text
Pod NotReady
```

也可能影响可用后端。

------------------------------------------------------------------------

# 28. DNS解析故障排查（★★★★★）

从 Pod 内：

``` bash
nslookup kubernetes.default
```

或使用调试容器。

检查：

``` text
/etc/resolv.conf
CoreDNS
Service
Network
```

判断：

``` text
只有一个Pod失败？
一个Namespace失败？
整个Cluster失败？
```

影响范围非常关键。

------------------------------------------------------------------------

# 29. CoreDNS故障排查（★★★★★）

检查：

``` bash
kubectl get pods -n kube-system
kubectl logs -n kube-system <coredns-pod>
kubectl get svc -n kube-system
```

关注：

``` text
CoreDNS Pod Ready
DNS Service
ConfigMap
Upstream DNS
NetworkPolicy
CNI
```

如果：

``` text
Service IP可以访问
但外部域名解析失败
```

应进一步检查：

``` text
Upstream DNS
```

------------------------------------------------------------------------

# 30. Ingress / Gateway访问故障（★★★★★）

链路：

``` text
Client
 ↓
DNS
 ↓
Load Balancer
 ↓
Ingress / Gateway
 ↓
Service
 ↓
EndpointSlice
 ↓
Pod
```

逐层验证，不要只盯 Ingress YAML。

检查：

``` text
Host
Path
TLS
Backend Service
Service Port
Controller
Gateway Listener
Route Binding
```

------------------------------------------------------------------------

# 31. NetworkPolicy网络阻断排查（★★★★★）

现象：

``` text
Pod A无法访问Pod B
```

检查：

``` bash
kubectl get networkpolicy -A
```

重点：

``` text
Ingress
Egress
PodSelector
NamespaceSelector
Ports
```

还要确认：

> 当前 CNI 是否真正实现 NetworkPolicy。

------------------------------------------------------------------------

# 32. CNI网络故障排查（★★★★★）

典型错误：

``` text
FailedCreatePodSandBox
```

可能来自：

``` text
CNI Plugin
IPAM
Route
Overlay
Node Network
```

检查：

``` text
CNI DaemonSet
CNI Logs
Node Network
Pod CIDR
```

如果：

``` text
同Node Pod正常
跨Node失败
```

要重点怀疑：

``` text
CNI / Routing / Firewall
```

------------------------------------------------------------------------

# 33. 跨Node网络故障（★★★★★）

典型：

``` text
Node A
Pod A
  X
Pod B
Node B
```

检查：

``` text
Pod IP
Node IP
Route
Firewall
Security Group
MTU
CNI
```

尤其云环境要检查：

``` text
Security Group
Route Table
Network ACL
```

------------------------------------------------------------------------

# 34. PVC Pending故障排查（★★★★★）

检查：

``` bash
kubectl get pvc
kubectl describe pvc <pvc>
```

常见：

``` text
StorageClass不存在
Provisioner异常
容量不足
AccessMode不支持
Topology限制
CSI异常
```

再检查：

``` bash
kubectl get storageclass
```

------------------------------------------------------------------------

# 35. Volume挂载失败排查（★★★★★）

Events：

``` text
FailedMount
FailedAttachVolume
```

检查链：

``` text
Pod
 ↓
PVC
 ↓
PV
 ↓
StorageClass
 ↓
CSI
 ↓
Backend Storage
```

可能原因：

``` text
Volume Attach失败
Node不可访问存储
权限
Secret
CSI Node Plugin
```

------------------------------------------------------------------------

# 36. PV / PVC / StorageClass故障链路（★★★★★）

记忆：

``` text
Pod
 ↓
PVC
 ↓
PV
 ↓
StorageClass
 ↓
Provisioner
 ↓
Storage Backend
```

动态供应：

``` text
PVC
 ↓
StorageClass
 ↓
CSI Provisioner
 ↓
Create Volume
 ↓
PV
```

任何一层异常都可能表现为：

``` text
Pod Pending
```

------------------------------------------------------------------------

# 37. CSI存储插件故障排查（★★★★★）

检查：

``` text
CSI Controller
CSI Node
Provisioner
Attacher
Storage Backend
```

常见问题：

``` text
Provision失败
Attach失败
Mount失败
Topology不匹配
Credential错误
```

排查 CSI Pod 日志时，要区分：

``` text
Controller-side
```

与：

``` text
Node-side
```

问题。

------------------------------------------------------------------------

# 38. Node NotReady故障排查（★★★★★）

检查：

``` bash
kubectl get nodes
kubectl describe node <node>
```

关注：

``` text
Ready
MemoryPressure
DiskPressure
PIDPressure
NetworkUnavailable
```

然后到 Node 检查：

``` text
kubelet
Container Runtime
Network
Disk
Memory
```

------------------------------------------------------------------------

# 39. Node资源压力与Pressure状态（★★★★★）

Node Conditions：

``` text
MemoryPressure
DiskPressure
PIDPressure
```

可能导致：

``` text
Scheduling限制
Pod Eviction
Node异常
```

检查：

``` bash
kubectl describe node <node>
kubectl top node
```

还应检查：

``` text
System Reserved
Kube Reserved
Ephemeral Storage
```

------------------------------------------------------------------------

# 40. CPU资源问题排查（★★★★★）

症状：

``` text
Application Slow
CPU Throttling
Latency High
```

检查：

``` bash
kubectl top pod
kubectl top node
```

关注：

``` text
CPU Request
CPU Limit
Actual Usage
Node CPU
```

CPU Limit 过低可能导致：

``` text
CPU Throttling
```

而不是 OOM。

------------------------------------------------------------------------

# 41. Memory资源问题排查（★★★★★）

检查：

``` text
Memory Usage
Request
Limit
Working Set
OOMKilled
Node MemoryPressure
```

区分：

``` text
Container OOM
```

和：

``` text
Node Memory Pressure
```

前者通常与 Container Limit 相关；

后者可能导致：

``` text
Eviction
```

------------------------------------------------------------------------

# 42. DiskPressure与磁盘故障（★★★★★）

Node：

``` text
DiskPressure=True
```

可能来自：

``` text
Image占用
Container Logs
Writable Layer
Ephemeral Storage
Node Filesystem
```

检查：

``` text
Disk Usage
inode
Container Runtime Storage
Logs
```

生产必须监控：

``` text
容量
inode
增长速率
```

------------------------------------------------------------------------

# 43. kubelet故障排查（★★★★★）

kubelet 是 Node 上关键 Agent。

检查：

``` bash
systemctl status kubelet
journalctl -u kubelet
```

常见：

``` text
Certificate
API Server Connectivity
Cgroup
Runtime
Disk
Config
```

如果 kubelet 无法正常上报：

``` text
Node
↓
NotReady
```

------------------------------------------------------------------------

# 44. Container Runtime故障排查（★★★★★）

现代 Kubernetes 常见：

``` text
containerd
CRI-O
```

检查 Runtime 状态。

containerd 示例：

``` bash
systemctl status containerd
journalctl -u containerd
```

CRI 诊断常使用：

``` bash
crictl ps
crictl images
crictl pods
```

如果 Runtime 异常：

``` text
Pod无法创建
镜像无法管理
kubelet异常
```

------------------------------------------------------------------------

# 45. Scheduler调度失败排查（★★★★★）

典型：

``` text
FailedScheduling
```

Events 可能提示：

``` text
Insufficient cpu
Insufficient memory
Untolerated taint
Node affinity conflict
Unbound PVC
```

核心：

``` text
Scheduler为什么找不到Feasible Node？
```

而不是：

``` text
Scheduler是不是坏了？
```

绝大多数 FailedScheduling 都是调度约束无法满足。

------------------------------------------------------------------------

# 46. Taint / Toleration调度问题（★★★★★）

Node：

``` text
Taint
```

Pod：

``` text
Toleration
```

如果：

``` text
Node存在NoSchedule Taint
```

而 Pod：

``` text
没有对应Toleration
```

则无法调度。

检查：

``` bash
kubectl describe node <node>
kubectl describe pod <pod>
```

------------------------------------------------------------------------

# 47. Affinity / Anti-Affinity调度问题（★★★★★）

重点检查：

``` text
nodeAffinity
podAffinity
podAntiAffinity
topologySpreadConstraints
nodeSelector
```

如果规则过于严格：

``` text
所有Node
↓
都不满足
```

结果：

``` text
Pending
```

生产设计应避免：

``` text
理论上正确
但实际永远无法满足
```

的调度约束。

------------------------------------------------------------------------

# 48. RBAC Forbidden权限故障（★★★★★）

典型：

``` text
Error from server (Forbidden)
```

先判断：

``` text
谁在访问？
```

然后：

``` bash
kubectl auth can-i get pods
```

模拟 ServiceAccount：

``` bash
kubectl auth can-i get secrets \
  --as=system:serviceaccount:<namespace>:<serviceaccount>
```

检查：

``` text
Role
ClusterRole
RoleBinding
ClusterRoleBinding
```

------------------------------------------------------------------------

# 49. ServiceAccount与Token故障（★★★★☆）

应用访问 API Server 失败：

``` text
401
403
```

需要区分：

``` text
401
↓
Authentication

403
↓
Authorization
```

检查：

``` text
ServiceAccount
Token
Audience
RBAC
Namespace
```

不要把所有 403 都当成 Token 无效。

------------------------------------------------------------------------

# 50. Admission Webhook导致发布失败（★★★★★）

典型：

``` text
failed calling webhook
```

或：

``` text
admission webhook denied the request
```

前者可能是：

``` text
Webhook Service不可达
TLS错误
Timeout
```

后者通常是：

``` text
Policy明确拒绝
```

检查：

``` text
ValidatingWebhookConfiguration
MutatingWebhookConfiguration
Service
Endpoints
Certificate
failurePolicy
timeoutSeconds
```

------------------------------------------------------------------------

# 51. API Server故障排查（★★★★★）

现象：

``` text
kubectl timeout
API request slow
connection refused
```

检查：

``` text
API Server Pod / Process
Load Balancer
Certificate
etcd
CPU / Memory
Network
```

API Server 大量变慢时：

``` text
不要只检查API Server本身
```

还要检查：

``` text
etcd
Admission Webhook
API Request Volume
```

------------------------------------------------------------------------

# 52. etcd故障与性能问题（★★★★★）

etcd 保存 Kubernetes Cluster State。

关注：

``` text
Latency
Disk IO
Database Size
Leader
Quorum
Network
```

etcd 对：

``` text
Disk Latency
```

非常敏感。

生产环境：

``` text
定期Snapshot
监控健康状态
保护Quorum
```

不要随意直接修改 etcd 数据。

------------------------------------------------------------------------

# 53. Controller Manager故障（★★★★☆）

Controller Manager 负责大量控制循环：

``` text
Deployment相关控制
Node Lifecycle
Endpoint相关控制
ServiceAccount相关控制
```

如果 Controller Manager 异常：

``` text
API仍可能可访问
```

但：

``` text
Desired State
无法持续收敛
```

现象：

``` text
对象创建成功
但系统不自动完成后续动作
```

------------------------------------------------------------------------

# 54. Scheduler组件故障（★★★★☆）

如果 Scheduler 本身异常：

``` text
新Pod
↓
持续Pending
```

且：

``` text
没有正常调度结果
```

需要检查：

``` text
Scheduler Health
Logs
Leader Election
API Connectivity
```

但排查前必须先排除普通：

``` text
FailedScheduling约束问题
```

------------------------------------------------------------------------

# 55. Control Plane整体故障（★★★★★）

Control Plane：

``` text
API Server
etcd
Scheduler
Controller Manager
```

排查：

``` text
API是否可达？

etcd是否健康？

Scheduler是否工作？

Controller是否Reconcile？
```

高可用集群还要检查：

``` text
Load Balancer
Control Plane Nodes
Quorum
```

------------------------------------------------------------------------

# 56. 证书过期故障排查（★★★★★）

可能表现：

``` text
x509 certificate has expired
TLS handshake error
Unauthorized
Component communication failure
```

检查：

``` text
API Server Certificate
kubelet Certificate
etcd Certificate
Webhook Certificate
Client Certificate
```

证书问题可能同时影响多个组件。

生产应：

``` text
提前监控Expiration
```

而不是等过期后再处理。

------------------------------------------------------------------------

# 57. 集群性能下降排查（★★★★★）

如果：

``` text
kubectl很慢
Pod创建慢
Controller响应慢
```

从：

``` text
API Server
etcd
Admission
Scheduler
Controller
Node
```

逐层分析。

还要判断：

``` text
控制面慢
```

还是：

``` text
业务应用慢
```

两者完全不同。

------------------------------------------------------------------------

# 58. API Server请求延迟排查（★★★★★）

可能原因：

``` text
etcd Latency
Admission Webhook
API Request Surge
Large LIST
Too Many Objects
Control Plane CPU
Network
```

特别是 Admission Webhook：

``` text
API Server
↓
同步等待Webhook
```

Webhook 慢会直接增加请求延迟。

------------------------------------------------------------------------

# 59. 大规模集群资源异常排查（★★★★☆）

大规模集群要关注：

``` text
Object Count
Pod Count
Watch Traffic
API QPS
etcd Size
Controller Queue
Scheduler Throughput
```

常见反模式：

``` text
客户端频繁全量LIST
```

或：

``` text
Controller产生高频Update
```

可能导致：

``` text
API Server / etcd压力
```

------------------------------------------------------------------------

# 60. 应用发布后故障快速回滚（★★★★★）

如果：

``` text
Old Version正常
New Version上线后大量错误
```

优先目标：

``` text
Restore Service
```

Deployment：

``` bash
kubectl rollout history deployment/<name>
kubectl rollout undo deployment/<name>
```

原则：

``` text
Mitigation First
↓
RCA Later
```

但回滚前应尽量记录：

``` text
Revision
Image
Config
Events
Metrics
Logs
```

------------------------------------------------------------------------

# 61. GitOps同步异常排查（★★★★☆）

典型：

``` text
OutOfSync
Reconciliation Failed
Health Degraded
```

检查：

``` text
Git Revision
Manifest
Controller Logs
RBAC
Admission
CRD
Dependency
```

GitOps 问题常见链：

``` text
Git
 ↓
Render
 ↓
Apply
 ↓
Admission
 ↓
Kubernetes Resource
```

需要判断失败在哪一层。

------------------------------------------------------------------------

# 62. Helm部署故障排查（★★★★☆）

常用：

``` bash
helm list
helm status <release>
helm history <release>
```

渲染检查：

``` bash
helm template
```

Dry Run：

``` bash
helm upgrade --install <release> <chart> --dry-run
```

常见：

``` text
Values错误
Template错误
Resource冲突
Hook失败
Admission拒绝
CRD问题
```

------------------------------------------------------------------------

# 63. Operator / CRD故障排查（★★★★★）

现象：

``` text
CR创建成功
但没有任何实际资源
```

检查：

``` text
CR Status
Conditions
Operator Pod
Controller Logs
RBAC
Watch Namespace
CRD Version
Webhook
```

核心链：

``` text
Custom Resource
      ↓
Controller Watch
      ↓
Reconcile
      ↓
Child Resources
      ↓
Status
```

哪一环断掉，就从那一环继续定位。

------------------------------------------------------------------------

# 64. 多集群故障定位（★★★★☆）

多集群首先判断：

``` text
单Cluster异常？
单Region异常？
所有Cluster异常？
```

如果所有集群同时异常：

``` text
Global DNS
Global Load Balancer
GitOps
Identity Provider
Shared Registry
Shared Database
Management Plane
```

应优先检查共享依赖。

原则：

> 故障影响范围越广，越应该优先寻找共同依赖。

------------------------------------------------------------------------

# 65. 监控、日志与Tracing联合诊断（★★★★★）

三大支柱：

``` text
Metrics
Logs
Traces
```

例如：

``` text
Metrics
↓
发现API错误率突然升高

Logs
↓
发现Database Timeout

Trace
↓
发现请求耗时集中在DB调用
```

联合使用：

``` text
Metrics
↓
Where / When

Logs
↓
What

Traces
↓
Request Path
```

------------------------------------------------------------------------

# 66. Kubernetes生产事故处理流程（★★★★★）

标准 Incident 流程：

``` text
Detect
 ↓
Triage
 ↓
Assess Impact
 ↓
Mitigate
 ↓
Recover
 ↓
Verify
 ↓
RCA
 ↓
Prevent Recurrence
```

生产事故中：

``` text
恢复服务
```

通常优先于：

``` text
立即找到100%完整根因
```

但必须保留足够证据供后续 RCA。

------------------------------------------------------------------------

# 67. 故障现场保护与证据收集（★★★★★）

修复前记录：

``` text
时间
影响范围
最近变更
Pod状态
Events
Logs
Node状态
Metrics
Deployment Revision
Config版本
Image版本
```

避免：

``` text
Delete Pod
Restart Everything
```

之后：

``` text
什么证据都没有
```

生产排障需要：

``` text
Evidence-driven Troubleshooting
```

------------------------------------------------------------------------

# 68. Root Cause Analysis根因分析（★★★★★）

RCA 不应写成：

``` text
原因：Pod挂了
```

因为：

``` text
Pod挂了
```

仍然只是现象。

RCA 应回答：

``` text
What happened?
Why did it happen?
Why was it not detected earlier?
Why did safeguards fail?
How was service restored?
How do we prevent recurrence?
```

可以使用：

``` text
5 Whys
Timeline
Fault Tree
```

------------------------------------------------------------------------

# 69. Kubernetes故障排查决策树（★★★★★）

``` text
Application异常
      ↓
Pod正常？
 ├── No
 │    ↓
 │  Pending?
 │    ├── Yes → Scheduler / Resource / PVC
 │    └── No
 │         ↓
 │   CrashLoop?
 │    ├── Yes → Logs / ExitCode / Probe / OOM
 │    └── No → Events
 │
 └── Yes
      ↓
Service可达？
 ├── No → Service / EndpointSlice
 └── Yes
      ↓
DNS正常？
 ├── No → CoreDNS
 └── Yes
      ↓
Ingress / Gateway正常？
 ├── No → Controller / Route / TLS
 └── Yes
      ↓
Application / Dependency / Data
```

如果大范围异常：

``` text
Node
↓
Control Plane
↓
Shared Infrastructure
```

------------------------------------------------------------------------

# 70. 十大生产故障案例（★★★★★）

## 案例1：Pod一直Pending

``` text
Events
↓
Insufficient cpu
```

根因：

``` text
Node可分配CPU不足
```

------------------------------------------------------------------------

## 案例2：CrashLoopBackOff

``` text
logs --previous
↓
Configuration file not found
```

根因：

``` text
ConfigMap挂载配置错误
```

------------------------------------------------------------------------

## 案例3：ImagePullBackOff

``` text
Events
↓
unauthorized
```

根因：

``` text
Registry Credential失效
```

------------------------------------------------------------------------

## 案例4：Pod Running但无法接流量

``` text
READY = 0/1
```

根因：

``` text
Readiness Probe失败
```

------------------------------------------------------------------------

## 案例5：Service无法访问

``` text
EndpointSlice为空
```

根因：

``` text
Service Selector与Pod Label不匹配
```

------------------------------------------------------------------------

## 案例6：PVC一直Pending

``` text
Events
↓
ProvisioningFailed
```

根因：

``` text
StorageClass / CSI异常
```

------------------------------------------------------------------------

## 案例7：Node NotReady

``` text
kubelet logs
↓
runtime unavailable
```

根因：

``` text
Container Runtime异常
```

------------------------------------------------------------------------

## 案例8：发布突然全部失败

``` text
failed calling webhook
```

根因：

``` text
Admission Webhook不可达
```

------------------------------------------------------------------------

## 案例9：应用频繁重启

``` text
Last State
↓
OOMKilled
```

根因：

``` text
Memory Limit过低或应用内存异常
```

------------------------------------------------------------------------

## 案例10：所有Region同时异常

单独 Cluster 均健康，但：

``` text
Global Entry异常
```

根因：

``` text
共享Global DNS / Load Balancer故障
```

启示：

> 影响所有故障域的问题，通常来自共享依赖。

------------------------------------------------------------------------

# 71. 高频错误信息速查表（★★★★★）

  现象 / Reason              第一检查点         常见方向
  -------------------------- ------------------ -----------------------------------
  Pending                    Pod Events         Scheduler / Resource / PVC
  FailedScheduling           Events             CPU / Memory / Taint / Affinity
  ContainerCreating          Events             CNI / Volume / Runtime
  CrashLoopBackOff           logs --previous    Application / Config / Probe
  ImagePullBackOff           Events             Image / Registry / Secret
  OOMKilled                  Last State         Memory Limit / Memory Leak
  Evicted                    Node Conditions    Memory / Disk / Ephemeral Storage
  0/1 Running                Probe              Readiness
  FailedMount                Pod Events         PVC / CSI / Secret
  FailedCreatePodSandBox     Events             CNI / Runtime
  Node NotReady              Node Conditions    kubelet / Runtime / Network
  Forbidden                  auth can-i         RBAC
  failed calling webhook     Webhook            Service / TLS / Timeout
  x509 expired               Certificate        PKI / Rotation
  ProgressDeadlineExceeded   Deployment / Pod   Rollout / Readiness
  PVC Pending                PVC Events         StorageClass / CSI

------------------------------------------------------------------------

# 72. Kubernetes排障命令速查表（★★★★★）

## Pod

``` bash
kubectl get pods -A
kubectl get pod <pod> -o wide
kubectl describe pod <pod>
kubectl logs <pod>
kubectl logs <pod> --previous
kubectl exec -it <pod> -- sh
kubectl debug -it <pod> --image=busybox
```

## Deployment

``` bash
kubectl get deploy
kubectl describe deploy <name>
kubectl rollout status deploy/<name>
kubectl rollout history deploy/<name>
kubectl rollout undo deploy/<name>
```

## Service

``` bash
kubectl get svc
kubectl describe svc <name>
kubectl get endpointslices
```

## Storage

``` bash
kubectl get pvc
kubectl describe pvc <name>
kubectl get pv
kubectl get storageclass
```

## Node

``` bash
kubectl get nodes
kubectl describe node <node>
kubectl top node
kubectl top pod
```

## Events

``` bash
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl events
```

## RBAC

``` bash
kubectl auth can-i get pods
kubectl auth can-i --list
```

## Runtime

``` bash
crictl ps
crictl pods
crictl images
```

## Linux Node

``` bash
systemctl status kubelet
journalctl -u kubelet

systemctl status containerd
journalctl -u containerd
```

------------------------------------------------------------------------

# 73. 系统架构设计师考点

## Kubernetes故障排查的基本原则是什么？

> 先确定故障影响范围和最近变更，再通过资源状态、Events、Logs、Metrics 和
> Traces
> 收集证据，按照应用、工作负载、调度、节点、网络、存储、安全和控制面逐层定位根因。

## Pending通常意味着什么？

> Pod
> 尚未完成调度或启动准备，常见原因包括资源不足、调度约束、Taint、Affinity、NodeSelector
> 或 PVC 未绑定，应优先查看 Pod Events。

## CrashLoopBackOff是什么？

> 表示容器反复启动失败，Kubernetes
> 对连续重启实施退避；它是现象而不是根因，应查看容器当前或 previous
> 日志、退出码和 Events。

## Running但0/1 Ready说明什么？

> 容器进程可能已经运行，但 Pod 尚未通过就绪条件，常见原因是 Readiness
> Probe 失败。

## OOMKilled是什么？

> 容器进程因内存超出相应限制或发生内存压力而被内核终止，需要结合容器限制、实际内存使用和
> Node 状态进一步判断。

## Service访问失败如何排查？

> 按 Client → Service → EndpointSlice → Pod IP → Container Port
> 链路逐层检查，并确认 Service Selector、Pod Label、端口和 Pod Ready
> 状态。

## Node NotReady如何排查？

> 先查看 Node Conditions 和 Events，再检查 kubelet、Container
> Runtime、网络、磁盘和内存等 Node 级组件。

## 为什么生产事故不能一开始就删除Pod？

> 因为删除或重启可能破坏故障现场，导致前一个容器日志、临时状态和关键证据丢失，应先完成必要的证据收集。

------------------------------------------------------------------------

# 74. Mermaid生产故障排查流程图

``` mermaid
flowchart TD

A[发现生产异常] --> B[确认影响范围]
B --> C[确认最近变更]
C --> D[kubectl get]
D --> E{资源状态异常?}

E -->|Yes| F[kubectl describe / Events]
F --> G[kubectl logs / previous]
G --> H{故障层级}

H --> P[Pod / Workload]
H --> S[Scheduler]
H --> N[Node / Runtime]
H --> NET[Network / DNS]
H --> ST[Storage / CSI]
H --> SEC[RBAC / Admission]
H --> CP[Control Plane]

P --> O[Metrics + Logs + Traces]
S --> O
N --> O
NET --> O
ST --> O
SEC --> O
CP --> O

E -->|No| O

O --> R[形成Root Cause假设]
R --> V[验证假设]
V --> M[Mitigation / Fix]
M --> VERIFY[验证业务恢复]
VERIFY --> RCA[RCA]
RCA --> PREVENT[监控 / 自动化 / 防复发]
```

------------------------------------------------------------------------

# 75. 本节小结

Kubernetes 生产故障排查核心知识：

1.  Kubernetes 是分布式系统，故障必须分层定位；
2.  Pending、CrashLoopBackOff 等状态通常是现象而不是根因；
3.  生产排障先确认影响范围；
4.  最近变更是极重要的排障线索；
5.  `kubectl get` 用于快速查看资源状态；
6.  `kubectl describe` 和 Events 是资源异常的重要证据；
7.  `kubectl logs --previous` 对 CrashLoopBackOff 特别重要；
8.  `kubectl debug` 可以在不修改生产镜像的情况下提供调试能力；
9.  Pending 优先检查 Scheduler、资源、Taint、Affinity 和 PVC；
10. ContainerCreating 优先检查 CNI、Volume 和 Runtime；
11. ImagePullBackOff 优先检查镜像、Registry 和凭证；
12. OOMKilled 需要分析 Memory Limit 与实际使用；
13. Evicted 需要检查 Node Pressure；
14. Running 不代表 Ready；
15. Probe 配置错误可以制造"人为故障"；
16. Deployment 故障最终通常要追到 ReplicaSet 和 Pod；
17. Service 排障应沿 Service → EndpointSlice → Pod；
18. DNS 故障应检查 CoreDNS、网络和上游 DNS；
19. Ingress / Gateway 应沿完整入口链路逐层检查；
20. 跨 Node 网络异常重点检查 CNI、路由和防火墙；
21. Storage 排障应沿 Pod → PVC → PV → StorageClass → CSI；
22. Node NotReady 应检查 kubelet、Runtime、网络和资源；
23. FailedScheduling 大多数来自调度条件无法满足；
24. Forbidden 需要区分认证与 RBAC 授权问题；
25. Admission Webhook 故障可能直接阻断资源发布；
26. API Server 慢时要同时检查 etcd 和 Admission；
27. etcd 性能高度依赖可靠的磁盘和 Quorum；
28. 证书过期可能引起多个 Kubernetes 组件通信异常；
29. 发布事故应优先恢复服务，并保留现场；
30. GitOps 故障要沿 Git → Render → Apply → Admission → Resource 排查；
31. Operator 故障要沿 CR → Controller → Reconcile → Child Resource →
    Status 排查；
32. 多集群大范围故障优先寻找共享依赖；
33. Metrics、Logs、Traces 应联合使用；
34. 生产事故需要标准 Incident Response 流程；
35. RCA 必须寻找根因，而不是重复描述故障现象；
36. 修复完成后必须验证业务，而不仅是确认 Pod Running；
37. 最终目标不是"会重启"，而是建立可重复、可验证、可审计的故障诊断体系。

------------------------------------------------------------------------

# 一句话冲刺记忆

> Kubernetes
> 排障可以记成"先范围、再变更，先状态、再事件，先日志、再分层"：从 Pod →
> Scheduler → Node → Network → Storage → Security → Control Plane
> 逐层缩小范围，用 Metrics、Logs、Traces
> 验证假设；生产事故先恢复业务但必须保护现场，最后通过 RCA
> 找到真正根因并建立防复发机制。
