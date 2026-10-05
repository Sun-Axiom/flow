# 项目流管理器 (Project Flow Manager)

一个基于 Cloudflare Pages + Workers + D1 数据库打造的轻量级、高颜值的全栈项目流程追踪管理系统。支持灵活定制流程模板、项目阶段管理、归档搜索、操作日志记录以及暗号鉴权保护。

---

## ✨ 核心功能

* **项目全生命周期管理**：支持新建项目、自定义推进阶段、实时进度条展示、置顶卡片与项目归档。
* **流程模板高度自定义**：自由创建分类与流程，支持动态增加、修改、删减流程节点与步骤。
* **强大的归档与检索**：支持按年份、流程分类快速筛选归档项目，提供全局项目/单位名称模糊搜索。
* **安全与隐私保障**：内置 HTTP Header (`X-Auth-Token`) 简单口令鉴权机制，防护后端 API。
* **极佳的用户体验**：支持浅色/深色（Dark Mode）主题一键切换，响应式适配移动端与桌面端。

---

## 🛠 快速上手与操作指南

### 1. 初次登录鉴权

* 首次打开页面或在执行数据写入时，系统会弹出提示框要求输入**访问暗号**。
* 输入正确暗号后将自动保存在浏览器的本地存储中，无需重复输入。

### 2. 流程模板配置（⚙️ 流程设置）

1. 点击顶部导航栏的 **⚙️ 流程设置** 按钮。
2. 点击右上角的 **✍️ 修改模式**：
* **新增分类**：点击 `+ 分类` 快速创建新的业务大类。
* **新增流程**：选择对应分类后，点击 `+ 流程` 创建新工作流。
* **调整步骤**：在每个流程卡片中，可修改流程名称、增删步骤节点。


3. 修改完成后再次点击 **🔒 锁定** 或直接保存。

### 3. 项目推进与归档

* **新建项目**：点击 **+ 新建项目**，在下拉列表中选择已配置好的流程模板并填写项目信息。
* **推进阶段**：在项目卡片中选择当前所处的步骤，进度条会自动更新并记录变动时间轴。
* **项目置顶**：点击卡片右上角的 📌 图标即可固定在最顶部。
* **归档与删除**：项目完成后点击 **归档该项目**；在归档库中可将其一键还原，或点击 `×` 进行永久删除。

---

## 🚀 部署教程

本项目的架构为 **前端静态页面 (Cloudflare Pages)** + **后端 API (Cloudflare Workers)** + **云端 SQLite (Cloudflare D1 Database)**。由于 Cloudflare 提供了免费额度，整个部署过程完全免费。

### 前置准备

