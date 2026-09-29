/* kubectl 命令解析与正确性校验（纯函数模块，浏览器与 Node 通用）
 * 覆盖常见动词/资源别名/旗标，用于学习场景的正确性判断；并非 kubectl 全量复刻。 */

/* ---------------- 资源类型 ---------------- */
export const RESOURCES = {
  pods: ['po', 'pod'],
  deployments: ['deploy', 'deployment'],
  services: ['svc', 'service'],
  namespaces: ['ns', 'namespace'],
  nodes: ['no', 'node'],
  replicasets: ['rs', 'replicaset'],
  statefulsets: ['sts', 'statefulset'],
  daemonsets: ['ds', 'daemonset'],
  jobs: ['job'],
  cronjobs: ['cj', 'cronjob'],
  configmaps: ['cm', 'configmap'],
  secrets: ['secret'],
  ingresses: ['ing', 'ingress'],
  persistentvolumes: ['pv', 'persistentvolume'],
  persistentvolumeclaims: ['pvc', 'persistentvolumeclaim'],
  storageclasses: ['sc', 'storageclass'],
  serviceaccounts: ['sa', 'serviceaccount'],
  networkpolicies: ['netpol', 'networkpolicy'],
  horizontalpodautoscalers: ['hpa', 'horizontalpodautoscaler'],
  endpoints: ['ep', 'endpoint'],
  events: ['ev', 'event'],
  roles: ['role'],
  rolebindings: ['rolebinding'],
  clusterroles: ['clusterrole'],
  clusterrolebindings: ['clusterrolebinding'],
  all: [],
};
const ALIAS = {};
for (const [canon, alts] of Object.entries(RESOURCES)) {
  ALIAS[canon] = canon;
  for (const a of alts) ALIAS[a] = canon;
}
export function canonicalResource(x) {
  if (typeof x !== 'string') return null;
  return ALIAS[x.toLowerCase()] || null;
}

function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}
export function suggestResource(input) {
  const lower = (input || '').toLowerCase();
  if (!lower) return [];
  const scored = [];
  for (const canon of Object.keys(RESOURCES)) {
    const d = editDistance(lower, canon);
    if (d <= Math.max(2, Math.floor(canon.length / 3)) || canon.startsWith(lower)) scored.push([d, canon]);
  }
  return [...new Set(scored.sort((a, b) => a[0] - b[0]).map(([, c]) => c))].slice(0, 3);
}

/* ---------------- 动词与子命令 ---------------- */
export const VERBS = new Set([
  'get', 'describe', 'create', 'apply', 'delete', 'edit', 'replace', 'expose', 'scale', 'autoscale',
  'rollout', 'logs', 'exec', 'cp', 'port-forward', 'proxy', 'top', 'explain', 'api-resources',
  'api-versions', 'config', 'cluster-info', 'version', 'auth', 'label', 'annotate', 'patch', 'wait',
  'drain', 'cordon', 'uncordon', 'taint', 'run', 'attach', 'debug', 'kustomize', 'diff', 'set',
]);
const SUBCOMMANDS = {
  rollout: ['status', 'history', 'undo', 'restart', 'pause', 'resume'],
  top: ['node', 'pod'],
  config: ['view', 'current-context', 'use-context', 'get-contexts', 'set-context', 'get-clusters', 'set', 'unset', 'rename-context', 'delete-context'],
  auth: ['can-i', 'whoami'],
  set: ['image', 'resources', 'env', 'selector', 'serviceaccount', 'subject'],
  certificate: ['approve', 'deny'],
};
const COMMON_VERB_HINT = 'get / apply -f / create / delete / logs / exec / describe / scale / rollout / edit';

