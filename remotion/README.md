# Remotion 영상 프로젝트

React 코드로 영상을 만드는 [Remotion](https://www.remotion.dev) 프로젝트입니다.
브랜드 진단 앱(`../index.html`)과는 독립적으로 동작하며, 홍보 영상·리포트 영상 등을 코드로 렌더링할 때 씁니다.

## 설치

```bash
cd remotion
npm install
```

## 미리보기 (Remotion Studio)

```bash
npm run dev
```

브라우저에서 스튜디오가 열리고, `src/` 안의 코드를 고치면 즉시 반영됩니다.

## 렌더링

```bash
npm run render   # out/video.mp4
npm run still    # out/still.png
```

## 구조

| 파일 | 설명 |
| --- | --- |
| `src/index.ts` | 진입점. `registerRoot`로 루트를 등록합니다. |
| `src/Root.tsx` | 컴포지션 목록. 해상도·fps·길이·기본 props를 정합니다. |
| `src/Composition.tsx` | 실제 화면. 평범한 React 컴포넌트입니다. |
| `remotion.config.ts` | 렌더 옵션 (CLI 전용, 렌더 자체에는 포함되지 않음) |

`Root.tsx`의 `defaultProps`는 zod 스키마로 검증되며, 스튜디오 오른쪽 패널에서 값을 바로 바꿔볼 수 있습니다.

## 브라우저 다운로드가 막힌 환경

Remotion은 첫 렌더 때 Chrome Headless Shell을 내려받습니다.
방화벽 등으로 막혀 있으면 이미 설치된 크로미움을 지정하세요.

```bash
REMOTION_BROWSER_EXECUTABLE=/path/to/chrome npm run render
# 또는
npx remotion render MyComp out/video.mp4 --browser-executable=/path/to/chrome
```

## 라이선스 주의

Remotion 자체는 소스가 공개돼 있지만 무료는 아닙니다.
개인, 그리고 직원 3명 이하 회사는 무료, **직원 4명 이상 회사는 유료 기업 라이선스**가 필요합니다.
자세한 내용: https://www.remotion.dev/license
