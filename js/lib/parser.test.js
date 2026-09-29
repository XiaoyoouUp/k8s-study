import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand, suggestResource, canonicalResource } from './parser.js';

function ok(line, expect = {}) {
  const r = parseCommand(line);
  const msgs = r.errors.map((e) => `${e.code}:${e.message}`).join(' | ');
  assert.equal(r.ok, true, `expected OK for "${line}", got errors: ${msgs}`);
  if (expect.verb !== undefined) assert.equal(r.verb, expect.verb, `verb of "${line}"`);
  if (expect.sub !== undefined) assert.equal(r.sub, expect.sub, `sub of "${line}"`);
  if (expect.resource !== undefined)
    assert.equal(r.resources[0], expect.resource, `resource of "${line}" (got ${JSON.stringify(r.resources)})`);
  if (expect.names !== undefined)
    assert.deepEqual(r.resourceNames, expect.names, `names of "${line}"`);
  if (expect.flag !== undefined) {
    for (const [k, v] of Object.entries(expect.flag))
      assert.deepEqual(r.flags[k], v, `flag ${k} of "${line}" (got ${JSON.stringify(r.flags[k])})`);
  }
  return r;
}

function fail(line, codePart) {
  const r = parseCommand(line);
  assert.equal(r.ok, false, `expected errors for "${line}"`);
  if (codePart) assert.ok(r.errors.some((e) => e.message.includes(codePart)),
    `expected error mentioning "${codePart}", got: ${JSON.stringify(r.errors)}`);
  return r;
}

/* ---------- 基础解析 ---------- */
test('get pods 基础', () => ok('kubectl get pods', { verb: 'get', resource: 'pods' }));
test('别名 po 与缩写 k', () => ok('k get po', { verb: 'get', resource: 'pods' }));
test('全局旗标 -A', () => ok('kubectl get pods -A', { resource: 'pods', flag: { 'all-namespaces': true } }));
test('-n 指定命名空间', () =>
  ok('kubectl get pods -n kube-system -o wide', { resource: 'pods', flag: { namespace: 'kube-system', output: 'wide' } }));
test('动词前的全局旗标', () => ok('kubectl -n study get pods', { resource: 'pods', flag: { namespace: 'study' } }));
test('= 赋值形式与长旗标', () => ok('kubectl get pods --output=yaml', { flag: { output: 'yaml' } }));
test('deploy 别名归一', () => ok('kubectl get deploy,svc', { resource: 'deployments' }) && ok('kubectl get deploy web', { resource: 'deployments', names: ['web'] }));
test('TYPE/NAME 形式', () => ok('kubectl describe pod/nginx-1', { verb: 'describe', resource: 'pods', names: ['nginx-1'] }));
test('多个名称', () => ok('kubectl delete pod nginx web', { resource: 'pods', names: ['nginx', 'web'] }));
test('带引号的名称', () => ok('kubectl logs "my pod"', { names: ['my pod'] }));
test('api 资源不带名字', () => ok('kubectl get pods', { names: [] }));

/* ---------- 错误与提示 ---------- */
test('空命令', () => fail('  ', ''));
test('不支持的程序', () => fail('helm install x', 'kubectl'));
test('未知动词给出建议', () => {
  const r = fail('kubectl gt pods', 'get');
  assert.ok(r.suggestions.length > 0);
});
test('未知资源给出建议', () => {
  const r = fail('kubectl get podz', 'pods');
  assert.ok(r.suggestions.some((s) => s.includes('pods')));
});
test('未知旗标', () => fail('kubectl get pods --replcas=3', 'replcas'));
test('纯 kubectl 无动词', () => fail('kubectl', ''));
test('-x 未定义短旗标', () => fail('kubectl get pods -x'));

/* ---------- scale / 数值校验 ---------- */
test('scale 合法', () => ok('kubectl scale deployment nginx --replicas=5', { verb: 'scale', resource: 'deployments', names: ['nginx'], flag: { replicas: '5' } }));
test('scale 缺 --replicas', () => fail('kubectl scale deployment nginx', '--replicas'));
test('scale replicas 非数字', () => fail('kubectl scale deployment nginx --replicas=abc', '整数'));
test('scale 负数 replicas', () => fail('kubectl scale deployment nginx --replicas=-1', '整数'));

/* ---------- logs ---------- */
test('logs 需要目标', () => fail('kubectl logs', 'Pod'));
test('logs -f --tail', () => ok('kubectl logs mypod -f --tail=100', { names: ['mypod'], flag: { follow: true, tail: '100' } }));
test('logs tail 非数字', () => fail('kubectl logs mypod --tail=abc', '整数'));
test('logs deploy/xxx 合法', () => ok('kubectl logs deploy/web', { resource: 'deployments', names: ['web'] }));

