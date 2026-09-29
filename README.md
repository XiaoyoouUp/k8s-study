# K8s 学练营

系统化学习 Kubernetes 的免费开源学习网站：**图文课程 + 随堂测验 + 阶段考试 + kubectl 在线命令练习**，全程对标 CNCF **CKA** 认证考纲。

在线访问：**https://xiaoyoouup.github.io/k8s-study/**

## 功能

- 📚 **6 个学习阶段**（约 26 课）：基础入门 → 工作负载 → 网络与存储 → 配置与安全 → 运维与排障 → CKA 认证冲刺，每课配原创 SVG 图解、命令示例（含输出）、随堂测验
- ⌨️ **命令练习场**：浏览器内的 kubectl 终端。命令解析器对动词、资源类型、旗标、取值做语法与用法校验（错误给出修正建议）；内置模拟集群展示 get/describe/logs/top 等输出；24 个练习任务逐条判定正确性
- 📝 **考试系统**：6 个阶段结业考试 + CKA 全真模拟考试（限时倒计时、实操任务在线校验、逐题解析、成绩存档）
- 📄 **命令速查表**：按场景分类 + CKA 考试加速技巧（`--dry-run=client -o yaml` 等）
- 📊 **进度追踪**：课程完成度、测验与考试成绩保存在浏览器 localStorage

纯静态站点（原生 JS，无构建、无外部依赖），克隆即用。

## 本地运行

```bash
git clone https://github.com/XiaoyoouUp/k8s-study.git
cd k8s-study
npx serve .          # 或 python -m http.server 8080
# 打开 http://localhost:3000（serve）或 http://localhost:8080（python）
```

> 必须通过 HTTP 访问（ES 模块限制），不能直接双击 index.html。

## 测试

命令解析器 / 任务判定 / 模拟集群均有单元测试（TDD 开发）：

```bash
npm test
```

## 目录结构

```
index.html            站点入口
css/style.css         设计系统
js/
  app.js              路由与页面
  components.js       内容块渲染
  quiz.js             测验引擎
  playground.js       命令练习场 UI
  store.js            进度存储
  data.js             数据注册表
  lib/parser.js       kubectl 命令解析器（核心）
  lib/mockcluster.js  模拟集群
  lib/tasks.js        任务判定与内置任务
data/
  stages/s1..s6.js    阶段课程数据
  exams/*.js          阶段考试与 CKA 模拟考
  reference.js        速查表数据
diagrams/*.svg        原创图解
docs/content-contract.md  课程数据契约
```

## 路线图

- [ ] 练习场支持可变更的模拟集群（apply/scale 后状态真实变化）
- [ ] CKAD / CKS 专项题库
- [ ] 错题本与间隔复习

## 声明

课程内容基于 Kubernetes 官方文档与 CNCF 考纲整理，仅供学习参考。CKA®、CKAD®、CKS® 与 Kubernetes® 为 Linux 基金会 / CNCF 商标。真题以 [cncf.io/training](https://www.cncf.io/training/certification/cka/) 为准。
