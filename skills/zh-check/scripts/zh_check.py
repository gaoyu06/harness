#!/usr/bin/env python3
"""zh-check — 机械扫描中文文本中的禁用词与风格问题。

用法：python zh_check.py <file.md> [file2.md ...]

输出按规则分组的问题清单。机械扫描只负责"可能存在问题的点"，
包装词判断、拟人、语义重复等查不了的部分由模型按 SKILL.md 复查。
"""

import json
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "banned.json"

# 模式规则：正则可机械抓取的句式问题
PATTERN_RULES = [
    (r"能不能|该不该|要不要|还能不能", "口语疑问，应写「是否 / 能否」"),
    (r"之所以.{0,40}是因为", "防御性解释句式，整段删除"),
    (r"它知道|它觉得|它会想|系统认为", "拟人化表述"),
    (r"通过.{2,12}来实现", "可压为「用…实现」"),
    (r"通过.{2,12}的(方式|方法|手段)", "可压为「用…」"),
    (r"对.{1,10}进行", "「对…进行…」公文句式，压为直接动词"),
    (r"由于.{2,12}的原因", "可压为「因为」"),
    (r"如果.{0,20}的话", "「的话」可删"),
    (r"随着.{0,15}的(不断|快速|飞速|迅猛)发展", "宏大叙述开头"),
    (r"在.{0,10}(浪潮|时代|背景|趋势|大潮|大环境)(中|下|里)", "宏大叙述开头"),
    (r"在.{1,8}方面", "可压为「…上 / …中」"),
    (r"不仅.{0,30}(而且|更|还)", "AI 递进腔，审视是否必要"),
    (r"一方面.{0,40}另一方面", "机械对仗"),
    (r"不是.{1,20}，是|不是.{1,20}，?而是", "「不是…而是…」AI 签名句式"),
    (r"就.{1,10}而言|对于.{1,15}来说", "翻译腔"),
    (r"第一.{0,30}第二.{0,30}第三", "机械枚举"),
    (r"[一-鿿],[一-鿿]", "中文之间混入半角逗号"),
    (r"[一-鿿]:[一-鿿]", "中文之间混入半角冒号"),
    (r"，[^，。！？]{1,4}地，", "副词伪停顿，去尾逗号让状语贴住动词"),
]

MAX_SENTENCE_LEN = 45


def load_banned(path):
    """banned.json：groups[] 各带 verdict——delete 级命中基本即删，
    context 级要结合语境判断（分组 description 写明合法情形）。
    词可以是字符串，也可以是 {"w": 词, "allow": [豁免复合词]}：
    词的所有出现都落在豁免词内部时不上报（如「落地」在「落地页」里）。"""
    data = json.loads(path.read_text(encoding="utf-8"))
    out = []
    for group in data["groups"]:
        for entry in group["words"]:
            if isinstance(entry, str):
                out.append((group["name"], group["verdict"], entry, []))
            else:
                out.append((group["name"], group["verdict"], entry["w"], entry.get("allow", [])))
    return out


def fully_allowed(word, allows, text):
    """word 的每次出现都必须落在某个 allow 复合词内部才算豁免。"""
    spans = [m.span() for a in allows for m in re.finditer(re.escape(a), text)]
    return all(
        any(s <= m.start() and m.end() <= e for s, e in spans)
        for m in re.finditer(re.escape(word), text)
    )


def scan(path, banned):
    hits = []
    lines = Path(path).read_text(encoding="utf-8").splitlines()
    for no, line in enumerate(lines, 1):
        if line.lstrip().startswith(("```", "    ", "- `", "| `")):
            continue  # 跳过代码块与行内代码为主的行
        prose = re.sub(r"`[^`]*`", "", line)  # 行内代码不参与词与句式检查
        for group_name, verdict, word, allows in banned:
            if word in prose and not fully_allowed(word, allows, prose):
                tag = "删" if verdict == "delete" else "看语境"
                hits.append((f"{group_name}·{tag}", no, word, line.strip()))
        for pattern, msg in PATTERN_RULES:
            if re.search(pattern, prose):
                hits.append(("模式规则", no, msg, line.strip()))
        for m in re.finditer(r"[^。！？；：]{%d,}[。！？；]" % MAX_SENTENCE_LEN, prose):
            hits.append(("超长句", no, f"超过 {MAX_SENTENCE_LEN} 字", m.group(0)[:32] + "…"))
    return hits


def formatting_stats(text):
    return {
        "加粗标记 **": text.count("**"),
        "破折号 ——": text.count("——"),
    }


def main():
    if len(sys.argv) < 2:
        print("用法：python zh_check.py <file.md> [...]")
        sys.exit(1)

    banned = load_banned(DATA)
    total = 0
    for path in sys.argv[1:]:
        hits = scan(path, banned)
        text = Path(path).read_text(encoding="utf-8")
        print(f"## {path}")
        if not hits:
            print("  机械扫描无命中。")
        for rule, no, what, excerpt in hits:
            print(f"  [{rule}] L{no} 「{what}」 {excerpt[:60]}")
            total += 1
        stats = formatting_stats(text)
        print("  格式统计：" + "，".join(f"{k} ×{v}" for k, v in stats.items()))
        print()

    print(f"机械扫描完成，共 {total} 处命中。")
    print("以下仍需模型按规则复查：包装词与自造术语、截短词、拟人、语义重复、缩写合理性。")


if __name__ == "__main__":
    main()
