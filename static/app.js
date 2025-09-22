// 全局元素
const $ = (id) => document.getElementById(id);
const els = { role: $("role"), mem: $("mem"), tts: $("tts"), chat: $("chat"),
  box: $("box"), send: $("send"), mic: $("mic"), eval: $("eval"),
  addRoleBtn: $("addRoleBtn"), modal: $("modal"), rn: $("rn"), rd: $("rd"), rsp: $("rsp"),
  save: $("save"), cancel: $("cancel"), clear: $("clearBtn")
};
const sid = localStorage.getItem("session_id") || crypto.randomUUID();
localStorage.setItem("session_id", sid);

let lastPair = { user: "", reply: "" };

// 初始化角色
async function loadRoles() {
  const r = await fetch("/api/roles"); const data = await r.json();
  els.role.innerHTML = "";
  data.roles.forEach(x => {
    const opt = document.createElement("option");
    opt.value = x.id; opt.textContent = `${x.name}：${x.desc || ""}`;
    els.role.appendChild(opt);
  });
}

// UI 辅助
function push(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  els.chat.appendChild(div);
  els.chat.scrollTop = els.chat.scrollHeight;
}

function speak(text) {
  if (!els.tts.checked) return;
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1; u.pitch = 1;
  window.speechSynthesis.speak(u);
}

// 发送
async function sendText(txt) {
  if (!txt.trim()) return;
  push("user", txt); els.box.value = "";
  els.send.disabled = true; els.mic.disabled = true;

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sid,
        role_id: els.role.value,
        text: txt,
        use_memory: els.mem.checked
      })
    });
    const data = await r.json();
    if (data.error) { push("bot", "⚠️ " + data.error); return; }
    push("bot", data.reply);
    speak(data.reply);
    lastPair = { user: txt, reply: data.reply };
    const meta = data.auto_eval || {score:0, reasons:[]};
    els.eval.textContent = `自动评分：${meta.score}/3  ${meta.reasons.join(" · ")}`;
  } catch (e) {
    push("bot", "网络错误：" + e.message);
  } finally {
    els.send.disabled = false; els.mic.disabled = false;
  }
}

// 事件绑定
els.send.addEventListener("click", () => sendText(els.box.value));
els.box.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(els.box.value); }
});
els.clear.addEventListener("click", async () => {
  await fetch("/api/clear", { method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ session_id: sid }) });
  els.chat.innerHTML = ""; els.eval.textContent = "";
  push("bot", "✅ 已清空会话。");
});

// 点赞/点踩（可选：你可在页面加两个按钮触发）
async function feedback(score) {
  if (!lastPair.reply) return;
  await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sid, role_id: els.role.value, score,
      user_text: lastPair.user, assistant_reply: lastPair.reply
    })
  });
}

// 自定义角色弹窗
els.addRoleBtn.addEventListener("click", () => els.modal.classList.remove("hide"));
els.cancel.addEventListener("click", () => els.modal.classList.add("hide"));
els.save.addEventListener("click", async () => {
  const name = els.rn.value.trim(), desc = els.rd.value.trim(), sp = els.rsp.value.trim();
  if (!name || !sp) { alert("名称与人格设定不能为空"); return; }
  const r = await fetch("/api/roles", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, desc, system_prompt: sp })
  });
  const data = await r.json();
  if (data.error) { alert(data.error); return; }
  els.modal.classList.add("hide");
  els.rn.value = els.rd.value = els.rsp.value = "";
  await loadRoles();
  els.role.value = data.role_id;
  push("bot", `✅ 已创建新角色：${name}`);
});

// 语音识别（浏览器内置）
let rec = null, recog = false;
if ("webkitSpeechRecognition" in window) {
  rec = new webkitSpeechRecognition();
  rec.lang = "zh-CN"; rec.continuous = false; rec.interimResults = false;
  rec.onresult = (e) => { const t = e.results[0][0].transcript; sendText(t); };
  rec.onerror = (e) => push("bot", "🎙️ 识别出错：" + e.error);
  rec.onend = () => { recog = false; els.mic.textContent = "🎙️"; };
}
els.mic.addEventListener("click", () => {
  if (!rec) { push("bot","当前浏览器不支持语音识别（建议 Chrome）。"); return; }
  if (!recog) { rec.start(); recog = true; els.mic.textContent = "■ 停止"; }
  else { rec.stop(); }
});

// 初始化
window.onload = async () => {
  await loadRoles();
  push("bot", "你好！选择一个角色开始对话吧～ 支持“自定义角色”“语音输入/播报”。");
};

