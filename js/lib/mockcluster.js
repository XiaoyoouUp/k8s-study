/* 模拟集群：固定数据集 + 只读查询表格/详情/日志 + 变更命令的模拟输出
 * 目标是让练习场"看起来像真的"，不代表真实集群状态。 */

const NS_DEFAULT = 'default';
const NS_SYSTEM = 'kube-system';
const NS_STUDY = 'study';

/* kind -> 行数据；labels 用于 -l 选择器过滤 */
const DATA = [
  /* pods */
  { kind: 'pods', ns: NS_DEFAULT, name: 'nginx-deployment-7d4c8b9f6-abcde', labels: { app: 'nginx', 'pod-template-hash': '7d4c8b9f6' }, ready: '1/1', status: 'Running', restarts: 0, age: '3d', ip: '10.244.1.12', node: 'worker-1', image: 'nginx:1.27' },
  { kind: 'pods', ns: NS_DEFAULT, name: 'nginx-deployment-7d4c8b9f6-fghij', labels: { app: 'nginx', 'pod-template-hash': '7d4c8b9f6' }, ready: '1/1', status: 'Running', restarts: 0, age: '3d', ip: '10.244.2.7', node: 'worker-2', image: 'nginx:1.27' },
  { kind: 'pods', ns: NS_DEFAULT, name: 'nginx-deployment-7d4c8b9f6-klmno', labels: { app: 'nginx', 'pod-template-hash': '7d4c8b9f6' }, ready: '1/1', status: 'Running', restarts: 1, age: '3d', ip: '10.244.1.18', node: 'worker-1', image: 'nginx:1.27' },
  { kind: 'pods', ns: NS_DEFAULT, name: 'web-ui-5c8d7b6f4-pqrst', labels: { app: 'web-ui', tier: 'frontend' }, ready: '1/1', status: 'Running', restarts: 2, age: '5d', ip: '10.244.2.11', node: 'worker-2', image: 'registry.local/web-ui:v2.1' },
  { kind: 'pods', ns: NS_DEFAULT, name: 'web-ui-5c8d7b6f4-uvwxy', labels: { app: 'web-ui', tier: 'frontend' }, ready: '1/1', status: 'Running', restarts: 0, age: '5d', ip: '10.244.1.25', node: 'worker-1', image: 'registry.local/web-ui:v2.1' },
  { kind: 'pods', ns: NS_STUDY, name: 'study-app-6d9f8b7c5-aaaaaa', labels: { app: 'study-app' }, ready: '1/1', status: 'Running', restarts: 0, age: '26h', ip: '10.244.2.31', node: 'worker-1', image: 'busybox:1.36' },
  { kind: 'pods', ns: NS_STUDY, name: 'study-db-0', labels: { app: 'study-db' }, ready: '1/1', status: 'Running', restarts: 0, age: '26h', ip: '10.244.2.32', node: 'worker-2', image: 'mysql:8.0' },
  { kind: 'pods', ns: NS_SYSTEM, name: 'coredns-7c65d6c888-bx2mv', labels: { 'k8s-app': 'kube-dns' }, ready: '1/1', status: 'Running', restarts: 0, age: '30d', ip: '10.244.0.5', node: 'control-plane', image: 'registry.k8s.io/coredns/coredns:v1.11.3' },
  { kind: 'pods', ns: NS_SYSTEM, name: 'kube-apiserver-control-plane', labels: { component: 'kube-apiserver', tier: 'control-plane' }, ready: '1/1', status: 'Running', restarts: 0, age: '30d', ip: '192.168.56.10', node: 'control-plane', image: 'registry.k8s.io/kube-apiserver:v1.32.2' },
  { kind: 'pods', ns: NS_SYSTEM, name: 'kube-controller-manager-control-plane', labels: { component: 'kube-controller-manager', tier: 'control-plane' }, ready: '1/1', status: 'Running', restarts: 1, age: '30d', ip: '192.168.56.10', node: 'control-plane', image: 'registry.k8s.io/kube-controller-manager:v1.32.2' },
  { kind: 'pods', ns: NS_SYSTEM, name: 'kube-scheduler-control-plane', labels: { component: 'kube-scheduler', tier: 'control-plane' }, ready: '1/1', status: 'Running', restarts: 1, age: '30d', ip: '192.168.56.10', node: 'control-plane', image: 'registry.k8s.io/kube-scheduler:v1.32.2' },
  { kind: 'pods', ns: NS_SYSTEM, name: 'etcd-control-plane', labels: { component: 'etcd', tier: 'control-plane' }, ready: '1/1', status: 'Running', restarts: 0, age: '30d', ip: '192.168.56.10', node: 'control-plane', image: 'registry.k8s.io/etcd:3.5.16-0' },
  { kind: 'pods', ns: NS_SYSTEM, name: 'kube-proxy-9xk2f', labels: { 'k8s-app': 'kube-proxy' }, ready: '1/1', status: 'Running', restarts: 0, age: '30d', ip: '192.168.56.11', node: 'worker-1', image: 'registry.k8s.io/kube-proxy:v1.32.2' },
  { kind: 'pods', ns: NS_SYSTEM, name: 'calico-node-2wq8r', labels: { 'k8s-app': 'calico-node' }, ready: '1/1', status: 'Running', restarts: 0, age: '30d', ip: '192.168.56.11', node: 'worker-1', image: 'calico/node:v3.28.2' },

  /* deployments */
  { kind: 'deployments', ns: NS_DEFAULT, name: 'nginx-deployment', labels: { app: 'nginx' }, ready: '3/3', upd: 3, avail: 3, age: '3d', image: 'nginx:1.27' },
  { kind: 'deployments', ns: NS_DEFAULT, name: 'web-ui', labels: { app: 'web-ui' }, ready: '2/2', upd: 2, avail: 2, age: '5d', image: 'registry.local/web-ui:v2.1' },
  { kind: 'deployments', ns: NS_STUDY, name: 'study-app', labels: { app: 'study-app' }, ready: '1/1', upd: 1, avail: 1, age: '26h', image: 'busybox:1.36' },

  /* services */
  { kind: 'services', ns: NS_DEFAULT, name: 'kubernetes', labels: { component: 'apiserver' }, type: 'ClusterIP', clusterIP: '10.96.0.1', ports: '443/TCP', age: '30d' },
  { kind: 'services', ns: NS_DEFAULT, name: 'nginx-service', labels: { app: 'nginx' }, type: 'ClusterIP', clusterIP: '10.96.45.12', ports: '80/TCP', age: '2d' },
  { kind: 'services', ns: NS_DEFAULT, name: 'web-ui-nodeport', labels: { app: 'web-ui' }, type: 'NodePort', clusterIP: '10.96.78.23', ports: '80:30080/TCP', age: '5d' },
  { kind: 'services', ns: NS_SYSTEM, name: 'kube-dns', labels: { 'k8s-app': 'kube-dns' }, type: 'ClusterIP', clusterIP: '10.96.0.10', ports: '53/UDP,53/TCP,9153/TCP', age: '30d' },
  { kind: 'services', ns: NS_STUDY, name: 'study-db', labels: { app: 'study-db' }, type: 'ClusterIP', clusterIP: 'None', ports: '3306/TCP', age: '26h' },

  /* nodes */
  { kind: 'nodes', ns: '', name: 'control-plane', labels: { 'node-role.kubernetes.io/control-plane': '' }, status: 'Ready', roles: 'control-plane', age: '30d', version: 'v1.32.2', internalIP: '192.168.56.10' },
  { kind: 'nodes', ns: '', name: 'worker-1', labels: {}, status: 'Ready', roles: '<none>', age: '30d', version: 'v1.32.2', internalIP: '192.168.56.11' },
  { kind: 'nodes', ns: '', name: 'worker-2', labels: {}, status: 'Ready', roles: '<none>', age: '30d', version: 'v1.32.2', internalIP: '192.168.56.12' },

  /* namespaces */
  { kind: 'namespaces', ns: '', name: 'default', labels: { 'kubernetes.io/metadata.name': 'default' }, status: 'Active', age: '30d' },
  { kind: 'namespaces', ns: '', name: NS_STUDY, labels: { 'kubernetes.io/metadata.name': NS_STUDY, team: 'devops' }, status: 'Active', age: '26h' },
  { kind: 'namespaces', ns: '', name: NS_SYSTEM, labels: { 'kubernetes.io/metadata.name': NS_SYSTEM }, status: 'Active', age: '30d' },
  { kind: 'namespaces', ns: '', name: 'kube-node-lease', status: 'Active', age: '30d' },
  { kind: 'namespaces', ns: '', name: 'kube-public', status: 'Active', age: '30d' },

  /* 其他常见资源 */
  { kind: 'replicasets', ns: NS_DEFAULT, name: 'nginx-deployment-7d4c8b9f6', desired: 3, current: 3, ready: 3, age: '3d' },
  { kind: 'replicasets', ns: NS_DEFAULT, name: 'web-ui-5c8d7b6f4', desired: 2, current: 2, ready: 2, age: '5d' },
  { kind: 'statefulsets', ns: NS_STUDY, name: 'study-db', ready: '1/1', age: '26h' },
  { kind: 'daemonsets', ns: NS_SYSTEM, name: 'kube-proxy', desired: 3, current: 3, ready: 3, age: '30d' },
  { kind: 'daemonsets', ns: NS_SYSTEM, name: 'calico-node', desired: 3, current: 3, ready: 3, age: '30d' },
  { kind: 'jobs', ns: NS_DEFAULT, name: 'batch-migrate', status: 'Complete', completions: '1/1', duration: '2m', age: '18h' },
  { kind: 'cronjobs', ns: NS_DEFAULT, name: 'nightly-report', schedule: '0 2 * * *', suspend: 'False', active: 0, lastSchedule: '10h', age: '12d' },
  { kind: 'configmaps', ns: NS_DEFAULT, name: 'app-config', data: 4, age: '7d' },
  { kind: 'configmaps', ns: NS_SYSTEM, name: 'coredns', data: 1, age: '30d' },
  { kind: 'secrets', ns: NS_DEFAULT, name: 'db-credentials', data: 3, age: '7d' },
  { kind: 'secrets', ns: NS_SYSTEM, name: 'bootstrap-token-abcdef12', data: 5, age: '30d' },
  { kind: 'ingresses', ns: NS_DEFAULT, name: 'web-ingress', className: 'nginx', hosts: 'web.example.com', address: '192.168.56.11', ports: '80', age: '4d' },
  { kind: 'persistentvolumes', ns: '', name: 'pv-001', capacity: '10Gi', accessModes: 'RWO', reclaimPolicy: 'Retain', status: 'Bound', claim: 'default/nginx-pvc', storageClass: 'standard', age: '14d' },
  { kind: 'persistentvolumes', ns: '', name: 'pv-002', capacity: '20Gi', accessModes: 'RWX', reclaimPolicy: 'Delete', status: 'Available', claim: '', storageClass: 'fast-ssd', age: '14d' },
  { kind: 'persistentvolumeclaims', ns: NS_DEFAULT, name: 'nginx-pvc', status: 'Bound', volume: 'pv-001', capacity: '10Gi', accessModes: 'RWO', storageClass: 'standard', age: '13d' },
  { kind: 'storageclasses', ns: '', name: 'standard (default)', provisioner: 'rancher.io/local-path', reclaimPolicy: 'Delete', bindingMode: 'Immediate', allowVolumeExpansion: true, age: '30d' },
  { kind: 'storageclasses', ns: '', name: 'fast-ssd', provisioner: 'kubernetes.io/aws-ebs', reclaimPolicy: 'Delete', bindingMode: 'WaitForFirstConsumer', allowVolumeExpansion: true, age: '30d' },
  { kind: 'serviceaccounts', ns: NS_DEFAULT, name: 'default', secrets: 0, age: '30d' },
  { kind: 'serviceaccounts', ns: NS_STUDY, name: 'study-sa', secrets: 0, age: '26h' },
  { kind: 'networkpolicies', ns: NS_STUDY, name: 'allow-web', podSelector: 'app=study-app', age: '20h' },
  { kind: 'horizontalpodautoscalers', ns: NS_DEFAULT, name: 'web-ui', reference: 'Deployment/web-ui', targets: 'cpu: 62%/60%', minPods: 2, maxPods: 10, replicas: 2, age: '6d' },
  { kind: 'endpoints', ns: NS_DEFAULT, name: 'nginx-service', endpoints: '10.244.1.12:80,10.244.1.18:80', age: '2d' },
];

