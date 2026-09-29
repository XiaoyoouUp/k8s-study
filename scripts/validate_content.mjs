/* 内容集成校验：结构合法性 + 参考答案必须通过自己的 check 规约 + 图引用存在 */
import { checkCommand } from '../js/lib/tasks.js';
import { parseCommand } from '../js/lib/parser.js';
import { existsSync } from 'node:fs';

const stageIds = ['s1', 's2', 's3', 's4', 's5', 's6'];
const examIds = ['exam1', 'exam2', 'exam3', 'exam4', 'exam5', 'exam-final'];
const CHECK_FIELDS = ['verb', 'sub', 'resources', 'namespace', 'flagsMust', 'flagsMustNot', 'minNames', 'namePattern', 'selectorMust'];

let problems = [];
const ids = new Set();
function chk(cond, msg) { if (!cond) problems.push(msg); }

const stages = (await Promise.all(stageIds.map(async (id) => {
  try { return (await import(`../data/stages/${id}.js`)).stage; } catch (e) { problems.push(`[load] ${id}: ${e.message}`); return null; }
}))).filter(Boolean);

for (const s of stages) {
  chk(s.id && s.num && s.title, `[stage] ${s.id} 缺元信息`);
  chk(Array.isArray(s.goals) && s.goals.length >= 3, `[stage] ${s.id} goals 不足`);
  for (const l of s.lessons) {
    chk(!ids.has(l.id), `[dup] lesson id ${l.id}`); ids.add(l.id);
    chk(l.duration > 0 && l.title && l.summary, `[lesson] ${l.id} 缺字段`);
    for (const b of l.blocks || []) {
      if (b.t === 'quiz') {
        chk(!ids.has(b.id), `[dup] quiz id ${b.id}`); ids.add(b.id);
        for (const q of b.questions) {
          chk(!ids.has(q.id), `[dup] question id ${q.id}`); ids.add(q.id);
          const n = q.type === 'judge' ? 2 : q.options.length;
          chk(n >= 2, `[q] ${q.id} 选项不足`);
          for (const a of q.answer) chk(Number.isInteger(a) && a >= 0 && a < n, `[q] ${q.id} answer 越界 ${a}/${n}`);
          chk(new Set(q.answer).size === q.answer.length, `[q] ${q.id} answer 重复`);
          chk(q.explain && q.explain.length > 10, `[q] ${q.id} 缺解析`);
        }
      }
      if (b.t === 'diagram') chk(existsSync(new URL(`../diagrams/${b.src}`, import.meta.url)), `[diagram] ${l.id} 引用不存在: ${b.src}`);
      if (b.t === 'code') chk(typeof b.code === 'string' && b.code.length > 0, `[code] ${l.id} 空 code`);
    }
  }
}

const exams = (await Promise.all(examIds.map(async (id) => {
  try { return (await import(`../data/exams/${id}.js`)).exam; } catch (e) { problems.push(`[load] ${id}: ${e.message}`); return null; }
}))).filter(Boolean);

for (const e of exams) {
  chk(e.id && e.stageId && e.duration > 0 && e.passScore > 0, `[exam] ${e.id} 缺元信息`);
  for (const q of e.questions || []) {
    chk(!ids.has(q.id), `[dup] exam question ${q.id}`); ids.add(q.id);
    const n = q.type === 'judge' ? 2 : q.options.length;
    for (const a of q.answer) chk(Number.isInteger(a) && a >= 0 && a < n, `[exam ${e.id}] ${q.id} answer 越界`);
    chk(q.explain, `[exam ${e.id}] ${q.id} 缺解析`);
  }
  for (const t of e.tasks || []) {
    for (const k of Object.keys(t.check || {})) chk(CHECK_FIELDS.includes(k), `[exam ${e.id}] ${t.id} 非法 check 字段 ${k}`);
    chk(Array.isArray(t.solution) && t.solution.length, `[exam ${e.id}] ${t.id} 缺 solution`);
    for (const sol of t.solution || []) {
      const r = checkCommand(sol, t.check || {});
      if (!r.pass) {
        const failed = r.checks.filter((c) => !c.ok).map((c) => c.label).join(' | ');
        problems.push(`[exam ${e.id}] ${t.id} 参考答案未通过自己的 check："${sol}" → ${failed}`);
      }
      const p = parseCommand(sol);
      chk(p.ok, `[exam ${e.id}] ${t.id} 参考答案解析失败："${sol}"`);
    }
  }
}

/* 统计 */
const lessonCount = stages.reduce((n, s) => n + s.lessons.length, 0);
const quizCount = stages.reduce((n, s) => n + s.lessons.reduce((m, l) => m + (l.blocks || []).reduce((k, b) => k + (b.t === 'quiz' ? b.questions.length : 0), 0), 0), 0);
const examQCount = exams.reduce((n, e) => n + (e.questions || []).length, 0);
const examTCount = exams.reduce((n, e) => n + (e.tasks || []).length, 0);
console.log(`阶段 ${stages.length}/6 · 课程 ${lessonCount} · 随堂题 ${quizCount} · 考试选择题 ${examQCount} · 实操题 ${examTCount}`);

if (problems.length) {
  console.log('\n发现问题:');
  for (const p of problems) console.log(' -', p);
  process.exit(1);
}
console.log('CONTENT OK');