/* ---------------- 旗标定义 ---------------- */
/* 简写: 简写字符 -> 长名；每个动词: [简写|null, 长名, 类型] */
const GLOBAL_SHORTS = { n: 'namespace', o: 'output', A: 'all-namespaces', v: 'v' };
const GLOBAL_LONGS = {
  namespace: 'str', output: 'str', 'all-namespaces': 'bool', context: 'str',
  kubeconfig: 'str', 'insecure-skip-tls-verify': 'bool', 'request-timeout': 'str', v: 'int-opt',
};
const IMG_TYPE = 'image';
const VERB_FLAGS = {
  get: [[null, 'watch', 'bool'], ['w', 'watch', 'bool'], ['l', 'selector', 'kv'], [null, 'show-labels', 'bool'], [null, 'field-selector', 'kv'], [null, 'sort-by', 'str'], [null, 'no-headers', 'bool'], [null, 'ignore-not-found', 'bool']],
  describe: [[null, 'show-events', 'bool']],
  apply: [['f', 'filename', 'str'], ['k', 'kustomize', 'str'], ['R', 'recursive', 'bool'], [null, 'dry-run', 'enum:client,server,none'], [null, 'prune', 'bool'], [null, 'force', 'bool'], [null, 'server-side', 'bool'], [null, 'wait', 'bool'], [null, 'overwrite', 'bool'], [null, 'timeout', 'str'], [null, 'validate', 'str']],
  create: [['f', 'filename', 'str'], ['k', 'kustomize', 'str'], [null, 'image', IMG_TYPE], [null, 'replicas', 'uint'], [null, 'port', 'uint'], [null, 'dry-run', 'enum:client,server,none'], [null, 'restart', 'enum:Always,OnFailure,Never'], [null, 'expose', 'bool'], [null, 'serviceaccount', 'str'], [null, 'from-literal', 'kv'], [null, 'from-file', 'str'], [null, 'from-env', 'str'], [null, 'generic', 'bool'], [null, 'schedule', 'str']],
  delete: [['f', 'filename', 'str'], ['k', 'kustomize', 'str'], [null, 'all', 'bool'], [null, 'force', 'bool'], [null, 'grace-period', 'uint'], [null, 'now', 'bool'], [null, 'wait', 'bool'], [null, 'cascade', 'enum:background,foreground,orphan'], [null, 'ignore-not-found', 'bool'], ['l', 'selector', 'kv']],
  replace: [['f', 'filename', 'str'], ['k', 'kustomize', 'str'], [null, 'force', 'bool']],
  diff: [['f', 'filename', 'str'], ['k', 'kustomize', 'str']],
  scale: [[null, 'replicas', 'uint'], [null, 'current-replicas', 'uint'], [null, 'all', 'bool'], [null, 'timeout', 'str'], ['l', 'selector', 'kv']],
  expose: [[null, 'port', 'uint'], [null, 'type', 'enum:ClusterIP,NodePort,LoadBalancer,ExternalName'], [null, 'name', 'str'], [null, 'protocol', 'str'], [null, 'target-port', 'str'], ['l', 'selector', 'kv'], [null, 'cluster-ip', 'str'], [null, 'external-name', 'str']],
  autoscale: [[null, 'min', 'uint'], [null, 'max', 'uint'], [null, 'cpu-percent', 'uint'], [null, 'name', 'str'], [null, 'dry-run', 'enum:client,server,none']],
  logs: [['f', 'follow', 'bool'], ['p', 'previous', 'bool'], ['c', 'container', 'str'], [null, 'tail', 'uint'], [null, 'since', 'str'], [null, 'since-time', 'str'], [null, 'timestamps', 'bool'], [null, 'limit-bytes', 'uint'], [null, 'prefix', 'bool'], [null, 'ignore-errors', 'bool']],
  exec: [['i', 'stdin', 'bool'], ['t', 'tty', 'bool'], ['c', 'container', 'str'], [null, 'quiet', 'bool']],
  attach: [['i', 'stdin', 'bool'], ['t', 'tty', 'bool'], ['c', 'container', 'str']],
  cp: [['c', 'container', 'str'], [null, 'no-preserve', 'bool']],
  'port-forward': [[null, 'address', 'str']],
  run: [[null, 'image', IMG_TYPE], [null, 'port', 'uint'], [null, 'restart', 'enum:Always,OnFailure,Never'], [null, 'env', 'kv'], ['l', 'labels', 'kv'], ['i', 'stdin', 'bool'], ['t', 'tty', 'bool'], [null, 'rm', 'bool'], [null, 'attach', 'bool'], [null, 'command', 'bool'], [null, 'dry-run', 'enum:client,server,none']],
  label: [[null, 'overwrite', 'bool'], [null, 'all', 'bool'], ['l', 'selector', 'kv'], ['f', 'filename', 'str'], [null, 'dry-run', 'enum:client,server,none']],
  annotate: [[null, 'overwrite', 'bool'], [null, 'all', 'bool'], ['l', 'selector', 'kv'], ['f', 'filename', 'str']],
  patch: [['p', 'patch', 'str'], [null, 'patch-file', 'str'], [null, 'type', 'str'], ['f', 'filename', 'str'], [null, 'dry-run', 'enum:client,server,none']],
  taint: [[null, 'overwrite', 'bool']],
  drain: [[null, 'force', 'bool'], [null, 'grace-period', 'uint'], [null, 'ignore-daemonsets', 'bool'], [null, 'delete-emptydir-data', 'bool'], [null, 'timeout', 'str'], [null, 'pod-selector', 'str'], [null, 'ignore-errors', 'bool']],
  cordon: [], uncordon: [],
  edit: [['o', 'output', 'str'], ['f', 'filename', 'str'], [null, 'output-patch', 'bool'], [null, 'save-config', 'bool']],
  wait: [[null, 'for', 'str'], [null, 'timeout', 'str'], [null, 'all', 'bool'], ['f', 'filename', 'str']],
  rollout: [[null, 'to-revision', 'uint'], [null, 'timeout', 'str'], [null, 'watch', 'bool'], [null, 'revision', 'uint']],
  top: [['l', 'selector', 'kv'], [null, 'sort-by', 'str'], [null, 'no-headers', 'bool'], [null, 'sum', 'bool']],
  explain: [[null, 'recursive', 'bool'], [null, 'api-version', 'str']],
  proxy: [[null, 'port', 'uint'], [null, 'address', 'str'], [null, 'www', 'str'], [null, 'api-prefix', 'str']],
  'auth': [[null, 'as-user', 'str'], [null, 'list', 'bool'], [null, 'subresource', 'str'], ['A', 'all-namespaces', 'bool']],
  set: [[null, 'local', 'bool'], [null, 'dry-run', 'enum:client,server,none'], ['f', 'filename', 'str']],
  version: [[null, 'short', 'bool'], [null, 'client', 'bool'], ['o', 'output', 'str']],
  'api-resources': [[null, 'api-group', 'str'], [null, 'namespaced', 'bool'], [null, 'no-headers', 'bool'], [null, 'verbs', 'str'], [null, 'sort-by', 'str']],
  'api-versions': [], 'cluster-info': [], kustomize: [], help: [],
};

