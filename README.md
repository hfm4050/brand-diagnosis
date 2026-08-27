# 브랜드 · 채널 진단 — 배포 가이드

이 폴더를 그대로 배포하면 웹사이트로 실행됩니다.

## 구성
- `index.html` — 앱 전체 (설문 + 강점 검사 + 리포트). 이 파일 하나만 있어도 동작합니다.
- `api/claude.js` — Anthropic API 프록시 (Vercel 서버 함수). 있으면 사용자에게 API 키를 받지 않습니다.
- `vercel.json`, `package.json` — Vercel 설정.

## 방법 1 · Vercel (추천, 무료, 5분)
1. https://vercel.com 가입 (GitHub 계정으로 가능)
2. 이 폴더를 GitHub 저장소에 올리거나, Vercel 대시보드에서 "Add New → Project → Import" 후 폴더 업로드
3. 프로젝트 Settings → Environment Variables 에 `ANTHROPIC_API_KEY` = `sk-ant-...` 추가
4. Deploy → `https://프로젝트명.vercel.app` 주소가 생깁니다

API 키를 서버에 두기 때문에 방문자는 키 없이 바로 진단할 수 있습니다.
비용은 본인 Anthropic 계정에 청구되니, 공개 후에는 Vercel 대시보드에서 호출량을 확인하세요.

## 방법 2 · GitHub Pages / Netlify Drop (정적 호스팅만)
`index.html` 만 올리면 됩니다. 이 경우 서버 함수가 없어서 방문자가 시작 화면에서 자기 API 키를 입력해야 리포트가 생성됩니다. (강점 검사·예시 리포트는 키 없이 동작)

## 방법 3 · Claude Code
터미널에서:
```
claude
> 이 폴더를 Vercel에 배포해줘. ANTHROPIC_API_KEY 환경변수 설정도 안내해줘.
```
Claude Code가 `vercel` CLI 설치와 배포를 도와줍니다.

## 노션에 넣기
노션은 HTML을 직접 실행하지 못합니다. 방법 1로 배포한 뒤 노션 페이지에 `/embed` 블록으로 `https://프로젝트명.vercel.app` 주소를 넣으면 페이지 안에서 실행됩니다.

## 수정하기
디자인·문항·프롬프트를 바꾸려면 `brand-diagnosis.jsx` 원본을 수정한 뒤 다시 빌드해야 합니다:
```
npx esbuild app.jsx --loader:.jsx=jsx --outfile=app.js --format=iife --minify
```
(Claude에게 "문항 바꿔서 다시 빌드해줘"라고 요청하면 됩니다.)
