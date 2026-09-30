# K8s 学练营

系统化学习 Kubernetes 的免费开源学习网站：**图文课程 + 随堂测验 + 阶段考试 + kubectl 在线命令练习**，全程对标 CNCF **CKA** 认证考纲。

纯静态站点（原生 JS，无构建、无外部依赖），克隆后本地即可运行（见下）。

## 功能

- 📚 **6 个学习阶段 · 27 课**：基础入门 → 工作负载 → 服务网络与存储 → 配置管理与安全 → 集群运维与故障排查 → CKA 认证冲刺。每课配原创 SVG 图解（共 22 张）、带模拟输出的命令示例、随堂测验（142 题）
- ⌨️ **命令练习场**：浏览器内的 kubectl 终端。命令解析器对动词、资源类型、旗标、取值做语法与用法校验（错误给修正建议）；内置模拟集群展示 get/describe/logs/top 等输出；**53 个练习任务**按 入门/进阶/挑战 分级，逐条判定命令正确性
- 📝 **考试系统**：6 个阶段结业考试 + CKA 全真模拟考试（共 94 道选择/判断题 + 22 道实操任务），限时倒计时、实操任务在线校验、逐题解析、成绩存档
- 📄 **命令速查表**：11 个场景分类 + CKA 考试加速技巧（`--dry-run=client -o yaml` 等），可一键送入练习场
- 📊 **进度追踪**：课程完成度、测验与考试成绩保存在浏览器 localStorage
- 🖥️ **阅读体验**：内容区宽度三档可调（标准/宽/全宽）、移动端适配

纯静态站点（原生 JS，无构建、无外部依赖），克隆即用。

## 本地运行

```bash
git clone https://github.com/XiaoyoouUp/k8s-study.git
cd k8s-study
npx serve .          # 或 python -m http.server 8080
```

> 必须通过 HTTP 访问（ES 模块限制），不能直接双击 index.html。

## 测试（三层）

```bash
npm test                              # 1. 单元测试：解析器/任务判定/模拟集群（85 用例）
node scripts/validate_content.mjs     # 2. 内容校验：课程/考试/任务数据合法性与自洽性
npx serve -l 8080 . &                 # 3. 浏览器回归（需先起服务 + playwright）
python scripts/full_regression.py     #    爬全部页面：渲染/图/考试流程/零 JS 错误
```

## 文档

| 文档 | 内容 |
|---|---|
| [docs/development.md](docs/development.md) | **开发指南**：架构、常见改动步骤（加课/加题/扩展解析器）、测试与发布流程、排障 |
| [docs/content-contract.md](docs/content-contract.md) | 课程数据契约：block 类型、题目与考试结构、图库清单、语言风格 |

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
  lib/parser.js       kubectl 命令解析器（核心，TDD）
  lib/mockcluster.js  模拟集群
  lib/tasks.js        任务判定引擎 + 内置任务
data/
  stages/s1..s6.js    阶段课程数据
  exams/*.js          阶段考试与 CKA 模拟考
  reference.js        速查表数据
diagrams/*.svg        原创图解（22 张）
docs/                 开发指南与内容契约
scripts/              测试与校验脚本
```

## 声明

课程内容基于 Kubernetes 官方文档与 CNCF 考纲整理，仅供学习参考。CKA®、CKAD®、CKS® 与 Kubernetes® 为 Linux 基金会 / CNCF 商标。真题以 [cncf.io/training](https://www.cncf.io/training/certification/cka/) 为准。