* 注册一个 [Cloudflare 账号](https://dash.cloudflare.com/)。
* 一个 [GitHub 账号](https://github.com/)（用于托管前端代码并与 Cloudflare Pages 联动）。

---

### 第一步：创建 D1 数据库并初始化表结构

1. 登录 Cloudflare Dashboard，点击左侧菜单栏的 **存储和数据库** -> **D1 数据库**。
2. 点击 **创建数据库**，输入数据库名称（例如 `project-db`），点击 **创建**。
3. 进入刚创建好的数据库，切换到 **控制台 (Console)** 选项卡。
4. 在 SQL 查询框中输入以下建表语句并点击 **执行 (Execute)**：

```sql
-- 1. 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    n TEXT NOT NULL,
    tpl TEXT,
    un TEXT,
    am REAL,
    s INTEGER,
    memo TEXT,
    isArchived INTEGER DEFAULT 0,
    isPinned INTEGER DEFAULT 0,
    logs TEXT,
    archivedAt INTEGER,
    createdAt INTEGER
);

-- 2. 创建流程模板表
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cat TEXT,
    steps TEXT
);

```

---

### 第二步：部署后端 API (Cloudflare Workers)

1. **创建 Worker 应用**：
* 登录 Cloudflare Dashboard，点击左侧菜单栏 **Workers 和 Pages** -> **概述**。
* 点击 **创建** -> 选择 **创建 Worker**。
* 设置你的 Worker 名称（例如 `flow-api`），点击右下角 **部署**。


2. **粘贴后端代码**：
* 点击页面右上角或中部的 **编辑代码** 按钮进入在线编辑器。
* 清空原有内容，将项目代码中的 `src/worker.js` 完整内容复制并粘贴进去。
* 点击右上角 **保存并部署 (Save and Deploy)**。


3. **绑定 D1 数据库**：
* 返回当前 Worker 的管理页面（点击左上角 Worker 名称）。
* 进入 **设置 (Settings)** 选项卡 -> 选择左侧的 **变量 (Variables)**。
* 找到 **D1 数据库绑定 (D1 Database Bindings)** 区域，点击 **添加绑定**。
* **变量名称 (Variable name)**：必须精确填入 `DB`（严格区分大小写，否则后端无法访问数据库）。
* **D1 数据库 (D1 Database)**：选择你在第一步中创建的 D1 数据库（例如 `project-db`）。


4. **配置安全暗号 (AUTH_KEY)**：
* 在同一页面的 **环境变量 (Environment Variables)** 区域，点击 **添加**。
* **变量名称 (Variable name)**：`AUTH_KEY`
* **值 (Value)**：设置你自己定义的系统访问口令/暗号（例如 `MySuperSecretPass123`）。


5. **重新部署与获取 URL**：
* 完成变量绑定后，点击页面下方的 **保存并部署** 使配置生效。
* 在 Worker 概览页面中找到分配的访问域名（形式如 `[https://flow-api.xxxx.workers.dev](https://flow-api.xxxx.workers.dev)`），将其复制保存。
* ⚠️ **重要提示**：复制的 URL **末尾千万不要带斜杠 `/**`。



---

### 第三步：配置前端代码并托管 (Cloudflare Pages)

1. **建立 GitHub 代码仓库**：
* 在 GitHub 上新建一个 Repository（例如 `project-flow-manager`）。
* 确保你的目录结构如下所示：
```
├── public/
│   └── index.html
└── README.md

```




2. **修改前端 API 请求地址**：
* 打开 `public/index.html`，找到定义 `API_URL` 变量的位置（约第 112 行）：
```javascript
// ⚠️️ 请替换为你第二步获取的 Worker 域名（末尾不要带斜杠 /）
const API_URL = "https://flow-api.xxxx.workers.dev";

```


* 保存文件并提交推送至 GitHub 仓库（`git push`）。


3. **关联 Cloudflare Pages 自动部署**：
* 回到 Cloudflare Dashboard，点击 **Workers 和 Pages** -> **创建** -> 选择 **Pages** -> **连接到 git**。
* 授权并选择你刚创建的 GitHub 仓库，点击 **开始设置**。
* 构建配置如下：
* **框架预设 (Framework preset)**：选择 `None`。
* **构建输出目录 (Build output directory)**：填入 `public`（若 `index.html` 直接放置在根目录，则填入 `/` 或留空）。


* 点击 **保存并部署**，稍等数秒即可生成可全局访问的前端页面链接。



---

## 🔍 FAQ / 常见故障排查

* **问题 1：新建项目或流程后，刷新页面数据消失？**
* **原因**：前端 `API_URL` 地址配置错误，或者末尾多加了斜杠 `/`，导致接口请求变成了 `//templates` 触发 `404 Not Found`。
* **解决**：检查 `index.html` 中的 `API_URL`，确保末尾无斜杠（例如：`[https://your-worker.workers.dev](https://your-worker.workers.dev)`）。


* **问题 2：操作时提示 `Unauthorized: 暗号错误或未输入`？**
* **原因**：前端输入的暗号与 Worker 环境变量中配置的 `AUTH_KEY` 不一致。
* **解决**：点击页面右上角 **登出** 按钮清空本地存储，重新输入与后台配置完全相同的暗号。


* **问题 3：控制台报错 `SyntaxError: Unexpected token 'N'` 或 500 错误？**
* **原因**：Worker 未能连通数据库，通常是 D1 数据库绑定未完成或变量名填错。
* **解决**：进入 Worker 的 Settings -> Variables，检查 D1 绑定的变量名是否**精确为 `DB**`，并确认已经成功点击部署。
