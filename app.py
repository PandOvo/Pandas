import os, json, time, hashlib, re
from datetime import datetime
from collections import defaultdict
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()
OPENAI_MODEL   = (os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip()
if not OPENAI_API_KEY.startswith("sk-"):
    raise RuntimeError("未检测到有效的 OPENAI_API_KEY，请在 .env 中配置。")

import openai
openai.api_key = OPENAI_API_KEY

app = Flask(__name__, static_url_path="", static_folder="static")

# 读取角色库
with open("roles.json", "r", encoding="utf-8") as f:
    ROLE_LIBRARY = json.load(f)

# 会话、缓存、反馈
SESSIONS = defaultdict(list)
CACHE    = {}
FEEDBACK_LOG = "feedback_log.csv"
CALL_COUNTER = defaultdict(lambda: {"min_ts": 0, "count": 0})
MAX_CALLS_PER_MIN = 20

def sha(s: str) -> str:
    return hashlib.sha256((s or "").strip().encode("utf-8")).hexdigest()

def check_rate_limit(sid: str) -> bool:
    m = int(time.time() // 60)
    box = CALL_COUNTER[sid]
    if box["min_ts"] != m:
        box["min_ts"] = m
        box["count"] = 0
    box["count"] += 1
    return box["count"] <= MAX_CALLS_PER_MIN

# —— 自动评分：长度/是否包含角色名/是否回应问号 —— #
def autoscore(reply: str, role_name: str, last_user: str) -> dict:
    score = 0
    reasons = []
    if len(reply) >= 20:
        score += 1; reasons.append("长度合适")
    if role_name and (role_name.split("·")[0] in reply or role_name in reply):
        score += 1; reasons.append("包含角色元素")
    if "?" in last_user or re.search(r"(吗|？|\?)", last_user):
        # 简单判定是否回应问题
        if re.search(r"(是的|当然|可以|会|可以试试|建议|因为|原因|首先|其次|我认为)", reply):
            score += 1; reasons.append("回应用户问题")
    return {"score": score, "reasons": reasons}

def call_llm(system_prompt: str, user_text: str, history_msgs=None) -> str:
    messages = [{"role": "system", "content": system_prompt}]
    if history_msgs:
        messages += history_msgs
    messages.append({"role": "user", "content": user_text})

    resp = openai.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.9,
        presence_penalty=0.3,
        frequency_penalty=0.2,
    )
    return resp.choices[0].message.content

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

# ---- 角色 ----
@app.route("/api/roles", methods=["GET"])
def list_roles():
    roles = [{"id": rid, "name": v.get("name", rid), "desc": v.get("desc", "")}
             for rid, v in ROLE_LIBRARY.items()]
    return jsonify({"roles": roles})

@app.route("/api/roles", methods=["POST"])
def add_role():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    sp   = (data.get("system_prompt") or "").strip()
    desc = (data.get("desc") or "").strip()
    if not name or not sp:
        return jsonify({"error": "name 与 system_prompt 不能为空"}), 400
    rid = re.sub(r"\W+", "_", name.strip().lower()).strip("_")
    if not rid: rid = f"role_{len(ROLE_LIBRARY)+1}"
    ROLE_LIBRARY[rid] = {"name": name, "system_prompt": sp, "desc": desc}
    return jsonify({"ok": True, "role_id": rid})

# ---- 对话 ----
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    sid       = (data.get("session_id") or "default").strip()
    role_id   = (data.get("role_id") or "harry_potter").strip()
    text      = (data.get("text") or "").strip()
    use_mem   = bool(data.get("use_memory", True))

    if not check_rate_limit(sid):
        return jsonify({"error": "调用过于频繁，请稍后再试"}), 429
    if role_id not in ROLE_LIBRARY:
        return jsonify({"error": f"未知角色：{role_id}"}), 400
    if not text:
        return jsonify({"error": "text 不能为空"}), 400

    # 命中缓存
    ck = (role_id, sha(text))
    if ck in CACHE:
        reply = CACHE[ck]
        SESSIONS[sid] += [{"role": "user", "content": text},
                          {"role": "assistant", "content": reply}]
        meta = autoscore(reply, ROLE_LIBRARY[role_id]["name"], text)
        return jsonify({"reply": reply, "from_cache": True, "auto_eval": meta})

    sys_prompt = ROLE_LIBRARY[role_id]["system_prompt"]
    hist = SESSIONS[sid][-10:] if use_mem else None

    try:
        reply = call_llm(sys_prompt, text, hist)
    except Exception as e:
        return jsonify({"error": f"LLM 调用失败: {type(e).__name__}: {e}"}), 500

    SESSIONS[sid] += [{"role": "user", "content": text},
                      {"role": "assistant", "content": reply}]
    CACHE[ck] = reply
    meta = autoscore(reply, ROLE_LIBRARY[role_id]["name"], text)
    return jsonify({"reply": reply, "from_cache": False, "auto_eval": meta})

@app.route("/api/history", methods=["GET"])
def history():
    sid = request.args.get("session_id", "default")
    return jsonify({"history": SESSIONS.get(sid, [])})

@app.route("/api/clear", methods=["POST"])
def clear():
    data = request.get_json(force=True)
    sid = data.get("session_id", "default")
    SESSIONS.pop(sid, None)
    return jsonify({"ok": True})

# ---- 反馈 ----
@app.route("/api/feedback", methods=["POST"])
def feedback():
    data = request.get_json(force=True)
    row = [
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        (data.get("session_id") or "").replace("\n"," "),
        (data.get("role_id") or "").replace("\n"," "),
        str(data.get("score", "")),
        (data.get("user_text") or "").replace("\n"," "),
        (data.get("assistant_reply") or "").replace("\n"," ")
    ]
    header = "ts,session_id,role_id,score,user_text,assistant_reply\n"
    need_header = not os.path.exists(FEEDBACK_LOG)
    with open(FEEDBACK_LOG, "a", encoding="utf-8") as f:
        if need_header: f.write(header)
        f.write(",".join(row) + "\n")
    return jsonify({"ok": True})

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
