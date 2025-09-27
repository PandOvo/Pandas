# 🏗️ 架构设计文档 - AI 角色扮演互动平台

## 📖 概述
本系统是一个 AI 角色扮演互动平台，基于 Flask 提供后端 API，前端通过 HTML/CSS/JS 与用户交互，支持语音输入/播报、角色管理和上下文记忆。

---

## 📦 模块划分

### 1. 前端模块（`static/`）
- **index.html**  
  提供页面框架（聊天窗口 + 工具栏 + 自定义角色侧栏）。

- **style.css**  
  页面样式，支持气泡化 UI、时间戳显示、响应式布局。

- **app.js**  
  - 角色加载与切换  
  - 消息渲染（含头像、气泡、时间戳）  
  - 与后端 API 通信  
  - 语音输入（ASR）与语音播报（TTS）  
  - 状态提示（正在输入 / 发送中）

---

### 2. 后端模块（Flask - `app.py`）
- **静态页面路由**  
  返回 `static/index.html`

- **API 路由**  
  - `GET /api/roles`：获取角色列表  
  - `POST /api/roles`：新增角色  
  - `POST /api/chat`：提交消息，返回 LLM 回复  
  - `POST /api/clear`：清空上下文  
  - `POST /api/feedback`：用户反馈接口（可选）

- **内存存储**  
  使用 Python 字典存储 session 对话历史。

---

### 3. 数据配置
- **roles.json**：预置角色与自定义角色存储  
- **.env**：API Key 与模型配置（开发环境用，不提交仓库）

---

## 🔄 数据流
1. 用户输入（文本/语音） → `app.js`  
2. `fetch` 调用 Flask `/api/chat`  
3. Flask 处理，调用 OpenAI API  
4. 返回结果给前端，渲染为气泡（附时间戳）  
5. 可选语音播报（TTS）

---

## 👥 分工建议
- **前端开发**：负责页面布局、UI 设计、JS 功能（ASR/TTS）  
- **后端开发**：负责 Flask API、上下文管理、调用 LLM  
- **测试与文档**：确保功能正常，编写 README 与架构文档  