const KIND_GROUP = {
  pods: 'pod', deployments: 'deployment.apps', services: 'service', namespaces: 'namespace',
  nodes: 'node', replicasets: 'replicaset.apps', statefulsets: 'statefulset.apps', daemonsets: 'daemonset.apps',
  jobs: 'job.batch', cronjobs: 'cronjob.batch', configmaps: 'configmap', secrets: 'secret',
  ingresses: 'ingress.networking.k8s.io', persistentvolumes: 'persistentvolume', persistentvolumeclaims: 'persistentvolumeclaim',
  storageclasses: 'storageclass', serviceaccounts: 'serviceaccount', networkpolicies: 'networkpolicy',
  horizontalpodautoscalers: 'horizontalpodautoscaler.autoscaling', endpoints: 'endpoints',
};
const KIND_SINGULAR = {
  pods: 'pod', deployments: 'deployment', services: 'service', nodes: 'node',
  configmaps: 'configmap', secrets: 'secret', persistentvolumeclaims: 'persistentvolumeclaim', persistentvolumes: 'persistentvolume',
};
const singularOf = (k) => (KIND_SINGULAR[k] || k.replace(/ies$/, 'y').replace(/s$/, ''));

const COLUMNS = {
  pods: (all) => ['NAMESPACE', 'NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE'],
  deployments: () => ['NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE', 'AGE'],
  services: () => ['NAME', 'TYPE', 'CLUSTER-IP', 'PORT(S)', 'AGE'],
  nodes: () => ['NAME', 'STATUS', 'ROLES', 'AGE', 'VERSION'],
  namespaces: () => ['NAME', 'STATUS', 'AGE'],
  replicasets: () => ['NAME', 'DESIRED', 'CURRENT', 'READY', 'AGE'],
  statefulsets: () => ['NAME', 'READY', 'AGE'],
  daemonsets: () => ['NAME', 'DESIRED', 'CURRENT', 'READY', 'AGE'],
  jobs: () => ['NAME', 'STATUS', 'COMPLETIONS', 'DURATION', 'AGE'],
  cronjobs: () => ['NAME', 'SCHEDULE', 'SUSPEND', 'ACTIVE', 'LAST SCHEDULE', 'AGE'],
  configmaps: () => ['NAME', 'DATA', 'AGE'],
  secrets: () => ['NAME', 'DATA', 'AGE'],
  ingresses: () => ['NAME', 'CLASS', 'HOSTS', 'ADDRESS', 'PORTS', 'AGE'],
  persistentvolumes: () => ['NAME', 'CAPACITY', 'ACCESS MODES', 'RECLAIM POLICY', 'STATUS', 'CLAIM', 'STORAGECLASS', 'AGE'],
  persistentvolumeclaims: () => ['NAME', 'STATUS', 'VOLUME', 'CAPACITY', 'ACCESS MODES', 'STORAGECLASS', 'AGE'],
  storageclasses: () => ['NAME', 'PROVISIONER', 'RECLAIMPOLICY', 'VOLUMEBINDINGMODE', 'ALLOWVOLUMEEXPANSION', 'AGE'],
  serviceaccounts: () => ['NAME', 'SECRETS', 'AGE'],
  networkpolicies: () => ['NAME', 'POD-SELECTOR', 'AGE'],
  horizontalpodautoscalers: () => ['NAME', 'REFERENCE', 'TARGETS', 'MINPODS', 'MAXPODS', 'REPLICAS', 'AGE'],
  endpoints: () => ['NAME', 'ENDPOINTS', 'AGE'],
};

