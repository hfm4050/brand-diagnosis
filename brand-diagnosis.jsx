import { useState, useEffect, useRef } from "react";

/* ───────── 문항 데이터 ───────── */
const SECTIONS = [
  { id: "A", title: "기본 정보", intro: "먼저 브랜드/채널과 지금 하는 일을 알려주세요." },
  { id: "S", title: "콘텐츠 소재", intro: "콘텐츠와 상품의 소재가 될 경험을 찾는 영역이에요. '있음'을 고르면 한 줄만 더 적어주세요. 이 답변들이 리포트의 콘텐츠 소재 목록이 됩니다." },
  { id: "B", title: "과거 스토리", intro: "20세까지의 이야기 3가지만 짧게 여쭤볼게요. 각 질문마다 '과거'와 '현재' 칸이 있고, 하나만 적어도 괜찮아요." },
  { id: "C", title: "정체성과 강점", intro: "브랜드/채널이 존재하는 이유와, 남들과 다른 점을 정리해요." },
  { id: "D", title: "상품과 고객", intro: "실제로 팔고 있는 것과 사는 사람에 대한 영역이에요. 숫자가 있으면 더 정확한 진단이 나옵니다." },
  { id: "E", title: "시장과 경쟁", intro: "시장에서 어디에 서 있는지 점검해요." },
  { id: "F", title: "마케팅 현황", intro: "지금 어떻게 알려지고 있는지, 무엇을 얼마나 하고 있는지 적어주세요. 이 영역으로 마케팅 전략이 만들어져요." },
  { id: "G", title: "목표", intro: "마지막으로 1년 뒤 목표를 알려주세요." },
];

const Q = [
  // A
  { n: 1, s: "A", type: "text", q: "브랜드명 또는 채널명은 무엇인가요?", hint: "아직 없다면 가칭이나 내 이름도 괜찮아요.", ph: "예: 텐미닛키친 / 자취요리 준 / 김OO" },
  { n: "1-1", s: "A", type: "links", q: "운영 중인 웹사이트나 채널 주소가 있다면 알려주세요.", hint: "없으면 건너뛰어도 됩니다.", labels: ["웹사이트 (스마트스토어, 자사몰 포함)", "SNS / 유튜브 / 블로그"], phs: ["https://", "@아이디 또는 링크"], skip: true },
  { n: 2, s: "A", type: "single", q: "운영 형태는?", opts: ["기업/팀 브랜드 운영 중", "1인 사업 운영 중", "예비 창업자 (준비 중)", "직장인 (부업·사이드 프로젝트)", "프리랜서 (디자이너, 작가, 강사 등)", "개인 채널·크리에이터", "전문가 퍼스널 브랜드 (의사, 변호사, 세무사, 코치 등)", "기타"] },
  { n: 3, s: "A", type: "single", q: "분야/카테고리는?", opts: ["F&B", "패션·뷰티", "IT", "교육", "헬스케어", "라이프스타일", "콘텐츠·엔터", "컨설팅·전문직", "기타"] },
  { n: 4, s: "A", type: "single", q: "운영 기간은?", opts: ["준비 중", "1년 미만", "1~3년", "3년 이상"] },
  { n: 5, s: "A", type: "single", q: "함께 일하는 인원은?", opts: ["나 혼자", "2~3명", "4~10명", "11명 이상"] },
  { n: 6, s: "A", type: "multi", q: "이번 진단의 목적은?", hint: "여러 개 선택 가능", opts: ["시작", "방향 재정립", "정체 돌파", "인지도 확대", "수익화", "제휴·투자 준비"] },
  { n: 7, s: "A", type: "long", q: "현재 직업(하는 일)은 무엇이고, 그 일에서 가장 인정받는 능력은?", hint: "브랜드/채널과 별개로 지금 실제로 하는 일을 적어주세요.", ex: ["마케팅 대행사 5년 차, 숫자를 쉽게 설명하는 걸로 인정받음", "카페 운영 3년 차, 손님 얼굴과 취향을 기억하는 걸로 유명", "전업 크리에이터, 편집 속도가 빠른 편"] },
  // S 콘텐츠 소재
  { n: "S1", s: "S", type: "yesno", q: "전공이나 자격증, 오래 한 직무가 있으신가요?", detail: "무엇인가요?", ph: "예: 마케팅 MBA / 조리기능사 / 회계 10년" },
  { n: "S2", s: "S", type: "yesno", q: "지금까지 가장 많은 시간을 쓴(또는 쓰고 있는) 취미나 특기가 있으신가요?", detail: "무엇이고, 얼마나 오래 했나요?", ph: "예: 홈베이킹 6년, 주말마다" },
  { n: "S3", s: "S", type: "yesno", q: "돈을 꾸준히 쓰고 있는(또는 썼던) 취미나 관심사가 있으신가요?", detail: "무엇에, 월 얼마 정도?", ph: "예: 캠핑 장비, 연 200만 원 / 온라인 강의 월 10만 원" },
  { n: "S4", s: "S", type: "yesno", q: "무언가를 직접 판매해 본 경험이 있으신가요?", detail: "무엇을, 어떻게, 결과는?", ph: "예: 당근마켓 중고 50건 / 플리마켓 수제 비누 / 회사 영업 3년" },
  { n: "S5", s: "S", type: "yesno", q: "정기적으로 참여하는(또는 참여했던) 오프라인 모임이 있으신가요?", detail: "어떤 모임이고 몇 명 정도?", ph: "예: 독서 모임 월 1회 8명 / 러닝 크루 주 2회" },
  { n: "S6", s: "S", type: "yesno", q: "구매해 본 상품/서비스 중 '내가 만들어도 이것보다 잘하겠다'고 느낀 것이 있으신가요?", detail: "무엇이었고, 어디가 아쉬웠나요?", ph: "예: 밀키트 — 양은 많은데 맛이 밋밋함" },
  { n: "S7", s: "S", type: "yesno", q: "구매해 본 상품/서비스 중 특별히 만족했던 것이 있으신가요?", detail: "무엇이었고, 어떤 점이 좋았나요?", ph: "예: 세무 앱 — 어려운 말이 하나도 없었음" },
  { n: "S8", s: "S", type: "single", q: "콘텐츠에 얼굴이나 목소리를 노출할 수 있나요?", opts: ["얼굴·목소리 모두 가능", "목소리만 가능", "둘 다 어려움 (직장, 개인 사정 등)", "아직 결정 못 함"] },
  { n: "S9", s: "S", type: "yesno", q: "SNS나 블로그를 운영해 본 경험이 있으신가요?", detail: "어떤 채널을, 얼마나, 결과는?", ph: "예: 인스타 2년 팔로워 1,200명 / 블로그 6개월 후 중단" },
  // B
  { n: 8, s: "B", type: "dual", q: "시간 가는 줄 모르고 몰두했던 활동은?", ph1: "예: 레고로 도시를 만들고 규칙을 정하는 데 하루를 썼어요", ph2: "예: 지금은 노션으로 시스템 짜는 데 시간 가는 줄 몰라요", skip: true },
  { n: 9, s: "B", type: "dual", q: "주변에서 자주 들었던 말은? (칭찬이든 지적이든)", ph1: "예: '넌 설명을 참 쉽게 한다'", ph2: "예: 동료들이 '정리의 신'이라고 불러요", skip: true },
  { n: 10, s: "B", type: "dual", q: "나의 가치관에 영향을 준 장면이나 사건은?", ph1: "예: 엄마가 아프던 날 처음 혼자 밥을 차렸던 저녁", ph2: "예: 첫 손님이 '덕분에 살았다'고 한 날", skip: true },
  // C
  { n: 11, s: "C", type: "long", q: "이 브랜드/채널이 존재하는 이유를 한 문장으로 적어주세요.", hint: "돈 버는 것 말고, 고객이나 세상에 어떤 변화를 만들고 싶은지 적어주세요.", ex: ["바쁜 직장인이 10분 만에 건강한 한 끼를 먹게 한다", "법을 몰라서 손해 보는 자영업자가 없게 한다"] },
  { n: 12, s: "C", type: "long", q: "고객(시청자)에게 주는 핵심 가치는?", hint: "기능이 아니라 고객이 실제로 얻어가는 '결과'로 적어주세요.", ex: ["저녁 시간을 되찾아줌", "혼자서도 해볼 수 있다는 자신감"] },
  { n: 13, s: "C", type: "keywords", q: "브랜드/채널을 대표하는 키워드 3개", ex: ["간편함 / 건강 / 저녁 시간", "쉬운 설명 / 자영업자 편 / 현실적 해결"] },
  { n: 14, s: "C", type: "long", q: "내 분야에서 남들과 다르게 접근하는 방식이 있다면?", ex: ["레시피를 '실패하기 쉬운 지점' 순으로 설명해요", "제품 소개 전에 '이런 분은 사지 마세요'부터 말해요"] },
  { n: 15, s: "C", type: "pair", q: "지금까지 성취한 일 중 가장 기억에 남는 일은? 숫자로도 정리해보세요.", lab1: "기억에 남는 성취", lab2: "숫자로 정리하면", ph1: "예: 동네 카페를 1년 만에 웨이팅 생기는 가게로", ph2: "예: 월 매출 300만 원 → 1,800만 원, 6개월" },
  // D
  { n: 16, s: "D", type: "long", q: "현재 판매 중인 상품/서비스(또는 콘텐츠)와 가격대를 적어주세요.", hint: "여러 개면 매출 비중이 큰 순서로.", ex: ["10분 밀키트 3종 (9,900~14,900원), 정기배송 월 59,000원", "1:1 세무 상담 (회당 15만 원), 온라인 강의 (99,000원)", "유튜브 무료 콘텐츠, 협찬 영상 건당 200만 원"] },
  { n: 17, s: "D", type: "pair", q: "현재 월 평균 매출과 고객(구독자) 규모는?", lab1: "월 평균 매출", lab2: "고객 수 / 팔로워·구독자 수", ph1: "예: 약 800만 원 (준비 중이면 0)", ph2: "예: 월 구매 고객 150명, 인스타 팔로워 4,200명" },
  { n: 18, s: "D", type: "long", q: "핵심 고객 또는 시청자층은 누구인가요?", hint: "나를 가장 필요로 하는 '한 사람'을 나이, 상황, 고민과 함께 그려보세요.", ex: ["30대 맞벌이 부부, 요리할 힘은 없지만 배달은 죄책감 드는 사람", "개업 3년 차 카페 사장, 세무 문제가 생겨도 누구에게 물어야 할지 모르는 사람"] },
  { n: 19, s: "D", type: "long", q: "고객이 겪는 가장 큰 문제와, 그럼에도 나를 선택하는 결정적 이유는?", ex: ["문제: 저녁마다 '뭐 먹지'로 30분 / 이유: 실패 걱정 없이 딱 10분", "문제: 세무사 말이 어려움 / 이유: 우리 가게 예시로 설명해줌"] },
  { n: 20, s: "D", type: "single", q: "재구매·재방문(또는 재시청) 고객 비율은 어느 정도인가요?", opts: ["잘 모름 / 측정 안 함", "10% 미만", "10~30%", "30~50%", "50% 이상"] },
  { n: 21, s: "D", type: "long", q: "고객 리뷰나 댓글에서 가장 자주 나오는 말은?", hint: "좋은 말과 불만 모두 적어주세요.", ex: ["좋은 말: '진짜 10분 걸리네요' / 불만: '재료 구하기 어려워요'", "좋은 말: '설명이 쉽다' / 불만: '업로드가 불규칙하다'"] },
  // E
  { n: 22, s: "E", type: "long", q: "비슷한 브랜드/채널 2~3개와, 그들과 비교한 나의 가격 위치는?", ex: ["○○키친, △△레시피 — 비슷한 가격대, 나는 배송이 느림", "□□세무 — 나보다 2배 비쌈, 대신 인지도가 높음"] },
  { n: 23, s: "E", type: "fill", q: "빈칸을 채워주세요.", parts: ["나는", "에서", "을(를) 제공하는", "을 위한 브랜드/채널이다"], labels: ["분야", "차별점", "타겟"] },
  { n: 24, s: "E", type: "multi", q: "수익 모델은?", hint: "현재 방식과 앞으로 만들고 싶은 방식 모두 골라주세요.", opts: ["상품 판매 (제품, 굿즈, 디지털 파일 등)", "서비스·컨설팅 (강의, 코칭, 자문, 시술 등)", "광고·협찬 (영상 광고 수익, 브랜드 협찬, PPL)", "멤버십·구독 (유료 커뮤니티, 정기 결제, 후원)", "제휴·수수료 (링크 판매 수수료, 공동구매)", "아직 없음 / 미정"], sub: "위 중 가장 키우고 싶은 수익 모델 1개는?" },
  // F
  { n: 25, s: "F", type: "multi", q: "고객이 나를 알게 되는 주요 경로는?", hint: "여러 개 선택 가능", opts: ["홈페이지·자사몰", "유튜브 롱폼 (10분 이상 영상)", "숏폼 (쇼츠·릴스·틱톡)", "인스타그램 피드", "블로그·검색", "스레드·X", "네이버 스마트스토어·쿠팡 등 마켓", "지인 소개·입소문", "오프라인 (매장, 행사)", "유료 광고", "잘 모름"] },
  { n: 26, s: "F", type: "pair", q: "콘텐츠 업로드 빈도와 월 마케팅 예산은?", hint: "롱폼과 숏폼을 나눠 적어주세요.", lab1: "업로드 빈도 (롱폼 / 숏폼 / 피드·블로그)", lab2: "월 마케팅 예산 (광고비, 촬영비, 외주비 포함)", ph1: "예: 유튜브 롱폼 월 2회, 쇼츠·릴스 주 3회, 블로그 월 1회", ph2: "예: 약 50만 원 / 없음" },
  { n: 27, s: "F", type: "single", q: "고객과 소통할 때 말투(톤앤매너)는?", opts: ["격식체 — \"안녕하세요, 오늘은 ○○에 대해 설명드리겠습니다.\"", "친근한 반말·구어체 — \"얘들아 오늘 이거 진짜 쉬워, 따라와봐\"", "전문 용어 중심 — \"본 케이스는 근로기준법 제17조에 따라…\"", "유머러스 — \"이거 실패하면 제가 책임집니다 (안 집니다)\"", "담백·간결 — \"재료 3개. 10분. 끝.\"", "정해진 것 없음 — 상황마다 다름"] },
  { n: 28, s: "F", type: "long", q: "지금까지 해본 마케팅 중 효과가 있었던 것과 없었던 것은?", ex: ["효과 있음: 릴스 레시피 (팔로워 +2,000) / 없음: 인스타 광고 30만 원 (구매 2건)", "효과 있음: 블로그 후기 / 없음: 인플루언서 협찬"] },
  { n: 29, s: "F", type: "long", q: "하고 싶지만 아직 못 하고 있는 마케팅 활동과 그 이유는?", ex: ["유튜브를 시작하고 싶은데 편집할 시간이 없음", "정기배송을 열고 싶은데 물류 방법을 모름"] },
  // G
  { n: 30, s: "G", type: "single", q: "희망 월 매출은 어느 정도인가요?", hint: "1년 안에 도달하고 싶은 목표를 골라주세요.", opts: ["100만 원 미만", "100~500만 원", "500~1,000만 원", "1,000~3,000만 원", "3,000만~1억 원", "1억~5억 원", "5억~10억 원", "아직 매출보다 성장(시청자·인지도)이 우선"] },
  { n: 31, s: "G", type: "pair", q: "지금 가장 큰 고민 한 가지와, 1년 뒤 되고 싶은 모습은?", lab1: "지금 가장 큰 고민", lab2: "1년 뒤 되고 싶은 모습", ph1: "예: 조회수는 나오는데 매출로 안 이어져요", ph2: "예: 자취 요리 하면 제 이름이 먼저 떠오르는 채널" },
];