/* ---------------- 工具 ---------------- */
function tokenize(line) {
  const out = [];
  let cur = '', quote = null;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null; else cur += ch;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (/\s/.test(ch)) { if (cur) { out.push(cur); cur = ''; } }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
function validateImage(v) {
  if (!v || /\s/.test(v)) return false;
  const [noDigest] = v.split('@');
  if (noDigest.startsWith('/') || noDigest.includes('//')) return false;
  const parts = noDigest.split(':');
  if (parts.length > 2) return false;
  if (parts.length === 2 && !/^[\w.-]+$/.test(parts[1])) return false;
  return /^[\w][\w./-]*$/.test(parts[0]);
}
function validateKvPair(s, { allowRemove = false, selector = false } = {}) {
  if (selector) {
    for (const part of s.split(',')) {
      if (!part) return false;
      const m = part.match(/^([^=!]+)(==|!=|=)(.+)?$/);
      if (m) { if (!m[1].trim()) return false; }
      else if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(part)) return false;
    }
    return true;
  }
  if (allowRemove && s.endsWith('-') && !s.includes('=')) return /^[A-Za-z0-9][A-Za-z0-9_.-]*-$/.test(s);
  const eq = s.indexOf('=');
  if (eq <= 0) return false;
  return /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(s.slice(0, eq));
}
const TAINT_EFFECTS = /^(NoSchedule|PreferNoSchedule|NoExecute)$/;

