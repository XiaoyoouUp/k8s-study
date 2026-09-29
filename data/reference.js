/* 命令速查表数据 */
export const REF_SECTIONS = [
  {
    title: '基础操作', icon: '🧭', items: [
      { cmd: 'kubectl get pods', desc: '列出当前命名空间的 Pod' },
      { cmd: 'kubectl get pods -A', desc: '列出所有命名空间的 Pod' },
      { cmd: 'kubectl get pods -n study', desc: '指定命名空间' },
      { cmd: 'kubectl get pods -o wide', desc: '宽输出（含 IP / 节点）' },
      { cmd: 'kubectl get pod web -o yaml', desc: '查看资源 YAML 定义' },
      { cmd: 'kubectl describe pod web', desc: '查看详情与 Events（排障第一站）' },
      { cmd: 'kubectl get all', desc: '列出常见资源汇总' },
      { cmd: 'kubectl api-resources', desc: '列出全部资源类型与缩写' },
      { cmd: 'kubectl explain pod.spec', desc: '查看字段文档（递归加 --recursive）' },
    ],
  },
  {
    title: '部署与清单', icon: '🚀', items: [
      { cmd: 'kubectl apply -f deploy.yaml', desc: '声明式应用清单' },
      { cmd: 'kubectl apply -R -f ./manifests', desc: '递归应用目录' },
      { cmd: 'kubectl apply -k ./overlays/prod', desc: '应用 Kustomize 目录' },
      { cmd: 'kubectl create deployment web --image=nginx:1.27', desc: '命令式创建 Deployment' },
      { cmd: 'kubectl run tmp --image=busybox --rm -it -- sh', desc: '运行一次性调试 Pod' },
      { cmd: 'kubectl diff -f deploy.yaml', desc: '预览变更（不下发）' },
      { cmd: 'kubectl delete -f deploy.yaml', desc: '按清单删除' },
      { cmd: 'kubectl delete pod web --grace-period=30', desc: '优雅删除并给终止宽限期' },
    ],
  },
  {
    title: '工作负载与伸缩', icon: '📦', items: [
      { cmd: 'kubectl scale deployment web --replicas=5', desc: '扩缩容到 5 副本' },
      { cmd: 'kubectl set image deployment/web nginx=nginx:1.28', desc: '更新容器镜像' },
      { cmd: 'kubectl rollout status deployment web', desc: '查看滚动更新进度' },
      { cmd: 'kubectl rollout history deployment web', desc: '修订版本列表' },
      { cmd: 'kubectl rollout undo deployment web --to-revision=2', desc: '回滚到指定修订' },
      { cmd: 'kubectl rollout restart deployment web', desc: '滚动重启（重载配置常用）' },
      { cmd: 'kubectl autoscale deployment web --min=2 --max=10 --cpu-percent=60', desc: '创建 HPA' },
      { cmd: 'kubectl get deploy,rs,sts,ds', desc: '一次查看多类工作负载' },
    ],
  },
  {
    title: '日志、执行与调试', icon: '🔍', items: [
      { cmd: 'kubectl logs web-abc123 -f --tail=100', desc: '跟随查看日志，取最后 100 行' },
      { cmd: 'kubectl logs web-abc123 -p', desc: '查看上一个崩溃容器的日志' },
      { cmd: 'kubectl exec -it web-abc123 -- sh', desc: '进入容器交互 shell' },
      { cmd: 'kubectl exec web-abc123 -- cat /etc/hosts', desc: '在容器内执行单条命令' },
      { cmd: 'kubectl cp web-abc123:/log/app.log ./app.log', desc: '从容器拷贝文件' },
      { cmd: 'kubectl port-forward pod/web 8080:80', desc: '本地端口转发调试' },
      { cmd: 'kubectl top pods --sort-by=memory', desc: '按内存排序查看资源占用' },
      { cmd: 'kubectl get events --sort-by=.lastTimestamp', desc: '按时间看事件流' },
    ],
  },
  {
    title: '网络与访问', icon: '🌐', items: [
      { cmd: 'kubectl get svc', desc: '查看 Service' },
      { cmd: 'kubectl get endpoints nginx-service', desc: '查看后端 Endpoint（排查 Service 不通）' },
      { cmd: 'kubectl expose deployment web --port=80 --type=NodePort', desc: '为 Deployment 创建 Service' },
      { cmd: 'kubectl get ingress', desc: '查看 Ingress 规则' },
      { cmd: 'kubectl get networkpolicy -n study', desc: '查看网络策略' },
      { cmd: 'kubectl run dns-test --image=busybox --rm -it --restart=Never -- nslookup kubernetes.default', desc: '集群内 DNS 测试' },
    ],
  },
  {
    title: '配置与密钥', icon: '🔑', items: [
      { cmd: 'kubectl create configmap app-conf --from-literal=LOG_LEVEL=debug', desc: '命令式创建 ConfigMap' },
      { cmd: 'kubectl create configmap app-files --from-file=./conf', desc: '从目录创建' },
      { cmd: 'kubectl create secret generic db-pass --from-literal=pwd=S3cret', desc: '创建 Opaque Secret' },
      { cmd: 'kubectl create secret tls web-tls --cert=tls.crt --key=tls.key', desc: '创建 TLS Secret' },
      { cmd: 'kubectl get secret db-pass -o jsonpath="{.data.pwd}" | base64 -d', desc: '解码 Secret 内容' },
      { cmd: 'kubectl set env deployment/web LOG_LEVEL=info', desc: '直接设置环境变量' },
    ],
  },
  {
    title: '存储', icon: '💾', items: [
      { cmd: 'kubectl get pv,pvc,sc', desc: '查看持久卷三件套' },
      { cmd: 'kubectl get pvc -A', desc: '所有命名空间的 PVC' },
      { cmd: 'kubectl describe pvc nginx-pvc', desc: '查看绑定状态与事件' },
      { cmd: 'kubectl get pv pv-001 -o jsonpath="{.spec.claimRef.name}"', desc: 'jsonpath 查看绑定对象' },
    ],
  },
  {
    title: '安全与 RBAC', icon: '🛡️', items: [
      { cmd: 'kubectl get sa -A', desc: '查看 ServiceAccount' },
      { cmd: 'kubectl create sa build-bot', desc: '创建 ServiceAccount' },
      { cmd: 'kubectl auth can-i create pods --as=system:serviceaccount:study:study-sa', desc: '模拟鉴权检查' },
      { cmd: 'kubectl get roles,rolebindings -n study', desc: '查看命名空间级 RBAC' },
      { cmd: 'kubectl get clusterroles,clusterrolebindings', desc: '查看集群级 RBAC' },
      { cmd: 'kubectl taint nodes worker-2 key=value:NoSchedule', desc: '打污点' },
    ],
  },
  {
    title: '节点与运维', icon: '⚙️', items: [
      { cmd: 'kubectl get nodes -o wide', desc: '节点与运行时版本' },
      { cmd: 'kubectl cordon worker-1', desc: '停止调度（不驱逐）' },
      { cmd: 'kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data', desc: '驱逐并维护' },
      { cmd: 'kubectl uncordon worker-1', desc: '恢复调度' },
      { cmd: 'kubectl label node worker-1 disk=ssd', desc: '给节点打标签' },
      { cmd: 'kubectl cluster-info', desc: '控制平面地址' },
      { cmd: 'kubectl config get-contexts', desc: '查看上下文（考试必会）' },
      { cmd: 'kubectl config use-context k8s', desc: '切换上下文（每题先做！）' },
    ],
  },
  {
    title: 'etcd 备份（CKA 必考）', icon: '🗄️', items: [
      { cmd: 'ETCDCTL_API=3 etcdctl snapshot save /backup/etcd.db --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key', desc: '快照备份（证书路径在 etcd 静态 Pod 清单中）' },
      { cmd: 'ETCDCTL_API=3 etcdctl snapshot status /backup/etcd.db --write-table', desc: '校验快照' },
      { cmd: 'ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd.db --data-dir=/var/lib/etcd-restored', desc: '恢复到新数据目录' },
    ],
  },
  {
    title: '考试加速技巧', icon: '⚡', items: [
      { cmd: 'kubectl get deploy nginx --dry-run=client -o yaml > deploy.yaml', desc: '生成 YAML 骨架再修改（最重要技巧）' },
      { cmd: 'kubectl create secret generic s1 --from-literal=k=v --dry-run=client -o yaml > s1.yaml', desc: '任何 create 都能生成 YAML' },
      { cmd: 'k = kubectl', desc: '考试环境已配好 alias，直接用 k' },
      { cmd: 'export do="--dry-run=client -o yaml"', desc: '变量化常用旗标：kubectl $do …' },
      { cmd: 'export now="--force --grace-period=0"', desc: '变量化强删参数（慎用）' },
      { cmd: 'kubectl explain deployment.spec.strategy --recursive', desc: '忘字段时查文档，比翻网页快' },
    ],
  },
];
