# K8s 学练营 · 课程内容契约（生成课程/考试数据必须严格遵守）

> 任何课程/考试数据改动，提交前必须通过：`node scripts/validate_content.mjs`
> 校验器强制本文档的硬性规则（id 唯一、答案下标、图引用存在、实操题参考答案必须通过自己的 check 规约）。改数据结构的步骤见 [development.md](development.md)。

## 文件与模块形式
- 课程：`data/stages/sN.js`，导出 `export const stage = {...}`
- 考试：`data/exams/examN.js`，导出 `export const exam = {...}`
- 纯 ESM，无任何 import（除非明确允许）。文件必须是合法 JS，可用下面命令自检：
  `node -e "import('./data/stages/s2.js').then(()=>console.log('OK')).catch(e=>{console.error(e);process.exit(1)})"`
- 代码字符串建议用模板字符串；**必须转义反引号（\`）与美元插值（\${）**。
- 所有面向用户的文字使用简体中文；命令、字段名、API 名称保持英文原文。
- 技术内容对齐 Kubernetes v1.32；YAML 一律 `apiVersion: apps/v1` 等真实写法，禁止编造 API 字段。

## stage 结构
```js
export const stage = {
  id: 's2', num: 2,
  title: '核心资源与工作负载',          // 8~14 字
  subtitle: '一句话说明本阶段主线',
  goals: ['学完本阶段你能…', '…'],      // 3~5 条，动宾结构
  cka: 'CKA 考纲对应：工作负载与调度 15%',   // 或数组
  lessons: [ /* lesson 数组，见下 */ ],
};
```

## lesson 结构
```js
{
  id: 's2l1',                 // 唯一：阶段号 l 课号
  title: 'Pod 深入理解',
  duration: 25,               // 预计学习分钟数
  summary: '一句话导语（列表页展示）',
  blocks: [ /* 内容块，见下 */ ],
  keyPoints: ['**小结1**', '小结2'],        // 3~5 条，可含 <strong>/<code>
  commands: [ { cmd: 'kubectl get pods -A', desc: '列出所有命名空间的 Pod' } ],  // 5~10 条本课命令
}
```

## block 类型（t 字段）
| t | 字段 | 说明 |
|---|---|---|
| h2 | text | 章节标题 |
| p | html | 段落；可内嵌 `<code>` `<strong>` `<mark>`，**不要**用其他标签 |
| list | items:[html], ordered?:bool | 列表 |
| code | lang:'bash'\|'yaml', code, out?, file? | 代码块；out 为模拟输出（显示在下方灰区）；file 为文件名 |
| callout | kind:'info'\|'tip'\|'warn'\|'cka', title, text(html) | 提示框；cka 类型用于"考试考点" |
| diagram | src, caption, desc | 插图；src 必须来自下方图库清单（或按 SVG 规则自建） |
| table | headers:[...], rows:[[...],...] | 表格 |
| quiz | id, title?, questions:[...] | 随堂测验，每课 3~6 题 |

## 题目结构（quiz 与考试共用）
```js
{ id: 'q-s2l1-1',                       // 全局唯一
  type: 'single' | 'multi' | 'judge',   // 单选/多选/判断
  q: '题干（可含 <code>）',
  options: ['A 选项', 'B 选项'],         // judge 类型固定 ['正确','错误']
  answer: [1],                           // 0 起始的下标数组；multi 可多个；judge [0]=正确
  explain: '解析（可含 <code>），必须讲透为什么' }
```
命题要求：场景题为主（"某 Pod 处于 CrashLoopBackOff，最可能的原因是…"），选项差异明显但需要理解才能区分；错误选项不能一眼假；禁止"以上都对"。

## 考试 exam 结构（data/exams/examN.js）
```js
export const exam = {
  id: 'exam2', stageId: 's2', title: '阶段二结业考试',
  duration: 30,            // 分钟，倒计时
  passScore: 66,           // 百分制及格线
  questions: [ /* 同题目结构，12~15 题 */ ],
  tasks: [ /* 操作题 2~4 题 */ ],
};
```
操作题 task：
```js
{ id: 'exam2-t1', points: 10,          // 分值
  text: '将 nginx-deployment 扩容到 5 个副本。',
  hint: 'scale 命令需要 --replicas',
  solution: ['kubectl scale deployment nginx-deployment --replicas=5'],  // 数组，每行一条命令
  check: { verb: 'scale', resources: ['deployments'], minNames: 1, flagsMust: [{ name: 'replicas', equals: '5' }] } }
```
**check 规约只允许这些字段**（校验引擎按此实现，超出字段会被忽略）：
`verb, sub, resources[], namespace('all'|'具体名'), flagsMust[{name, equals?, oneOf?}], flagsMustNot['force'|'grace-period=0'], minNames, namePattern, selectorMust`
任务必须能被解析器判定（可用动词：get describe create apply delete scale expose autoscale rollout(sub) logs exec cp port-forward top(sub) label annotate taint drain cordon uncordon run set(sub) config(sub) explain api-resources version）。任务描述要给出**明确的资源名与命名空间**，保证答案可判定。

## 图库清单（diagram 的 src 只能引用这些或自建）
| 文件 | 内容 |
|---|---|
| containers-vs-vms.svg | 虚拟机与容器架构分层对比 |
| architecture.svg | 集群架构：控制平面四组件 + 两个 worker（kubelet/kube-proxy/pod） |
| api-object-model.svg | 声明式 API 对象模型：期望状态 vs 实际状态，控制循环 |
| pod-lifecycle.svg | Pod 生命周期状态机与三种探针 |
| deployment-rs-pod.svg | Deployment→ReplicaSet→Pod 归属与滚动更新新旧 RS |
| workload-types.svg | Deployment/StatefulSet/DaemonSet/Job/CronJob 形态对比 |
| service-types.svg | ClusterIP/NodePort/LoadBalancer/Ingress 流量路径 |
| networking-flow.svg | Service→Endpoint→Pod 转发与 kube-proxy 模式 |
| storage-flow.svg | PVC↔PV↔StorageClass 绑定与挂载流程 |
| rbac-flow.svg | User/SA→Role/ClusterRole→Binding→资源授权链 |
| scheduling-flow.svg | 调度流程：预选过滤→优选打分→绑定，含污点/亲和 |
| etcd-backup.svg | etcd 快照备份与恢复流程 |
| pod-troubleshoot.svg | Pod 异常排查决策树（ImagePullBackOff/CrashLoopBackOff/Pending 等） |

自建 SVG 规则（仅当确有必要，命名 `stage-N-*.svg` 放 `diagrams/`）：
- 宽 860、白底 #ffffff、圆角矩形、K8s 蓝 #326CE5、浅蓝 #E8F0FE、深色 #0d1b2e、成功 #148a5c、警示 #c53030
- `font-family="'PingFang SC','Microsoft YaHei',sans-serif"`，正文字号 13，标题 15 加粗
- 线条 #7b8ca0 1.5px，箭头用 marker；结构扁平清晰，不超过 30 个元素
- 图必须能脱离上下文独立看懂，中文标注

## 语言风格（对标 kubernetes.io/zh-cn 官方文档）
- 讲解由浅入深：是什么 → 为什么需要 → 怎么用 → 常见坑
- 每课 10~16 个 block；至少 1 个 diagram、2 个 code（一半带 out 输出）、1 个 callout（cka 类型指出考试考点与命令）
- 命令示例真实可运行；YAML 缩进两个空格
- 出现新术语首次给出中文+英文，如 "污点（taint）"
