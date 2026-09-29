/* 阶段一结业考试：容器与 K8s 概述 / 集群架构与组件 / 声明式 API 与核心资源对象 / 部署第一个应用 */
export const exam = {
  id: 'exam1',
  stageId: 's1',
  title: '阶段一结业考试',
  duration: 25,
  passScore: 66,
  questions: [
    { id: 'q-exam1-1', type: 'single', q: '容器与传统虚拟机最本质的区别是什么？', options: ['容器共享宿主机内核，虚拟机各自运行完整内核', '容器比虚拟机更安全，完全隔离了硬件', '容器不需要镜像即可启动', '虚拟机只能运行 Linux，容器可以运行任意系统'], answer: [0], explain: '容器通过 namespace/cgroup 在<strong>同一个内核</strong>上隔离进程视图，因此轻、快、密度高；虚拟机通过 Hypervisor 虚拟硬件，每个实例带完整客户操作系统。隔离强度上 VM 反而更强，所以"容器更安全"不成立。' },
    { id: 'q-exam1-2', type: 'single', q: '以下哪件事属于容器编排系统的职责？', options: ['编写 Dockerfile 并分层构建镜像', '决定数百个容器分别放到哪些机器，并在故障时自动重启', '在一台笔记本上运行单个容器做开发', '为虚拟机提供 Hypervisor 运行环境'], answer: [1], explain: '编排（orchestration）解决的是"规模问题"：调度放置、自愈、扩缩容、服务发现。镜像构建是 Docker/BuildKit 的领域，单容器开发只需要容器运行时，Hypervisor 属于虚拟化层。' },
    { id: 'q-exam1-3', type: 'judge', q: '容器镜像采用分层结构，多个不同的镜像可以共享相同的基础层。', options: ['正确', '错误'], answer: [0], explain: '镜像由只读层叠成，nginx:1.27 与 nginx:1.26 可以共享同一批底层，拉取与存储都更省；容器启动时再叠加一个可写层。' },
    { id: 'q-exam1-4', type: 'single', q: '执行 kubectl create 命令时，请求最先到达哪个组件？', options: ['etcd', 'kube-apiserver', 'kube-scheduler', 'kubelet'], answer: [1], explain: '<code>kube-apiserver</code> 是集群唯一入口，所有请求（kubectl、内部组件）都先经它认证、鉴权、准入，再由它写入 etcd。集群里任何组件都不绕过 apiserver。' },
    { id: 'q-exam1-5', type: 'single', q: '整个集群的状态（节点、Pod、配置等）唯一持久化保存在哪里？', options: ['各节点的 /etc/kubernetes 目录', 'etcd 分布式键值数据库', 'kubelet 的内存缓存', '容器运行时的镜像仓库'], answer: [1], explain: '<code>etcd</code> 是集群唯一的持久化存储，且只有 kube-apiserver 能读写它；节点本地目录只放证书与静态 Pod 清单，内存缓存与镜像仓库都不保存集群状态。' },
    { id: 'q-exam1-6', type: 'multi', q: '下列哪些组件运行在每个工作节点（worker node）上？', options: ['kubelet', 'kube-proxy', 'kube-apiserver', '容器运行时（containerd）'], answer: [0, 1, 3], explain: '每个节点都跑 kubelet（执行）、kube-proxy（转发规则）与容器运行时；kube-apiserver 属于控制平面，通常只在控制平面节点上运行。' },
    { id: 'q-exam1-7', type: 'judge', q: '为了排查数据问题，直接用 etcdctl 读写 etcd 来代替通过 kube-apiserver 操作集群，是值得推荐的做法。', options: ['正确', '错误'], answer: [1], explain: 'etcd 是私有存储，规范用法是所有集群操作都经 apiserver；直连 etcd 会绕过认证、鉴权与准入，还可能与控制器的写入冲突。只有备份/恢复（如 etcdctl snapshot save）这类专业运维场景才直接操作它。' },
    { id: 'q-exam1-8', type: 'single', q: '关于 API 对象的 spec 与 status，说法正确的是？', options: ['spec 是实际状态，由系统写入', 'status 是期望状态，由用户声明', 'spec 是用户声明的期望状态，status 是系统记录的实际状态', '两者都必须由用户在清单中编写'], answer: [2], explain: 'spec 是你提交的期望（要几个副本、用什么镜像），status 是系统观察并维护的实际（现在就绪几个），控制循环负责让 status 向 spec 对齐。status 由系统写入，手写清单不需要它。' },
    { id: 'q-exam1-9', type: 'judge', q: '提交 YAML 清单时必须编写 status 字段，否则 kubectl apply 会失败。', options: ['正确', '错误'], answer: [1], explain: 'status 由系统维护，用户清单只需 apiVersion、kind、metadata、spec 四要素；即使写了 status 也会被系统覆盖，apply 不会因此失败。' },
    { id: 'q-exam1-10', type: 'single', q: '同事的命令里出现了 kubectl get deploy -A，deploy 与 -A 分别是什么含义？', options: ['deploy 是 deployments 的缩写，-A 表示所有命名空间', 'deploy 是子命令，-A 表示追加输出', 'deploy 是 Deployment 的 API 版本，-A 表示异步执行', 'deploy 是标签名，-A 表示按年龄排序'], answer: [0], explain: '资源支持短名（SHORTNAMES），可用 <code>kubectl api-resources</code> 查到：deployments→deploy、pods→po、services→svc；<code>-A</code> 等价于 --all-namespaces，跨全部命名空间查询。' },
    { id: 'q-exam1-11', type: 'single', q: '要创建名为 cache、镜像 redis:7、2 个副本的 Deployment，正确的命令是？', options: ['kubectl create deployment cache --image=redis:7 --replicas=2', 'kubectl run cache --image=redis:7 --replicas=2', 'kubectl create deployment redis:7 --image=cache --replicas=2', 'kubectl expose deployment cache --image=redis:7 --replicas=2'], answer: [0], explain: '<code>create deployment 名称 --image=镜像 --replicas=数量</code>：先资源类型后名称；run 建的是单个 Pod；expose 用于基于现有工作负载创建 Service，不接收 --image。' },
    { id: 'q-exam1-12', type: 'single', q: '希望 Service 把 80 端口的流量转发到容器的 8080 端口，正确的命令是？', options: ['kubectl expose deployment web --port=80 --target-port=8080', 'kubectl expose deployment web --port=8080 --target-port=80', 'kubectl expose deployment web --container-port=8080', 'kubectl scale deployment web --port=80 --target-port=8080'], answer: [0], explain: '流量方向是 客户端 → Service:--port → 容器:--target-port，所以 Service 端口写 80、目标容器端口写 8080；scale 与端口无关，也不存在 --container-port 旗标。' },
    { id: 'q-exam1-13', type: 'judge', q: '执行 kubectl scale deployment web-ui --replicas=0 会删除 web-ui 这个 Deployment 对象本身。', options: ['正确', '错误'], answer: [1], explain: '副本数缩到 0 只是把 Pod 全部回收，Deployment 及其 ReplicaSet 定义仍保留在 etcd 中，随时可以再扩回来——这是"停服不删应用"的常用手段。' },
  ],
  tasks: [
    { id: 'exam1-t1', points: 10, text: '查看 default 命名空间中名为 nginx-deployment 的 Deployment 的详细信息。', hint: 'describe + 资源类型 + 名称', solution: ['kubectl describe deployment nginx-deployment'], check: { verb: 'describe', resources: ['deployments'], minNames: 1 } },
    { id: 'exam1-t2', points: 10, text: '将 default 命名空间中的 nginx-deployment 扩容到 6 个副本。', hint: 'scale 命令需要 --replicas 指定目标副本数', solution: ['kubectl scale deployment nginx-deployment --replicas=6'], check: { verb: 'scale', resources: ['deployments'], minNames: 1, flagsMust: [{ name: 'replicas', equals: '6' }] } },
  ],
};
