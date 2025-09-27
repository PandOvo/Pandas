# 🏗️ 架构设计文档（AI 角色扮演互动平台）

> 目标：清晰说明系统架构、模块规格、接口契约、数据流与分工，辅助评审与后续维护。

---

## 1. 整体架构概览

```
┌──────────────┐        HTTP/JSON        ┌───────────────┐
│  Web 前端    │  <--------------------> │   Flask 后端   │
│ (HTML/CSS/JS)│                         │ (app.py, API) │
└──────┬───────┘                          └───────┬───────┘
       │ 语音 API (Browser)                        │ OpenAI SDK
       │                                           │(LLM: Chat)
┌──────▼───────┐                          ┌───────▼────────┐
│ SpeechRecognition│ (ASR)                │ OpenAI Chat API │
│ SpeechSynthesis  │ (TTS)                │ 生成角色回复     │
└────────────────┘                          └───────────────┘

本地存储：
- LocalStorage：session_id / 用户偏好
- roles.json：角色配置（预置 + 用户新增）
```

---

## 2. 模块划分与职责

### 2.1 前端（`templates/index.html` + `static/`）
- **index.html**：导航栏、聊天主区、侧栏表单（自定义角色）。
- **style.css**：布局与视觉（卡片化、气泡、头像、渐入动画、输入中指示）。
- **app.js**：
  - 事件绑定（发送、清空、保存角色、语音按钮、Enter 发送）。
  - 与后端交互（`/api/roles`、`/api/chat`、`/api/clear`、`/api/feedback`）。
  - UI 渲染（头像 + 气泡 + **时间戳**、“发送中…”、**“对方正在输入…”**）。
  - 语音：**ASR**（`webkitSpeechRecognition`）、**TTS**（`SpeechSynthesis`）。
  - 会话：使用 `localStorage` 维护 `session_id`。

### 2.2 后端（`app.py`，Flask）
- 暴露 REST API：角色管理、对话、清空会话、反馈。
- 职责：接收参数校验 → 组装 Prompt（含角色设定、可选对话记忆）→ 调用 OpenAI → 返回回复与评分元数据。

### 2.3 数据（持久化/配置）
- **roles.json**：角色对象数组（`id/name/desc/system_prompt`）。
- **会话数据**：以内存为主（简单），按 `session_id` 做区分；若扩展可落地（SQLite/Redis）。

---

## 3. API 契约（后端接口）

### 3.1 `GET /api/roles`
- **入参**：无
- **返回**：
```json
{
  "roles": [
    {"id": "hp", "name": "哈利波特", "desc": "魔法世界", "system_prompt": "..."}
  ]
}
```

### 3.2 `POST /api/roles`
- **入参**：
```json
{"name":"诸葛亮","desc":"三国谋士","system_prompt":"你是诸葛亮..."}
```
- **返回**：
```json
{"ok": true, "role_id": "auto_generated_id"}
```

### 3.3 `POST /api/chat`
- **入参**：
```json
{
  "session_id": "uuid",
  "role_id": "hp",
  "text": "你好",
  "use_memory": true
}
```
- **返回**：
```json
{
  "reply": "你好，我是哈利波特...",
  "auto_eval": {"score": 2, "reasons": ["风格匹配", "表达流畅"]}
}
```

### 3.4 `POST /api/clear`
- **入参**：
```json
{"session_id":"uuid"}
```
- **返回**：
```json
{"ok": true}
```

### 3.5 `POST /api/feedback`（可选）
- **入参**：
```json
{
  "session_id":"uuid",
  "role_id":"hp",
  "score": 1,
  "user_text":"...",
  "assistant_reply":"..."
}
```
- **返回**：
```json
{"ok": true}
```

---

## 4. 前后端交互与数据流

1. 前端加载 → `GET /api/roles` → 渲染角色下拉。
2. 用户输入文本 → `POST /api/chat`：
   - 前端：展示用户气泡、置“发送中…”，显示“对方正在输入…”。
   - 后端：读取角色设定 + 历史摘要（可选）→ 调用 OpenAI Chat → 返回回复与评分。
   - 前端：移除“输入中”，渲染 AI 气泡（带时间戳），可 TTS 朗读。
3. 用户清空 → `POST /api/clear`，前端重置视图。
4. 用户自定义角色 → `POST /api/roles` → 刷新下拉选项。

---

## 5. 关键规格（Spec）

### 5.1 角色对象
```json
{
  "id": "string",           // 唯一值（如 uuid 或 slug）
  "name": "string",         // 展示名
  "desc": "string",         // 简介（可选）
  "system_prompt": "string" // 人格设定（System Prompt）
}
```

### 5.2 会话记忆策略
- 默认按 `session_id` 聚合最近 N 轮对话摘要，作为 Chat 上下文（可开关）。
- 清空接口会重置该 `session_id` 的上下文。

### 5.3 安全与配额
- 后端读取环境变量 `OPENAI_API_KEY`、`OPENAI_MODEL`；不在前端暴露密钥。
- 配置请求超时与长度限制（防止超长 Prompt）。

---

## 6. 非功能性要求（NFR）

- **可用性**：关键路径（发消息 → 收到回复）应 < 3s（视模型/网络而定）。
- **可维护性**：前后端分离，样式与逻辑解耦；接口与数据结构有文档。
- **可扩展性**：可替换 LLM/TTS/ASR 实现（保留统一接口）。
- **合规性**：不接入第三方 Agent/RAG 框架；仅使用 LLM/ASR/TTS。

---

## 7. 部署与运行

- **开发**：`python app.py` 本地启动（Flask 内置服务器）。
- **生产**：建议 `gunicorn + gevent` 或 `uvicorn + fastapi`（如后续迁移），前置 Nginx 反代 / 静态资源缓存。
- **环境变量**：`.env`（本地）或部署平台的 Secret 管理（不入库）。

---

## 8. 分工建议（单人/多人通用）

- **前端**：UI/交互（HTML/CSS/JS）、语音调用、气泡组件、状态提示。
- **后端**：API 设计实现、会话与角色管理、模型调用与 Prompt 组装。
- **产品/文档**：需求梳理、说明文档（README/Architecture）、演示视频。
- **测试**：用例设计（功能/边界/异常），性能与可用性验证。

---

## 9. 测试清单（示例）

- 角色加载：GET `/api/roles` 返回列表。
- 基础对话：POST `/api/chat` 返回 `reply`。
- 记忆开关：`use_memory=true/false` 行为符合预期。
- 清空会话：POST `/api/clear` 后，回复不再携带历史。
- 自定义角色：POST `/api/roles` 新角色可用。
- 语音：Chrome 下 ASR/TTS 可用；其他浏览器优雅降级。

---

## 10. 未来扩展路线（Roadmap）

- 基础向量检索（自研最小 RAG：本地 embedding + 相似度检索），**不引入第三方 RAG 框架**。
- 多人/多角色同屏剧场式对话。
- 表情头像/Live2D 小组件增强沉浸感。
- 移动端适配与暗黑模式。
- 简易角色市场与分享。

---

**状态**：当前实现已满足“LLM + ASR + TTS + 记忆 + 自定义角色 + UI 体验”的要求；架构保持轻量、可替换与合规。
