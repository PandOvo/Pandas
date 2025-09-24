// ====== 工具与全局 ======
const $ = (id) => document.getElementById(id);
const els = {
  role: $("role"), mem: $("mem"), tts: $("tts"),
  chat: $("chat"), box: $("box"), send: $("send"), mic: $("mic"),
  eval: $("eval"), clear: $("clearBtn"),
  rn: $("rn"), rd: $("rd"), rsp: $("rsp"), save: $("save"), cancel: $("cancel"),
};

const sid = localStorage.getItem("session_id") || (crypto.randomUUID?.() || String(Date.now()));
localStorage.setItem("session_id", sid);

let lastPair = { user: "", reply: "" };

// 确保 chat 里有内层容器，消息都插这里
function getChatBody() {
  let body = document.getElementById("chatBody");
  if (!body) {
    body = document.createElement("div");
    body.id = "chatBody";
    els.chat.appendChild(body);
  }
  return body;
}

// ====== 角色加载 ======
async function loadRoles() {
  const r = await fetch("/api/roles");
  const data = await r.json();
  els.role.innerHTML = "";
  (data.roles || []).forEach((x) => {
    const opt = document.createElement("option");
    opt.value = x.id;
    opt.textContent = `${x.name}：${x.desc || ""}`;
    els.role.appendChild(opt);
  });
}

// ====== UI：头像 + 气泡 ======
function createMsg(role, text) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "🙂" : "🤖";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  // user 在右，bot 在左
  if (role === "user") {
    wrap.appendChild(bubble);
    wrap.appendChild(avatar);
  } else {
    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
  }
  return wrap;
}

function push(role, text) {
  const node = createMsg(role, text);
  getChatBody().appendChild(node);
  els.chat.scrollTop = els.chat.scrollHeight;
}

// ====== TTS（浏览器内置）======
function speak(text) {
  if (!els.tts.checked) return;
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1; u.pitch = 1;
  window.speechSynthesis.speak(u);
}

// ====== 发送消息 ======
async function sendText(txt) {
  if (!txt || !txt.trim()) return;

  push("user", txt);
  els.box.value = "";
  els.send.disabled = true;
  els.mic.disabled = true;

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sid,
        role_id: els.role.value,
        text: txt,
        use_memory: els.mem.checked,
      }),
    });
    const data = await r.json();
    if (data.error) { push("bot", "⚠️ " + data.error); return; }

    push("bot", data.reply);
    speak(data.reply);
    lastPair = { user: txt, reply: data.reply };

    const meta = data.auto_eval || { score: 0, reasons: [] };
    els.eval.textContent = `自动评分：${meta.score}/3  ${meta.reasons.join(" · ")}`;
  } catch (e) {
    push("bot", "网络错误：" + e.message);
  } finally {
    els.send.disabled = false;
    els.mic.disabled = false;
  }
}

// ====== 事件绑定 ======
els.send.addEventListener("click", () => sendText(els.box.value));
els.box.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(els.box.value); }
});

// 清空会话
els.clear.addEventListener("click", async () => {
  await fetch("/api/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sid }),
  });
  getChatBody().innerHTML = "";
  els.eval.textContent = "";
  push("bot", "✅ 已清空会话。");
});

// 右侧：保存/取消新角色
els.save.addEventListener("click", async () => {
  const name = els.rn.value.trim();
  const desc = els.rd.value.trim();
  const sp   = els.rsp.value.trim();
  if (!name || !sp) { alert("名称与人格设定不能为空"); return; }

  const r = await fetch("/api/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, desc, system_prompt: sp }),
  });
  const data = await r.json();
  if (data.error) { alert(data.error); return; }

  // 清空输入并刷新角色列表
  els.rn.value = els.rd.value = els.rsp.value = "";
  await loadRoles();
  els.role.value = data.role_id;
  push("bot", `✅ 已创建新角色：${name}`);
});

els.cancel.addEventListener("click", () => {
  els.rn.value = els.rd.value = els.rsp.value = "";
});

// 语音识别（Chrome）
let rec = null, recog = false;
if ("webkitSpeechRecognition" in window) {
  rec = new webkitSpeechRecognition();
  rec.lang = "zh-CN"; rec.continuous = false; rec.interimResults = false;
  rec.onresult = (e) => { const t = e.results[0][0].transcript; sendText(t); };
  rec.onerror = (e) => push("bot", "🎙️ 识别出错：" + e.error);
  rec.onend = () => { recog = false; els.mic.textContent = "🎤"; };
}
els.mic.addEventListener("click", () => {
  if (!rec) { push("bot", "当前浏览器不支持语音识别（建议 Chrome）。"); return; }
  if (!recog) { rec.start(); recog = true; els.mic.textContent = "■ 停止"; }
  else { rec.stop(); }
});

// ====== 初始化 ======
window.onload = async () => {
  await loadRoles();
  push("bot", "你好！选择一个角色开始对话吧～ 支持“自定义角色”“语音输入/播报”。");
};
