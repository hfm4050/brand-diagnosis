#!/usr/bin/env bash
# /watch 스킬이 필요로 하는 미디어 도구를 준비한다.
# Claude Code on the web 세션은 컨테이너가 매번 새로 뜨므로 SessionStart 훅에서 실행된다.
set -uo pipefail

need() { ! command -v "$1" >/dev/null 2>&1; }

if need yt-dlp; then
  pip install --quiet --disable-pip-version-check yt-dlp >/dev/null 2>&1 \
    || python3 -m pip install --quiet --disable-pip-version-check yt-dlp >/dev/null 2>&1
fi

if need ffmpeg || need ffprobe; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update >/dev/null 2>&1 && apt-get install -y ffmpeg >/dev/null 2>&1
  elif command -v brew >/dev/null 2>&1; then
    brew install ffmpeg >/dev/null 2>&1
  fi
fi

missing=()
for b in yt-dlp ffmpeg ffprobe; do need "$b" && missing+=("$b"); done

if [ ${#missing[@]} -eq 0 ]; then
  echo "media env ready: yt-dlp, ffmpeg, ffprobe"
else
  echo "media env incomplete — 설치 실패: ${missing[*]}" >&2
  echo "수동 설치: macOS 'brew install ffmpeg yt-dlp' / Debian 'apt-get install -y ffmpeg && pip install yt-dlp'" >&2
fi
