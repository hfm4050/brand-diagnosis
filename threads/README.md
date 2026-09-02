# 스레드 자동 읽기 → 열정덕 카피 → 자동 게시 파이프라인

스레드(@duckpd7)에서 **리포스트한 글 중 반응(좋아요) 100개 이상**인 콘텐츠를 모아
카테고리별로 분류하고, 열정덕 톤의 카피로 변환한 뒤, 스레드에 바로 게시까지 하는 파이프라인입니다.

정리된 결과물은 노션의 **[열정덕 > 스레드 (리포스트 → 열정덕 카피)]** 페이지에 쌓습니다.

```
1단계 읽기      scrape-reposts.mjs   스레드 리포스트 탭 수집 → output/reposts.json/.md
2단계 쓰기      generate-copy.mjs    Claude로 분류 + 열정덕 카피 2버전 생성 → output/copies.json/.md
3단계 게시      post-thread.mjs      고른 카피를 즉시 게시 (수동)
   또는 자동    build-queue.mjs      카피를 queue.json 에 담아 push → Vercel 크론이 매일 1개씩 발행
```

빠른 실행 (프로젝트 루트에서):

```bash
npm run threads:scrape      # 브라우저가 열리며 리포스트 수집 (본인 PC에서)
npm run threads:generate    # ANTHROPIC_API_KEY 필요 (또는 --proxy 사용)
npm run threads:list        # 생성된 카피 목록 확인
npm run threads:post -- --pick 3 --version v2   # 3번 카피 v2 게시
```

## 1단계 — 읽기 (수집)

### 방법 1 — 수동 (가장 확실, 5분)
스레드 앱 → 내 프로필 → 리포스트 탭 → 반응 100+ 글의 **본문/작성자/좋아요 수/링크**를
`threads/input.md` 같은 파일에 붙여넣고 2단계에서 `--input threads/input.md` 로 지정.

### 방법 2 — 자동 수집 스크립트 (로컬 PC에서 실행)
Claude Code 원격 환경에서는 threads.com 접속이 네트워크 정책으로 차단되어 있어,
이 스크립트는 **본인 PC에서** 실행해야 합니다.

```bash
npm install playwright
npx playwright install chromium
node threads/scrape-reposts.mjs --user duckpd7 --min-likes 100
```

결과는 `threads/output/reposts.json` 과 `threads/output/reposts.md` 로 저장됩니다.
로그인 벽이 뜨면 열린 브라우저 창에서 직접 로그인한 뒤 Enter를 누르면 이어서 수집합니다.

## 2단계 — 쓰기 (카피 생성)

```bash
# 방법 A — 본인 API 키로 직접 호출
ANTHROPIC_API_KEY=sk-ant-... node threads/generate-copy.mjs

# 방법 B — 이미 배포된 Vercel 프록시 재활용 (로컬에 키가 없어도 됨)
node threads/generate-copy.mjs --proxy https://프로젝트명.vercel.app/api/claude
```

옵션: `--input <파일>` (기본 `threads/output/reposts.json`, .md/.txt도 가능) ·
`--model <모델>` (기본 `claude-sonnet-5`, 품질 우선이면 `claude-opus-5`) · `--limit N`

- 톤·작성 규칙은 `threads/convert-prompt.md` 를 그대로 읽어 사용합니다.
  **톤을 바꾸고 싶으면 그 파일만 수정하면 됩니다.** (Claude 채팅에 수동으로 붙여넣어 쓸 때도 같은 파일 사용)
- 결과: `threads/output/copies.json` (게시용) + `threads/output/copies.md` (노션에 붙여넣기용, 카테고리별 정리)

## 3단계 — 게시 (스레드 업로드)

```bash
node threads/post-thread.mjs --list                  # 카피 목록 + 번호 확인
node threads/post-thread.mjs --pick 3                # 3번 카피 v1 게시 (미리보기 + Enter 확인)
node threads/post-thread.mjs --pick 3 --version v2   # v2 게시
node threads/post-thread.mjs --text "직접 쓴 글"      # 임의 텍스트 게시
```

게시 전에 항상 본문 미리보기를 띄우고 Enter 확인을 받습니다. (`--yes` 로 생략 가능)
스레드는 글당 500자 제한이 있어 초과하면 게시하지 않고 알려줍니다.

### 게시 준비 (액세스 토큰, 최초 1회)

스레드 공식 API는 Meta 개발자 앱이 필요합니다.