function rowCells(row, kind, opts) {
  const cells = [];
  if (kind === 'pods' && opts.allNamespaces) cells.push(row.ns);
  switch (kind) {
    case 'pods': cells.push(row.name, row.ready, row.status, String(row.restarts), row.age); break;
    case 'deployments': cells.push(row.name, row.ready, String(row.upd), String(row.avail), row.age); break;
    case 'services': cells.push(row.name, row.type, row.clusterIP, row.ports, row.age); break;
    case 'nodes': cells.push(row.name, row.status, row.roles, row.age, row.version); break;
    case 'namespaces': cells.push(row.name, row.status, row.age); break;
    case 'replicasets': cells.push(row.name, String(row.desired), String(row.current), String(row.ready), row.age); break;
    case 'statefulsets': cells.push(row.name, row.ready, row.age); break;
    case 'daemonsets': cells.push(row.name, String(row.desired), String(row.current), String(row.ready), row.age); break;
    case 'jobs': cells.push(row.name, row.status, row.completions, row.duration, row.age); break;
    case 'cronjobs': cells.push(row.name, row.schedule, row.suspend, String(row.active), row.lastSchedule, row.age); break;
    case 'configmaps': case 'secrets': cells.push(row.name, String(row.data), row.age); break;
    case 'ingresses': cells.push(row.name, row.className, row.hosts, row.address, row.ports, row.age); break;
    case 'persistentvolumes': cells.push(row.name, row.capacity, row.accessModes, row.reclaimPolicy, row.status, row.claim || '<none>', row.storageClass || '<none>', row.age); break;
    case 'persistentvolumeclaims': cells.push(row.name, row.status, row.volume, row.capacity, row.accessModes, row.storageClass, row.age); break;
    case 'storageclasses': cells.push(row.name, row.provisioner, row.reclaimPolicy, row.bindingMode, String(row.allowVolumeExpansion), row.age); break;
    case 'serviceaccounts': cells.push(row.name, String(row.secrets), row.age); break;
    case 'networkpolicies': cells.push(row.name, row.podSelector, row.age); break;
    case 'horizontalpodautoscalers': cells.push(row.name, row.reference, row.targets, String(row.minPods), String(row.maxPods), String(row.replicas), row.age); break;
    case 'endpoints': cells.push(row.name, row.endpoints, row.age); break;
    default: cells.push(row.name, row.age);
  }
  return cells;
}

