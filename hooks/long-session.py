#!/usr/bin/env python3
"""UserPromptSubmit hook：会话里用户消息到 40、80 条时，提醒 agent 建议用 handoff 开新会话。

按字节偏移增量读取会话记录，状态存在 /tmp，避免每轮重读上百 MB 的记录文件。
"""
import json
import os
import sys

THRESHOLDS = (40, 80)
STATE_DIR = "/tmp/claude-long-session"


def is_user_prompt(entry):
    if entry.get("type") != "user" or entry.get("isMeta") or entry.get("isSidechain"):
        return False
    content = (entry.get("message") or {}).get("content")
    if isinstance(content, list):
        texts = [b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text"]
        if not texts:
            return False  # 只有 tool_result 的消息不算用户发言
        content = "\n".join(texts)
    return isinstance(content, str) and not content.lstrip().startswith("<")


def main():
    data = json.load(sys.stdin)
    path = data.get("transcript_path")
    sid = data.get("session_id") or "unknown"
    if not path or not os.path.exists(path):
        return

    os.makedirs(STATE_DIR, exist_ok=True)
    state_file = os.path.join(STATE_DIR, sid + ".json")
    try:
        state = json.load(open(state_file))
    except (OSError, ValueError):
        state = {"offset": 0, "count": 0, "reminded": []}

    with open(path, "rb") as f:
        f.seek(state["offset"])
        for raw in f:
            if not raw.endswith(b"\n"):
                break  # 半行留到下次再读
            state["offset"] += len(raw)
            if b'"type":"user"' not in raw:
                continue
            try:
                if is_user_prompt(json.loads(raw)):
                    state["count"] += 1
            except ValueError:
                pass

    count = state["count"] + 1  # 本条消息还没写进记录
    due = [t for t in THRESHOLDS if count >= t and t not in state["reminded"]]
    if due:
        state["reminded"].extend(due)
    json.dump(state, open(state_file, "w"))

    if due:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": (
                    f"本会话用户消息已有 {count} 条。完成本轮回复后，在结尾用一句话提醒用户："
                    "会话已经较长，早期的规则和上下文容易被忽略；换方向或跨天时，可以用 /handoff 生成交接文档再开新会话。只提醒这一次。"
                ),
            }
        }, ensure_ascii=False))


if __name__ == "__main__":
    main()
