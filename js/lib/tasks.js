/* 任务正确性判定：将用户命令与任务要求逐条比对。
 * check 规约字段（全部可选，缺省即不校验）：
 *   verb            期望动词，如 'get'
 *   sub             期望子命令，如 rollout 的 'restart'
 *   resources       期望资源类型数组（规范复数），如 ['pods']
 *   namespace       'all' 要求 -A/--all-namespaces；具体名要求 -n <名>；null 不校验
 *   flagsMust       [{name, equals?, oneOf?}] 必须出现的旗标
 *   flagsMustNot    ['force', 'grace-period=0'] 禁止出现的旗标（可含值）
 *   minNames        至少指定 N 个资源名
 *   namePattern     资源名需匹配的正则字符串
 *   selectorMust    要求使用 -l 标签选择器
 *   hints           未通过时的提示数组（与 checks 顺序无关） */
import { parseCommand } from './parser.js';

export function checkCommand(cmdLine, spec = {}) {
  const parsed = parseCommand(cmdLine);
  const checks = [];
  const add = (label, ok, detail = '') => checks.push({ label, ok, detail });

  if (!parsed.ok) {
    add('命令语法正确', false, (parsed.errors[0] && parsed.errors[0].message) || '命令解析失败');
    return { pass: false, checks, parsed };
  }
  add('命令语法正确', true);

  if (spec.verb) add(`使用动词 ${spec.verb}`, parsed.verb === spec.verb, `实际为 ${parsed.verb}`);
  if (spec.sub) add(`使用子命令 ${spec.sub}`, parsed.sub === spec.sub, `实际为 ${parsed.sub}`);
  if (spec.resources && spec.resources.length) {
    for (const res of spec.resources)
      add(`操作对象包含 ${res}`, parsed.resources.includes(res), `实际为 ${parsed.resources.join(', ') || '（未识别）'}`);
  }
  if (spec.namespace === 'all')
    add('作用于所有命名空间（-A / --all-namespaces）', !!parsed.flags['all-namespaces'],
      parsed.flags.namespace ? `当前用 -n 指定了 ${parsed.flags.namespace}` : '缺少 -A 旗标');
  else if (spec.namespace)
    add(`作用于命名空间 ${spec.namespace}（-n ${spec.namespace}）`,
      parsed.flags.namespace === spec.namespace,
      parsed.flags.namespace ? `实际为 ${parsed.flags.namespace}` : '未指定 -n（默认 default）');
  for (const f of spec.flagsMust || []) {
    const { name, equals, oneOf } = f;
    if (equals !== undefined) add(`旗标 --${name}=${equals}`, parsed.flags[name] === equals, `实际为 ${JSON.stringify(parsed.flags[name])}`);
    else if (oneOf) add(`旗标 --${name} 取值 ${oneOf.join('/')}`, oneOf.includes(parsed.flags[name]), `实际为 ${JSON.stringify(parsed.flags[name])}`);
    else add(`包含旗标 --${name}`, parsed.flags[name] !== undefined && parsed.flags[name] !== false, parsed.flags[name] === undefined ? '缺少该旗标' : '');
  }
  for (const f of spec.flagsMustNot || []) {
    const [name, value] = f.split('=');
    const bad = value !== undefined ? String(parsed.flags[name]) === value : parsed.flags[name] !== undefined && parsed.flags[name] !== false;
    add(`不使用 ${f}`, !bad, bad ? '检测到被禁止的旗标' : '');
  }
  if (spec.minNames) add(`至少指定 ${spec.minNames} 个资源名称`, parsed.resourceNames.length >= spec.minNames,
    parsed.resourceNames.length ? `实际 ${parsed.resourceNames.length} 个` : '未指定名称');
  if (spec.namePattern) add(`资源名匹配 ${spec.namePattern}`, parsed.resourceNames.some((n) => new RegExp(spec.namePattern).test(n)),
    parsed.resourceNames.join(', ') || '未指定名称');
  if (spec.selectorMust) add('使用 -l 标签选择器', !!parsed.flags.selector, '缺少 -l 旗标');

  const pass = checks.every((c) => c.ok);
  return { pass, checks, parsed };
}

