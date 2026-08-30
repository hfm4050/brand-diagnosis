#!/usr/bin/env bash
# board.html 을 프레임 캡처 → 스윽 사운드 합성 → MP4 로 묶는다.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

FPS=30
OUT="${1:-../exports/암진단금-사례.mp4}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/frames" "$(dirname "$OUT")"

echo "[1/4] 프레임 캡처…"
META="$(node capture.js "$WORK/frames" $FPS | tail -1)"
echo "      $META"
TOTAL=$(python3 -c "import json,sys;print(json.loads('''$META''')['total'])")
TIMES=$(python3 -c "import json;print(' '.join(str(t) for t in json.loads('''$META''')['swooshes']))")

echo "[2/4] 스윽 사운드 생성…"
# 펜이 종이를 긁는 소리: 대역 제한 노이즈 + 빠른 어택, 느린 감쇠
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.42:c=pink:a=0.9:r=48000" \
  -af "bandpass=f=2100:width_type=h:w=1900,
       highpass=f=650,
       volume='0.55*exp(-9*max(0,t-0.045))*min(1,t/0.035)':eval=frame,
       afade=t=out:st=0.34:d=0.08" \
  -ac 1 "$WORK/swoosh.wav"

echo "[3/4] 타임라인에 배치…"
# 무음 트랙 위에 각 밑줄 시작 시각으로 지연시킨 스윽을 겹친다
INPUTS=(-f lavfi -i "anullsrc=r=48000:cl=mono:d=$TOTAL")
FILTER=""; N=1
for t in $TIMES; do
  INPUTS+=(-i "$WORK/swoosh.wav")
  MS=$(python3 -c "print(int(round($t*1000)))")
  FILTER+="[$N]adelay=${MS}|${MS}[s$N];"
  N=$((N+1))
done
MIX="[0]"; for i in $(seq 1 $((N-1))); do MIX+="[s$i]"; done
FILTER+="${MIX}amix=inputs=$N:normalize=0,alimiter=limit=0.92,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo[a]"
ffmpeg -v error -y "${INPUTS[@]}" -filter_complex "$FILTER" -map "[a]" "$WORK/track.wav"

echo "[4/4] 인코딩…"
ffmpeg -v error -y -framerate $FPS -i "$WORK/frames/%05d.png" -i "$WORK/track.wav" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k -shortest "$OUT"

echo "완료: $OUT"
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_type,width,height,r_frame_rate -of default=nw=1 "$OUT"
