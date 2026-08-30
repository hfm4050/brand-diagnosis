# 미디어 워크스페이스

영상을 "보고" 분석하는 작업 전용 공간입니다. `/watch` 스킬이 여기에 결과물을 쌓습니다.

## 폴더
| 경로 | 용도 | 커밋 여부 |
|---|---|---|
| `media/inbox/` | 분석할 로컬 영상 원본 (`.mp4`, `.mov`, `.mkv`, `.webm`) | ✕ (gitignore) |
| `media/frames/` | 추출된 프레임 JPEG | ✕ |
| `media/transcripts/` | 타임스탬프 자막·전사 텍스트 | ○ |
| `media/notes/` | 영상별 분석 노트 (마크다운) | ○ |
| `media/exports/` | 편집·렌더 결과물 | ✕ |

무거운 바이너리는 저장소에 남기지 않고, 텍스트 산출물(전사·노트)만 버전 관리합니다.

## 쓰는 법

URL 또는 로컬 경로에 질문을 붙여서 호출합니다.

```
/watch https://youtu.be/VIDEO_ID 이 영상의 훅이 뭐야?
/watch media/inbox/screen-recording.mov 어디서 오류가 나?
/watch https://youtu.be/VIDEO_ID 2:30 근처에서 무슨 일이 일어나?
```

특정 구간만 볼 때는 시점을 말해주면 그 구간을 촘촘하게 봅니다 ("마지막 30초", "0:45~1:00").

### 브랜드 진단과 엮어 쓰기
경쟁 채널 영상이나 광고 크리에이티브를 `/watch`로 분석한 뒤,
결과를 `media/notes/`에 남기고 진단 문항·프롬프트 개선에 반영하는 흐름을 기본으로 합니다.

## 필요한 도구
`yt-dlp`, `ffmpeg`, `ffprobe`. 세션이 시작될 때 `scripts/setup-media-env.sh`가 자동으로 설치합니다.
수동 설치가 필요하면:

- macOS: `brew install ffmpeg yt-dlp`
- Debian/Ubuntu: `apt-get install -y ffmpeg && pip install yt-dlp`

## 자막이 없는 영상 (Whisper)
대부분의 공개 영상은 자막으로 처리되므로 API 키 없이 동작합니다.
자막이 없는 영상(예: 직접 찍은 화면 녹화)을 전사하려면 `~/.config/watch/.env`에 키를 넣으세요.

```
GROQ_API_KEY=gsk_...     # 권장 (더 싸고 빠름)
# 또는
OPENAI_API_KEY=sk-...
```

## 웹 세션(Claude Code on the web)의 네트워크 제약
이 환경의 네트워크 정책이 `youtube.com` 등 외부 미디어 호스트로의 연결을 막고 있어,
**웹 세션에서는 URL 영상 분석이 실패합니다** (`yt-dlp` → `Tunnel connection failed: 403`).
`media/inbox/`에 올린 **로컬 파일 분석은 정상 동작**합니다.

URL 분석까지 웹에서 쓰려면 환경 설정에서 네트워크 정책을 열어야 합니다
(https://code.claude.com/docs/en/claude-code-on-the-web).
로컬 터미널의 Claude Code에서는 제약 없이 URL·로컬 모두 동작합니다.