/* ---------- 练习场内置任务清单（与模拟集群数据配套） ---------- */
export const TASKS = [
  { id: 't01', level: 1, title: '查看当前命名空间的 Pod', desc: '列出 default 命名空间下的所有 Pod。', hint: 'get + 资源类型', solution: 'kubectl get pods',
    check: { verb: 'get', resources: ['pods'] } },
  { id: 't02', level: 1, title: '查看所有命名空间的 Pod', desc: '一次列出全部命名空间的 Pod。', hint: '短旗标 -A', solution: 'kubectl get pods -A',
    check: { verb: 'get', resources: ['pods'], namespace: 'all' } },
  { id: 't03', level: 1, title: '宽输出查看 Deployment', desc: '在 study 命名空间查看 Deployment，并使用 wide 输出。', hint: '-n 与 -o wide', solution: 'kubectl get deployments -n study -o wide',
    check: { verb: 'get', resources: ['deployments'], namespace: 'study', flagsMust: [{ name: 'output', equals: 'wide' }] } },
  { id: 't04', level: 1, title: '查看节点', desc: '列出集群节点及其版本信息。', hint: 'nodes 资源，集群级无需 -n', solution: 'kubectl get nodes',
    check: { verb: 'get', resources: ['nodes'] } },
  { id: 't05', level: 1, title: '查看 Service 的 YAML', desc: '以 YAML 格式查看 default 命名空间下 nginx-service 的定义。', hint: '-o yaml + 资源名', solution: 'kubectl get service nginx-service -o yaml',
    check: { verb: 'get', resources: ['services'], minNames: 1, flagsMust: [{ name: 'output', equals: 'yaml' }] } },
  { id: 't06', level: 1, title: 'describe 一个 Pod', desc: '查看 nginx-deployment-7d4c8b9f6-abcde 的详细信息。', hint: 'describe 命令', solution: 'kubectl describe pod nginx-deployment-7d4c8b9f6-abcde',
    check: { verb: 'describe', resources: ['pods'], minNames: 1 } },
  { id: 't07', level: 2, title: '按标签筛选 Pod', desc: '使用标签选择器找出 app=nginx 的 Pod。', hint: '-l 选择器', solution: 'kubectl get pods -l app=nginx',
    check: { verb: 'get', resources: ['pods'], selectorMust: true } },
  { id: 't08', level: 2, title: '扩容 Deployment 到 5 副本', desc: '把 nginx-deployment 扩容到 5 个副本。', hint: 'scale + --replicas', solution: 'kubectl scale deployment nginx-deployment --replicas=5',
    check: { verb: 'scale', resources: ['deployments'], minNames: 1, flagsMust: [{ name: 'replicas', equals: '5' }] } },
  { id: 't09', level: 2, title: '滚动重启', desc: '滚动重启 web-ui Deployment。', hint: 'rollout restart', solution: 'kubectl rollout restart deployment web-ui',
    check: { verb: 'rollout', sub: 'restart', resources: ['deployments'], minNames: 1 } },
  { id: 't10', level: 2, title: '查看滚动更新状态', desc: '查看 web-ui 的滚动更新状态。', hint: 'rollout status', solution: 'kubectl rollout status deployment web-ui',
    check: { verb: 'rollout', sub: 'status', resources: ['deployments'], minNames: 1 } },
  { id: 't11', level: 2, title: '查看 Pod 日志', desc: '查看 nginx-deployment-7d4c8b9f6-abcde 的日志，并持续跟随输出。', hint: 'logs + -f', solution: 'kubectl logs nginx-deployment-7d4c8b9f6-abcde -f',
    check: { verb: 'logs', resources: ['pods'], minNames: 1, flagsMust: [{ name: 'follow' }] } },
  { id: 't12', level: 2, title: '进入容器排查', desc: '在 nginx Pod 中打开一个交互式 shell。', hint: 'exec -it ... -- sh', solution: 'kubectl exec -it nginx-deployment-7d4c8b9f6-abcde -- sh',
    check: { verb: 'exec', resources: ['pods'], minNames: 1, flagsMust: [{ name: 'stdin' }, { name: 'tty' }] } },
  { id: 't13', level: 2, title: '应用清单文件', desc: '使用 apply 应用 pod.yaml 清单。', hint: 'apply -f', solution: 'kubectl apply -f pod.yaml',
    check: { verb: 'apply', flagsMust: [{ name: 'filename' }] } },
  { id: 't14', level: 2, title: '创建 Deployment', desc: '创建一个名为 cache、镜像为 redis:7 的 Deployment。', hint: 'create deployment + --image', solution: 'kubectl create deployment cache --image=redis:7',
    check: { verb: 'create', resources: ['deployments'], minNames: 1, flagsMust: [{ name: 'image' }] } },
  { id: 't15', level: 2, title: '给 Pod 打标签', desc: '给 nginx-deployment-7d4c8b9f6-abcde 打上 env=prod 标签。', hint: 'label + key=value', solution: 'kubectl label pod nginx-deployment-7d4c8b9f6-abcde env=prod',
    check: { verb: 'label', resources: ['pods'], minNames: 1 } },
  { id: 't16', level: 3, title: '查看节点资源占用', desc: '查看各节点的 CPU/内存占用（top）。', hint: 'top 命令', solution: 'kubectl top nodes',
    check: { verb: 'top', sub: 'node', resources: ['nodes'] } },
  { id: 't17', level: 3, title: '安全驱逐节点', desc: '驱逐 worker-1 上的 Pod 以便维护，需忽略 DaemonSet Pod。', hint: 'drain + --ignore-daemonsets', solution: 'kubectl drain worker-1 --ignore-daemonsets',
    check: { verb: 'drain', resources: ['nodes'], minNames: 1, flagsMust: [{ name: 'ignore-daemonsets' }] } },
  { id: 't18', level: 3, title: '恢复节点调度', desc: '维护完成后，让 worker-1 重新可调度。', hint: 'uncordon', solution: 'kubectl uncordon worker-1',
    check: { verb: 'uncordon', resources: ['nodes'], minNames: 1 } },
  { id: 't19', level: 3, title: '给节点打污点', desc: '给 worker-2 打上键 key、值 value、effect 为 NoSchedule 的污点。', hint: 'taint + 键=值:effect', solution: 'kubectl taint nodes worker-2 key=value:NoSchedule',
    check: { verb: 'taint', resources: ['nodes'], minNames: 1 } },
  { id: 't20', level: 3, title: '查看 HPA 状态', desc: '查看 default 命名空间的 HorizontalPodAutoscaler。', hint: 'hpa 资源', solution: 'kubectl get hpa',
    check: { verb: 'get', resources: ['horizontalpodautoscalers'] } },
  { id: 't21', level: 3, title: '查看 PVC', desc: '查看 default 命名空间的持久卷声明。', hint: 'pvc 资源', solution: 'kubectl get pvc',
    check: { verb: 'get', resources: ['persistentvolumeclaims'] } },
  { id: 't22', level: 3, title: '查看全部 API 资源', desc: '列出集群支持的所有 API 资源类型。', hint: 'api-resources', solution: 'kubectl api-resources',
    check: { verb: 'api-resources' } },
  { id: 't23', level: 3, title: '带命令的临时 Pod', desc: '运行一个名为 tmp、镜像 busybox 的 Pod，执行完 nslookup 后自动删除。', hint: 'run + --rm + --restart=Never', solution: 'kubectl run tmp --image=busybox --rm -it --restart=Never -- nslookup kubernetes.default',
    check: { verb: 'run', minNames: 1, flagsMust: [{ name: 'image' }] } },
  { id: 't24', level: 3, title: '删除 Pod', desc: '删除名为 web-ui-5c8d7b6f4-pqrst 的 Pod（Deployment 会自动拉起新 Pod）。', hint: 'delete + 资源名；不要用 --force', solution: 'kubectl delete pod web-ui-5c8d7b6f4-pqrst',
    check: { verb: 'delete', resources: ['pods'], minNames: 1, flagsMustNot: ['force', 'grace-period=0'] } },
  { id: 't25', level: 1, title: '查看 StatefulSet', desc: '查看 study 命名空间中的 StatefulSet（有状态应用）。', hint: 'sts 是 statefulsets 的缩写，别忘了 -n study', solution: 'kubectl get statefulsets -n study',
    check: { verb: 'get', resources: ['statefulsets'], namespace: 'study' } },
  { id: 't26', level: 1, title: '查看 DaemonSet', desc: '查看 kube-system 命名空间中的 DaemonSet（每个节点一份的代理类负载）。', hint: 'ds 缩写；kube-system 是系统组件所在命名空间', solution: 'kubectl get daemonsets -n kube-system',
    check: { verb: 'get', resources: ['daemonsets'], namespace: 'kube-system' } },
  { id: 't27', level: 1, title: '查看批处理任务', desc: '查看 default 命名空间中的一次性 Job。', hint: 'job 资源类型', solution: 'kubectl get jobs',
    check: { verb: 'get', resources: ['jobs'] } },
  { id: 't28', level: 1, title: '查看定时任务', desc: '查看 default 命名空间中的 CronJob 及其调度表达式。', hint: 'cronjob 缩写 cj', solution: 'kubectl get cronjobs',
    check: { verb: 'get', resources: ['cronjobs'] } },
  { id: 't29', level: 1, title: '查看 Ingress 规则', desc: '查看 default 命名空间的 Ingress 路由规则。', hint: 'ingress 缩写 ing', solution: 'kubectl get ingresses',
    check: { verb: 'get', resources: ['ingresses'] } },
  { id: 't30', level: 1, title: '查看 ConfigMap', desc: '列出 default 命名空间中的 ConfigMap。', hint: 'configmap 缩写 cm', solution: 'kubectl get configmaps',
    check: { verb: 'get', resources: ['configmaps'] } },
  { id: 't31', level: 1, title: '查看 Secret 清单', desc: '列出 default 命名空间中的 Secret（注意不要明文打印内容）。', hint: 'secrets 资源类型', solution: 'kubectl get secrets',
    check: { verb: 'get', resources: ['secrets'] } },
  { id: 't32', level: 1, title: '查看持久卷 PV', desc: '查看集群中所有 PersistentVolume 及其绑定状态（集群级资源，无需 -n）。', hint: 'pv 缩写', solution: 'kubectl get persistentvolumes',
    check: { verb: 'get', resources: ['persistentvolumes'] } },
  { id: 't33', level: 1, title: '查看存储类', desc: '列出集群的 StorageClass，确认默认存储类。', hint: 'storageclass 缩写 sc', solution: 'kubectl get storageclasses',
    check: { verb: 'get', resources: ['storageclasses'] } },
  { id: 't34', level: 1, title: '查看 ServiceAccount', desc: '列出 default 命名空间的 ServiceAccount。', hint: 'serviceaccount 缩写 sa', solution: 'kubectl get serviceaccounts',
    check: { verb: 'get', resources: ['serviceaccounts'] } },
  { id: 't35', level: 1, title: 'describe 一个 Deployment', desc: '查看 nginx-deployment 的详细状态（副本、策略、事件）。', hint: 'describe + 资源类型 + 名称', solution: 'kubectl describe deployment nginx-deployment',
    check: { verb: 'describe', resources: ['deployments'], minNames: 1, namePattern: '^nginx-deployment$' } },
  { id: 't36', level: 2, title: 'describe 一个节点', desc: '查看 worker-1 节点的容量、条件与系统信息。', hint: '节点是集群级资源', solution: 'kubectl describe node worker-1',
    check: { verb: 'describe', resources: ['nodes'], minNames: 1, namePattern: '^worker-1$' } },
  { id: 't37', level: 2, title: 'describe 一个 Service', desc: '查看 nginx-service 的类型、端口与转发规则。', hint: 'svc 缩写', solution: 'kubectl describe service nginx-service',
    check: { verb: 'describe', resources: ['services'], minNames: 1, namePattern: '^nginx-service$' } },
  { id: 't38', level: 2, title: '确认 Service 后端', desc: 'Service 不通时第一步：查看 nginx-service 的 Endpoints 是否为空。', hint: 'endpoints 缩写 ep', solution: 'kubectl get endpoints nginx-service',
    check: { verb: 'get', resources: ['endpoints'], minNames: 1 } },
  { id: 't39', level: 2, title: '查看更新历史', desc: '查看 nginx-deployment 的滚动更新修订版本列表。', hint: 'rollout history', solution: 'kubectl rollout history deployment nginx-deployment',
    check: { verb: 'rollout', sub: 'history', resources: ['deployments'], minNames: 1 } },
  { id: 't40', level: 2, title: '回滚到上一版本', desc: 'nginx-deployment 新版本有问题，回滚到上一个修订版本。', hint: 'rollout undo；指定版本加 --to-revision=N', solution: 'kubectl rollout undo deployment nginx-deployment',
    check: { verb: 'rollout', sub: 'undo', resources: ['deployments'], minNames: 1 } },
  { id: 't41', level: 2, title: '为 Deployment 创建 Service', desc: '用 expose 给 nginx-deployment 创建一个 80 端口的 ClusterIP Service。', hint: 'expose deployment <名> --port=80', solution: 'kubectl expose deployment nginx-deployment --port=80',
    check: { verb: 'expose', resources: ['deployments'], minNames: 1, flagsMust: [{ name: 'port', equals: '80' }] } },
  { id: 't42', level: 2, title: '创建 NodePort Service', desc: '把 web-ui 以 NodePort 方式暴露，端口 80，便于集群外访问。', hint: 'expose + --type=NodePort --port=80', solution: 'kubectl expose deployment web-ui --type=NodePort --port=80',
    check: { verb: 'expose', resources: ['deployments'], minNames: 1, flagsMust: [{ name: 'type', equals: 'NodePort' }, { name: 'port', equals: '80' }] } },
  { id: 't43', level: 2, title: '本地端口转发调试', desc: '把本地 8080 转发到 web-ui Pod 的 80 端口，在本地浏览器验证。', hint: 'port-forward pod/<名> 本地端口:容器端口', solution: 'kubectl port-forward pod/web-ui-5c8d7b6f4-pqrst 8080:80',
    check: { verb: 'port-forward', resources: ['pods'], minNames: 1 } },
  { id: 't44', level: 2, title: '给 Pod 加注解', desc: '给 web-ui-5c8d7b6f4-pqrst 加上注解 owner=devops，记录负责人。', hint: 'annotate + key=value', solution: 'kubectl annotate pod web-ui-5c8d7b6f4-pqrst owner=devops',
    check: { verb: 'annotate', resources: ['pods'], minNames: 1 } },
  { id: 't45', level: 2, title: '覆盖修改标签', desc: '把 nginx-deployment-7d4c8b9f6-abcde 的 version 标签改为 v2（需要覆盖已有键）。', hint: 'label + --overwrite', solution: 'kubectl label pod nginx-deployment-7d4c8b9f6-abcde version=v2 --overwrite',
    check: { verb: 'label', resources: ['pods'], minNames: 1, flagsMust: [{ name: 'overwrite' }] } },
  { id: 't46', level: 2, title: '查看 Pod 资源占用', desc: '用 metrics-server 的数据查看各 Pod 的 CPU/内存占用。', hint: 'top 命令，注意子命令是 pod', solution: 'kubectl top pod',
    check: { verb: 'top', sub: 'pod', resources: ['pods'] } },
  { id: 't47', level: 2, title: '查看容器环境变量', desc: '在 nginx-deployment-7d4c8b9f6-abcde 容器内执行 env，确认注入的配置。', hint: 'exec <pod> -- env（-- 后接命令）', solution: 'kubectl exec nginx-deployment-7d4c8b9f6-abcde -- env',
    check: { verb: 'exec', resources: ['pods'], minNames: 1, namePattern: '^nginx-deployment' } },
  { id: 't48', level: 3, title: '暂停滚动更新', desc: '发布过程中发现异常，先暂停 web-ui 的滚动更新，保住可用副本。', hint: 'rollout pause', solution: 'kubectl rollout pause deployment web-ui',
    check: { verb: 'rollout', sub: 'pause', resources: ['deployments'], minNames: 1 } },
  { id: 't49', level: 3, title: '一次性排查 Pod', desc: '创建名为 tmp-check、镜像 busybox:1.36 的一次性 Pod（不自动重启），用于排查。', hint: 'run + --restart=Never', solution: 'kubectl run tmp-check --image=busybox:1.36 --restart=Never',
    check: { verb: 'run', minNames: 1, namePattern: '^tmp-check$', flagsMust: [{ name: 'image' }, { name: 'restart', oneOf: ['Never'] }] } },
  { id: 't50', level: 3, title: '从容器拷贝文件', desc: '把 web-ui-5c8d7b6f4-pqrst 中的 /log/app.log 拷贝到本地当前目录。', hint: 'kubectl cp <pod:/路径> <本地路径>', solution: 'kubectl cp web-ui-5c8d7b6f4-pqrst:/log/app.log ./app.log',
    check: { verb: 'cp' } },
  { id: 't51', level: 3, title: '切换集群上下文', desc: 'CKA 考试每道题一个集群：把当前上下文切换到 study-cluster。', hint: 'kubectl config use-context <名>', solution: 'kubectl config use-context study-cluster',
    check: { verb: 'config', sub: 'use-context', minNames: 1, namePattern: '^study-cluster$' } },
  { id: 't52', level: 3, title: '查看 API 版本', desc: '列出集群支持的所有 API 版本，确认资源该用哪个 apiVersion。', hint: '与 api-resources 区分', solution: 'kubectl api-versions',
    check: { verb: 'api-versions' } },
  { id: 't53', level: 3, title: '模拟鉴权检查', desc: '确认当前用户能否在集群中创建 Pod（RBAC 验证）。', hint: 'kubectl auth can-i <动词> <资源>', solution: 'kubectl auth can-i create pods',
    check: { verb: 'auth', sub: 'can-i' } },
];