function matchSelector(labels, selector) {
  if (!selector) return true;
  return selector.split(',').every((part) => {
    const eq = part.indexOf('==');
    const neq = part.indexOf('!=');
    const eq2 = part.indexOf('=');
    if (neq > -1) return (labels[part.slice(0, neq)] || '') !== part.slice(neq + 2);
    if (eq > -1) return labels[part.slice(0, eq)] === part.slice(eq + 2);
    if (eq2 > -1) return labels[part.slice(0, eq2)] === part.slice(eq2 + 1);
    return labels[part] !== undefined; /* 存在性选择器 */
  });
}

function filterRows(kind, opts) {
  let rows = DATA.filter((d) => d.kind === kind);
  if (kind !== 'nodes' && kind !== 'namespaces' && kind !== 'persistentvolumes' && kind !== 'storageclasses') {
    if (opts.allNamespaces) {
      /* 全部命名空间 */
    } else {
      const ns = opts.namespace || NS_DEFAULT;
      rows = rows.filter((d) => (d.ns || '') === ns);
    }
  }
  if (opts.selector) rows = rows.filter((d) => matchSelector(d.labels || {}, opts.selector));
  if (opts.names && opts.names.length) rows = rows.filter((d) => opts.names.includes(d.name));
  return rows;
}