/* ---------------- 主解析 ---------------- */
export function parseCommand(line) {
  const r = {
    raw: line, program: null, verb: null, sub: null, resources: [], resourceNames: [],
    flags: {}, errors: [], warnings: [], suggestions: [], ok: false,
  };
  const err = (message, hint = '') => r.errors.push({ code: 'ERR', message, hint });
  const tokens = tokenize(line);
  if (!tokens.length) { err('命令为空。试试：kubectl get pods'); return r; }
  const program = tokens[0].toLowerCase();
  if (program !== 'kubectl' && program !== 'k') {
    err(`目前练习场只支持 kubectl 命令（收到 "${tokens[0]}"）。`);
    r.suggestions.push('kubectl get pods');
    return r;
  }
  r.program = 'kubectl';
  let rest = tokens.slice(1);

  /* 动词前的全局旗标 */
  let i = 0;
  while (i < rest.length && rest[i].startsWith('-') && rest[i] !== '--') {
    const t = rest[i];
    const eq = t.indexOf('=');
    const bare = t.startsWith('--') ? t.slice(2, eq > -1 ? eq : undefined) : t.slice(1);
    if (t.startsWith('--') && bare in GLOBAL_LONGS) {
      if (eq > -1) r.flags[bare] = t.slice(eq + 1);
      else if (GLOBAL_LONGS[bare] === 'bool') r.flags[bare] = true;
      else { if (i + 1 >= rest.length) { err(`旗标 --${bare} 需要一个值`); return r; } r.flags[bare] = rest[++i]; }
      i++;
    } else if (!t.startsWith('--') && GLOBAL_SHORTS[t.slice(1)]) {
      const long = GLOBAL_SHORTS[t.slice(1)];
      if (t.length > 2) r.flags[long] = t.slice(2);
      else if (GLOBAL_LONGS[long] === 'bool') r.flags[long] = true;
      else { if (i + 1 >= rest.length) { err(`旗标 -${t.slice(1)} 需要一个值`); return r; } r.flags[long] = rest[++i]; }
      i++;
    } else { err(`未知的旗标 ${t.split('=')[0]}`); return r; }
  }
  const verb = rest[i] ? rest[i].toLowerCase() : null;
  if (!verb) {
    err('缺少 kubectl 子命令。');
    r.suggestions.push(COMMON_VERB_HINT);
    return r;
  }
  if (!VERBS.has(verb)) {
    const near = [...VERBS].map((v) => [editDistance(verb, v), v]).sort((a, b) => a[0] - b[0])[0];
    err(`未知的 kubectl 子命令 "${verb}"。你是不是想用 "${near[1]}"？`);
    r.suggestions.push(`kubectl ${near[1]} ...`);
    return r;
  }
  r.verb = verb;
  i++;
  const vFlags = VERB_FLAGS[verb] || [];
  const verbShorts = {}; const verbLongs = {};
  for (const [sh, long, type] of vFlags) {
    verbLongs[long] = type;
    if (sh) verbShorts[sh] = long;
  }
  const knownLong = (name) => name in GLOBAL_LONGS || name in verbLongs || name === 'help';

  /* 子命令 */
  if (verb in SUBCOMMANDS) {
    const tok = rest[i];
    if (!tok) {
      err(`子命令 ${verb} 需要一个操作，可选：${SUBCOMMANDS[verb].join(' / ')}`);
      return r;
    }
    let s = tok.toLowerCase();
    if (verb === 'top') { if (s === 'nodes') s = 'node'; if (s === 'pods') s = 'pod'; }
    if (!SUBCOMMANDS[verb].includes(s)) {
      err(`"${tok}" 不是 ${verb} 的有效操作。可选：${SUBCOMMANDS[verb].join(' / ')}`);
      return r;
    }
    r.sub = s;
    i++;
  }

  /* 逐 token 解析旗标与位置参数 */
  const positional = [];
  let afterDashDash = null;
  for (; i < rest.length; i++) {
    const t = rest[i];
    if (afterDashDash !== null) { afterDashDash.push(t); continue; }
    if (t === '--') { afterDashDash = []; continue; }
    if (t === '-') { positional.push(t); continue; }
    if (t === '-h' || t === '--help') { r.flags.help = true; continue; }
    if (t.startsWith('--')) {
      const eq = t.indexOf('=');
      const name = t.slice(2, eq > -1 ? eq : undefined);
      if (!knownLong(name)) {
        const near = Object.keys(verbLongs).map((k) => [editDistance(name, k), k]).sort((a, b) => a[0] - b[0])[0];
        err(`未知的旗标 --${name}。` + (near && near[0] <= 3 ? `你是不是想输入 --${near[1]}？` : `"kubectl ${verb}" 常用旗标：${Object.keys(verbLongs).slice(0, 8).join(', ')}`));
        return r;
      }
      const type = name in GLOBAL_LONGS ? GLOBAL_LONGS[name] : verbLongs[name];
      let value;
      if (eq > -1) value = t.slice(eq + 1);
      else if (type === 'bool') value = true;
      else {
        if (i + 1 >= rest.length) { err(`旗标 --${name} 需要一个值，例如 --${name}=<值>`); return r; }
        value = rest[++i];
      }
      const vErr = checkValue(name, type, value);
      if (vErr) { err(vErr); return r; }
      r.flags[name] = value;
      continue;
    }
    if (t.startsWith('-')) {
      const chars = t.slice(1).split('');
      for (let ci = 0; ci < chars.length; ci++) {
        const c = chars[ci];
        const long = c in GLOBAL_SHORTS ? GLOBAL_SHORTS[c] : verbShorts[c];
        if (!long) { err(`未知的旗标 -${c}。"kubectl ${verb}" 的简写旗标：${Object.keys(verbShorts).map((s) => '-' + s).join(' ') || '（无）'}`); return r; }
        const type = long in GLOBAL_LONGS ? GLOBAL_LONGS[long] : verbLongs[long];
        if (type === 'bool') { r.flags[long] = true; continue; }
        const tail = chars.slice(ci + 1).join('');
        let value;
        if (tail) value = tail.replace(/^=/, '');
        else { if (i + 1 >= rest.length) { err(`旗标 -${c} 需要一个值`); return r; } value = rest[++i]; }
        const vErr = checkValue(long, type, value);
        if (vErr) { err(vErr); return r; }
        r.flags[long] = value;
        break; // 值已吞掉后续字符
      }
      continue;
    }
    positional.push(t);
  }
  if (afterDashDash) r.command = afterDashDash;

  /* 位置参数归类 */
  const catErr = parsePositional(r, positional, afterDashDash);
  if (catErr) { err(catErr); return r; }

  r.ok = r.errors.length === 0;
  return r;
}

