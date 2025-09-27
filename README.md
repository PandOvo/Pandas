# 🎭 AI 角色扮演互动平台

这是一个基于 **Flask + 前端静态页面** 的 AI 角色扮演互动平台，支持用户选择或自定义角色，与 AI 进行沉浸式对话。

---

## 📂 项目结构
```
ai-roleplay/
├── app.py               # Flask 后端入口
├── requirements.txt     # Python 依赖
├── .env                 # 环境变量配置（需手动创建，存放 API_KEY）
├── roles.json           # 内置角色配置文件
├── static/              # 前端静态资源
│   ├── index.html       # 前端页面
│   ├── app.js           # 前端逻辑
│   └── style.css        # 页面样式
├── ARCHITECTURE.md      # 架构设计文档
├── README.md            # 使用说明
└── demo/                # Demo 演示视频
    └── demo.mp4
```

---

## 🚀 快速启动

1. 克隆仓库
   ```bash
   git clone https://github.com/你的账号/Pandas.git
   cd ai-roleplay
   ```

2. 创建虚拟环境并安装依赖
   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   source venv/bin/activate # macOS / Linux

   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. 配置环境变量  
   在项目根目录下创建 `.env` 文件，内容如下：
   ```
   OPENAI_API_KEY=你的key
   ```

4. 启动项目
   ```bash
   python app.py
   ```

5. 浏览器访问
   ```
   http://127.0.0.1:5000
   ```

---

## 🎥 Demo 演示

本项目提供一段约 **5 分钟** 的演示视频，涵盖以下内容：
- 项目启动
- 默认角色对话
- 语音输入
- 自定义角色
- 清空会话

👉 [点击这里观看 Demo 视频](demo/demo.mp4)

---

## 🏗 架构设计

详见 [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 👥 作者

- PandOvo 