/* ───────── 자료 업로드 ───────── */
function loadScript(url) {
  return new Promise((res, rej) => { if (document.querySelector(`script[src="${url}"]`)) return res(); const s = document.createElement("script"); s.src = url; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
async function pdfToText(file) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) { const pg = await pdf.getPage(i); const c = await pg.getTextContent(); out += c.items.map((it) => it.str).join(" ") + "\n"; }
  return out;
}
const readAsDataURL = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(f); });

function Materials({ mat, setMat, onNext, onBack }) {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState("");
  const [rec, setRec] = useState(false);
  const recRef = useRef(null);
  const inputRef = useRef(null);

  async function addFiles(list) {
    for (const f of Array.from(list)) {
      setBusy(f.name);
      try {
        const ext = f.name.split(".").pop().toLowerCase();
        if (["txt", "md", "csv", "json", "html", "htm"].includes(ext)) {
          const text = (await f.text()).slice(0, 8000);
          setMat((m) => ({ ...m, texts: [...m.texts, { name: f.name, text }] }));
        } else if (ext === "pdf") {
          const text = (await pdfToText(f)).slice(0, 8000);
          setMat((m) => ({ ...m, texts: [...m.texts, { name: f.name, text }] }));
        } else if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
          if (f.size > 4 * 1024 * 1024) throw new Error("4MB 이하 이미지만");
          const b64 = await readAsDataURL(f);
          setMat((m) => ({ ...m, images: [...m.images, { name: f.name, b64, type: f.type || "image/jpeg" }] }));
        } else if (["mp3", "m4a", "wav", "ogg", "webm", "aac"].includes(ext)) {
          setMat((m) => ({ ...m, audios: [...m.audios, { name: f.name }] }));
        } else {
          setMat((m) => ({ ...m, skipped: [...m.skipped, f.name] }));
        }
      } catch (e) {
        setMat((m) => ({ ...m, skipped: [...m.skipped, `${f.name} (${e.message})`] }));
      }
    }
    setBusy("");
  }

  function toggleRec() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("이 브라우저는 음성 인식을 지원하지 않아요. Chrome에서 열어주세요."); return; }
    if (rec) { recRef.current?.stop(); setRec(false); return; }
    const r = new SR(); r.lang = "ko-KR"; r.continuous = true; r.interimResults = false;
    r.onresult = (e) => { let t = ""; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript + " "; setMat((m) => ({ ...m, transcript: (m.transcript + " " + t).trim() })); };
    r.onend = () => setRec(false);
    recRef.current = r; r.start(); setRec(true);
  }

  const remove = (key, i) => setMat((m) => ({ ...m, [key]: m[key].filter((_, j) => j !== i) }));

  return (
    <div className="stage"><div className="page">
      <div className="eyebrow">Materials · 선택</div>
      <h1 className="q" style={{ marginTop: 14 }}>브랜드를 보여주는 자료가 있다면 여기 놓아주세요.</h1>
      <p className="hint">없어도 괜찮아요. 있으면 리포트가 훨씬 구체적으로 나옵니다. 소개서·상세페이지 PDF, 로고·상품 사진, 매출 표, 홈페이지 주소, 그리고 말로 설명한 녹음까지 모두 됩니다.</p>

      <div className="dual" style={{ marginBottom: 22 }}>
        <div><div className="lab">홈페이지 · 자사몰 · 채널 주소</div><input type="text" value={mat.url} placeholder="https://" onChange={(e) => setMat((m) => ({ ...m, url: e.target.value }))} /></div>
      </div>

      <div className={`drop ${drag ? "on" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
        <div className="dropi">↓</div>
        <div><b>파일을 여기에 끌어다 놓거나 클릭해서 선택</b><small>PDF · 텍스트 · 이미지(4MB) · 음성 파일</small></div>
        {busy && <small style={{ color: "var(--moss)" }}>읽는 중 · {busy}</small>}
      </div>

      <div className="card" style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center" }}>
        <button className={`btn ${rec ? "" : "ghost"}`} style={rec ? { background: "#B4553C", borderColor: "#B4553C" } : {}} onClick={toggleRec}>{rec ? "● 녹음 중 · 누르면 멈춤" : "🎤 말로 설명하기"}</button>
        <div style={{ fontSize: 13, color: "#55635B", lineHeight: 1.6 }}>마이크로 브랜드를 설명하면 글로 바뀌어 리포트에 들어가요. 설문 답변 대신 이걸로만 진행해도 됩니다.</div>
      </div>
      {mat.transcript && <textarea style={{ marginTop: 10, minHeight: 90 }} value={mat.transcript} onChange={(e) => setMat((m) => ({ ...m, transcript: e.target.value }))} />}

      {(mat.texts.length + mat.images.length + mat.audios.length + mat.skipped.length > 0) && (
        <div style={{ marginTop: 22 }}>
          {mat.texts.map((t, i) => <div className="filerow" key={"t" + i}><span>📄 {t.name} <small>{t.text.length.toLocaleString()}자 읽음</small></span><button onClick={() => remove("texts", i)}>삭제</button></div>)}
          {mat.images.map((t, i) => <div className="filerow" key={"i" + i}><span>🖼 {t.name} <small>이미지로 분석</small></span><button onClick={() => remove("images", i)}>삭제</button></div>)}
          {mat.audios.map((t, i) => <div className="filerow warn" key={"a" + i}><span>🎧 {t.name} <small>음성 파일은 브라우저에서 글로 바꿀 수 없어요. 위 '말로 설명하기'로 직접 녹음하거나, 서버 배포 후 자동 변환됩니다.</small></span><button onClick={() => remove("audios", i)}>삭제</button></div>)}
          {mat.skipped.map((t, i) => <div className="filerow warn" key={"s" + i}><span>⚠ {t} <small>지원하지 않는 형식</small></span><button onClick={() => remove("skipped", i)}>삭제</button></div>)}
        </div>
      )}
    </div>
    <div className="nav"><div className="in">
      <button className="btn ghost" onClick={onBack}>이전</button>
      <button className="btn" onClick={onNext}>{mat.url || mat.texts.length || mat.images.length || mat.transcript ? "다음 · 강점 검사" : "자료 없이 다음"}</button>
    </div></div></div>
  );
}

/* ───────── 강점 진단 모듈 ───────── */
const DOMAINS = [
  { id: "drive", name: "추진", sub: "일을 끝까지 실행하는 힘", color: "#6B3F8C", light: "#E7DCEF" },
  { id: "sway", name: "설득", sub: "사람을 움직이고 이끄는 힘", color: "#C9661F", light: "#F6E3D2" },
  { id: "bond", name: "연결", sub: "관계를 만들고 지키는 힘", color: "#2D6FB5", light: "#D9E6F4" },
  { id: "vision", name: "구상", sub: "정보를 모아 방향을 그리는 힘", color: "#2F6B4F", light: "#D6E6DD" },
];
const THEMES = [
  { id: "finish", d: "drive", name: "완수", en: "Finisher", desc: "시작한 일은 끝을 봐야 마음이 놓입니다. 마감과 결과로 자신을 증명합니다.", use: ["출시일·마감일을 브랜드의 약속으로 공개해 신뢰를 만드세요.", "'해냈다' 기록(누적 판매, 완주 고객 수)을 콘텐츠로 쓰세요.", "미완성 프로젝트가 쌓이는 팀에서 마무리 담당을 맡으세요."], warn: "속도에 밀려 '왜 하는가'를 놓칠 수 있습니다." },
  { id: "order", d: "drive", name: "체계", en: "Discipline", desc: "흩어진 것을 체계로 만듭니다. 순서와 구조가 보이면 움직입니다.", use: ["고객이 헤매는 구매 과정을 3단계로 정리해 안내하세요.", "템플릿·체크리스트·가이드 형태의 상품이 잘 맞습니다.", "콘텐츠도 '시리즈'와 '순서'로 묶어 발행하세요."], warn: "구조가 없는 초기 단계에서 시작을 미룰 수 있습니다." },
  { id: "own", d: "drive", name: "책임감", en: "Owner", desc: "맡은 일은 내 일입니다. 약속을 어기는 것을 견디지 못합니다.", use: ["A/S·환불·응대 기준을 명문화해 브랜드 차별점으로 쓰세요.", "'끝까지 책임지는' 서비스 상품(1:1 관리, 보증)을 만드세요.", "고객 후기의 '믿을 수 있다'를 핵심 메시지로 올리세요."], warn: "혼자 다 떠안아 위임이 늦어질 수 있습니다." },
  { id: "careful", d: "drive", name: "신중함", en: "Deliberate", desc: "결정 전에 위험을 먼저 봅니다. 실수를 줄이는 것이 강점입니다.", use: ["'이런 분은 사지 마세요' 식의 정직한 안내로 신뢰를 얻으세요.", "고위험 결정(가격 변경, 대량 발주)의 최종 검토자를 맡으세요.", "리스크를 미리 알려주는 콘텐츠(실패 사례 분석)가 맞습니다."], warn: "기회 앞에서 실행 타이밍을 놓칠 수 있습니다." },
  { id: "start", d: "sway", name: "시동", en: "Starter", desc: "생각보다 행동이 먼저입니다. 멈춰 있는 것을 움직이게 합니다.", use: ["새 상품·채널을 작게 빨리 테스트하고 반응으로 결정하세요.", "'오늘 바로 해보기' 형식의 짧은 실행 콘텐츠가 맞습니다.", "정체된 팀 프로젝트의 첫 삽을 뜨는 역할을 맡으세요."], warn: "시작만 많고 마무리가 약해질 수 있습니다." },
  { id: "persuade", d: "sway", name: "설득력", en: "Persuader", desc: "상대가 움직일 말을 압니다. 반대를 동의로 바꿉니다.", use: ["상세페이지·제안서·영업 대화의 문구를 직접 쓰세요.", "라이브 판매, 상담 판매 등 대면 전환 채널을 키우세요.", "협찬·제휴 제안은 본인이 직접 하세요."], warn: "말이 앞서 근거가 부족하다는 인상을 줄 수 있습니다." },
  { id: "compete", d: "sway", name: "승부욕", en: "Competitor", desc: "비교 대상이 있을 때 힘이 납니다. 순위와 기록에 반응합니다.", use: ["'업계 1위', '리뷰 1,000개' 같은 측정 가능한 목표를 공개하세요.", "경쟁사 비교 콘텐츠를 정직한 데이터로 만드세요.", "수치 목표가 있는 캠페인(챌린지, 랭킹)을 설계하세요."], warn: "이기는 데 집중해 고객 가치를 잊을 수 있습니다." },
  { id: "present", d: "sway", name: "표현", en: "Presenter", desc: "말과 글로 사람을 사로잡습니다. 무대와 카메라가 편합니다.", use: ["얼굴과 목소리가 드러나는 영상·강연 채널을 주력으로 삼으세요.", "브랜드 스토리를 직접 말하는 콘텐츠가 가장 효과적입니다.", "설명이 어려운 상품일수록 본인이 설명자가 되세요."], warn: "전달에 집중하다 듣는 시간이 줄 수 있습니다." },
  { id: "empathy", d: "bond", name: "공감", en: "Empathizer", desc: "상대의 감정을 먼저 읽습니다. 말하지 않은 불편을 알아챕니다.", use: ["고객 후기와 댓글에서 '진짜 문제'를 뽑아 상품을 고치세요.", "고객 사연 기반 콘텐츠, 상담형 서비스가 맞습니다.", "응대 문구·환불 안내 등 감정이 걸린 접점을 직접 설계하세요."], warn: "고객 감정에 휘둘려 기준이 흔들릴 수 있습니다." },
  { id: "include", d: "bond", name: "포용", en: "Includer", desc: "소외된 사람을 챙깁니다. 누구나 들어올 수 있는 문을 만듭니다.", use: ["초보·입문자를 위한 '첫 상품'과 안내 콘텐츠를 만드세요.", "커뮤니티·멤버십 운영자로 적합합니다.", "'이런 분도 환영' 메시지로 타겟의 진입 장벽을 낮추세요."], warn: "타겟을 좁히는 결정을 어려워할 수 있습니다." },
  { id: "mentor", d: "bond", name: "육성", en: "Mentor", desc: "사람이 성장하는 것을 보면 힘이 납니다. 가르치는 것이 자연스럽습니다.", use: ["강의·코칭·워크북 등 교육형 상품이 핵심 수익원이 될 수 있습니다.", "고객의 '전후 변화'를 기록하는 콘텐츠를 만드세요.", "팀에서 신규 인력 온보딩을 맡으세요."], warn: "가르치려는 태도가 고객에게 부담이 될 수 있습니다." },
  { id: "harmony", d: "bond", name: "화합", en: "Harmony", desc: "갈등을 줄이고 합의를 만듭니다. 모두가 편한 지점을 찾습니다.", use: ["협업·제휴·공동구매처럼 여러 이해관계를 맞추는 일에 강합니다.", "고객 불만 응대와 중재 역할을 맡으세요.", "극단적 주장보다 '균형 잡힌 비교' 콘텐츠가 맞습니다."], warn: "분명한 입장을 요구하는 브랜딩에서 밋밋해질 수 있습니다." },
  { id: "analyze", d: "vision", name: "분석", en: "Analyst", desc: "근거와 숫자로 판단합니다. 감보다 데이터를 믿습니다.", use: ["매출·전환율·재구매율을 매주 보고 결정하세요.", "데이터 기반 콘텐츠('실험해봤습니다', 비교표)가 맞습니다.", "가격 결정과 광고 효율 판단을 맡으세요."], warn: "분석에 시간을 쓰느라 실행이 늦어질 수 있습니다." },
  { id: "ideate", d: "vision", name: "발상", en: "Ideator", desc: "연결되지 않던 것을 잇습니다. 새로운 조합에 설렙니다.", use: ["상품 기획, 콘텐츠 포맷 개발, 이벤트 아이디어를 담당하세요.", "'이런 조합 처음' 형식의 실험 콘텐츠가 맞습니다.", "아이디어는 반드시 실행 담당과 짝을 지으세요."], warn: "아이디어가 쌓여 어느 것도 완성되지 않을 수 있습니다." },
  { id: "learn", d: "vision", name: "배움", en: "Learner", desc: "배우는 과정 자체가 즐겁습니다. 새로운 분야에 빠르게 적응합니다.", use: ["'배우면서 공유하는' 과정형 콘텐츠로 초보 시청자와 함께 성장하세요.", "새 도구·트렌드 도입을 팀에서 가장 먼저 맡으세요.", "배운 것을 정리한 가이드·강의가 상품이 될 수 있습니다."], warn: "배움에 머물고 판매로 넘어가지 못할 수 있습니다." },
  { id: "foresee", d: "vision", name: "미래지향", en: "Futurist", desc: "지금보다 미래가 선명합니다. 큰 방향을 먼저 그립니다.", use: ["1년·3년 로드맵을 세우고 공개해 브랜드 방향성을 보여주세요.", "'앞으로 이렇게 될 것' 전망 콘텐츠가 맞습니다.", "투자·제휴 제안서의 비전 파트를 직접 쓰세요."], warn: "현재 실행과 단기 매출을 소홀히 할 수 있습니다." },
  { id: "fair", d: "drive", name: "공정성", en: "Consistency", desc: "누구에게나 같은 기준을 적용합니다. 예외와 특혜를 불편해합니다.", use: ["가격·환불·응대 기준을 모든 고객에게 동일하게 공개해 신뢰를 만드세요.", "'누구나 같은 조건' 메시지가 차별점이 될 수 있습니다.", "팀 규칙과 성과 기준을 문서화하는 역할을 맡으세요."], warn: "상황에 따른 유연한 대응이 늦어질 수 있습니다." },
  { id: "belief", d: "drive", name: "신념", en: "Belief", desc: "변하지 않는 가치가 있습니다. 그 가치에 맞는 일이면 오래 버팁니다.", use: ["브랜드 미션을 문장으로 정하고 모든 콘텐츠 첫 줄에 반복하세요.", "가치가 같은 고객이 모이는 커뮤니티형 브랜드가 맞습니다.", "가치에 어긋나는 협찬·제휴는 거절하는 것이 오히려 자산입니다."], warn: "가치가 다른 고객·파트너를 배척할 수 있습니다." },
  { id: "maximize", d: "sway", name: "최상화", en: "Maximizer", desc: "괜찮은 것을 탁월하게 만드는 데 끌립니다. 약점 보완보다 강점 극대화를 택합니다.", use: ["가장 잘 팔리는 상품 하나를 더 좋게 만드는 데 자원을 집중하세요.", "'베스트 하나만' 큐레이션 콘텐츠가 맞습니다.", "팀에서 잘하는 사람을 더 잘하게 하는 코치 역할을 맡으세요."], warn: "기본이 안 된 영역을 방치할 수 있습니다." },
  { id: "individual", d: "bond", name: "개별화", en: "Individualization", desc: "사람마다 다른 점이 먼저 보입니다. 맞춤 대응이 자연스럽습니다.", use: ["1:1 맞춤 상담·커스텀 상품이 핵심 수익원이 될 수 있습니다.", "고객 이름과 상황을 기억하는 응대를 브랜드 시그니처로 삼으세요.", "고객 유형별로 다른 안내 페이지를 만드세요."], warn: "규모가 커지면 맞춤 대응이 병목이 됩니다." },
  { id: "strategic", d: "vision", name: "전략", en: "Strategic", desc: "여러 길 중 가장 나은 길이 빨리 보입니다. 패턴을 읽고 대안을 만듭니다.", use: ["분기마다 '하지 않을 것' 목록을 먼저 정하세요.", "경쟁사 비교 후 빈자리를 찾는 포지셔닝 작업을 직접 하세요.", "시나리오별 계획(A안·B안)을 세우는 역할이 맞습니다."], warn: "결론이 빨라 팀이 과정을 따라오지 못할 수 있습니다." },
  { id: "context", d: "vision", name: "회고", en: "Context", desc: "지나온 과정을 돌아보며 이유를 찾습니다. 과거의 데이터가 판단 근거입니다.", use: ["'왜 됐고 왜 안 됐는지' 회고 기록을 분기마다 남기세요.", "브랜드 히스토리·창업 스토리 콘텐츠를 직접 쓰세요.", "실패 사례 복기 콘텐츠가 신뢰를 만듭니다."], warn: "새로운 시도 앞에서 과거 사례에 발이 묶일 수 있습니다." },
  { id: "relator", d: "bond", name: "절친", en: "Relator", desc: "넓은 인맥보다 깊은 관계를 원합니다. 오래 아는 사람과 일할 때 힘이 납니다.", use: ["신규 고객 확대보다 재구매·단골 관리(멤버십, VIP 케어)에 집중하세요.", "소수 고객과 깊게 소통하는 커뮤니티·소규모 모임 형태가 맞습니다.", "협업은 여러 곳보다 검증된 파트너 1~2곳과 길게 가세요."], warn: "새로운 사람·시장으로 넓히는 일을 미룰 수 있습니다." },
];
const ITEMS = [
  // 1라운드
  ["finish", "일을 시작하면 끝내기 전까지 다른 일이 손에 안 잡힌다."], ["order", "일을 시작하기 전에 순서와 목록부터 정리한다."], ["own", "약속을 못 지키면 상대보다 내가 더 괴롭다."], ["careful", "결정 전에 잘못될 가능성부터 따져본다."],
  ["start", "계획이 완벽하지 않아도 일단 시작하는 편이다."], ["persuade", "반대하는 사람을 설득해 동의를 얻어낸 경험이 많다."], ["compete", "순위나 기록이 걸리면 평소보다 훨씬 집중된다."], ["present", "여러 사람 앞에서 말하거나 카메라 앞에 서는 게 편하다."],
  ["empathy", "상대가 말하지 않아도 기분이 안 좋다는 걸 알아챈다."], ["include", "모임에서 겉도는 사람이 보이면 먼저 말을 건다."], ["mentor", "누군가 내 도움으로 성장하는 걸 보면 큰 보람을 느낀다."], ["harmony", "의견 충돌이 생기면 양쪽이 만족할 지점을 찾으려 한다."],
  ["analyze", "결정할 때 감보다 숫자와 근거를 먼저 본다."], ["ideate", "전혀 다른 것들을 연결해 새 아이디어를 내는 걸 즐긴다."], ["learn", "새로운 분야를 배우는 과정 자체가 즐겁다."], ["foresee", "지금 하는 일이 3년 뒤 어떻게 될지 자주 상상한다."],
  // 2라운드
  ["finish", "하루가 끝날 때 완료한 일 목록을 보면 만족감이 크다."], ["order", "흐트러진 자료나 공간을 보면 정리하고 싶어진다."], ["own", "실수가 생기면 남 탓보다 내 책임부터 찾는다."], ["careful", "즉흥적인 결정보다 충분히 검토한 결정이 편하다."],
  ["start", "정체된 상황을 보면 답답해서 내가 먼저 움직인다."], ["persuade", "상대가 무엇에 마음이 움직이는지 빨리 파악한다."], ["compete", "누군가와 비교되는 상황에서 더 좋은 성과를 낸다."], ["present", "내 생각을 말이나 글로 표현할 때 사람들이 잘 집중한다."],
  ["empathy", "다른 사람의 이야기를 들으면 그 감정이 내게도 전해진다."], ["include", "누구도 배제되지 않는 방식을 항상 신경 쓴다."], ["mentor", "설명하고 가르치는 일이 자연스럽고 잘한다는 말을 듣는다."], ["harmony", "갈등 상황에서 중재 역할을 자주 맡게 된다."],
  ["analyze", "'왜 그런지'를 데이터로 확인하지 않으면 찜찜하다."], ["ideate", "아이디어가 너무 많아 다 실행하지 못한다는 말을 듣는다."], ["learn", "관심 분야가 자주 바뀌고 매번 깊이 파고든다."], ["foresee", "사람들이 아직 보지 못한 방향을 먼저 제안하는 편이다."],
  // 3라운드 — 상황 문항 (일부는 역채점)
  ["finish", "마감이 임박하면 오히려 힘이 나고 몰입도가 올라간다."], ["order", "갑자기 계획이 바뀌면 다시 정리하기 전까지 마음이 불편하다."], ["own", "내가 맡은 일은 완성도가 떨어져도 남에게 넘기기 어렵다."], ["careful", "좋은 기회라도 검토할 시간이 없으면 일단 거절하는 편이다."],
  ["start", "새 프로젝트를 시작하는 순간이 가장 신난다.", false], ["persuade", "협상이나 가격 흥정 상황이 부담스럽기보다 재미있다."], ["compete", "경쟁 상대가 없으면 동기가 잘 생기지 않는다."], ["present", "즉석에서 마이크를 넘겨받아도 당황하지 않는다."],
  ["empathy", "상대의 감정에 휘둘려 내 결정이 흔들린 적이 있다."], ["include", "타겟을 좁히라는 말을 들으면 누군가를 배제하는 것 같아 망설여진다."], ["mentor", "내가 아는 것을 정리해 남에게 알려주는 콘텐츠를 만든 적이 있다."], ["harmony", "분명한 입장을 요구받으면 양쪽을 다 고려하느라 답이 늦어진다."],
  ["analyze", "분석하느라 실행이 늦어졌다는 말을 들은 적이 있다."], ["ideate", "지루한 반복 업무보다 새 기획을 맡을 때 성과가 훨씬 좋다."], ["learn", "배운 것을 수익으로 연결하는 것보다 배우는 것 자체에 더 시간을 쓴다."], ["foresee", "당장의 매출보다 1년 뒤 방향이 맞는지가 더 신경 쓰인다."],
  // 4라운드 — 역채점 문항 (반대 방향)
  ["finish", "여러 일을 벌여놓고 마무리는 다른 사람에게 맡기는 편이다.", true], ["order", "정리보다는 일단 쌓아두고 필요할 때 찾는 편이다.", true], ["own", "내 책임이 아닌 일은 굳이 신경 쓰지 않는다.", true], ["careful", "일단 저지르고 문제는 나중에 해결하는 편이다.", true],
  ["start", "계획이 확실하지 않으면 시작을 미루는 편이다.", true], ["persuade", "설득보다는 상대가 알아서 결정하게 두는 편이다.", true], ["compete", "남과 비교되는 상황은 되도록 피한다.", true], ["present", "앞에 나서기보다 뒤에서 준비하는 역할이 편하다.", true],
  ["empathy", "상대의 감정보다 사실 관계가 먼저 보인다.", true], ["include", "함께할 사람을 고를 때 기준에 맞는 사람만 고르는 편이다.", true], ["mentor", "가르치는 것보다 내 일에 집중하는 게 편하다.", true], ["harmony", "갈등이 생겨도 굳이 중재하지 않고 지켜보는 편이다.", true],
  ["analyze", "숫자를 보는 것보다 직감으로 결정하는 게 빠르고 편하다.", true], ["ideate", "새 아이디어보다 검증된 방법을 반복하는 게 마음 편하다.", true], ["learn", "새로운 걸 배우기보다 이미 아는 것을 잘 쓰는 게 좋다.", true], ["foresee", "먼 미래보다 이번 달 결과가 훨씬 중요하다.", true],
  // 추가 테마 (공정성·신념·최상화·개별화·전략·회고)
  ["fair", "누구에게든 같은 기준을 적용하는 것이 옳다고 믿는다."], ["fair", "특정 고객에게만 예외를 두면 마음이 불편하다."], ["fair", "규칙이 없는 상황에서는 내가 먼저 기준을 만든다."], ["fair", "상황에 따라 기준을 바꾸는 게 더 현실적이라고 생각한다.", true],
  ["belief", "돈이 되더라도 내 가치와 맞지 않는 일은 하지 않는다."], ["belief", "내가 왜 이 일을 하는지 한 문장으로 말할 수 있다."], ["belief", "가치가 맞지 않는 협업 제안을 거절한 적이 있다."], ["belief", "일의 의미보다 조건이 좋으면 대부분 받아들인다.", true],
  ["maximize", "괜찮은 수준에서 멈추지 않고 탁월하게 만들고 싶어진다."], ["maximize", "약점을 고치는 것보다 잘하는 것을 더 키우는 게 맞다고 본다."], ["maximize", "여러 상품보다 하나를 최고로 만드는 데 집중한 적이 있다."], ["maximize", "부족한 부분을 골고루 채우는 게 우선이라고 생각한다.", true],
  ["individual", "사람마다 다르게 대해야 한다는 것이 자연스럽다."], ["individual", "고객의 이름과 상황을 잘 기억하는 편이다."], ["individual", "같은 상품이라도 고객에 따라 다르게 설명한다."], ["individual", "모든 고객에게 같은 방식으로 응대하는 게 효율적이라고 본다.", true],
  ["strategic", "여러 선택지 중 가장 나은 길이 남들보다 빨리 보인다."], ["strategic", "일을 시작하기 전에 '하지 않을 것'부터 정한다."], ["strategic", "계획이 틀어져도 대안(B안)이 이미 머릿속에 있다."], ["strategic", "미리 여러 경우를 따지기보다 부딪히면서 조정하는 편이다.", true],
  ["context", "무언가 결정할 때 지난 사례부터 돌아본다."], ["context", "실패한 이유를 정리해두는 습관이 있다."], ["context", "브랜드나 일의 역사·배경을 설명하는 걸 좋아한다."], ["context", "과거를 돌아보는 것보다 새로 시작하는 게 훨씬 편하다.", true],
  ["relator", "많은 사람을 아는 것보다 몇 명과 깊이 아는 것이 좋다."], ["relator", "오래 알고 지낸 사람과 일할 때 가장 편하고 성과도 좋다."], ["relator", "새 고객을 늘리는 것보다 기존 고객을 챙기는 데 더 시간을 쓴다."], ["relator", "낯선 사람이 많은 자리에서도 금방 친해지고 넓게 어울린다.", true],
];
const PER_THEME = 4, MAX_SCORE = PER_THEME * 5;
const SCALE = ["전혀 아니다", "아니다", "보통", "그렇다", "매우 그렇다"];

function scoreStrengths(resp) {
  const sum = {};
  ITEMS.forEach(([t], i) => { sum[t] = (sum[t] || 0) + (resp[i] || 3); });
  return THEMES.map((t) => ({ ...t, score: sum[t.id], pct: Math.round((sum[t.id] / 15) * 100) })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).map((t, i) => ({ ...t, rank: i + 1 }));
}

function StrengthsTest({ onDone, onBack }) {
  const [page, setPage] = useState(0);
  const [resp, setResp] = useState({});
  const per = 8, pages = Math.ceil(ITEMS.length / per);
  const slice = ITEMS.slice(page * per, page * per + per);
  const filled = true;
  return (
    <div className="stage">
      <div className="bar"><i style={{ width: `${((page + 1) / pages) * 100}%` }} /></div>
      <div className="page">
        <div className="eyebrow">Strengths Profile · {page + 1} / {pages}</div>
        <h1 className="q" style={{ marginTop: 14 }}>각 문장이 평소의 나와 얼마나 가까운지 골라주세요.</h1>
        <p className="hint">정답은 없습니다. 오래 고민하지 말고 첫 느낌으로 답하세요. 답하지 않은 문항은 '보통'으로 계산됩니다. 48문항, 약 7분.</p>
        {slice.map(([, text], i) => {
          const k = page * per + i;
          return (
            <div key={k} style={{ margin: "26px 0" }}>
              <div style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 10, wordBreak: "keep-all" }}><span style={{ fontFamily: "'Noto Serif KR'", color: "var(--mist)", marginRight: 8 }}>{String(k + 1).padStart(2, "0")}</span>{text}</div>
              <div className="scale">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={resp[k] === n ? "on" : ""} title={SCALE[n - 1]} onClick={() => setResp((r) => ({ ...r, [k]: n }))}>{n}</button>)}</div>
              <div className="scale-lab"><span>{SCALE[0]}</span><span>{SCALE[4]}</span></div>
            </div>
          );
        })}
      </div>
      <div className="nav"><div className="in">
        <button className="btn ghost" onClick={() => (page === 0 ? onBack() : setPage(page - 1))}>이전</button>
        <button className="btn" onClick={() => (page === pages - 1 ? onDone(scoreStrengths(resp)) : setPage(page + 1))}>{page === pages - 1 ? "결과 보기" : filled ? "다음" : "건너뛰고 다음"}</button>
      </div></div>
    </div>
  );
}

function StrengthsGrid({ ranked, compact }) {
  const top3 = ranked.slice(0, 3);
  return (
    <>
    <div className="top3">
      {top3.map((t) => { const d = DOMAINS.find((x) => x.id === t.d); return (
        <div key={t.id} className="top3c" style={{ borderTop: `4px solid ${d.color}` }}>
          <div className="tag" style={{ color: d.color }}>최강 강점 {t.rank}</div>
          <div className="top3n">{t.name}<small>{t.en}</small></div>
          <div className="top3s"><b>{t.pct}</b><span>/ 100</span></div>
          <div className="top3bar"><i style={{ width: `${t.pct}%`, background: d.color }} /></div>
        </div>
      ); })}
    </div>
    <p style={{ fontSize: 13, color: "#55635B", margin: "6px 0 0" }}>색칠된 테마가 대표적인 강점입니다 (상위 5개). 큰 숫자는 순위, 작은 숫자는 점수(100점 만점)입니다. 테마당 4문항, 반대 방향 문항은 역채점해 산출했어요. 순위가 낮은 테마는 약점이 아니라 에너지를 덜 쓰는 방식입니다.</p>
    <div className="sgrid">
      {DOMAINS.map((d) => (
        <div key={d.id}>
          <div className="sdom" style={{ borderColor: d.color, color: d.color }}>{d.name}<small>{d.sub}</small></div>
          {ranked.filter((t) => t.d === d.id).map((t) => {
            const top = t.rank <= 5;
            return (
              <div key={t.id} className="scell" style={{ background: top ? d.color : d.light, color: top ? "#fff" : d.color, opacity: t.rank > 12 ? 0.55 : 1 }}>
                <b>{t.rank}</b><span>{t.name}<em>({t.en}) · {t.pct}점</em></span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
    </>
  );
}

function StrengthsResult({ ranked, onNext, onRetry, nextLabel }) {
  const top = ranked.slice(0, 5);
  const domScore = DOMAINS.map((d) => ({ ...d, v: ranked.filter((t) => t.d === d.id).reduce((s, t) => s + t.score, 0) }));
  const lead = [...domScore].sort((a, b) => b.v - a.v)[0];
  return (
    <div className="stage"><div className="report">
      <div className="eyebrow">Strengths Profile</div>
      <h1 className="q" style={{ fontSize: 32, marginTop: 16 }}>나의 강점 프로필</h1>
      <p>23개 강점 테마 중 상위 5개가 진하게 표시됩니다. 가장 두드러진 영역은 <b style={{ color: lead.color }}>{lead.name}</b>({lead.sub})입니다. 순위가 낮은 테마는 약점이 아니라 '에너지를 덜 쓰는 방식'이니, 상위 5개를 현업에 어떻게 쓸지에 집중하세요.</p>
      <StrengthsGrid ranked={ranked} />
      <h2>강점별 현업 응용</h2>
      {top.map((t) => {
        const d = DOMAINS.find((x) => x.id === t.d);
        return (
          <div className="card" key={t.id} style={{ marginBottom: 12, borderLeft: `4px solid ${d.color}` }}>
            <div className="tag" style={{ color: d.color }}>{t.rank}위 · {d.name}</div>
            <h4 style={{ fontSize: 18 }}>{t.name} <span style={{ fontWeight: 400, color: "#6E7A72", fontSize: 13 }}>{t.en}</span></h4>
            <p style={{ color: "var(--ink)", marginBottom: 10 }}>{t.desc}</p>
            {t.use.map((u, i) => <p key={i} style={{ margin: "4px 0" }}>○ {u}</p>)}
            <p style={{ marginTop: 10, color: "#B4553C" }}>주의 · {t.warn}</p>
          </div>
        );
      })}
      <h2>이 강점 조합을 한 문장으로</h2>
      <p style={{ fontFamily: "'Noto Serif KR'", fontSize: 18 }}>{top.map((t) => t.name).join(" · ")} — {lead.name} 중심으로 {top[0].name}과(와) {top[1].name}이(가) 브랜드의 일하는 방식을 결정합니다.</p>
      <div style={{ marginTop: 40, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn" onClick={onNext}>{nextLabel}</button>
        <button className="btn link" onClick={onRetry}>다시 검사하기</button>
      </div>
    </div></div>
  );
}



const sampleRank = (order) => order.map((id, i) => ({ ...THEMES.find((t) => t.id === id), score: 15 - Math.floor(i * 0.6), pct: Math.round(((15 - Math.floor(i * 0.6)) / 15) * 100), rank: i + 1 }));
const SAMPLE_STR_CHANNEL = sampleRank(["mentor", "present", "empathy", "order", "individual", "start", "learn", "include", "ideate", "belief", "finish", "persuade", "maximize", "analyze", "harmony", "context", "own", "careful", "foresee", "strategic", "fair", "relator", "compete"]);
const SAMPLE_STR_BRAND = sampleRank(["own", "analyze", "careful", "strategic", "fair", "finish", "harmony", "order", "context", "belief", "foresee", "empathy", "maximize", "mentor", "persuade", "include", "individual", "learn", "start", "ideate", "relator", "present", "compete"]);

const SAMPLE_BRAND = {
  name: "텐미닛키친",
  oneLiner: "맞벌이 부부의 평일 저녁을 10분 밀키트로 돌려주는 신뢰형 식품 브랜드",
  originStory: [
    "텐미닛키친은 대표가 열 살 무렵 맞벌이 부모님 대신 동생 저녁을 챙기던 기억에서 출발했습니다. '뭐라도 먹여야 한다'는 책임감으로 냉장고 재료를 조합하던 아이는, 어른들이 '대충 먹어'라고 말하는 것을 유독 참지 못했습니다. 그 성향은 지금 '10분이지만 대충은 아닌' 밀키트의 기준이 되었습니다.",
    "식품회사 품질관리 7년 경력과 강점 검사 상위 테마인 책임감·분석·신중함은 같은 축 위에 있습니다. 이 브랜드의 뿌리는 요리가 아니라 '바쁜 사람의 한 끼를 책임진다'는 태도이며, 리뷰에 반복되는 '믿고 먹는다'는 말이 그 증거입니다.",
  ],
  strengths: [
    { title: "책임지는 품질", past: "동생 저녁을 매일 챙기던 기억", now: "원산지·제조일 전 상품 공개, 불만 24시간 내 응대", value: "믿고 아이에게 먹일 수 있음" },
    { title: "숫자로 보는 습관", past: "용돈 가계부를 스스로 만들어 관리", now: "재구매율·이탈 사유를 매주 분석", value: "'진짜 10분' 같은 검증된 약속" },
    { title: "신중한 확장", past: "새 게임도 규칙을 다 읽고 시작", now: "신메뉴는 100세트 테스트 후 출시", value: "실패작이 없어 선택이 쉬움" },
  ],
  scores: { 정체성: 78, 진정성: 81, 포지셔닝: 55, "상품·고객": 72, 마케팅: 38 },
  scoreNotes: {
    정체성: "존재 이유와 품질 기준이 일치하며 대표의 서사와 강점이 뒷받침합니다.",
    진정성: "책임감·분석·신중함 강점이 실제 운영 방식(테스트 후 출시, 전수 공개)에 드러납니다.",
    포지셔닝: "'10분 밀키트' 시장에 경쟁사가 많은데 '믿고 먹는다'는 차별점이 문장으로 정리돼 있지 않습니다.",
    "상품·고객": "월 매출 2,400만 원, 재구매율 35%로 상품은 검증됐으나 정기배송 비중이 낮습니다.",
    마케팅: "유입의 70%가 스마트스토어 검색에 의존하고, 자체 채널 콘텐츠가 월 2회에 그칩니다.",
  },
  gap: "고객은 '믿을 수 있어서' 사는데 마케팅은 '10분 간편'만 말하고 있어 경쟁사와 같은 자리에서 가격 비교를 당합니다. 대표의 강점인 신중함이 마케팅에서는 '노출을 미루는 이유'로 작동해 인지도 확대를 막고 있습니다.",
  brandStrategy: {
    positioning: "10분 밀키트 중 유일하게 원산지·제조과정을 전부 공개하는, 아이 있는 맞벌이 가정을 위한 신뢰형 밀키트",
    coreMessage: "10분이지만, 대충은 아닙니다",
    target: "5~10세 자녀가 있는 30~40대 맞벌이 부부, 배달은 미안하고 요리는 힘든 평일 저녁",
    tone: "격식체를 유지하되 문장을 짧게. 모든 상품 설명 첫 줄은 '무엇이 들어갔는지'로 시작",
  },
  marketing: {
    channels: [
      { channel: "홈페이지·자사몰", direction: "스마트스토어 의존(유입 70%)을 줄이기 위해 자사몰 정기배송 페이지를 메인으로. 상세페이지 첫 화면을 원산지 표와 제조 사진으로 교체", example: "이 밀키트에 들어간 재료 12가지, 전부 보여드립니다" },
      { channel: "유튜브 롱폼", direction: "당장 시작하지 않음. 4명 인원으로 편집 부담이 크고 신뢰형 브랜드는 짧은 검수 영상이 더 맞음. 정기배송 비중 30% 달성 후 재검토", example: "(보류) 텐미닛키친 공장 하루 — 검수부터 포장까지" },
      { channel: "숏폼 (쇼츠·릴스)", direction: "대표가 직접 공장·검수 과정을 찍는 '오늘의 검수' 주 2회. 인스타 릴스와 유튜브 쇼츠에 동시 업로드", example: "오늘 반려된 양파 3박스, 이유는" },
      { channel: "네이버 블로그", direction: "'맞벌이 저녁' 검색 키워드에 맞춘 식단 가이드로 검색 유입을 자체 콘텐츠로 확보", example: "맞벌이 부부 평일 5일 저녁 식단표 (장보기 0회)" },
    ],
    plan90: [
      "1개월차: 핵심 메시지 확정, 상세페이지 3종 원산지 공개형으로 교체, 인스타 '오늘의 검수' 시작",
      "2개월차: 정기배송 4주 체험권(20% 할인) 출시, 재구매 고객 200명에게 우선 안내, 블로그 식단표 4편 발행",
      "3개월차: 정기배송 비중 30% 목표 점검, 어린이집·학원 인근 오프라인 시식 1회, 협업 제안(유아식 브랜드) 발송",
    ],
  },
  product: {
    keep: "재구매율이 가장 높은 '순한 불고기 덮밥' 등 아이 동반 메뉴 3종은 그대로 두고 대표 상품으로 고정합니다.",
    change: "단품 판매 위주를 '평일 5일 세트'로 묶어 객단가를 높이고 '이번 주 저녁은 해결됐다'는 경험으로 바꿉니다.",
    new: "월 59,000원 정기배송을 주력으로 키우고, 3개월 뒤 '아이 도시락 밀키트'(주 3회, 39,000원)를 테스트합니다.",
  },
  customer: {
    focus: "5~10세 자녀가 있는 맞벌이 가정. 재구매율과 객단가가 가장 높고 리뷰가 가장 구체적입니다.",
    release: "가격 비교 후 1회 구매하는 1인 가구. 할인 때만 유입되고 재구매율 8%로 광고비 대비 효율이 낮습니다.",
    expand: "부모님 집에 밀키트를 보내는 40~50대 자녀 세대. '믿을 수 있는 재료'가 곧 구매 이유가 됩니다.",
  },
  contentSeeds: [
    { source: "직무 · 품질관리 7년", seed: "식품회사 QC가 집에서 장 볼 때 절대 안 사는 것", format: "전문 해설" },
    { source: "지출 · 유아식 월 20만 원", seed: "아이 밥에 쓰는 돈을 직접 계산해 본 부모의 정산표", format: "비교·데이터" },
    { source: "모임 · 맞벌이 부모 독서모임", seed: "모임 8가정의 '평일 저녁 실태'를 익명 설문으로 공개", format: "설문·커뮤니티" },
    { source: "만족 제품 · 정기배송 커피", seed: "'기다려지는 배송'이 되려면 무엇이 필요한지 우리 정기배송에 적용", format: "과정 공개" },
  ],
  contentDo: [
    { title: "이 밀키트 재료 12가지, 원산지 전부 공개", why: "핵심 메시지를 가장 직접적으로 증명하는 콘텐츠" },
    { title: "오늘 반려된 양파 3박스, 이유는", why: "신중함·책임감 강점을 콘텐츠로 시각화" },
    { title: "맞벌이 부부 평일 5일 저녁 식단표", why: "검색 유입과 세트 상품 판매를 동시에 잡음" },
    { title: "아이가 남긴 밀키트 vs 다 먹은 밀키트, 데이터로 봤습니다", why: "분석 강점을 살린 신뢰 콘텐츠" },
    { title: "정기배송 4주 써본 고객의 냉장고", why: "정기배송 전환을 돕는 실사용 후기" },
  ],
  dont: [
    { what: "타임세일·1+1 반복 할인", why: "가격 비교 고객만 유입되고 '대충 아님' 포지셔닝을 훼손" },
    { what: "유튜브 신규 개설", why: "4명 인원으로 월 2회 인스타도 벅찬 상황, 채널 확장보다 기존 채널 빈도가 우선" },
    { what: "신메뉴 동시 5종 출시", why: "신중한 테스트라는 강점과 상충하고 재고 리스크 증가" },
    { what: "인플루언서 대량 협찬", why: "지난 협찬 40만 원에 구매 3건, 신뢰형 브랜드는 대표 얼굴이 더 효과적" },
  ],
  strengthStrategies: [
    { strength: "책임감", title: "'책임 보증'을 상품에 넣기", body: "맛이 없으면 전액 환불하는 보증을 공식화합니다. 책임감 강점을 가진 대표에게는 자연스러운 약속이고, 신뢰형 포지셔닝의 가장 강한 증거가 됩니다." },
    { strength: "분석", title: "주간 데이터 리포트를 콘텐츠로", body: "매주 보는 재구매율·반품 사유를 고객에게도 공개하는 '이번 주 텐미닛 숫자' 게시물을 만듭니다. 분석 강점을 마케팅 자산으로 전환합니다." },
    { strength: "신중함", title: "신중함을 '검수 콘텐츠'로 뒤집기", body: "노출을 미루게 만드는 신중함을, 검수 과정을 보여주는 콘텐츠의 소재로 씁니다. 약점처럼 작동하던 강점을 마케팅의 근거로 바꿉니다." },
    { strength: "전략", title: "'하지 않을 것' 분기 목록 공개", body: "4위 강점 전략을 활용해 분기마다 하지 않을 메뉴·채널·할인을 먼저 정하고 고객에게도 공개합니다. 선택과 집중이 곧 신뢰형 브랜드의 메시지가 됩니다." },
    { strength: "공정성", title: "누구에게나 같은 가격, 같은 기준", body: "5위 강점 공정성을 살려 첫 구매·재구매·대량 구매의 가격 기준을 하나로 공개합니다. 할인 경쟁 대신 '조건이 같다'는 신뢰로 차별화합니다." },
  ],
};

const SAMPLE = {
  oneLiner: "실패가 무서운 자취생에게 '10분이면 되는 저녁'을 돌려주는 채널",
  originStory: [
    "자취요리 준은 열 살 무렵, 어머니가 아프시던 날 처음으로 혼자 밥을 차렸던 저녁에서 시작됐습니다. 서툰 계란말이를 먹으며 웃던 가족의 얼굴이 '누군가를 먹이는 일'의 첫 기억으로 남았고, 이후 친구들에게 '넌 설명을 참 쉽게 한다'는 말을 자주 들었습니다. 규칙을 한 번에 이해해 남에게 알려주는 아이는, 지금 복잡한 레시피를 실패 지점 순으로 풀어주는 사람이 되었습니다.",
    "어른들이 '아이니까' 대충 설명하고 넘어가는 것을 참지 못했던 성향은, 오늘날 '초보니까 대충 따라 하라'는 요리 콘텐츠에 대한 문제의식으로 이어집니다. 마케팅 대행사에서 숫자를 쉽게 설명하는 능력으로 인정받는 현재의 직업 역시 같은 축 위에 있습니다. 이 채널의 뿌리는 요리가 아니라 '어려운 것을 쉽게 만들어 누군가를 안심시키는 일'입니다.",
  ],
  strengths: [
    { title: "쉬운 설명", past: "게임 규칙을 한 번에 이해해 친구들에게 가르쳐줌", now: "레시피를 '실패하기 쉬운 지점' 순으로 재구성", value: "따라 하다 망칠 걱정이 사라짐" },
    { title: "돌봄의 동기", past: "아픈 어머니를 위해 처음 차린 저녁 한 끼", now: "댓글 질문에 하나하나 답하는 운영 방식", value: "혼자 해도 누군가 봐주는 느낌" },
    { title: "숫자 감각", past: "용돈 기입장을 스스로 만들어 관리", now: "대행사에서 성과 보고로 인정받는 능력", value: "'10분, 재료 3개' 같은 명확한 약속" },
  ],
  scores: { 정체성: 82, 진정성: 74, 포지셔닝: 58, "상품·고객": 61, 마케팅: 43 },
  scoreNotes: {
    정체성: "존재 이유와 핵심 가치가 한 문장으로 일치하며, 과거 서사와 연결이 뚜렷합니다.",
    진정성: "타고난 강점이 현재 콘텐츠에 잘 드러나지만, 챌린지 콘텐츠가 축을 흐리고 있습니다.",
    포지셔닝: "타겟은 선명하나 '10분 자취 요리' 시장에서 차별점 문장이 아직 약합니다.",
    "상품·고객": "타겟과 문제는 선명하나 유료 상품이 없어 고객 수는 늘어도 매출로 이어지지 않습니다.",
    마케팅: "릴스 레시피가 효과적이라는 데이터가 있는데도 예산과 시간이 챌린지에 분산돼 있습니다.",
  },
  gap: "고객은 '실패할 걱정 없이 10분'이라는 이유로 채널을 선택하는데, 정작 유행 따라 찍는 숏폼 챌린지는 그 약속과 무관합니다. 조회수는 챌린지에서 나오지만 구독 전환과 신뢰는 레시피에서 나오는 구조라, 챌린지를 줄여도 핵심 지표는 떨어지지 않을 가능성이 높습니다.",
  brandStrategy: {
    positioning: "자취 요리 채널 중 유일하게 '실패 지점'부터 알려주는, 요리 초보를 위한 안심 레시피 채널",
    coreMessage: "망칠 수 없는 10분 저녁",
    target: "자취 1년 미만, 라면 이상을 해본 적 없고 실패가 두려워 시작을 미루는 20대 초반",
    tone: "친근한 반말 구어체를 유지하되, 모든 콘텐츠 첫 문장은 '이거 망치는 사람 없어'류의 안심 문장으로 시작",
  },
  marketing: {
    channels: [
      { channel: "홈페이지·자사몰", direction: "아직 없음. 워크북 출시(3개월차)에 맞춰 노션이나 스마트스토어 1페이지로 시작하고, 유튜브 설명란 첫 링크로 연결", example: "자취 첫 달 생존 레시피 워크북 — 미리보기 3페이지 무료" },
      { channel: "유튜브 롱폼", direction: "주력. 레시피마다 '여기서 망합니다' 구간을 타임스탬프로 고정 배치해 채널 시그니처로 만들기 (월 4회)", example: "계란볶음밥, 90%가 망하는 그 순간 (재료 3개·10분)" },
      { channel: "숏폼 (쇼츠·릴스)", direction: "새로 찍지 말고 롱폼의 '망하는 순간' 15초만 잘라 쇼츠·릴스에 동시 업로드 (주 3회). 챌린지 콘텐츠는 중단", example: "자취 첫 주에 꼭 망하는 요리 TOP 3" },
      { channel: "스레드", direction: "댓글 질문을 텍스트 Q&A로 옮겨 '물어보면 답해주는 선배' 포지션 강화", example: "김치찌개 신맛 잡는 법, 댓글 질문 모음" },
    ],
    plan90: [
      "1개월차: 숏폼 챌린지 중단, 기존 영상 20개에 '망하는 순간' 타임스탬프 추가, 모든 채널 프로필 문구를 '망칠 수 없는 10분 저녁'으로 통일",
      "2개월차: '자취 첫 달 생존 레시피 10' 시리즈 제작, 인스타 릴스 주 3회 재활용 업로드, 댓글 질문 스레드 정리 시작",
      "3개월차: 시리즈를 묶은 유료 PDF 워크북(9,900원) 출시로 수익 모델 다변화, 주방 소형가전 브랜드 협찬 제안서 발송",
    ],
  },
  product: {
    keep: "'실패 지점' 구조의 10분 레시피 영상은 채널의 핵심이므로 형식을 고정하고 시리즈로 묶습니다.",
    change: "협찬 영상은 건당 단가보다 '자취 첫 달 필수템' 같은 시리즈 안에 자연스럽게 넣는 방식으로 바꿔, 시청자 이탈 없이 단가를 높입니다.",
    new: "반응 좋은 레시피 10개를 묶은 PDF 워크북(9,900원)과 장보기 리스트 템플릿을 첫 유료 상품으로 만듭니다.",
  },
  customer: {
    focus: "자취 1년 미만, 요리를 시작조차 못 하고 있는 20대 초반. 댓글과 구독 전환이 가장 높은 층입니다.",
    release: "이미 요리를 잘하는 '레시피 수집가' 시청자. 조회수는 주지만 구매로 이어지지 않고 챌린지 콘텐츠 요구가 많습니다.",
    expand: "자녀를 자취시킨 부모 세대. 워크북 선물 수요가 있어 두 번째 상품의 구매층이 될 수 있습니다.",
  },
  contentSeeds: [
    { source: "전공 · 식품영양학", seed: "자취생 한 끼 영양 기준을 '이 정도면 됐다' 수준으로 쉽게 풀어주기", format: "전문 해설" },
    { source: "취미 · 보드게임 모임 4년", seed: "모임 날 8인분을 10분 요리로 해결한 경험을 '손님 오는 날 편'으로", format: "과정 브이로그" },
    { source: "판매 경험 · 플리마켓 수제 잼", seed: "잼 60병 완판 때 배운 '설명 문구'가 지금 레시피 설명 방식의 뿌리", format: "브랜드 스토리" },
    { source: "불만족 제품 · 밀키트", seed: "양은 많은데 맛이 밋밋한 밀키트를 10분 만에 살리는 법", format: "리뷰·개선" },
  ],
  contentDo: [
    { title: "자취 첫 주에 90%가 망하는 요리 3가지", why: "'실패 지점' 시그니처를 가장 직관적으로 보여주는 진입 콘텐츠" },
    { title: "계란 하나로 5일 버티기 (재료비 3,000원)", why: "타겟의 예산 고민을 숫자로 정면 공략" },
    { title: "댓글 질문 답변: 김치찌개 신맛 잡는 법", why: "리뷰에서 반복되는 질문을 콘텐츠로 전환해 신뢰 축적" },
    { title: "이 채널 레시피 실패한 사람 모여라 (실패 리뷰 편)", why: "실패를 숨기지 않는 태도가 곧 브랜드 진정성" },
    { title: "워크북 미리보기: 첫 달 장보기 리스트", why: "유료 상품 출시 전 수요 검증 겸 예고" },
  ],
  dont: [
    { what: "유행 숏폼 챌린지 참여", why: "본인이 나답지 않다고 느끼고, 구독 전환에도 기여하지 않음" },
    { what: "인스타 유료 광고 집행", why: "30만 원으로 구매 2건, 현재 예산 규모에서 효율이 나오지 않음" },
    { what: "요리 고수 대상 고난도 레시피", why: "집중 고객과 맞지 않고 '실패 없는' 포지셔닝을 흐림" },
    { what: "유튜브 외 채널 동시 확장", why: "1인 운영으로 편집 시간이 부족한데 채널을 늘리면 업로드 주기가 무너짐" },
  ],
  strengthStrategies: [
    { strength: "육성", title: "댓글 질문을 '주간 과외' 코너로", body: "가르치는 것이 자연스러운 육성 강점을 살려 매주 댓글 질문 3개를 골라 답하는 고정 코너를 만듭니다. 유료 워크북과 강의로 이어지는 가장 자연스러운 길입니다." },
    { strength: "표현", title: "얼굴과 목소리를 앞세운 포맷 고정", body: "카메라가 편한 표현 강점을 활용해 손만 나오는 레시피 영상 대신 대표가 직접 말하는 인트로를 모든 영상에 넣습니다. 채널의 얼굴이 곧 브랜드가 됩니다." },
    { strength: "공감", title: "실패 댓글을 콘텐츠 소재로", body: "'저는 망했어요' 댓글에 공감하며 답하는 영상은 공감 강점과 '실패 없는' 포지셔닝을 동시에 보여줍니다." },
    { strength: "체계", title: "레시피를 시리즈·순서로 묶기", body: "체계 강점으로 흩어진 영상을 '자취 1주차·2주차' 재생목록으로 재구성해 신규 시청자의 시청 시간을 늘립니다." },
  ],
  actions: [
    { title: "챌린지 콘텐츠를 멈추고 시그니처 포맷 고정", body: "'여기서 망합니다' 구간을 모든 영상의 필수 요소로 만들어 채널을 한 문장으로 기억되게 합니다." },
    { title: "채널 간 첫 문장 통일", body: "유튜브 소개, 인스타 프로필, 스레드 바이오를 같은 핵심 메시지로 맞춰 표현 점수를 끌어올립니다." },
    { title: "광고 외 첫 수익원 만들기", body: "가장 반응 좋은 레시피 10개를 워크북으로 묶어 3개월 안에 판매를 시작합니다." },
  ],
};


function RadarSVG({ data }) {
  const n = data.length, cx = 200, cy = 170, R = 120;
  const pt = (i, r) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const poly = data.map((d, i) => pt(i, (R * d.v) / 100).join(",")).join(" ");
  return (
    <svg viewBox="0 0 400 340" style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={data.map((_, i) => pt(i, R * f).join(",")).join(" ")} fill="none" stroke="#C9D3CB" />)}
      {data.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#C9D3CB" />; })}
      <polygon points={poly} fill="#2F6B4F" fillOpacity="0.25" stroke="#2F6B4F" strokeWidth="2" />
      {data.map((d, i) => { const [x, y] = pt(i, R + 22); return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#1B2A24" fontFamily="Noto Sans KR, sans-serif">{d.k} {d.v}</text>; })}
    </svg>
  );
}

/* ───────── 스타일 ───────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');
:root{--paper:#EEF1EC;--ink:#1B2A24;--moss:#2F6B4F;--mist:#C9D3CB;--marigold:#E8B84A;--rule:#DCE2DD;}
*{box-sizing:border-box}
.app{min-height:100vh;background:var(--paper);color:var(--ink);font-family:'Noto Sans KR',system-ui,sans-serif;display:flex}
.spine{width:210px;border-right:1px solid var(--rule);padding:36px 24px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:6px}
.spine .brand{font-family:'Noto Serif KR',serif;font-weight:700;font-size:15px;letter-spacing:-.01em;margin-bottom:22px}
.spine .chap{display:flex;gap:10px;align-items:baseline;font-size:13px;padding:6px 0;color:#6E7A72;border-left:2px solid transparent;padding-left:10px;transition:.2s}
.spine .chap.cur{color:var(--ink);border-left-color:var(--moss);font-weight:500}
.spine .chap.done{color:var(--moss)}
.spine .chap b{font-family:'Noto Serif KR',serif;font-size:12px;width:14px}
.spine .foot{margin-top:auto;font-size:12px;color:#6E7A72;line-height:1.6}
.stage{flex:1;display:flex;flex-direction:column;min-width:0}
.bar{height:3px;background:var(--rule)}
.bar i{display:block;height:100%;background:var(--marigold);transition:width .4s}
.page{max-width:640px;width:100%;margin:0 auto;padding:60px 28px 120px;flex:1}
.eyebrow{font-size:12px;letter-spacing:.14em;color:var(--moss);font-weight:500;text-transform:uppercase}
.num{font-family:'Noto Serif KR',serif;font-size:56px;font-weight:700;line-height:1;color:var(--mist);margin:18px 0 10px}
h1.q{font-family:'Noto Serif KR',serif;font-size:26px;font-weight:700;line-height:1.45;letter-spacing:-.01em;margin:0 0 10px;word-break:keep-all}
.hint{font-size:14px;color:#55635B;line-height:1.7;margin:0 0 22px}
.ex{border-left:2px solid var(--marigold);padding:8px 14px;margin:0 0 22px;font-size:13.5px;color:#55635B;line-height:1.85}
.ex span{display:block}
.ex em{font-style:normal;font-weight:500;color:var(--ink);display:block;margin-bottom:2px}
textarea,input[type=text]{width:100%;font:inherit;font-size:16px;line-height:1.7;color:var(--ink);background:transparent;border:0;border-bottom:1.5px solid var(--mist);padding:10px 0;outline:none;resize:none;transition:border-color .2s}
textarea:focus,input[type=text]:focus{border-bottom-color:var(--moss)}
textarea{min-height:110px}
.opts{display:flex;flex-direction:column;gap:8px}
.opt{display:flex;align-items:center;gap:12px;padding:13px 16px;border:1px solid var(--mist);border-radius:6px;background:#fff;cursor:pointer;font-size:15px;line-height:1.5;transition:.15s;text-align:left;font-family:inherit;color:var(--ink)}
.opt:hover{border-color:var(--moss)}
.opt.on{border-color:var(--moss);background:#E6EFE9}
.opt .box{width:16px;height:16px;border:1.5px solid var(--mist);border-radius:4px;flex:none;display:grid;place-items:center}
.opt.round .box{border-radius:50%}
.opt.on .box{background:var(--moss);border-color:var(--moss)}
.opt.on .box:after{content:'';width:6px;height:6px;background:#fff;border-radius:50%}
.scale{display:flex;gap:8px;margin:8px 0}
.scale button{flex:1;height:56px;border:1px solid var(--mist);background:#fff;border-radius:6px;font-family:'Noto Serif KR',serif;font-size:20px;cursor:pointer;color:var(--ink)}
.scale button.on{background:var(--moss);color:#fff;border-color:var(--moss)}
.scale-lab{display:flex;justify-content:space-between;font-size:12px;color:#6E7A72}
.fill{font-size:19px;line-height:2.6;font-family:'Noto Serif KR',serif}
.fill input{display:inline-block;width:auto;min-width:120px;font:inherit;font-size:18px;border-bottom:1.5px solid var(--moss);text-align:center;margin:0 6px;padding:0 6px;background:#fff}
.kw{display:flex;gap:10px}
.kw input{text-align:center}
.dual{display:grid;gap:22px}.dual .lab{font-size:12px;letter-spacing:.1em;color:var(--moss);font-weight:500;margin-bottom:2px}.dual .lab small{letter-spacing:0;color:#6E7A72;margin-left:8px;font-weight:400}
.drop{border:2px dashed var(--mist);border-radius:10px;padding:34px 20px;text-align:center;background:#fff;cursor:pointer;transition:.15s;display:flex;flex-direction:column;align-items:center;gap:8px}.drop.on,.drop:hover{border-color:var(--moss);background:#E6EFE9}.dropi{font-family:'Noto Serif KR',serif;font-size:30px;color:var(--moss)}.drop b{display:block;font-weight:500;font-size:15px}.drop small{display:block;font-size:12px;color:#6E7A72;margin-top:4px}.filerow{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;background:#fff;border:1px solid var(--rule);border-radius:6px;margin-bottom:6px;font-size:14px}.filerow small{display:block;color:#6E7A72;font-size:12px;margin-top:2px}.filerow.warn{border-left:3px solid var(--marigold)}.filerow button{font:inherit;font-size:12px;border:0;background:none;color:#6E7A72;cursor:pointer;flex:none}
.sub{margin-top:28px;padding-top:22px;border-top:1px dashed var(--mist)}
.sub .lab{font-size:14px;font-weight:500;margin-bottom:10px}
.nav{position:sticky;bottom:0;background:linear-gradient(transparent,var(--paper) 30%);padding:28px;display:flex;justify-content:center}
.nav .in{max-width:640px;width:100%;display:flex;align-items:center;gap:12px}
.btn{font:inherit;font-size:15px;font-weight:500;padding:13px 22px;border-radius:6px;border:1px solid var(--ink);background:var(--ink);color:#fff;cursor:pointer;transition:.15s}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn.ghost{background:transparent;color:var(--ink)}
.btn.link{border:0;background:transparent;color:#6E7A72;padding:13px 6px}
.count{margin-left:auto;font-family:'Noto Serif KR',serif;font-size:14px;color:#6E7A72}
.sect{font-family:'Noto Serif KR',serif;font-size:13px;color:var(--moss);margin-top:14px;font-weight:500}
.intro{padding:70px 28px;max-width:640px;margin:0 auto}
.intro h1{font-family:'Noto Serif KR',serif;font-size:40px;line-height:1.3;letter-spacing:-.02em;margin:22px 0 18px;word-break:keep-all}
.intro p{font-size:16px;line-height:1.85;color:#3E4B45;word-break:keep-all}
.notice{background:#fff;border:1px solid var(--rule);border-left:3px solid var(--marigold);padding:18px 20px;margin:24px 0 32px;font-size:15px;line-height:1.8;word-break:keep-all}
.chapters{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:8px 0 36px;font-size:14px}
.chapters div{display:flex;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--rule)}
.chapters b{font-family:'Noto Serif KR',serif;color:var(--moss)}
.chapters i{font-style:normal;margin-left:auto;color:#6E7A72;font-size:12px}
.report{max-width:760px;margin:0 auto;padding:60px 28px 100px}
.report h2{font-family:'Noto Serif KR',serif;font-size:22px;margin:44px 0 14px;padding-bottom:10px;border-bottom:1px solid var(--rule)}
.report p{font-size:15.5px;line-height:1.9;word-break:keep-all;color:#2A3630}
.story p{font-family:'Noto Serif KR',serif;font-size:16.5px;line-height:2}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{background:#fff;border:1px solid var(--rule);border-radius:8px;padding:18px}
.card h4{margin:0 0 6px;font-size:15px}
.card p{font-size:13.5px;line-height:1.7;margin:0;color:#55635B}
.card .tag{font-size:11px;letter-spacing:.1em;color:var(--moss);margin-bottom:8px}
.act{display:flex;gap:16px;padding:16px 0;border-bottom:1px solid var(--rule)}
.act b{font-family:'Noto Serif KR',serif;font-size:22px;color:var(--marigold);width:28px;flex:none}
.loading{text-align:center;padding:120px 20px;font-family:'Noto Serif KR',serif;font-size:20px;line-height:1.8}
.loading small{display:block;font-family:'Noto Sans KR';font-size:13px;color:#6E7A72;margin-top:12px}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--marigold);margin:0 3px;animation:b 1.2s infinite}
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
@keyframes b{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
.top3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0 18px}.top3c{background:#fff;border:1px solid var(--rule);border-radius:8px;padding:16px}.top3n{font-family:'Noto Serif KR',serif;font-size:22px;font-weight:700;margin:4px 0}.top3n small{display:block;font-family:'Noto Sans KR';font-weight:400;font-size:12px;color:#6E7A72}.top3s{font-family:'Noto Serif KR',serif;font-size:14px;color:#6E7A72;margin-top:6px}.top3s b{font-size:28px;color:var(--ink);margin-right:4px}.top3bar{height:6px;background:var(--rule);border-radius:3px;margin-top:8px;overflow:hidden}.top3bar i{display:block;height:100%}
.sgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0 8px}
.sdom{border-top:4px solid;padding:10px 4px 8px;font-family:'Noto Serif KR',serif;font-weight:700;font-size:15px;text-align:center;margin-bottom:8px}
.sdom small{display:block;font-family:'Noto Sans KR';font-weight:400;font-size:11px;color:#6E7A72;margin-top:2px}
.scell{border-radius:6px;padding:14px 10px;margin-bottom:8px;text-align:center;min-height:78px;display:flex;flex-direction:column;justify-content:center;font-size:13.5px;line-height:1.35}
.scell b{font-family:'Noto Serif KR',serif;font-size:20px;display:block;margin-bottom:2px;font-weight:700}
.scell em{font-style:normal;font-size:11px;display:block;opacity:.85}
@media(max-width:760px){.sgrid{grid-template-columns:repeat(2,1fr)}.top3{grid-template-columns:1fr}.spine{display:none}.grid3{grid-template-columns:1fr}.chapters{grid-template-columns:1fr}.intro h1{font-size:30px}h1.q{font-size:22px}.num{font-size:44px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

/* ───────── 컴포넌트 ───────── */
export default function App() {
  const [phase, setPhase] = useState("intro"); // intro | survey | loading | report | error
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState({});
  const [report, setReport] = useState(null);
  const [err, setErr] = useState("");
  const [strengths, setStrengths] = useState(null);
  const [after, setAfter] = useState("intro");
  const [mat, setMat] = useState({ url: "", texts: [], images: [], audios: [], skipped: [], transcript: "" });
  const topRef = useRef(null);

  const cur = Q[idx];
  const set = (v) => setAns((a) => ({ ...a, [cur.n]: v }));
  const val = ans[cur?.n];

  useEffect(() => { topRef.current?.scrollTo?.(0, 0); window.scrollTo(0, 0); }, [idx, phase]);

  const answered = (q, v) => {
    if (v == null) return false;
    if (q.type === "multi") return Array.isArray(v) && v.length > 0;
    if (q.type === "keywords" || q.type === "fill" || q.type === "dual") return Array.isArray(v) && v.some((x) => x?.trim());
    if (q.type === "yesno") return Array.isArray(v) && !!v[0];
    if (q.type === "links") return Array.isArray(v) && v.some((x) => x?.trim());
    if (q.type === "pair") return Array.isArray(v) && v.every((x) => x?.trim());
    if (q.type === "scale") return typeof v === "number";
    return String(v).trim().length > 0;
  };
  const canNext = true;
  const isLast = idx === Q.length - 1;
  const secDone = (s) => Q.filter((q) => q.s === s).every((q) => q.skip || answered(q, ans[q.n]));
  const secIdx = SECTIONS.findIndex((s) => s.id === cur.s);
  const firstOfSec = idx === 0 || Q[idx - 1].s !== cur.s;

  const next = () => (isLast ? runDiagnosis() : setIdx(idx + 1));
  const prev = () => setIdx(Math.max(0, idx - 1));

  async function callClaude(prompt, withImages) {
    const content = [{ type: "text", text: prompt }];
    if (withImages) mat.images.slice(0, 4).forEach((im) => content.push({ type: "image", source: { type: "base64", media_type: im.type, data: im.b64 } }));
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content }] }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || "API 오류");
    const text = (d.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    const a = text.indexOf("{"), b = text.lastIndexOf("}");
    if (a < 0 || b < 0) throw new Error("JSON 없음");
    return JSON.parse(text.slice(a, b + 1));
  }

  async function runDiagnosis() {
    setPhase("loading");
    const lines = Q.map((q) => {
      const v = ans[q.n];
      let t;
      if (q.type === "yesno") t = v?.[0] === "있음" ? `있음 — ${v[1] || ""}` : v?.[0] || "(무응답)";
      else if (q.type === "links") t = `웹사이트: ${v?.[0] || "없음"} / SNS: ${v?.[1] || "없음"}`;
      else if (q.type === "dual") t = `과거: ${v?.[0] || "-"} / 현재: ${v?.[1] || "-"}`;
      else if (q.type === "pair") t = `${q.lab1}: ${v?.[0] || ""} / ${q.lab2}: ${v?.[1] || ""}`;
      else t = Array.isArray(v) ? v.filter(Boolean).join(" / ") : v ?? "(무응답)";
      return `${q.n}. ${q.q}\n→ ${t}${q.sub && ans[`${q.n}-1`] ? `\n→ 가장 키우고 싶은 모델: ${ans[`${q.n}-1`]}` : ""}`;
    }).join("\n\n");

    const strengthLine = strengths ? `\n\n=== 강점 검사 결과 (상위 5) ===\n${strengths.slice(0, 5).map((t) => `${t.rank}. ${t.name}(${t.en}) - ${t.desc}`).join("\n")}` : "";
    const matLines = [
      mat.url ? `홈페이지/채널 주소: ${mat.url}` : "",
      mat.transcript ? `[음성 설명]\n${mat.transcript.slice(0, 4000)}` : "",
      ...mat.texts.map((t) => `[파일: ${t.name}]\n${t.text.slice(0, 5000)}`),
      mat.images.length ? `[첨부 이미지 ${mat.images.length}장: ${mat.images.map((i) => i.name).join(", ")}] — 이미지는 메시지에 첨부됨` : "",
    ].filter(Boolean).join("\n\n");
    const matBlock = matLines ? `\n\n=== 업로드 자료 (설문보다 우선 참고) ===\n${matLines}` : "";
    const rules = `규칙: JSON만 출력. 마크다운·설명·코드펜스 금지. 모든 문장은 한국어이며 브랜드명을 실제로 사용. 문자열 안에 큰따옴표를 쓰지 말 것. 각 문장은 짧고 구체적으로. 전체 출력 1200자 이내. 설문에 무응답이 많으면 업로드 자료와 강점 검사로 추론하고, 근거가 없는 항목은 "정보 부족: ~를 알려주면 정확해집니다"라고 쓸 것.`;

    const p1 = `당신은 브랜드 전략 진단 전문가입니다. 설문 답변을 분석해 아래 JSON을 출력하세요.
${rules}

분석 원칙: 강점 검사 결과가 있으면 strengths 3개 중 최소 2개는 검사 상위 5개 테마와 연결할 것. 8~10번 과거 답변과 7번 현재 직업의 능력, 14~15번 현재 강점을 교차해 일관된 강점 축을 찾을 것. 점수는 답변의 구체성·숫자·일관성 기준 0~100 정수.

형식:
{"oneLiner":"브랜드를 한 줄로 정의","originStory":["문단1 (3문장)","문단2 (3문장)"],"strengths":[{"title":"강점명","past":"과거 근거","now":"현재 발현","value":"고객 가치"},{},{}],"scores":{"정체성":0,"진정성":0,"포지셔닝":0,"상품·고객":0,"마케팅":0},"scoreNotes":{"정체성":"1문장","진정성":"1문장","포지셔닝":"1문장","상품·고객":"1문장","마케팅":"1문장"},"gap":"현재 활동과 고객 선택 이유의 충돌 지점 2문장"}

=== 설문 답변 ===
${lines}${strengthLine}${matBlock}`;

    const p2 = `당신은 브랜드 마케팅 전략가입니다. 설문 답변을 바탕으로 실행 가능한 전략을 아래 JSON으로 출력하세요.
${rules}

원칙: S8번 얼굴·목소리 노출 가능 여부에 맞는 포맷만 제안(불가면 화면 녹화·손·텍스트·AI 보이스 포맷). S9번 SNS 경험을 채널 선택 근거로. 16~17번 상품·매출, 24번 수익 모델, 25~29번 마케팅 현황(유입 경로·빈도·예산·효과 있던 것·못 하는 것), 30번 희망 매출을 반드시 반영. channels는 반드시 "홈페이지·자사몰", "유튜브 롱폼", "숏폼(쇼츠·릴스)" 3개를 각각 별도 항목으로 다루고(현재 안 하고 있으면 시작 여부와 이유를 direction에), 25번에서 고른 다른 채널이 있으면 1개 추가. 1-1번 주소가 있으면 그 채널을 첫 번째로. 예산과 인원(5번)을 넘지 않는 현실적인 제안만.

형식:
{"brandStrategy":{"positioning":"포지셔닝 문장","coreMessage":"핵심 메시지 한 줄","target":"타겟 한 줄 정의","tone":"톤앤매너 가이드 한 줄"},"marketing":{"channels":[{"channel":"홈페이지·자사몰","direction":"1문장","example":"페이지·콘텐츠 예시"},{"channel":"유튜브 롱폼","direction":"1문장","example":"영상 제목"},{"channel":"숏폼(쇼츠·릴스)","direction":"1문장","example":"영상 제목"},{"channel":"추가 채널","direction":"1문장","example":"예시"}],"plan90":["1개월차: ...","2개월차: ...","3개월차: ..."]},"actions":[{"title":"액션명","body":"1~2문장"},{},{}]}

=== 설문 답변 ===
${lines}${strengthLine}${matBlock}`;

    const p3 = `당신은 상품 기획·콘텐츠 전략가입니다. 설문 답변을 바탕으로 아래 JSON을 출력하세요.
${rules}

원칙: S1~S9번(전공·취미·지출·판매 경험·모임·불만족 제품·만족 제품·SNS 경험)을 콘텐츠 소재와 상품 아이디어의 1차 재료로 쓸 것. contentSeeds는 S문항 각각에서 뽑되 '없음'인 항목은 건너뛰고, 각 소재에 어울리는 콘텐츠 유형(리뷰·비교·과정·모임·전문 해설 등)을 붙일 것. 16번 현재 상품·가격, 17번 매출·고객 규모, 18~21번 고객·리뷰, 22번 경쟁·가격 위치, 24번 수익 모델, 30번 희망 매출을 반영. 상품 방향은 '지금 것을 어떻게 바꿀지'와 '새로 만들 것'을 구분. 고객 방향은 '집중할 고객'과 '놓아줄 고객'을 구분. 콘텐츠 예시는 제목 수준으로 바로 만들 수 있게. 하면 안 되는 것은 19번 나답지 않은 활동, 28번 효과 없던 마케팅, 예산·인원을 근거로.

형식:
{"product":{"keep":"유지·강화할 상품 1문장","change":"바꿀 상품과 방법 1~2문장","new":"새로 만들 상품과 가격대 1~2문장"},"customer":{"focus":"집중할 고객 1~2문장","release":"우선순위에서 내릴 고객과 이유 1문장","expand":"다음 단계에서 넓힐 고객 1문장"},"contentSeeds":[{"source":"출처(전공/취미/판매 경험 등)","seed":"소재 1문장","format":"콘텐츠 유형"},{},{},{}],"contentDo":[{"title":"콘텐츠 제목","why":"이유 1문장"},{},{},{},{}],"dont":[{"what":"하면 안 되는 것","why":"이유 1문장"},{},{},{}]}

=== 설문 답변 ===
${lines}${strengthLine}${matBlock}`;

    const p4 = `당신은 강점 기반 조직·브랜드 코치입니다. 강점 검사 상위 5개 테마를 실제 업무 전략으로 바꿔 아래 JSON을 출력하세요.
${rules}

원칙: 각 전략은 반드시 상위 5개 테마 중 하나를 근거로 하고, 16~17번 상품·매출, 25~29번 마케팅 현황, 5번 인원에 맞는 구체적 실행으로 쓸 것. 최소 3개, 가능하면 4개. 하나는 '약점처럼 작동하는 강점을 뒤집는' 전략으로.

형식:
{"strengthStrategies":[{"strength":"테마명","title":"전략명","body":"실행 방법과 기대 효과 2문장"},{},{},{}]}

=== 설문 답변 ===
${lines}${strengthLine}${matBlock}`;

    try {
      const hasImg = mat.images.length > 0;
      const calls = [callClaude(p1, hasImg), callClaude(p2, hasImg), callClaude(p3, hasImg)];
      if (strengths) calls.push(callClaude(p4));
      const parts = await Promise.all(calls);
      setReport(Object.assign({}, ...parts));
      setPhase("report");
    } catch (e) {
      setErr(`진단 결과를 생성하지 못했어요. (${e.message}) 다시 시도해주세요.`);
      setPhase("error");
    }
  }

  /* ── 입력 렌더 ── */
  const renderInput = () => {
    switch (cur.type) {
      case "text":
        return <input type="text" value={val || ""} placeholder={cur.ph} onChange={(e) => set(e.target.value)} />;
      case "long":
        return <textarea value={val || ""} placeholder={cur.ph || "여기에 적어주세요"} onChange={(e) => set(e.target.value)} />;
      case "single":
        return (
          <div className="opts">
            {cur.opts.map((o) => (
              <button key={o} className={`opt round ${val === o ? "on" : ""}`} onClick={() => set(o)}>
                <span className="box" />{o}
              </button>
            ))}
          </div>
        );
      case "multi": {
        const arr = Array.isArray(val) ? val : [];
        const toggle = (o) => {
          if (arr.includes(o)) set(arr.filter((x) => x !== o));
          else if (!cur.max || arr.length < cur.max) set([...arr, o]);
        };
        return (
          <>
            <div className="opts">
              {cur.opts.map((o) => (
                <button key={o} className={`opt ${arr.includes(o) ? "on" : ""}`} onClick={() => toggle(o)}>
                  <span className="box" />{o}
                </button>
              ))}
            </div>
            {cur.sub && arr.length > 0 && (
              <div className="sub">
                <div className="lab">{cur.sub}</div>
                <div className="opts">
                  {arr.map((o) => (
                    <button key={o} className={`opt round ${ans[`${cur.n}-1`] === o ? "on" : ""}`} onClick={() => setAns((a) => ({ ...a, [`${cur.n}-1`]: o }))}>
                      <span className="box" />{o.split(" (")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }
      case "scale":
        return (
          <>
            <div className="scale">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={val === n ? "on" : ""} onClick={() => set(n)}>{n}</button>
              ))}
            </div>
            <div className="scale-lab"><span>1 · {cur.lo}</span><span>5 · {cur.hi}</span></div>
          </>
        );
      case "yesno": {
        const arr = Array.isArray(val) ? val : ["", ""];
        return (
          <>
            <div className="opts" style={{ flexDirection: "row" }}>
              {["있음", "없음"].map((o) => (
                <button key={o} className={`opt round ${arr[0] === o ? "on" : ""}`} style={{ flex: 1 }} onClick={() => set([o, o === "있음" ? arr[1] : ""])}><span className="box" />{o}</button>
              ))}
            </div>
            {arr[0] === "있음" && (
              <div className="sub">
                <div className="lab">{cur.detail}</div>
                <textarea style={{ minHeight: 70 }} value={arr[1] || ""} placeholder={cur.ph} onChange={(e) => set(["있음", e.target.value])} />
              </div>
            )}
          </>
        );
      }
      case "links": {
        const arr = Array.isArray(val) ? val : ["", ""];
        return (
          <div className="dual">
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="lab">{cur.labels[i]}<small>선택</small></div>
                <input type="text" value={arr[i] || ""} placeholder={cur.phs[i]} onChange={(e) => { const c = [...arr]; c[i] = e.target.value; set(c); }} />
              </div>
            ))}
          </div>
        );
      }
      case "dual":
      case "pair": {
        const arr = Array.isArray(val) ? val : ["", ""];
        const isDual = cur.type === "dual";
        const labs = isDual ? ["과거 (어렸을 때 ~ 20세)", "현재"] : [cur.lab1, cur.lab2];
        return (
          <div className="dual">
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="lab">{labs[i]}{isDual && <small>선택</small>}</div>
                <textarea style={{ minHeight: 80 }} value={arr[i] || ""} placeholder={i === 0 ? cur.ph1 : cur.ph2} onChange={(e) => { const c = [...arr]; c[i] = e.target.value; set(c); }} />
              </div>
            ))}
          </div>
        );
      }
      case "keywords": {
        const arr = Array.isArray(val) ? val : ["", "", ""];
        return (
          <div className="kw">
            {[0, 1, 2].map((i) => (
              <input key={i} type="text" value={arr[i] || ""} placeholder={`키워드 ${i + 1}`} onChange={(e) => { const c = [...arr]; c[i] = e.target.value; set(c); }} />
            ))}
          </div>
        );
      }
      case "fill": {
        const arr = Array.isArray(val) ? val : ["", "", ""];
        return (
          <div className="fill">
            {cur.parts.map((p, i) => (
              <span key={i}>
                {p}
                {i < 3 && <input type="text" value={arr[i] || ""} placeholder={cur.labels[i]} onChange={(e) => { const c = [...arr]; c[i] = e.target.value; set(c); }} />}
              </span>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  /* ── 화면 ── */
  if (phase === "intro") {
    return (
      <div className="app"><style>{css}</style>
        <div className="stage">
          <div className="intro">
            <div className="eyebrow">Brand · Channel Diagnosis</div>
            <h1>나의 과거에서<br />브랜드의 이유를 찾습니다</h1>
            <p>이 설문은 브랜드와 개인 채널 모두를 위한 진단입니다. 홈페이지 주소나 소개 자료, 녹음만 올려도 되고, 31개 질문에 답하면 상품, 고객, 시장, 마케팅 현황부터 지금의 강점, 고객, 목표까지 연결해 AI가 브랜드 스토리, 브랜드 전략, 마케팅 전략을 담은 진단 리포트를 만들어드립니다.</p>
            <div className="notice">
              사업체가 있는 분들은 <b>브랜드</b>를 기준으로, 개인 채널을 키우고 싶으신 분들은 <b>개인 채널</b>을 기준으로 생각하며 답변해주세요. 정답은 없으니 떠오르는 대로 편하게 적어주시면 됩니다. <b>모든 문항은 비워두고 넘어가도 됩니다.</b>
            </div>
            <div className="chapters">
              <div><b>M</b>자료 업로드 (선택)<i>드래그</i></div>
              <div><b>S</b>강점 검사 (23개 테마)<i>48문항</i></div>
              {SECTIONS.map((s) => (
                <div key={s.id}><b>{s.id}</b>{s.title}<i>{Q.filter((q) => q.s === s.id).length}문항</i></div>
              ))}
            </div>
            <button className="btn" onClick={() => { setAfter("survey"); setPhase("materials"); }}>진단 시작하기</button>
            <div style={{ marginTop: 22, fontSize: 13, color: "#6E7A72" }}>리포트 예시 보기</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn ghost" onClick={() => { setStrengths(SAMPLE_STR_BRAND); setReport(SAMPLE_BRAND); setPhase("report"); }}>브랜드편 · 텐미닛키친</button>
              <button className="btn ghost" onClick={() => { setStrengths(SAMPLE_STR_CHANNEL); setReport(SAMPLE); setPhase("report"); }}>채널편 · 자취요리 준</button>
            </div>
            <p style={{ fontSize: 13, color: "#6E7A72", marginTop: 14 }}>강점 검사 48문항(약 7분)을 먼저 하고 설문(약 15분)으로 이어집니다 · 답변은 이 화면에서만 사용됩니다</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "materials") {
    return <div className="app"><style>{css}</style><Materials mat={mat} setMat={setMat} onBack={() => setPhase("intro")} onNext={() => setPhase("strengths")} /></div>;
  }
  if (phase === "strengths") {
    return <div className="app"><style>{css}</style><StrengthsTest onBack={() => setPhase(after === "survey" ? "materials" : "intro")} onDone={(r) => { setStrengths(r); setPhase("strengthsResult"); }} /></div>;
  }
  if (phase === "strengthsResult" && strengths) {
    return <div className="app"><style>{css}</style><StrengthsResult ranked={strengths} nextLabel={after === "survey" ? "브랜드 설문 시작하기" : "리포트로 돌아가기"} onNext={() => setPhase(after)} onRetry={() => setPhase("strengths")} /></div>;
  }
  if (phase === "loading" || phase === "error") {
    return (
      <div className="app"><style>{css}</style>
        <div className="stage">
          <div className="loading">
            {phase === "loading" ? (
              <>어린 시절의 당신과<br />지금의 브랜드를 잇는 중입니다<div style={{ marginTop: 20 }}><span className="dot" /><span className="dot" /><span className="dot" /></div><small>보통 30초 안팎 걸려요</small></>
            ) : (
              <>{err}<div style={{ marginTop: 24 }}><button className="btn" onClick={runDiagnosis}>다시 진단하기</button> <button className="btn ghost" onClick={() => setPhase("survey")}>답변 수정</button></div></>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "report" && report) {
    const data = Object.entries(report.scores || {}).map(([k, v]) => ({ k, v: Number(v) || 0 }));
    const isSample = report === SAMPLE || report === SAMPLE_BRAND;
    const name = ans[1] || report.name || (report === SAMPLE ? "자취요리 준" : "이 브랜드");
    return (
      <div className="app"><style>{css}</style>
        <div className="stage">
          <div className="report">
            <div className="eyebrow">Diagnosis Report{isSample && (report === SAMPLE_BRAND ? " · 예시 (브랜드편)" : " · 예시 (채널편)")}</div>
            <h1 className="q" style={{ fontSize: 34, marginTop: 16 }}>{name}</h1>
            <p style={{ fontFamily: "'Noto Serif KR'", fontSize: 18, color: "var(--moss)" }}>{report.oneLiner}</p>

            <h2>브랜드 스토리</h2>
            <div className="story">{(report.originStory || []).map((p, i) => <p key={i}>{p}</p>)}</div>

            <h2>강점 지도</h2>
            <div className="grid3">
              {(report.strengths || []).map((s, i) => (
                <div className="card" key={i}>
                  <div className="tag">STRENGTH {i + 1}</div>
                  <h4>{s.title}</h4>
                  <p><b>어린 시절</b> · {s.past}</p>
                  <p style={{ marginTop: 6 }}><b>지금</b> · {s.now}</p>
                  <p style={{ marginTop: 6 }}><b>고객 가치</b> · {s.value}</p>
                </div>
              ))}
            </div>

            {strengths && (
              <>
                <h2>강점 검사 결과</h2>
                <StrengthsGrid ranked={strengths} />
                <h2>강점 활용 업무 전략</h2>
                {(report.strengthStrategies || []).map((s, i) => {
                  const th = THEMES.find((t) => t.name === s.strength); const d = DOMAINS.find((x) => x.id === th?.d);
                  return (
                    <div className="act" key={i}><b style={{ fontSize: 13, width: 60, color: d?.color || "var(--moss)", fontFamily: "'Noto Sans KR'", paddingTop: 4 }}>{s.strength}</b><div><h4 style={{ margin: "0 0 4px", fontSize: 16 }}>{s.title}</h4><p style={{ margin: 0 }}>{s.body}</p></div></div>
                  );
                })}
                <p style={{ fontSize: 14, marginTop: 14 }}>{strengths.slice(0, 5).map((t) => t.name).join(" · ")} — <button className="btn link" style={{ padding: 0, fontSize: 14, textDecoration: "underline" }} onClick={() => { setAfter("report"); setPhase("strengthsResult"); }}>현업 응용 가이드 보기</button></p>
              </>
            )}

            <h2>영역별 점수</h2>
            <RadarSVG data={data} />
            <div className="opts">
              {data.map((d) => (
                <div className="card" key={d.k} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                  <b style={{ fontFamily: "'Noto Serif KR'", fontSize: 26, width: 52, color: d.v >= 70 ? "var(--moss)" : d.v >= 45 ? "var(--marigold)" : "#B4553C" }}>{d.v}</b>
                  <div><h4 style={{ margin: 0 }}>{d.k}</h4><p>{report.scoreNotes?.[d.k]}</p></div>
                </div>
              ))}
            </div>

            <h2>갭 분석</h2>
            <p>{report.gap}</p>

            <h2>브랜드 전략</h2>
            <div className="opts">
              {[["포지셔닝", report.brandStrategy?.positioning], ["핵심 메시지", report.brandStrategy?.coreMessage], ["타겟", report.brandStrategy?.target], ["톤앤매너", report.brandStrategy?.tone]].map(([k, v]) => (
                <div className="card" key={k}><div className="tag">{k}</div><p style={{ color: "var(--ink)", fontSize: 15 }}>{v}</p></div>
              ))}
            </div>

            <h2>마케팅 전략 · 채널별</h2>
            <div className="grid2">
              {(report.marketing?.channels || []).map((c, i) => (
                <div className="card" key={i}><div className="tag">{c.channel}</div><p style={{ color: "var(--ink)" }}>{c.direction}</p><p style={{ marginTop: 8 }}>예시 · {c.example}</p></div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              {(report.marketing?.plan90 || []).map((p, i) => (
                <div className="act" key={i}><b>{i + 1}M</b><p style={{ margin: 0 }}>{p}</p></div>
              ))}
            </div>

            <h2>추천 상품 방향</h2>
            <div className="grid3">
              {[["유지·강화", report.product?.keep], ["바꾸기", report.product?.change], ["새로 만들기", report.product?.new]].map(([k, v]) => (
                <div className="card" key={k}><div className="tag">{k}</div><p style={{ color: "var(--ink)" }}>{v}</p></div>
              ))}
            </div>

            <h2>추천 고객 방향</h2>
            <div className="grid3">
              {[["집중할 고객", report.customer?.focus], ["놓아줄 고객", report.customer?.release], ["다음에 넓힐 고객", report.customer?.expand]].map(([k, v]) => (
                <div className="card" key={k}><div className="tag">{k}</div><p style={{ color: "var(--ink)" }}>{v}</p></div>
              ))}
            </div>

            <h2>콘텐츠 소재 은행</h2>
            <p style={{ fontSize: 14, color: "#55635B" }}>전공, 취미, 판매 경험, 모임, 써본 제품 등 답변에서 뽑은 소재예요. 각 소재를 어떤 유형의 콘텐츠로 만들면 좋은지 함께 표시했습니다.</p>
            <div className="grid2">
              {(report.contentSeeds || []).map((c, i) => (
                <div className="card" key={i}><div className="tag">{c.source} → {c.format}</div><p style={{ color: "var(--ink)" }}>{c.seed}</p></div>
              ))}
            </div>

            <h2>해야 할 콘텐츠 예시</h2>
            {(report.contentDo || []).map((c, i) => (
              <div className="act" key={i}><b style={{ color: "var(--moss)" }}>○</b><div><h4 style={{ margin: "0 0 4px", fontSize: 16 }}>{c.title}</h4><p style={{ margin: 0 }}>{c.why}</p></div></div>
            ))}

            <h2>하면 안 되는 것</h2>
            {(report.dont || []).map((c, i) => (
              <div className="act" key={i}><b style={{ color: "#B4553C" }}>✕</b><div><h4 style={{ margin: "0 0 4px", fontSize: 16 }}>{c.what}</h4><p style={{ margin: 0 }}>{c.why}</p></div></div>
            ))}

            <h2>우선 액션 3가지</h2>
            {(report.actions || []).map((a, i) => (
              <div className="act" key={i}><b>{i + 1}</b><div><h4 style={{ margin: "0 0 4px", fontSize: 16 }}>{a.title}</h4><p style={{ margin: 0 }}>{a.body}</p></div></div>
            ))}

            <div style={{ marginTop: 40, display: "flex", gap: 10 }}>
              {!strengths && <button className="btn" onClick={() => { setAfter("report"); setPhase("strengths"); }}>강점 검사 추가하기</button>}
              <button className="btn ghost" onClick={() => { setPhase("survey"); setIdx(0); }}>답변 수정하기</button>
              <button className="btn link" onClick={() => { setAns({}); setReport(null); setIdx(0); setPhase("intro"); }}>처음부터 다시</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* survey */
  return (
    <div className="app"><style>{css}</style>
      <aside className="spine">
        <div className="brand">브랜드 진단</div>
        {SECTIONS.map((s, i) => (
          <div key={s.id} className={`chap ${i === secIdx ? "cur" : ""} ${i < secIdx || secDone(s.id) ? "done" : ""}`}>
            <b>{s.id}</b>{s.title}
          </div>
        ))}
        <div className="foot">모든 문항은 건너뛸 수 있어요.<br />답변은 저장되지 않고<br />이 화면에서만 사용됩니다.</div>
      </aside>

      <div className="stage" ref={topRef}>
        <div className="bar"><i style={{ width: `${((idx + 1) / Q.length) * 100}%` }} /></div>
        <div className="page">
          <div className="eyebrow">{SECTIONS[secIdx].id} · {SECTIONS[secIdx].title}</div>
          {firstOfSec && <div className="hint" style={{ marginTop: 10 }}>{SECTIONS[secIdx].intro}</div>}
          <div className="num">{String(cur.n).padStart(2, "0").replace("1-1", "01+").replace("0S", "S")}</div>
          <h1 className="q">{cur.q}</h1>
          {cur.hint && <p className="hint">{cur.hint}</p>}
          {cur.ex && (
            <div className="ex"><em>이렇게 적어볼 수 있어요</em>{cur.ex.map((e, i) => <span key={i}>· {e}</span>)}</div>
          )}
          {renderInput()}
        </div>

        <div className="nav">
          <div className="in">
            <button className="btn ghost" onClick={prev} disabled={idx === 0}>이전</button>
            
            <button className="btn" onClick={next}>{isLast ? "진단 결과 보기" : answered(cur, val) ? "다음" : "건너뛰고 다음"}</button>
            <span className="count">{idx + 1} / {Q.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
