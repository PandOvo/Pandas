# 🎭 AI 角色扮演互动平台

## 📖 项目简介
这是一个基于 **Flask + 前端网页** 的 AI 角色扮演互动平台。  
用户可以选择或自定义角色，与 AI 进行沉浸式的对话，支持语音输入和语音播报。  

本平台旨在模拟不同人物（如哈利波特、诸葛亮等）的风格，提供娱乐、陪伴与学习体验。  

---

## ✨ 功能特性
- ✅ 角色选择：内置角色（如哈利波特），支持自定义角色。  
- ✅ 对话记忆：开启后可保持上下文记忆。  
- ✅ 语音交互：支持语音输入与语音播报。  
- ✅ UI 美化：现代化界面，支持左右分栏布局（聊天 + 角色管理）。  
- ✅ 聊天气泡：用户与 AI 对话气泡展示，并带有时间戳。  

---

## 💻 运行环境
- **Python** 3.8+  
- **Node.js**   
- 浏览器建议 **Google Chrome**。  

---

## 📦 安装步骤
1. 克隆项目
   ```bash
   git clone https://github.com/PandOvo/Pandas.git
   cd Pandas
   ```

2. 创建虚拟环境并安装依赖
   ```bash
   python -m venv venv
   source venv/bin/activate   # Mac/Linux
   venv\Scripts\activate      # Windows

   pip install -r requirements.txt
   ```

3. 运行后端服务
   ```bash
   python app.py
   ```

4. 打开浏览器访问：
   ```
   http://127.0.0.1:5000
   ```

---

## 🚀 使用说明
1. 打开网页，选择内置角色（如“哈利波特”）。  
2. 在输入框输入对话内容，点击「发送」。  
3. 若勾选「语音播报」，AI 回复会自动朗读。  
4. 点击「➕ 自定义角色」可以创建新角色：  
   - 名称  
   - 简介  
   - 人格设定（system prompt）  

---

## 🏗️ 架构概览
```
E盘/Projects/ai-roleplay
│── app.py          # Flask 后端，提供 API
│── index.html      # 前端页面
│── style.css       # 样式文件
│── app.js          # 前端逻辑（消息处理、语音、角色管理）
│── roles.json      # 角色配置文件
│── requirements.txt# Python 依赖
│── README.md       # 使用说明
```

- **前端**  
  - `index.html`：页面框架（导航栏、聊天区、侧边栏）  
  - `style.css`：整体 UI 样式  
  - `app.js`：前端逻辑（发送消息、渲染对话气泡、调用语音 API）  

- **后端**  
  - `Flask` 提供 REST API（聊天 `/api/chat`，角色管理 `/api/roles`，清空会话 `/api/clear` 等）。  
  - 会话状态存储在内存中，区分不同 session_id。  

---

## 📝 更新日志

### Day 1
- 初始化项目结构（Flask 后端 + 前端页面）。  

### Day 2
- 新增自定义角色功能（可添加名称、简介、system prompt）。  

### Day 3
- UI 美化：导航栏、聊天框、输入栏重新排版。  

### Day 4
- 左右分栏布局：左侧聊天窗口，右侧角色管理。  

### Day 5
- 聊天气泡优化：增加时间戳，消息展示更直观。  

### Day 6
- 演示文档更新，Demo录制  

---

## 🎥 Demo 演示
1. 打开网页  
2. 选择角色（如哈利波特）  
3. 输入一句话，AI 回复  
4. 创建自定义角色（如“诸葛亮”）并对话  
5. 展示语音播报功能  

---

## 📄 License
MIT License
