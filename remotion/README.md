# 티나는 성형 vs 티 안 나는 성형 — 영상

[Remotion](https://www.remotion.dev)으로 만든 16:9 키네틱 타이포그래피 영상입니다.
같은 내용의 인포그래픽(웹)과 팔레트·서체를 공유합니다.

- **해상도** 1920×1080 (16:9) · **30fps** · **1765프레임 ≈ 58.8초**
- 인스타그램 피드 영상 60초 제한 안에 들어갑니다.

## 실행

```bash
cd remotion
npm install
npm run dev      # Remotion Studio — 코드 고치면 즉시 반영
npm run render   # out/ti-surgery.mp4
```

`dev`·`render`·`still` 앞에는 폰트 내려받기가 자동으로 붙습니다(`npm run fonts`).
`public/fonts/` 가 이미 차 있으면 건너뜁니다.

특정 프레임만 이미지로 뽑을 때:

```bash
npx remotion still TiSurgery out/f165.png --frame=165
```

## 구성

| 파일 | 설명 |
| --- | --- |
| `src/ti/content.ts` | 여섯 축의 문구. **문구만 고치려면 여기만 보면 됩니다.** |
| `src/ti/theme.ts` | 팔레트와 씬 길이(`D`). 전체 길이는 `D`에서 자동 계산됩니다. |
| `src/ti/kinetic.tsx` | 한 글자씩 등장(`Chars`), 괘선, 캘리퍼 눈금, 씬 래퍼 |
| `src/ti/scenes.tsx` | 표제 · 논지 · 축 6개 · 판정 · 엔드카드 |
| `src/ti/TiSurgery.tsx` | 씬을 `<Series>`로 이어 붙인 본편 |
| `scripts/fetch-fonts.mjs` | 폰트를 `public/fonts/` 로 내려받고 매니페스트를 생성 |

## 한 글자씩 등장

`Chars`가 문자열을 글자 단위로 쪼개, 각 글자에 **블러 해제 + 아래에서 올라옴 + 자간 조여듦**을
스프링으로 어긋나게 겁니다. 굵기는 `stagger`(글자 간격)와 `rise`/`blur`/`spread`로 조절합니다.

```tsx
<Chars text="티나는 성형" delay={16} stagger={5} rise={34} spread={14} />
```

티나는 쪽은 스태거를 짧게, 티 안 나는 쪽은 길고 감쇠를 크게 줬습니다.
움직임 자체가 두 성형의 차이를 말하도록 한 것입니다.

## 씬 길이를 고칠 때

각 씬은 **마지막 글자가 안착한 뒤 잠깐 머물다** 빠져야 합니다.
문구를 늘렸다면 `theme.ts`의 `D`도 같이 늘리세요. 대략:

```
필요한 길이 ≒ (마지막 Chars의 delay) + (글자 수 × stagger) + 25(스프링 안착) + 30(머무름) + 18(페이드아웃)
```

## 폰트

렌더 중에 웹폰트를 불러오면, 네트워크가 막히거나 프록시가 CORS·인증서를 건드릴 때
**일부 글자만 시스템 고딕으로 폴백돼 씬마다 서체가 달라집니다.** 그래서 이 프로젝트는
폰트를 먼저 파일로 받아두고 `staticFile()` 로 붙입니다. 렌더는 네트워크를 타지 않습니다.

```bash
npm run fonts            # public/fonts/ 채우기 (없는 것만)
npm run fonts -- --force # 전부 다시 받기
```

- 한글(나눔명조 400/700/800)은 `google/fonts` 저장소의 원본 TTF를 씁니다.
  `fonts.googleapis.com` 의 구형 엔드포인트는 한글 폰트도 **라틴 154자짜리로만** 내려주기
  때문에 쓸 수 없습니다. 스크립트가 글리프 수를 검사해 그런 파일을 거릅니다.
- 폰트 파일(약 9MB)은 저장소에 넣지 않습니다(`.gitignore`). 매니페스트만 커밋됩니다.
- 파일이 없으면 조용히 폴백하지 않고 렌더가 실패합니다.

## 렌더 브라우저가 막히는 환경

Remotion은 첫 렌더 때 Chrome Headless Shell을 내려받습니다. 다운로드가 막혀 있으면
이미 설치된 크로미움을 지정하세요.

```bash
REMOTION_BROWSER_EXECUTABLE=/path/to/chrome npm run render
```

## 라이선스 주의

Remotion은 소스가 공개돼 있지만 무료는 아닙니다.
개인과 직원 3명 이하 회사는 무료, **직원 4명 이상 회사는 유료 기업 라이선스**가 필요합니다.
자세한 내용: https://www.remotion.dev/license
