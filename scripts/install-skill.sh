#!/usr/bin/env bash
# GitHub 저장소의 Claude 스킬을 이 프로젝트의 .claude/skills/ 에 설치한다.
#
#   scripts/install-skill.sh <owner/repo> [스킬이름 ...]
#
# 스킬이름을 생략하면 저장소에서 찾은 SKILL.md를 모두 설치한다.
# 설치 내역은 .claude/skills/INSTALLED.md 에 기록된다.
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
manifest="$dest/INSTALLED.md"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "[install-skill] cloning $repo…"
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --quiet "https://github.com/$repo" "$tmp/src"
sha="$(git -C "$tmp/src" rev-parse --short HEAD)"

mkdir -p "$dest"
[ -f "$manifest" ] || printf '# 설치된 스킬\n\n출처 기록. `scripts/install-skill.sh` 가 갱신합니다.\n\n| 스킬 | 저장소 | 커밋 | 설치일 |\n|---|---|---|---|\n' > "$manifest"

installed=0
while IFS= read -r skillmd; do
  dir="$(dirname "$skillmd")"
  name="$(basename "$dir")"
  fm_name="$(sed -n '/^---$/,/^---$/p' "$skillmd" | sed -n 's/^name:[[:space:]]*//p' | head -1 | tr -d '"'"'"'')"
  [ -n "$fm_name" ] && name="$fm_name"

  if [ ${#want[@]} -gt 0 ]; then
    match=0
    for w in "${want[@]}"; do [ "$w" = "$name" ] && match=1; done
    [ $match -eq 1 ] || continue
  fi

  # 다른 저장소에서 온 같은 이름이 이미 있으면 경고
  if [ -d "$dest/$name" ] && grep -q "^| \`$name\` |" "$manifest" 2>/dev/null; then
    prev="$(grep "^| \`$name\` |" "$manifest" | head -1 | awk -F'|' '{print $3}' | tr -d ' `')"
    [ "$prev" = "$repo" ] || echo "[install-skill] ⚠ 이름 충돌: '$name' 은 이미 $prev 에서 설치됨 — $repo 것으로 덮어씁니다." >&2
  fi

  rm -rf "${dest:?}/$name"
  cp -R "$dir" "$dest/$name"
  rm -rf "$dest/$name/scripts/build-skill.sh" "$dest/$name/__pycache__"
  sed -i.bak "/^| \`$name\` |/d" "$manifest" 2>/dev/null && rm -f "$manifest.bak"
  printf '| `%s` | `%s` | `%s` | %s |\n' "$name" "$repo" "$sha" "$(date +%Y-%m-%d)" >> "$manifest"
  echo "[install-skill] installed: $name"
  installed=$((installed + 1))
done < <(find "$tmp/src" -name SKILL.md -not -path '*/.git/*' | sort)

if [ "$installed" -eq 0 ]; then
  echo "[install-skill] $repo 에서 설치할 스킬을 찾지 못했습니다." >&2
  exit 1
fi
echo "[install-skill] 완료 — $repo 에서 스킬 $installed 개. 새 세션에서 활성화됩니다."
