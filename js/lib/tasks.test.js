import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCommand } from './tasks.js';

function pass(cmd, spec) {
  const r = checkCommand(cmd, spec);
  const bad = r.checks.filter((c) => !c.ok).map((c) => c.label).join(' | ');
  assert.equal(r.pass, true, `expected pass for "${cmd}", failed checks: ${bad}`);
  return r;
}
function deny(cmd, spec) {
  const r = checkCommand(cmd, spec);
  assert.equal(r.pass, false, `expected FAIL for "${cmd}"`);
  return r;
}

test('任务：列出所有命名空间的 Pod', () => {
  const spec = { verb: 'get', resources: ['pods'], namespace: 'all' };
  pass('kubectl get pods -A', spec);
  pass('kubectl get pods --all-namespaces', spec);
  deny('kubectl get pods', spec);
  deny('kubectl get pods -n default', spec);
  deny('kubectl get deployments -A', spec);
});

test('任务：查看指定命名空间 Deployment 并以 wide 输出', () => {
  const spec = { verb: 'get', resources: ['deployments'], namespace: 'study', flagsMust: [{ name: 'output', equals: 'wide' }] };
  pass('kubectl get deploy -n study -o wide', spec);
  deny('kubectl get deploy -n study', spec);
  deny('kubectl get deploy -o wide', spec);
  deny('kubectl get deploy -n study -o yaml', spec);
});

test('任务：扩缩容到 5 副本', () => {
  const spec = { verb: 'scale', resources: ['deployments'], minNames: 1, flagsMust: [{ name: 'replicas', equals: '5' }] };
  pass('kubectl scale deployment nginx --replicas=5', spec);
  deny('kubectl scale deployment nginx --replicas=3', spec);
  deny('kubectl scale deployment --replicas=5', spec);
});

test('任务：重启 rollout', () => {
  const spec = { verb: 'rollout', sub: 'restart', resources: ['deployments'], minNames: 1 };
  pass('kubectl rollout restart deployment nginx', spec);
  pass('kubectl rollout restart deploy/nginx', spec);
  deny('kubectl rollout status deployment nginx', spec);
});

test('任务：查看某 Pod 日志并跟随', () => {
  const spec = { verb: 'logs', resources: ['pods'], minNames: 1, flagsMust: [{ name: 'follow' }] };
  pass('kubectl logs nginx-abc -f', spec);
  deny('kubectl logs nginx-abc', spec);
});

test('任务：使用标签选择器查询', () => {
  const spec = { verb: 'get', resources: ['pods'], selectorMust: true };
  pass('kubectl get pods -l app=web', spec);
  deny('kubectl get pods', spec);
});

test('任务：禁止使用破坏性旗标', () => {
  const spec = { verb: 'delete', resources: ['pods'], flagsMustNot: ['force', 'grace-period=0'] };
  pass('kubectl delete pod nginx', spec);
  deny('kubectl delete pod nginx --force --grace-period=0', spec);
});

test('任务：节点维护 drain', () => {
  const spec = { verb: 'drain', resources: ['nodes'], minNames: 1, flagsMust: [{ name: 'ignore-daemonsets' }] };
  pass('kubectl drain node1 --ignore-daemonsets --delete-emptydir-data', spec);
  deny('kubectl drain node1', spec);
});

test('checkCommand 对解析失败的命令返回不通过', () => {
  const r = checkCommand('kubectl get podz', { verb: 'get', resources: ['pods'] });
  assert.equal(r.pass, false);
  assert.ok(r.checks.some((c) => !c.ok));
});
