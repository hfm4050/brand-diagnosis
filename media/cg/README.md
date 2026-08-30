# CG 영상 — 암진단금 사례 보드

칠판 표가 한 줄씩 나타나면서 펜으로 밑줄이 그어지고, 밑줄마다 "스윽" 소리가 나는 영상.

## 만들기
```
bash media/cg/render.sh                       # → media/exports/암진단금-사례.mp4
bash media/cg/render.sh 다른이름.mp4          # 출력 경로 지정
```

출력: 1920×1080 / 30fps / H.264 + AAC.

## 구성
| 파일 | 역할 |
|---|---|
| `board.html` | 장면 전체. `renderAt(t)` 가 t초 시점의 화면을 그린다 (CSS 애니메이션 없음 → 프레임 캡처가 항상 동일) |
| `capture.js` | Playwright로 `renderAt(t)`를 호출하며 프레임을 PNG로 저장 |
| `render.sh` | 캡처 → 스윽 사운드 합성 → ffmpeg 인코딩 |

## 고치기
- **표 내용**: `board.html` 의 `ROWS` 배열. `[진단서, 결과지 글자, 검토 담보]` 순서.
- **속도·타이밍**: `board.html` 의 `T` 객체.
  - `intro` 도입부, `step` 행 간격, `appear` 행 등장, `penDelay` 등장 후 펜 시작까지, `draw` 밑줄 긋는 시간, `outro` 마무리 정지.
  - 사운드 시점은 `SWOOSH_TIMES` 로 자동 계산되므로 타이밍만 바꾸면 소리도 따라간다.
- **색**: CSS 의 `.c1`(진단서) `.c2`(결과지) `.c3`(검토 담보), 밑줄은 `stroke` 값.
- **스윽 소리 톤**: `render.sh` 의 `bandpass`/`volume` 값. 중심 주파수를 올리면 날카롭게, 내리면 둔탁하게.

## 필요한 것
`ffmpeg`(SessionStart 훅이 설치), Node + `playwright` 패키지, 한글 폰트(`fonts-noto-cjk`).
브라우저는 이 환경에 미리 설치된 크로미움을 쓴다 — `CHROMIUM_PATH` 로 바꿀 수 있다.
