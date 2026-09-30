/* K8s 学练营 Service Worker：全量预缓存——首次打开后可完全离线使用。
 * 更新内容时把 CACHE 版本号 +1，旧缓存会在 activate 阶段自动清除。 */
const CACHE = 'k8s-study-v1';
const ASSETS = [
  "./css/style.css",
  "./data/exams/exam-final.js",
  "./data/exams/exam1.js",
  "./data/exams/exam2.js",
  "./data/exams/exam3.js",
  "./data/exams/exam4.js",
  "./data/exams/exam5.js",
  "./data/reference.js",
  "./data/stages/s1.js",
  "./data/stages/s2.js",
  "./data/stages/s3.js",
  "./data/stages/s4.js",
  "./data/stages/s5.js",
  "./data/stages/s6.js",
  "./diagrams/api-object-model.svg",
  "./diagrams/architecture.svg",
  "./diagrams/containers-vs-vms.svg",
  "./diagrams/deployment-rs-pod.svg",
  "./diagrams/etcd-backup.svg",
  "./diagrams/networking-flow.svg",
  "./diagrams/pod-lifecycle.svg",
  "./diagrams/pod-troubleshoot.svg",
  "./diagrams/rbac-flow.svg",
  "./diagrams/request-lifecycle.svg",
  "./diagrams/scheduling-flow.svg",
  "./diagrams/service-types.svg",
  "./diagrams/stage-4-config-injection.svg",
  "./diagrams/stage-4-pod-security.svg",
  "./diagrams/stage-4-qos.svg",
  "./diagrams/stage-5-kubeadm-lifecycle.svg",
  "./diagrams/stage-5-node-troubleshoot.svg",
  "./diagrams/stage-5-observability.svg",
  "./diagrams/stage-6-exam-env.svg",
  "./diagrams/stage-6-exam-map.svg",
  "./diagrams/stage-6-path.svg",
  "./diagrams/storage-flow.svg",
  "./diagrams/workload-types.svg",
  "./index.html",
  "./js/app.js",
  "./js/components.js",
  "./js/data.js",
  "./js/lib/mockcluster.js",
  "./js/lib/parser.js",
  "./js/lib/tasks.js",
  "./js/playground.js",
  "./js/quiz.js",
  "./js/store.js"
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) =>
      hit ||
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
