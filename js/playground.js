/* 命令练习场：终端 UI + 内置任务校验 */
import { parseCommand } from './lib/parser.js';
import { simulate } from './lib/mockcluster.js';
import { checkCommand, TASKS } from './lib/tasks.js';
import { store } from './store.js';
import { esc } from './components.js';

const EXAMPLES = [
  'kubectl get pods', 'kubectl get pods -A', 'kubectl get nodes',
  'kubectl get deployments -n study -o wide', 'kubectl describe pod nginx-deployment-7d4c8b9f6-abcde',
  'kubectl logs nginx-deployment-7d4c8b9f6-abcde --tail=5', 'kubectl rollout status deployment web-ui',
  'kubectl scale deployment nginx-deployment --replicas=5', 'kubectl top nodes', 'kubectl api-resources',
];
const LEVEL_NAME = { 1: '入门', 2: '进阶', 3: '挑战' };

export function renderPlayground(el) {
  el.innerHTML = `
  <div class="fade-in">
    <h1 style="margin:4px 0 8px">kubectl 命令练习场</h1>
    <p style="color:var(--ink-2);margin:0 0 18px">输入命令并回车：右侧会先做<strong>语法与用法校验</strong>（错误会给出修正建议），语法通过后在<strong>模拟集群</strong>上执行并展示输出。选中一个任务后，练习场会判断你的命令是否满足任务要求。</p>
    <div class="pg-layout">
      <div class="terminal">
        <div class="term-bar">
          <span class="term-dot" style="background:#ff5f57"></span><span class="term-dot" style="background:#febc2e"></span><span class="term-dot" style="background:#28c840"></span>
          <span class="term-title">k8s-study · 模拟集群 v1.32.2</span>
          <button id="pg-clear" class="chip-btn" style="margin-left:auto">清屏</button>
        </div>
        <div class="term-body" id="pg-out"></div>
        <div class="term-input"><span class="ps">k8s@study:~$</span><input id="pg-in" type="text" spellcheck="false" autocomplete="off" placeholder="输入 kubectl 命令，回车执行…"></div>
      </div>
      <div class="pg-side">
        <div class="card"><h3>常用命令（点击填入）</h3><div class="chips-row">${EXAMPLES.map((c) => `<button class="chip-btn pg-ex" type="button">${esc(c)}</button>`).join('')}</div></div>
        <div class="card"><h3>练习任务 <span class="chip gray" id="pg-task-count"></span></h3><div id="pg-tasks"></div></div>
        <div class="card" id="pg-verdict-card" style="display:none"><h3>任务判定</h3><div id="pg-verdict"></div></div>
      </div>
    </div>
    <div class="callout info" style="margin-top:22px"><div class="co-title">ℹ️ 关于模拟集群</div>
    <p>集群数据是固定的演示集（default / study / kube-system 三个命名空间）。读取类命令（get / describe / logs / top 等）返回模拟数据；变更类命令返回模拟确认信息，不会真实改变状态。解析器覆盖常用命令与旗标，未覆盖的高级用法会在课程中标注。</p></div>
  </div>`;

  const out = el.querySelector('#pg-out');
  const input = el.querySelector('#pg-in');
  const tasksEl = el.querySelector('#pg-tasks');
  const verdictCard = el.querySelector('#pg-verdict-card');
  const verdictEl = el.querySelector('#pg-verdict');
  let activeTask = null;
  const history = [];
  let hIdx = -1;

  const greet = document.createElement('div');
  greet.className = 't-out';
  greet.textContent = '欢迎使用 K8s 学练营模拟终端。试试 kubectl get pods，或从右侧选择一个练习任务。';
  out.appendChild(greet);

  function print(text, tone = 'out') {
    const div = document.createElement('div');
    div.className = 't-out';
    if (tone === 'err') div.className = 't-err';
    else if (tone === 'ok') div.className = 't-ok';
    else if (tone === 'in') { div.className = 't-in'; div.textContent = text; out.appendChild(div); return; }
    div.textContent = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function refreshTasks() {
    const done = TASKS.filter((t) => store.isTaskDone(t.id)).length;
    el.querySelector('#pg-task-count').textContent = `${done}/${TASKS.length}`;
    tasksEl.innerHTML = TASKS.map((t) => {
      const isDone = store.isTaskDone(t.id);
      const active = activeTask && activeTask.id === t.id;
      return `<div class="task-item ${active ? 'active' : ''} ${isDone ? 'done' : ''}" data-task="${t.id}">
        <span class="ti-status">${isDone ? '✅' : `<span class="chip ${t.level === 3 ? 'warn' : 'gray'}">${LEVEL_NAME[t.level]}</span>`}</span>
        <div class="ti-title">${esc(t.title)}</div><div class="ti-desc">${esc(t.desc)}</div></div>`;
    }).join('');
  }

  function solutionText(task) {
  return Array.isArray(task.solution) ? task.solution.join('\n') : String(task.solution || '');
}

function showVerdict(task, result) {
    verdictCard.style.display = '';
    const rows = result.checks.map((c) => `<li>${c.ok ? '✅' : '❌'} ${esc(c.label)}${c.detail && !c.ok ? ` — ${esc(c.detail)}` : ''}</li>`).join('');
    verdictEl.innerHTML = result.pass
      ? `<div class="verdict pass"><div class="v-title">🎉 任务完成</div><ul>${rows}</ul>${task.solution ? `<details style="margin-top:8px"><summary>参考答案</summary><pre>${esc(solutionText(task))}</pre></details>` : ''}</div>`
      : `<div class="verdict fail"><div class="v-title">未通过，逐条检查：</div><ul>${rows}</ul>${task.hint ? `<p style="margin:8px 0 0"><b>提示：</b>${esc(task.hint)}</p>` : ''}</div>`;
  }

  tasksEl.addEventListener('click', (e) => {
    const item = e.target.closest('.task-item');
    if (!item) return;
    const t = TASKS.find((x) => x.id === item.dataset.task);
    activeTask = activeTask && activeTask.id === t.id ? null : t;
    if (activeTask) print(`已选择任务：${t.title} —— ${t.desc}`, 'out');
    verdictCard.style.display = 'none';
    refreshTasks();
    input.focus();
  });

  function run(cmdLine) {
    print(cmdLine, 'in');
    history.unshift(cmdLine);
    hIdx = -1;
    const parsed = parseCommand(cmdLine);
    if (!parsed.ok) {
      for (const e of parsed.errors) print('✗ ' + e.message, 'err');
      if (parsed.suggestions.length) print('  建议：' + parsed.suggestions.join('；'), 'out');
    } else {
      for (const w of parsed.warnings) print('⚠ ' + w, 'out');
      const sim = simulate(cmdLine, parsed);
      print(sim.text, sim.tone);
    }
    if (activeTask) {
      const result = checkCommand(cmdLine, activeTask.check);
      showVerdict(activeTask, result);
      if (result.pass) { store.markTaskDone(activeTask.id); refreshTasks(); }
    }
    const blank = document.createElement('div');
    blank.innerHTML = '&nbsp;';
    out.appendChild(blank);
    out.scrollTop = out.scrollHeight;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) { run(input.value.trim()); input.value = ''; }
    else if (e.key === 'ArrowUp') { if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; e.preventDefault(); } }
    else if (e.key === 'ArrowDown') { if (hIdx > 0) { hIdx--; input.value = history[hIdx]; e.preventDefault(); } else { hIdx = -1; input.value = ''; } }
  });
  el.querySelector('#pg-clear').addEventListener('click', () => { out.innerHTML = ''; });
  el.querySelectorAll('.pg-ex').forEach((b) => b.addEventListener('click', () => { input.value = b.textContent; input.focus(); }));

  refreshTasks();
  input.focus();
}
