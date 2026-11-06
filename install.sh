#!/usr/bin/env bash
# 把本仓库的全局规则和 skills 链接到 Codex 与 Claude Code。
#
#   ./install.sh [Claude 配置目录...]     默认 ~/.claude
#
# ~/.agents/skills 是总目录：本仓库的 skills 链接进去，Codex 直接读取它；
# 每个 Claude 配置目录的 skills/ 逐项链接到总目录，两边看到同一套 skill。
# 全局规则 rules/global-rules.md 链接为 ~/.codex/AGENTS.md 和各 Claude 目录的 CLAUDE.md。
# 可重复运行。已存在的真实文件或目录不覆盖，只提示；指向已删除 skill 的失效链接会清掉。
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
HUB="$HOME/.agents/skills"
RULES="$REPO/rules/global-rules.md"
if [ "$#" -gt 0 ]; then CLAUDE_DIRS=("$@"); else CLAUDE_DIRS=("$HOME/.claude"); fi

link() { # link <目标> <链接路径>
  local target="$1" path="$2"
  if [ -L "$path" ]; then
    [ "$(readlink "$path")" = "$target" ] && return
    ln -sfn "$target" "$path"
    echo "改链  $path -> $target"
  elif [ -e "$path" ]; then
    echo "跳过  $path 已存在且不是链接"
  else
    ln -s "$target" "$path"
    echo "新建  $path -> $target"
  fi
}

prune() { # 删除目录下的失效链接
  find "$1" -maxdepth 1 -type l ! -exec test -e {} \; -print | while read -r l; do
    rm "$l"
    echo "清除  $l"
  done
}

mkdir -p "$HUB"
for dir in "$REPO"/skills/*/; do
  name="$(basename "$dir")"
  link "$REPO/skills/$name" "$HUB/$name"
done
prune "$HUB"

mkdir -p "$HOME/.codex"
link "$RULES" "$HOME/.codex/AGENTS.md"

for claude in "${CLAUDE_DIRS[@]}"; do
  mkdir -p "$claude/skills"
  link "$RULES" "$claude/CLAUDE.md"
  for entry in "$HUB"/*; do
    [ -e "$entry" ] || continue
    link "$HUB/$(basename "$entry")" "$claude/skills/$(basename "$entry")"
  done
  prune "$claude/skills"
done

echo "完成：总目录 ${HUB}，Claude 配置目录 ${CLAUDE_DIRS[*]}"
