# brand-diagnosis

브랜드·채널 진단 웹앱 + 영상 분석 미디어 워크스페이스.

## 구조
- `index.html` — 배포되는 앱 전체 (설문 + 강점 검사 + 리포트). 이 파일 하나로 동작합니다.
- `brand-diagnosis.jsx` — 앱 원본 소스. **UI·문항·프롬프트 수정은 여기서 하고 다시 빌드합니다.**
- `api/claude.js`, `api/transcribe.js` — Vercel 서버 함수 (Anthropic API 프록시).
- `media/` — 영상 분석 워크스페이스. 사용법은 `media/README.md`.
- `.claude/skills/watch/` — `/watch` 스킬 (bradautomates/claude-video, MIT).
- `scripts/setup-media-env.sh` — 세션 시작 시 `yt-dlp`/`ffmpeg` 설치 (SessionStart 훅).

## 빌드
`brand-diagnosis.jsx`를 고쳤으면 번들을 다시 만들어 `index.html`에 반영합니다.

```
npx esbuild brand-diagnosis.jsx --loader:.jsx=jsx --outfile=app.js --format=iife --minify
```

`index.html`은 빌드 산출물을 인라인으로 품고 있으므로, jsx만 고치고 빌드를 빼먹으면 배포에 반영되지 않습니다.

## 영상 분석
경쟁사 채널, 광고 크리에이티브, 버그 화면 녹화 등을 `/watch`로 분석합니다.
분석 노트는 `media/notes/`, 전사는 `media/transcripts/`에 남깁니다.

```
/watch <URL 또는 로컬 경로> <질문>
```

## 배포
Vercel. `ANTHROPIC_API_KEY` 환경변수가 있으면 방문자는 키 없이 사용합니다. 자세한 절차는 `README.md`.