1. https://developers.facebook.com → 앱 만들기 → 사용 사례에서 **Threads API** 선택
2. 앱의 Threads 설정에서 본인 스레드 계정을 테스터로 추가하고, 스레드 앱(설정 → 계정 → 웹사이트 권한)에서 초대 수락
3. 앱 대시보드의 토큰 생성 도구에서 `threads_basic`, `threads_content_publish` 권한으로 액세스 토큰 발급
4. 단기 토큰이면 장기 토큰(60일)으로 교환:
   ```bash
   curl "https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=<앱시크릿>&access_token=<단기토큰>"
   ```
5. 환경변수로 저장:
   ```bash
   export THREADS_ACCESS_TOKEN="<장기토큰>"
   ```

장기 토큰은 만료 전(60일 이내)에 갱신할 수 있습니다:
```bash
curl "https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=<현재토큰>"
```

## 자동 발행 (Vercel 크론 — 컴퓨터 꺼져 있어도 동작)

`api/post-thread.js` 가 매일 한 번 Vercel 크론으로 실행되어, `threads/queue.json` 대기열에서
**아직 계정에 올라가지 않은 첫 글**을 찾아 발행합니다. 이미 올라갔는지는 스레드 API로
내 최근 글을 읽어 본문을 비교하므로, 하루 실패해도 다음 날 같은 글을 다시 시도합니다.

### 흐름

```bash
node threads/generate-copy.mjs                       # 카피 생성 (2단계)
node threads/build-queue.mjs --add 1:v1 --add 3:v2   # 마음에 드는 카피를 큐에 담기
node threads/build-queue.mjs --list                  # 큐 확인
git add threads/queue.json && git commit -m "발행 큐 갱신" && git push
```

push 하면 Vercel이 자동 재배포되고, 그 다음부터는 아무것도 하지 않아도
큐가 빌 때까지 매일 1개씩 올라갑니다. 큐가 비면 아무 일도 하지 않으니
가끔 카피를 새로 생성해 큐를 채우고 push 하면 됩니다.

### 최초 설정 (1회)

1. Vercel 프로젝트 → Settings → Environment Variables:
   - `THREADS_ACCESS_TOKEN` = 장기 액세스 토큰 (아래 "게시 준비" 참고)
   - `CRON_SECRET` = 아무 긴 무작위 문자열 (외부인이 발행 주소를 호출하지 못하게 차단 — 꼭 설정하세요)
2. 발행 시각은 `vercel.json` 의 크론 스케줄로 조정 (UTC 기준):
   - 현재 `0 23 * * *` = 매일 한국시간 오전 8시. 예: 한국 12시로 바꾸려면 `0 3 * * *`
   - Vercel 무료(Hobby) 플랜은 하루 1회 크론까지 지원하며, 실행 시각이 지정 시각에서 최대 1시간 늦을 수 있습니다.
3. 배포 후 미리보기로 확인: `https://프로젝트명.vercel.app/api/post-thread?check=1`
   (CRON_SECRET을 설정했다면 `Authorization: Bearer <CRON_SECRET>` 헤더 필요)

주의: 장기 토큰은 60일 만료라, 만료 전에 갱신해서 Vercel 환경변수를 교체해야 합니다 (아래 갱신 curl 참고).
큐에 담긴 글은 검토 없이 그대로 올라가니, `--list` 로 한 번 확인하고 push 하세요.

## 카테고리 기준

| 카테고리 | 설명 |
|---|---|
| 🎯 마케팅·브랜딩 인사이트 | 마케팅 노하우, SNS 알고리즘, 브랜딩 관점 |
| 💼 사업·자영업 현실 | 대표/자영업자의 현실, 매출, 조직 이야기 |
| 🔥 동기부여·마인드셋 | 태도, 성장, 실행력 |
| ⏰ 일·습관·자기관리 | 루틴, 시간관리, 생산성 |
| 😂 공감·유머 | 웃기거나 공감돼서 반응이 터진 글 |
| 🤖 트렌드·AI 활용 | AI 도구, 새로운 트렌드 활용법 |

## 열정덕 변환 원칙 (요약)

원문을 베끼지 않는다. **터진 이유(후킹 구조)만 차용**하고,
사례는 열정덕(병원·소상공인 마케팅 현장)의 경험으로 교체한다.
첫 줄 후킹 필수, 500자 이내, 마무리는 질문 또는 단정 한 줄.
전체 프롬프트는 `threads/convert-prompt.md` 참고.

## 참고

- `threads/output/` 은 개인 데이터(수집 원문·생성 카피)라 git에 올라가지 않습니다 (.gitignore).
- 게시된 글의 원문은 절대 그대로 복사되지 않습니다 — 프롬프트가 문장 재사용을 금지하고 구조만 차용합니다.
  그래도 게시 전 미리보기에서 한 번 직접 확인하는 것을 권장합니다.
