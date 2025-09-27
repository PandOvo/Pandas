# 🎭 AI 角色扮演互动平台

## 📖 项目简介
这是一个基于 **Flask + 前端网页** 的 AI 角色扮演互动平台。  
用户可以选择或自定义角色，与 AI 进行沉浸式的对话，支持语音输入（ASR）和语音播报（TTS）。  
项目满足赛题合规：**仅调用 LLM/ASR/TTS，未使用第三方 Agent 或 RAG 框架**。

---

## ✨ 功能特性
- 角色选择 & 自定义角色（名称/简介/System Prompt）
- 会话记忆（可开关）
- 语音输入（浏览器 `webkitSpeechRecognition`）与语音播报（`SpeechSynthesis`）
- 现代化 UI：消息气泡（含头像与时间戳）、“正在输入…/发送中…”
- 轻量部署：无需前端构建工具，`pip install -r requirements.txt` 即可运行

---

## 🗂 目录结构（以当前项目为准）
```
ai-roleplay/
├─ static/
│  ├─ app.js          # 前端逻辑
│  ├─ index.html      # 前端页面
│  └─ style.css       # 页面样式
├─ .env               # 环境变量（本地自配，不入库）
├─ .gitignore
├─ app.py             # Flask 后端
├─ ARCHITECTURE.md    # 架构设计文档
├─ README.md          # 本说明文档
├─ requirements.txt   # 依赖清单
└─ roles.json         # 角色配置
```

> **注意**：因为 `index.html` 在 `static/` 下，`app.py` 里需要用 `send_from_directory('static', 'index.html')` 来返回首页。

---

## 💻 运行环境
- Python 3.8+
- 浏览器建议使用 **Google Chrome**
- 已在 Windows 下测试

---

## 📦 安装与启动
```bash
pip install -r requirements.txt
```

创建 `.env` 文件：
```env
OPENAI_API_KEY=你的OpenAI密钥
OPENAI_MODEL=gpt-4o-mini
```

运行：
```bash
python app.py
```
访问：`http://127.0.0.1:5000`

---

## 🚀 使用说明
1. 选择角色或自定义角色；  
2. 开启“记忆”保存上下文；  
3. 开启“语音播报”朗读回复；  
4. 输入框：**Enter 发送 / Shift+Enter 换行**；  
5. 点击“清空会话”清除上下文。

---

## 📝 更新日志
- **Day 6**：更新说明文档；Demo录制  
- **Day 5**：消息气泡增加时间戳；体验优化  
- **Day 4**：新增“对方正在输入…”与“发送中…”状态  
- **Day 3**：整体 UI 美化，修复对齐问题  
- **Day 2**：自定义角色侧栏与接口打通  
- **Day 1**：项目初始化（Flask + 前端基本对话）

---

## 📄 License
MIT