function renderTable(headers, rowsCells) {
  const all = [headers, ...rowsCells];
  const width = headers.map((_, ci) => Math.max(...all.map((r) => (r[ci] || '').length)));
  const line = (r) => r.map((c, i) => String(c).padEnd(width[i])).join('   ').trimEnd();
  return [line(headers), ...rowsCells.map(line)].join('\n');
}

export function getTable(kind, opts = {}) {
  const rows = filterRows(kind, opts);
  if (opts.output === 'name') return rows.map((r) => `${singularOf(kind)}/${r.name}`).join('\n');
  if (opts.output === 'yaml' || opts.output === 'json') {
    if (rows.length === 1) return toYaml(rows[0], kind);
    return rows.length ? toYaml(rows[0], kind) + '\n#（模拟：仅展示第一个对象的清单）' : '';
  }
  const header = [...(kind === 'pods' && opts.allNamespaces ? ['NAMESPACE'] : []), ...(COLUMNS[kind] ? COLUMNS[kind](opts.allNamespaces) : ['NAME', 'AGE'])];
  const cells = rows.map((r) => rowCells(r, kind, opts));
  if (!cells.length) return `No resources found in ${opts.allNamespaces ? 'any namespace' : (opts.namespace || NS_DEFAULT) + ' namespace'}.`;
  return renderTable(header, cells);
}

function toYaml(row, kind) {
  const lines = [
    `apiVersion: v1`,
    `kind: ${kind.replace(/(^|s)(.)/, (m, a, b) => b.toUpperCase())}`,
    `metadata:`,
    `  name: ${row.name}`,
  ];
  if (row.ns) lines.push(`  namespace: ${row.ns}`);
  if (row.labels && Object.keys(row.labels).length) {
    lines.push(`  labels:`);
    for (const [k, v] of Object.entries(row.labels)) lines.push(`    ${k}: ${v}`);
  }
  lines.push(`#（模拟 YAML：仅包含关键元数据，真实输出更完整）`);
  return lines.join('\n');
}

