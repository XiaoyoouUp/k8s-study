import test from 'node:test';
import assert from 'node:assert/strict';
import { getTable, describeResource, getLogs, simulate } from './mockcluster.js';

test('get pods 表格包含默认命名空间 Pod', () => {
  const t = getTable('pods', {});
  assert.match(t, /NAME/);
  assert.match(t, /nginx-deployment/);
});
test('get pods -A 包含 kube-system', () => {
  const t = getTable('pods', { allNamespaces: true });
  assert.match(t, /kube-system/);
});
test('get pods -n study 过滤命名空间', () => {
  const t = getTable('pods', { namespace: 'study' });
  assert.match(t, /study-app/);
  assert.doesNotMatch(t, /kube-system/);
});
test('get deployments 表格', () => {
  const t = getTable('deployments', {});
  assert.match(t, /READY/);
  assert.match(t, /web-ui/);
});
test('get -o name 仅输出名字', () => {
  const t = getTable('services', { output: 'name' });
  assert.match(t, /service\//);
});
test('get nodes 表格', () => {
  const t = getTable('nodes', {});
  assert.match(t, /Ready/);
  assert.match(t, /control-plane/);
});
test('describe 未知资源返回 NotFound', () => {
  const d = describeResource('pods', 'no-such-pod', 'default');
  assert.match(d, /NotFound/);
});
test('describe 已知 Pod 返回详情', () => {
  const d = describeResource('pods', 'nginx-deployment-7d4c8b9f6-abcde', 'default');
  assert.match(d, /Name:/);
});
test('logs 返回日志行', () => {
  const l = getLogs('nginx-deployment-7d4c8b9f6-abcde', {}, 'default');
  assert.ok(l.split('\n').length > 2);
});
test('logs 未知 Pod NotFound', () => {
  assert.match(getLogs('ghost', {}, 'default'), /NotFound/);
});
test('simulate: scale 输出 scaled', () => {
  const r = simulate('kubectl scale deployment web-ui --replicas=5', { verb: 'scale', resources: ['deployments'], resourceNames: ['web-ui'] });
  assert.match(r.text, /scaled/);
});
test('simulate: api-resources 有表头', () => {
  const r = simulate('kubectl api-resources', { verb: 'api-resources' });
  assert.match(r.text, /SHORTNAMES/);
});