/* ---------- exec ---------- */
test('exec 双横线形式', () => ok('kubectl exec mypod -- ls -la /usr', { names: ['mypod'] }));
test('exec -it 组合短旗标', () => ok('kubectl exec -it mypod -- sh', { flag: { stdin: true, tty: true } }));
test('exec 无 -- 有警告', () => {
  const r = ok('kubectl exec mypod ls', {});
  assert.ok(r.warnings.length > 0);
});
test('exec 缺 Pod', () => fail('kubectl exec -- ls', 'Pod'));

/* ---------- apply / create / run ---------- */
test('apply -f', () => ok('kubectl apply -f pod.yaml', { flag: { filename: 'pod.yaml' } }));
test('apply 缺 -f/-k', () => fail('kubectl apply', '-f'));
test('apply -k 目录', () => ok('kubectl apply -k overlays/prod', { flag: { kustomize: 'overlays/prod' } }));
test('create deployment --image', () => ok('kubectl create deployment web --image=nginx:1.25', { resource: 'deployments', names: ['web'] }));
test('create 缺 --image', () => fail('kubectl create deployment web', '--image'));
test('create --image 格式错误', () => fail('kubectl create deployment web --image=nginx:1:2', '镜像'));
test('run --image', () => ok('kubectl run nginx --image=nginx', { names: ['nginx'] }));
test('run 缺 --image', () => fail('kubectl run nginx', '--image'));

/* ---------- delete / label / annotate / taint ---------- */
test('delete 全部 Pod 合法', () => ok('kubectl delete pods --all', { flag: { all: true } }));
test('label key=value', () => ok('kubectl label pods nginx env=prod', { names: ['nginx'] }));
test('label 缺 key=value', () => fail('kubectl label pods nginx env', 'key=value'));
test('label 移除 env-', () => ok('kubectl label pods nginx env-', {}));
test('taint 格式', () => fail('kubectl taint nodes n1 key=value', 'effect'));
test('taint 合法', () => ok('kubectl taint nodes n1 key=value:NoSchedule', {}));

/* ---------- 子命令动词 ---------- */
test('rollout status', () => ok('kubectl rollout status deployment/nginx', { verb: 'rollout', sub: 'status', resource: 'deployments', names: ['nginx'] }));
test('rollout restart deploy', () => ok('kubectl rollout restart deploy/web', { sub: 'restart', resource: 'deployments' }));
test('rollout 非法子命令', () => fail('kubectl rollout foo deploy/web', 'status'));
test('top nodes', () => ok('kubectl top nodes', { sub: 'node', resource: 'nodes' }));
test('config use-context', () => ok('kubectl config use-context ctx1', { sub: 'use-context', names: ['ctx1'] }));
test('set image 合法', () => ok('kubectl set image deployment/web web=nginx:1.26', { resource: 'deployments' }));
test('set image 缺容器=镜像', () => fail('kubectl set image deployment/web webnginx', '='));

/* ---------- 其他动词 ---------- */
test('port-forward pod 8080:80', () => ok('kubectl port-forward pod/mypod 8080:80', { resource: 'pods', names: ['mypod'] }));
test('port-forward 端口格式错误', () => fail('kubectl port-forward pod/mypod abc:80', '端口'));
test('drain 节点', () => ok('kubectl drain node1 --ignore-daemonsets', { resource: 'nodes', names: ['node1'] }));
test('cordon 缺节点名', () => fail('kubectl cordon', '节点'));
test('explain 合法', () => ok('kubectl explain pods.spec', {}));
test('version --short 合法', () => ok('kubectl version --short', {}));
test('cp 需要两个参数', () => fail('kubectl cp a.txt', '两个参数'));
test('cp 合法', () => ok('kubectl cp a.txt pod/mypod:/tmp/a.txt', {}));
test('get -l 选择器', () => ok('kubectl get pods -l app=nginx,tier=web', { flag: { selector: 'app=nginx,tier=web' } }));
test('get -l 空键选择器非法', () => fail('kubectl get pods -l ==web', '选择器'));
test('get -l 存在性选择器合法（真实 kubectl 行为）', () => ok('kubectl get pods -l app', { flag: { selector: 'app' } }));

/* ---------- 工具函数 ---------- */
test('canonicalResource', () => {
  assert.equal(canonicalResource('po'), 'pods');
  assert.equal(canonicalResource('deploy'), 'deployments');
  assert.equal(canonicalResource('svc'), 'services');
  assert.equal(canonicalResource('ingress'), 'ingresses');
});
test('suggestResource 模糊建议', () => {
  assert.ok(suggestResource('podz').includes('pods'));
  assert.ok(suggestResource('deploymnt').includes('deployments'));
});