export function describeResource(kind, name, ns = NS_DEFAULT) {
  const rows = DATA.filter((d) => d.kind === kind && d.name === name && (kind === 'nodes' || kind === 'namespaces' || kind === 'persistentvolumes' || kind === 'storageclasses' || d.ns === ns));
  if (!rows.length)
    return `Error from server (NotFound): ${singularOf(kind)} "${name}" not found`;
  const row = rows[0];
  const L = [];
  if (kind === 'pods') {
    L.push(`Name:             ${row.name}`, `Namespace:        ${row.ns}`, `Node:             ${row.node}/192.168.56.x`,
      `Labels:           ${Object.entries(row.labels || {}).map(([k, v]) => `${k}=${v}`).join(',')}`,
      `Status:           ${row.status}`, `IP:               ${row.ip}`,
      `Containers:`, `  app:`, `    Image:         ${row.image}`, `    State:         ${row.status === 'Running' ? 'Running' : 'Waiting'}`,
      `    Ready:         ${row.ready === '1/1' ? 'True' : 'False'}`, `    Restart Count: ${row.restarts}`);
  } else if (kind === 'deployments') {
    L.push(`Name:                   ${row.name}`, `Namespace:              ${row.ns}`, `Selector:               app=${row.labels ? row.labels.app || 'app' : row.name}`,
      `Replicas:               ${row.ready} | ${row.upd} up-to-date | ${row.avail} available`,
      `StrategyType:           RollingUpdate`, `  RollingUpdateStrategy:  25% max unavailable, 25% max surge`,
      `Pod Template:`, `  Image:  ${row.image}`);
  } else if (kind === 'services') {
    L.push(`Name:              ${row.name}`, `Namespace:         ${row.ns}`, `Type:              ${row.type}`, `IP:                ${row.clusterIP}`,
      `Port:              ${row.ports}`, `Session Affinity:  None`);
  } else if (kind === 'nodes') {
    L.push(`Name:               ${row.name}`, `Roles:              ${row.roles}`, `Labels:             ${Object.keys(row.labels).join(',') || '<none>'}`,
      `Internal-IP:        ${row.internalIP}`, `Status:             Ready`, `Kubelet version:    ${row.version}`,
      `Conditions:`, `  Type             Status`, `  Ready            True`, `  MemoryPressure   False`, `  DiskPressure     False`);
  } else {
    L.push(`Name:       ${row.name}`, row.ns ? `Namespace:  ${row.ns}` : null, `Age:        ${row.age}`).filter(Boolean);
  }
  L.push(`#（模拟 describe：仅展示关键字段，真实输出更详细）`);
  return L.join('\n');
}

export function getLogs(target, opts = {}, ns = NS_DEFAULT) {
  const known = DATA.find((d) => d.kind === 'pods' && d.name === target && d.ns === ns)
    || DATA.find((d) => d.kind === 'pods' && d.name === target);
  if (!known) return `Error from server (NotFound): pods "${target}" not found`;
  const base = [
    `${known.name} 10.0.0.1 - - [29/Sep/2026:09:15:01] "GET / HTTP/1.1" 200 612 "-" "curl/8.5.0"`,
    `${known.name} 10.0.0.1 - - [29/Sep/2026:09:15:04] "GET /healthz HTTP/1.1" 200 2 "-" "kube-probe/1.32"`,
    `${known.name} 10.0.0.2 - - [29/Sep/2026:09:16:12] "GET /index.html HTTP/1.1" 200 1024 "-" "Mozilla/5.0"`,
    `${known.name} 10.0.0.3 - - [29/Sep/2026:09:17:40] "GET /favicon.ico HTTP/1.1" 404 153 "-" "Mozilla/5.0"`,
    `${known.name} 10.0.0.1 - - [29/Sep/2026:09:18:02] "GET /healthz HTTP/1.1" 200 2 "-" "kube-probe/1.32"`,
    `${known.name} 10.0.0.4 - - [29/Sep/2026:09:19:33] "POST /api/orders HTTP/1.1" 201 87 "-" "sdk-client/2.3"`,
    `${known.name} 10.0.0.1 - - [29/Sep/2026:09:20:00] "GET /healthz HTTP/1.1" 200 2 "-" "kube-probe/1.32"`,
    `${known.name} 10.0.0.5 - - [29/Sep/2026:09:21:18] "GET /static/app.js HTTP/1.1" 200 20480 "-" "Mozilla/5.0"`,
    `${known.name} 10.0.0.1 - - [29/Sep/2026:09:22:01] "GET /healthz HTTP/1.1" 200 2 "-" "kube-probe/1.32"`,
    `${known.name} 10.0.0.6 - - [29/Sep/2026:09:23:45] "GET /metrics HTTP/1.1" 200 8891 "-" "prometheus/2.53"`,
    `${known.name} 10.0.0.1 - - [29/Sep/2026:09:25:00] "GET /healthz HTTP/1.1" 200 2 "-" "kube-probe/1.32"`,
  ];
  const tail = opts.tail !== undefined ? parseInt(opts.tail, 10) || 0 : null;
  return (tail !== null ? base.slice(-tail) : base).join('\n');
}

