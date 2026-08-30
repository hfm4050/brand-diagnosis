#!/usr/bin/env bash
# GitHub 저장소의 Claude 스킬을 이 프로젝트의 .claude/skills/ 에 설치한다.
#
#   scripts/install-skill.sh <owner/repo> [스킬이름 ...]
#
# 스킬이름을 생략하면 저장소에서 찾은 SKILL.md를 모두 설치한다.
# 이미 있는 스킬은 덮어쓴다.
set -euo pipefail

repo="${1:-}"
if [ -z "$repo" ]; then
  echo "usage: $0 <owner/repo> [skill-name ...]" >&2
  exit 2
fi
shift
want=("$@")

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dest="$root/.claude/skills"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "[install-skill] cloning $repo…"
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --quiet "https://github.com/$repo" "$tmp/src"

mkdir -p "$dest"
installed=0
while IFS= read -r skillmd; do
  dir="$(dirname "$skillmd")"
  name="$(basename "$dir")"
  # SKILL.md 프론트매터의 name 을 우선한다
  fm_name="$(sed -n '/^---$/,/^---$/p' "$skillmd" | sed -n 's/^name:[[:space:]]*//p' | head -1 | tr -d '"'"'"'')"
  [ -n "$fm_name" ] && name="$fm_name"

  if [ ${#want[@]} -gt 0 ]; then
    match=0
    for w in "${want[@]}"; do [ "$w" = "$name" ] && match=1; done
    [ $match -eq 1 ] || continue
  fi

  rm -rf "${dest:?}/$name"
  cp -R "$dir" "$dest/$name"
  rm -f "$dest/$name/scripts/build-skill.sh"
  echo "[install-skill] installed: $name  ($repo)"
  installed=$((installed + 1))
done < <(find "$tmp/src" -name SKILL.md -not -path '*/.git/*' | sort)

if [ "$installed" -eq 0 ]; then
  echo "[install-skill] $repo 에서 설치할 스킬을 찾지 못했습니다." >&2
  exit 1
fi
echo "[install-skill] 완료 — 스킬 $installed 개. 새 세션에서 활성화됩니다."