function checkValue(name, type, value) {
  if (type === 'bool') return null;
  if (value === undefined || value === '') return `旗标 --${name} 需要一个非空值`;
  if (type === 'uint' && !/^\d+$/.test(value)) return `旗标 --${name} 需要一个非负整数（收到 "${value}"）`;
  if (type === 'int' && !/^-?\d+$/.test(value)) return `旗标 --${name} 需要一个整数（收到 "${value}"）`;
  if (type === 'int-opt') return null;
  if (type && type.startsWith('enum:')) {
    const opts = type.slice(5).split(',');
    if (!opts.includes(value)) return `旗标 --${name} 的值必须是：${opts.join(' / ')}（收到 "${value}"）`;
  }
  if (type === 'kv' && !validateKvPair(value, { allowRemove: name === 'labels' || name === 'env', selector: name === 'selector' }))
    return `旗标 --${name} 的值不是合法的选择器/键值对（收到 "${value}"）。示例：app=nginx 或 app=nginx,tier=web`;
  if (type === IMG_TYPE && !validateImage(value))
    return `旗标 --${name} 不是合法的镜像地址（收到 "${value}"）。示例：nginx、nginx:1.27、registry.local:5000/app:v1`;
  return null;
}

/* 位置参数按动词归类校验；返回错误消息或 null */
function parsePositional(r, positional, afterDashDash) {
  const verb = r.verb;
  const hasAll = !!r.flags.all || !!r.flags.selector || !!r.flags.filename || !!r.flags.kustomize;
  const needTarget = () => `需要指定资源名称，或使用 --all / -l <选择器>；示例：kubectl ${verb} pods nginx`;

  if (verb === 'get' || verb === 'describe' || verb === 'delete' || verb === 'label' ||
      verb === 'annotate' || verb === 'scale' || verb === 'expose' || verb === 'autoscale' ||
      verb === 'edit' || verb === 'patch' || verb === 'wait' || verb === 'set') {
    if (!positional.length) {
      if (hasAll) return null;
      if (verb === 'apply' || verb === 'create') return null;
      if (verb === 'wait' && r.flags.for) return null;
      return `缺少资源类型。示例：kubectl ${verb} pods`;
    }
    const first = positional[0];
    let types = [];
    if (first.includes('/')) {
      const slash = first.indexOf('/');
      const left = canonicalResource(first.slice(0, slash));
      if (!left) {
        const sug = suggestResource(first.slice(0, slash));
        r.suggestions.push(...sug);
        return `未知的资源类型 "${first.slice(0, slash)}"` + (sug.length ? `，你是不是想要：${sug.join(' / ')}？` : '');
      }
      types = [left];
      r.resourceNames.push(first.slice(slash + 1));
    } else {
      const segs = first.split(',');
      for (const s of segs) {
        const c = canonicalResource(s);
        if (!c) {
          const sug = suggestResource(s);
          r.suggestions.push(...sug);
          return `未知的资源类型 "${s}"` + (sug.length ? `，你是不是想要：${sug.join(' / ')}？` : '');
        }
        types.push(c);
      }
    }
    r.resources = types;
    /* 资源名与键值对分离：label/annotate/set 的 k=v、k- 参数不计入资源名 */
    const kvVerbs = verb === 'label' || verb === 'annotate' || verb === 'set';
    const names = [];
    const kvs = [];
    for (let k = 1; k < positional.length; k++) {
      const p = positional[k];
      if (p.includes('=')) { if (kvVerbs) kvs.push(p); else names.push(p); }
      else if (kvVerbs && p.endsWith('-') && !p.includes('/')) kvs.push(p);
      else names.push(p);
    }
    if (!r.resourceNames.length) r.resourceNames = names;
    r.kvs = kvs;
    if (types.length > 1 && r.resourceNames.length) return '一次指定多种资源类型时不能再指定名称';
    if (types.includes('all')) return null;

    if (verb === 'scale' && r.flags.replicas === undefined && !hasAll)
      return 'scale 需要 --replicas=<数量> 参数，例如 --replicas=3';
    if ((verb === 'label' || verb === 'annotate') && r.resourceNames.length === 0 && !hasAll) return needTarget();
    return validatePairsFor(r);
  }

  if (verb === 'taint') {
    if (!positional.length) return '用法：kubectl taint nodes <节点名> <键>=<值>:<effect>';
    const first = positional[0];
    let names = [];
    if (first.includes('/')) {
      const [left, right] = first.split('/');
      if (canonicalResource(left) !== 'nodes') return 'taint 只能作用于节点：kubectl taint node/<名称> ...';
      names = [right];
    } else if (canonicalResource(first) === 'nodes') {
      if (positional.length < 2) return '用法：kubectl taint nodes <节点名> <键>=<值>:<effect>';
      names = [positional[1]];
    } else return 'taint 需要指定节点。用法：kubectl taint nodes <节点名> <键>=<值>:<effect>';
    r.resources = ['nodes'];
    r.resourceNames = names;
    const pairs = positional.slice(first.includes('/') ? 1 : 2);
    if (!pairs.length) return 'taint 需要污点键值，格式 <键>=<值>:<effect>，effect 取值 NoSchedule / PreferNoSchedule / NoExecute';
    for (const p of pairs) {
      const m = p.match(/^[^=]+=[^:]*:(.+)$/);
      if (!m || !TAINT_EFFECTS.test(m[1])) return `污点 "${p}" 格式不对，需要 <键>=<值>:<effect>，effect 为 NoSchedule / PreferNoSchedule / NoExecute`;
    }
    return null;
  }

  if (verb === 'drain' || verb === 'cordon' || verb === 'uncordon') {
    if (!positional.length) return `${verb} 需要指定节点名称。示例：kubectl ${verb} node-1`;
    r.resources = ['nodes'];
    r.resourceNames = positional;
    return null;
  }

  if (verb === 'logs' || verb === 'exec' || verb === 'attach' || verb === 'port-forward') {
    if (!positional.length && !(r.flags.selector)) {
      return verb === 'exec'
        ? `需要指定目标 Pod。示例：kubectl exec -it <pod> -- sh`
        : `需要指定目标 Pod。示例：kubectl ${verb} <pod>` + (verb === 'logs' ? ' 或 kubectl logs deploy/<名称>' : '');
    }
    if (positional.length) {
      const first = positional[0];
      if (first.includes('/')) {
        const slash = first.indexOf('/');
        const left = canonicalResource(first.slice(0, slash));
        if (!left) return `未知的资源类型 "${first.slice(0, slash)}"`;
        r.resources = [left];
        r.resourceNames.push(first.slice(slash + 1));
      } else {
        r.resources = ['pods'];
        r.resourceNames.push(first);
      }
    } else r.resources = ['pods'];
    if (verb === 'port-forward') {
      const ports = positional.slice(r.resourceNames.length ? 1 : 1);
      const portList = positional.slice(1);
      void ports;
      if (!portList.length) return 'port-forward 需要端口映射。示例：kubectl port-forward pod/web 8080:80';
      for (const p of portList)
        if (!/^\d{1,5}(:\d{1,5})?$/.test(p)) return `端口 "${p}" 不合法，格式应为 本地端口:容器端口 或单个端口`;
    }
    if (verb === 'exec' && afterDashDash === null && positional.length > 1) {
      r.warnings.push('建议使用 "--" 分隔 Pod 名称与要执行的命令：kubectl exec <pod> -- <命令>');
    }
    if (verb === 'exec' && (afterDashDash === null || afterDashDash.length === 0) && positional.length <= 1)
      return 'exec 需要提供要执行的命令。示例：kubectl exec <pod> -- ls /';
    return null;
  }

  if (verb === 'cp') {
    if (positional.length !== 2) return 'cp 需要两个参数：源路径与目标路径。示例：kubectl cp ./a.txt pod/mypod:/tmp/a.txt';
    return null;
  }

  if (verb === 'apply' || verb === 'replace' || verb === 'diff') {
    if (r.flags.filename || r.flags.kustomize) return null;
    if (!positional.length)
      return `${verb} 需要 -f <文件> 或 -k <目录> 参数。示例：kubectl ${verb} -f pod.yaml`;
    return null;
  }

  if (verb === 'create') {
    if (r.flags.filename || r.flags.kustomize) return null;
    if (!positional.length) return 'create 需要 -f <文件> 或资源类型。示例：kubectl create deployment web --image=nginx';
    const c = canonicalResource(positional[0]);
    if (!c) {
      const sug = suggestResource(positional[0]);
      return `未知的资源类型 "${positional[0]}"` + (sug.length ? `，你是不是想要：${sug.join(' / ')}？` : '');
    }
    r.resources = [c];
    r.resourceNames = positional.slice(1);
    const req = { deployments: ['image'], jobs: ['image'], daemonsets: ['image'], replicasets: ['image'], cronjobs: ['schedule', 'image'], configmaps: ['fromAny'], secrets: ['fromAny'] }[c];
    if (req) {
      for (const name of req) {
        if (name === 'fromAny') {
          if (!Object.keys(r.flags).some((k) => k.startsWith('from-'))) return `创建 ${c} 需要提供数据来源：--from-literal=<键>=<值> 或 --from-file=<文件>`;
        } else if (r.flags[name] === undefined) return `创建 ${c} 需要提供 --${name}=<值> 参数`;
      }
    }
    if (c !== 'namespaces' && c !== 'services' && c !== 'roles' && c !== 'clusterroles' && c !== 'serviceaccounts' && c !== 'configmaps' && c !== 'secrets' && r.resourceNames.length === 0 && !hasAll)
      return `create ${c} 需要一个名称。示例：kubectl create ${c} <名称> --image=...`;
    return null;
  }

  if (verb === 'run') {
    if (!positional.length) return 'run 需要一个 Pod 名称。示例：kubectl run tmp --image=busybox --rm -it -- sh';
    r.resources = ['pods'];
    r.resourceNames = [positional[0]];
    if (r.flags.image === undefined) return 'run 需要提供 --image=<镜像> 参数';
    return null;
  }

  if (verb === 'rollout') {
    if (!positional.length) return `rollout ${r.sub} 需要目标资源。示例：kubectl rollout ${r.sub} deployment/web`;
    const first = positional[0];
    if (first.includes('/')) {
      const slash = first.indexOf('/');
      const left = canonicalResource(first.slice(0, slash));
      if (!left) return `未知的资源类型 "${first.slice(0, slash)}"`;
      r.resources = [left];
      r.resourceNames.push(first.slice(slash + 1));
    } else {
      const c = canonicalResource(first);
      if (!c) {
        const sug = suggestResource(first);
        return `未知的资源类型 "${first}"` + (sug.length ? `，你是不是想要：${sug.join(' / ')}？` : '');
      }
      r.resources = [c];
      r.resourceNames = positional.slice(1);
    }
    if (!['deployments', 'statefulsets', 'daemonsets', 'replicasets'].includes(r.resources[0]))
      return `rollout 支持 Deployment / StatefulSet / DaemonSet / ReplicaSet，不支持 ${r.resources[0]}`;
    if (r.resourceNames.length === 0 && !hasAll) return needTarget();
    return null;
  }

  if (verb === 'top') {
    r.resources = [r.sub === 'node' ? 'nodes' : 'pods'];
    r.resourceNames = positional;
    return null;
  }

  if (verb === 'config') {
    if ((r.sub === 'use-context' || r.sub === 'set-context' || r.sub === 'rename-context' || r.sub === 'delete-context') && !positional.length)
      return `config ${r.sub} 需要一个上下文名称`;
    if (['use-context', 'set-context', 'rename-context', 'delete-context'].includes(r.sub)) r.resourceNames = positional;
    return null;
  }

  if (verb === 'kustomize' && !positional.length) return 'kustomize 需要一个目录参数。示例：kubectl kustomize overlays/prod';
  if (verb === 'auth' && r.sub === 'can-i' && positional.length < 1) return '用法：kubectl auth can-i <动词> <资源>，例如 kubectl auth can-i create pods';
  /* explain / version / api-resources / api-versions / cluster-info / proxy 等：位置参数自由 */
  return null;
}

/* label/annotate 键值对与 set 容器=镜像 校验（键值对已在解析阶段分入 r.kvs） */
function validatePairsFor(r) {
  const verb = r.verb;
  if (verb === 'set') {
    if (!r.kvs.length) return 'set 需要至少一个 "容器=值" 对。示例：kubectl set image deployment/web web=nginx:1.27';
    return null;
  }
  if (verb === 'label' || verb === 'annotate') {
    if (!r.kvs.length) return `${verb} 需要至少一个 key=value（或 key- 移除标签）。示例：kubectl label pods nginx env=prod`;
    for (const kv of r.kvs)
      if (!validateKvPair(kv, { allowRemove: true })) return `"${kv}" 不是合法的 key=value 或 key- 格式。示例：env=prod 或 env-`;
  }
  return null;
}