/* 变更类命令的模拟输出 */
function groupOf(kind) { return KIND_GROUP[kind] || kind; }
function mutateLine(verb, parsed) {
  const kind = (parsed.resources && parsed.resources[0]) || 'resources';
  const name = (parsed.resourceNames && parsed.resourceNames[0]) || 'unknown';
  const g = groupOf(kind);
  const ref = `${g}/${name}`;
  switch (verb) {
    case 'create': return { text: `${ref} created`, tone: 'ok' };
    case 'run': return { text: `pod/${name} created`, tone: 'ok' };
    case 'delete': return parsed.resourceNames.map((n) => `${g}/${n} deleted`).join('\n') || `resources deleted`;
    case 'apply': return { text: parsed.flags.filename ? `${parsed.flags.filename}: ${ref} configured（清单中的对象已应用）` : `${ref} configured`, tone: 'ok' };
    case 'replace': return { text: `${ref} replaced`, tone: 'ok' };
    case 'scale': return { text: `${ref} scaled`, tone: 'ok' };
    case 'autoscale': return { text: `${ref} autoscaled`, tone: 'ok' };
    case 'expose': return { text: `service/${parsed.flags.name || name + '-service'} exposed`, tone: 'ok' };
    case 'label': return { text: `${ref} labeled`, tone: 'ok' };
    case 'annotate': return { text: `${ref} annotated`, tone: 'ok' };
    case 'patch': return { text: `${ref} patched`, tone: 'ok' };
    case 'set': return { text: `${ref} updated`, tone: 'ok' };
    case 'taint': return { text: `node/${name} tainted`, tone: 'ok' };
    case 'cordon': return { text: `node/${name} cordoned`, tone: 'ok' };
    case 'uncordon': return { text: `node/${name} uncordoned`, tone: 'ok' };
    case 'drain': return { text: `node/${name} drained（模拟：真实环境中会逐个驱逐 Pod）`, tone: 'ok' };
    case 'edit': return { text: `${ref} edited（模拟）`, tone: 'ok' };
    case 'wait': return { text: `${ref} condition met`, tone: 'ok' };
    default: return { text: `（模拟）命令已接受：${parsed.raw}`, tone: 'out' };
  }
}

const ROLLOUT_LINES = {
  status: (name) => `Waiting for deployment "${name}" rollout to finish: 2 of 3 updated replicas are available...\ndeployment "${name}" successfully rolled out`,
  restart: (name) => `deployment.apps/${name} restarted`,
  history: (name) => `deployment.apps/${name}\nREVISION  CHANGE-CAUSE\n1         <none>\n2         Update image to nginx:1.27`,
  undo: (name) => `deployment.apps/${name} rolled back`,
  pause: (name) => `deployment.apps/${name} paused`,
  resume: (name) => `deployment.apps/${name} resumed`,
};

const EXEC_OUTPUTS = [
  [/^(ls|ll)\b/i, 'bin   boot  dev   etc   home  lib   media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var'],
  [/^env\b/i, 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin\nHOSTNAME=nginx-deployment-7d4c8b9f6-abcde\nNGINX_PORT=80'],
  [/^(hostname|whoami)\b/i, 'nginx-deployment-7d4c8b9f6-abcde'],
  [/^date\b/i, 'Tue Sep 29 09:30:12 UTC 2026'],
  [/^curl\b/i, 'Welcome to nginx!（模拟响应）'],
  [/^(cat|pwd|sh|bash)\b/i, '（模拟环境不执行真实命令，这里仅演示 exec 用法）'],
];

export function simulate(cmdLine, parsed = {}) {
  const verb = parsed.verb || '';
  const flags = parsed.flags || {};
  const opts = {
    namespace: flags.namespace,
    allNamespaces: !!flags['all-namespaces'],
    output: flags.output,
    selector: flags.selector,
    names: parsed.resourceNames || [],
  };
  if (parsed.program && parsed.program !== 'kubectl') return { text: '目前练习场只支持 kubectl 命令。', tone: 'err' };
  if (parsed.ok === false) {
    return { text: (parsed.errors && parsed.errors.map((e) => e.message).join('\n')) || '命令解析失败', tone: 'err' };
  }
  if (flags.help) return { text: `用法提示（模拟）：kubectl ${verb}${parsed.sub ? ' ' + parsed.sub : ''} <参数>\n本练习场覆盖常见命令，语法细节可在课程中查看。`, tone: 'out' };

  switch (verb) {
    case 'get': {
      const kinds = (parsed.resources && parsed.resources.length) ? parsed.resources : ['pods'];
      const texts = kinds.map((k) => getTable(k, opts));
      return { text: texts.join('\n'), tone: 'out' };
    }
    case 'describe': {
      const kind = (parsed.resources && parsed.resources[0]) || 'pods';
      const name = (parsed.resourceNames && parsed.resourceNames[0]);
      if (!name) return { text: 'describe 需要指定资源名称。', tone: 'err' };
      return { text: describeResource(kind, name, flags.namespace || NS_DEFAULT), tone: 'out' };
    }
    case 'logs': {
      const target = (parsed.resourceNames && parsed.resourceNames[0]) || (parsed.resources && parsed.resources[0] === 'deployments' ? 'web-ui-5c8d7b6f4-pqrst' : '');
      if (!target) return { text: '需要指定 Pod 或 deploy/<名称>。', tone: 'err' };
      const kind = parsed.resources && parsed.resources[0];
      const ns = flags.namespace || NS_DEFAULT;
      const podName = kind === 'deployments' ? 'web-ui-5c8d7b6f4-pqrst' : target;
      return { text: getLogs(podName, { tail: flags.tail }, ns), tone: 'out' };
    }
    case 'rollout': {
      const name = (parsed.resourceNames && parsed.resourceNames[0]) || 'unknown';
      const fn = ROLLOUT_LINES[parsed.sub] || (() => '（模拟）rollout 命令已执行');
      return { text: fn(name), tone: 'ok' };
    }
    case 'exec': {
      const cmdText = (parsed.command || []).join(' ') || '';
      const hit = EXEC_OUTPUTS.find(([re]) => re.test(cmdText));
      const out = hit ? hit[1] : `（模拟）在 pod 中执行：${cmdText}`;
      return { text: `→ kubectl exec ${parsed.resourceNames[0] || ''} -- ${cmdText}\n${out}`, tone: 'out' };
    }
    case 'top': {
      if (parsed.sub === 'node')
        return { text: renderTable(['NAME', 'CPU(cores)', 'CPU%', 'MEMORY(bytes)', 'MEMORY%'], [
          ['control-plane', '182m', '4%', '1189Mi', '15%'], ['worker-1', '246m', '6%', '1621Mi', '21%'], ['worker-2', '201m', '5%', '1502Mi', '19%'],
        ]), tone: 'out' };
      return { text: renderTable(['POD', 'NAME', 'CPU(cores)', 'MEMORY(bytes)'], [
        ['nginx-deployment-7d4c8b9f6-abcde', 'nginx', '2m', '18Mi'],
        ['web-ui-5c8d7b6f4-pqrst', 'web', '12m', '96Mi'],
        ['study-app-6d9f8b7c5-aaaaaa', 'app', '1m', '6Mi'],
      ]), tone: 'out' };
    }
    case 'version':
      return { text: 'Client Version: v1.32.2\nKustomize Version: v5.5.0-1.32.2\nServer Version: v1.32.2', tone: 'out' };
    case 'cluster-info':
      return { text: 'Kubernetes control plane is running at https://192.168.56.10:6443\nCoreDNS is running at https://192.168.56.10:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy\n（模拟集群信息）', tone: 'out' };
    case 'api-resources':
      return { text: renderTable(['NAME', 'SHORTNAMES', 'APIVERSION', 'NAMESPACED', 'KIND'], [
        ['pods', 'po', 'v1', 'true', 'Pod'], ['services', 'svc', 'v1', 'true', 'Service'],
        ['deployments', 'deploy', 'apps/v1', 'true', 'Deployment'], ['replicasets', 'rs', 'apps/v1', 'true', 'ReplicaSet'],
        ['statefulsets', 'sts', 'apps/v1', 'true', 'StatefulSet'], ['daemonsets', 'ds', 'apps/v1', 'true', 'DaemonSet'],
        ['jobs', '', 'batch/v1', 'true', 'Job'], ['cronjobs', 'cj', 'batch/v1', 'true', 'CronJob'],
        ['configmaps', 'cm', 'v1', 'true', 'ConfigMap'], ['secrets', '', 'v1', 'true', 'Secret'],
        ['nodes', 'no', 'v1', 'false', 'Node'], ['namespaces', 'ns', 'v1', 'false', 'Namespace'],
      ]), tone: 'out' };
    case 'config':
      return { text: renderTable(['CURRENT', 'NAME', 'CLUSTER', 'AUTHINFO', 'NAMESPACE'], [
        ['*', 'kubernetes-admin@kubernetes', 'kubernetes', 'kubernetes-admin', ''],
        ['', 'study-cluster', 'study-cluster', 'study-admin', 'study'],
      ]), tone: 'out' };
    case 'explain':
      return { text: `KIND:     Pod\nVERSION:  v1\n\n字段说明（模拟）……使用 kubectl explain <资源>.<字段> --recursive 可逐级查看。`, tone: 'out' };
    default:
      return mutateLine(verb, parsed);
  }
}
