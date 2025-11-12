import React, { useMemo, useState, useLayoutEffect, useEffect, useRef } from "react";

import imgISTJ from "../../assets/mbti/ISTJ.png";
import imgISFJ from "../../assets/mbti/ISFJ.png";
import imgINFJ from "../../assets/mbti/INFJ.png";
import imgINTJ from "../../assets/mbti/INTJ.png";
import imgISTP from "../../assets/mbti/ISTP.png";
import imgISFP from "../../assets/mbti/ISFP.png";
import imgINFP from "../../assets/mbti/INFP.png";
import imgINTP from "../../assets/mbti/INTP.png";
import imgESTP from "../../assets/mbti/ESTP.png";
import imgESFP from "../../assets/mbti/ESFP.png";
import imgENFP from "../../assets/mbti/ENFP.png";
import imgENTP from "../../assets/mbti/ENTP.png";
import imgESTJ from "../../assets/mbti/ESTJ.png";
import imgESFJ from "../../assets/mbti/ESFJ.png";
import imgENFJ from "../../assets/mbti/ENFJ.png";
import imgENTJ from "../../assets/mbti/ENTJ.png";
import { px } from "framer-motion";

/* ──────────────────────────────────────────────────────────────────────────────
   하단 네비(전역) 높이 자동 측정 훅
   ────────────────────────────────────────────────────────────────────────────── */
function useBottomNavHeight() {
  const [h, setH] = useState(0);
  const roRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const candidates = [
      'nav[role="navigation"]',
      "nav",
      "#bottom-nav",
      ".bottom-nav",
      '[data-role="bottom-nav"]',
      '[data-testid="bottom-nav"]',
      "footer",
    ];

    const isBottomFixed = (el) => {
      const cs = getComputedStyle(el);
      const pos = cs.position;
      const bottom = cs.bottom;
      const hidden = cs.display === "none" || cs.visibility === "hidden";
      const bottomZero = bottom === "0px" || bottom === "0";
      return !hidden && (pos === "fixed" || pos === "sticky") && bottomZero;
    };

    const findNav = () => {
      let maxH = 0;
      for (const sel of candidates) {
        document.querySelectorAll(sel).forEach((el) => {
          if (isBottomFixed(el)) {
            const hh = el.offsetHeight || 0;
            if (hh > maxH) maxH = hh;
          }
        });
      }
      return maxH;
    };

    const apply = () => setH(findNav());

    apply();
    const t = requestAnimationFrame(apply);

    const onWin = () => apply();
    window.addEventListener("resize", onWin);
    window.addEventListener("orientationchange", onWin);

    const observer = new MutationObserver(apply);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    if ("ResizeObserver" in window) {
      roRef.current = new ResizeObserver(apply);
      roRef.current.observe(document.documentElement);
    }

    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("resize", onWin);
      window.removeEventListener("orientationchange", onWin);
      observer.disconnect();
      if (roRef.current) roRef.current.disconnect();
    };
  }, []);

  return h; // px
}

/* ──────────────────────────────────────────────────────────────────────────────
   전역 UI 효과용 스타일 자동 주입 (애니메이션/호버 등)
   ────────────────────────────────────────────────────────────────────────────── */
function useUiEffects() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("mbti-inline-styles")) return;

    const css = `
      :root {
        --blur: 14px;
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes cardIn {
        from { opacity: 0; transform: translateY(6px) scale(0.99); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes floaty {
        0%   { transform: translateY(0px) translateX(0); }
        50%  { transform: translateY(-8px) translateX(4px); }
        100% { transform: translateY(0px) translateX(0); }
      }
      .fade-up { animation: fadeUp .26s ease-out both; }
      .card-in { animation: cardIn .22s ease-out both; }

      /* 버튼 인터랙션(모든 버튼 공용) */
      .btn {
        transition: transform .08s ease, box-shadow .14s ease, opacity .14s ease, filter .14s ease;
        will-change: transform, box-shadow, filter;
      }
      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 28px rgba(0,0,0,0.16);
        filter: brightness(1.02);
      }
      .btn:active {
        transform: translateY(0);
        box-shadow: 0 10px 20px rgba(0,0,0,0.18);
        opacity: .98;
      }
      .btn:disabled {
        opacity: .5;
        pointer-events: none;
      }

      /* 글래스 카드 */
      .glass {
        background: rgba(255,255,255,0.75);
        backdrop-filter: blur(var(--blur));
        -webkit-backdrop-filter: blur(var(--blur));
        border: 1px solid rgba(255,255,255,0.6);
      }

      /* 상단 프로그레스 바 */
      .progressWrap {
        position: sticky;
        top: 0;
        z-index: 1;
        margin: 0 -8px 12px;
        padding-top: 6px;
        backdrop-filter: blur(6px);
      }
      .progressTrack {
        height: 8px;
        border-radius: 999px;
        background: rgba(255,255,255,0.55);
        border: 1px solid rgba(0,0,0,0.12);
        overflow: hidden;
      }
      .progressBar {
        height: 100%;
        width: 0%;
        border-radius: 999px;
        background: linear-gradient(90deg, #9be15d 0%, #00e3ae 100%);
        transition: width .25s ease;
      }

      /* 결과 타이틀 그라데이션 텍스트 */
      .gradTitle {
        background: linear-gradient(180deg, #B9F6CA 0%, #69F0AE 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      /* 장식용 블롭 */
      .blob {
        position: absolute; inset: auto auto 8% -6%;
        width: 36vw; max-width: 520px; height: 36vw; max-height: 520px;
        filter: blur(36px) saturate(1.1);
        opacity: .35; border-radius: 50%;
        background: radial-gradient(closest-side, #00e3ae 0%, rgba(0,227,174,0.0) 70%);
        animation: floaty 9s ease-in-out infinite;
      }
      .blob2 {
        position: absolute; inset: 4% -8% auto auto;
        width: 28vw; max-width: 420px; height: 28vw; max-height: 420px;
        filter: blur(34px); opacity: .32; border-radius: 50%;
        background: radial-gradient(closest-side, #9be15d 0%, rgba(155,225,93,0.0) 70%);
        animation: floaty 11s ease-in-out infinite .4s;
      }
      .no-scrollbar {
        -ms-overflow-style: none;   /* IE/Edge */
        scrollbar-width: none;      /* Firefox */
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;              /* Chrome/Safari */
        width: 0; height: 0;
      }
    `;
    const style = document.createElement("style");
    style.id = "mbti-inline-styles";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }, []);
}

/* ──────────────────────────────────────────────────────────────────────────────
   폰트 로더(+ preconnect): Jua(메인) / Gowun Dodum(백업)
   ────────────────────────────────────────────────────────────────────────────── */
function useCuteFonts() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    // preconnect
    const p1 = document.createElement("link");
    p1.rel = "preconnect";
    p1.href = "https://fonts.googleapis.com";
    p1.setAttribute("data-font-preconnect", "true");

    const p2 = document.createElement("link");
    p2.rel = "preconnect";
    p2.href = "https://fonts.gstatic.com";
    p2.crossOrigin = "anonymous";
    p2.setAttribute("data-font-preconnect", "true");

    const exists = document.querySelector('link[data-loaded-font="jua-gowun"]');
    const l = exists || document.createElement("link");
    l.rel = "stylesheet";
    l.setAttribute("data-loaded-font", "jua-gowun");
    l.href = "https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap";

    if (!document.querySelector('link[data-font-preconnect][href="https://fonts.googleapis.com"]')) {
      document.head.appendChild(p1);
    }
    if (!document.querySelector('link[data-font-preconnect][href="https://fonts.gstatic.com"]')) {
      document.head.appendChild(p2);
    }
    if (!exists) document.head.appendChild(l);
  }, []);
}

const ScrollableContent = ({ children }) => (
    <div style={{
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    }}>
        {children}
    </div>
);

/* ──────────────────────────────────────────────────────────────────────────────
   나의 공연 테스트 (콘텐츠는 그대로)
   ────────────────────────────────────────────────────────────────────────────── */

const THEME = {
  quizBg: "#0b1f1a",
  cardBg: "#ffffff",
  text: "#1C1C1E",
  border: "#111111",
  ivory: "#FFF5E1",
  green: "#2a8a55",
};

const QUESTIONS = [
  { id: 1, text: "공연 볼 때 내가 앉고 싶은 자리는?", options: [{ label: "아티스트를 가까이 볼 수 있는 무대 1열", trait: "S" }, { label: "전체적인 분위기를 느낄 수 있는 뒷열", trait: "N" }] },
  { id: 2, text: "공연 당일, 친구가 보러 가기로 한 공연이 아닌 다른 공연을 예매했다는 것을 알았다. 나의 반응은?", options: [{ label: "이건 운명이야. 일단 가보자 !", trait: "P" }, { label: "좌절스럽지만 따라간다….", trait: "J" }] },
  { id: 3, text: "공연 당일, 친구가 새로운 친구를 데려왔다면?", options: [{ label: "으악 조금 어색해..", trait: "I" }, { label: "아싸! 공연 같이 볼 친구 더 생겼다 야호", trait: "E" }] },
  { id: 4, text: "스트레스 해소에는...", options: [{ label: "심장과 귀가 터질 듯한 락 음악", trait: "E" }, { label: "마음이 편안해지는 포크나 어쿠스틱 음악", trait: "I" }] },
  { id: 5, text: "공연 시간이 약 20분 정도 남았다!", options: [{ label: "표 받고 대기하려면 서둘러서 가야 돼!", trait: "J" }, { label: "널널하네~ 더 돌아다니다가 천천히 들어가자", trait: "P" }] },
  { id: 6, text: "곧 밤 10시인데... 공연이 아직 안 끝났을 때, 나는?", options: [{ label: "내일은 내일의 나에게 맡긴다. 다 즐기고 가야지!", trait: "F" }, { label: "아쉽지만 집에 가야해… 현생 이슈", trait: "T" }] },
  { id: 7, text: "페스티벌 갔을 때, 나는...", options: [{ label: "체력 분배는 필수야. 페이스 조절하면서 즐기기!", trait: "T" }, { label: "일단 뛰어! 음악이 나오면 몸이 먼저 반응한다", trait: "F" }] },
  { id: 8, text: "거리에서 내가 좋아하는 노래를 연주하는 버스킹 공연을 마주칠 때 나는...", options: [{ label: "발걸음을 멈추고 노래 한 곡만이라도 끝까지 듣는다", trait: "P" }, { label: "다음 약속을 떠올리며 아쉽지만 천천히 지나친다", trait: "J" }] },
  { id: 9, text: "내가 노래를 즐기는 방법은?", options: [{ label: "한 곡에 빠져서 반복재생", trait: "S" }, { label: "무한 디깅", trait: "N" }] },
  { id: 10, text: "공연 볼 때, 나는...", options: [{ label: "친구랑 잠깐씩 수다를 떨면서 분위기를 즐기는 편!", trait: "T" }, { label: "혼자 감상하며 공연에 몰입하는 편!", trait: "F" }] },
  { id: 11, text: "내가 가장 좋아하는 노래의 기타 솔로가 나온다!", options: [{ label: "이건 찍어야 해! 바로 카메라를 꺼낸다 ", trait: "S" }, { label: "기타는 느끼는 거야..! 눈으로만 담는다 ", trait: "N" }] },
  { id: 12, text: "연주가 끝난 후 아티스트에게 나는...", options: [{ label: "이름을 외치며, 열렬한 환호를 보낸다", trait: "E" }, { label: "조용히 박수를 치며 마음 속으로 고마움을 전한다", trait: "I" }] },
];

const RESULT_BOOK = {
  ISTJ: { title: "현실적으로 감상하는 모더지", image: imgISTJ },
  ISFJ: { title: "추억을 수집하는 모더지", image: imgISFJ },
  INFJ: { title: "여운으로 잠 못 이루는 모더지", image: imgINFJ },
  INTJ: { title: "몰입까지 계획하는 모더지", image: imgINTJ},
  ISTP: { title: "관찰하면서 청취하는 모더지", image: imgISTP },
  ISFP: { title: "고요하게 감성 타는 모더지", image: imgISFP },
  INFP: { title: "감동으로 오열하는 모더지", image: imgINFP },
  INTP: { title: "논리적으로 감상하는 모더지", image: imgINTP },
  ESTP: { title: "본능으로 리듬을 만드는 모더지", image: imgESTP },
  ESFP: { title: "흥에 흠뻑 취한 모더지", image: imgESFP },
  ENFP: { title: "낭만을 탐험하는 모더지", image: imgENFP },
  ENTP: { title: "자유롭게 공연장을 누비는 모더지", image: imgENTP },
  ESTJ: { title: "예매부터 귀가까지 완벽한 모더지", image: imgESTJ },
  ESFJ: { title: "감동을 나눠주는 모더지", image: imgESFJ },
  ENFJ: { title: "분위기를 조율하는 모더지", image: imgENFJ },
  ENTJ: { title: "무대를 심사하는 모더지", image: imgENTJ },
};

const MATCH_BOOK = {
  ISTJ: { good: "ESFP", bad: "INFP" },
  ISFJ: { good: "ESTP", bad: "ENFJ" },
  INFJ: { good: "ENFP", bad: "ESTJ" },
  INTJ: { good: "ENTP", bad: "ESFJ" },
  ISTP: { good: "ESFJ", bad: "INFJ" },
  ISFP: { good: "ESFJ", bad: "INFJ" },
  INFP: { good: "ENTJ", bad: "ISTP" },
  INTP: { good: "ESTJ", bad: "ISFJ" },
  ESTP: { good: "ISFJ", bad: "ENFP" },
  ESFP: { good: "ISTJ", bad: "INFP" },
  ENFP: { good: "INTJ", bad: "ISTP" },
  ENTP: { good: "INTJ", bad: "ESTJ" },
  ESTJ: { good: "ISTP", bad: "ENFJ" },
  ESFJ: { good: "ISFP", bad: "ENFP" },
  ENFJ: { good: "ISFP", bad: "ESTP" },
  ENTJ: { good: "INTP", bad: "ESFP" },
};

function computeMBTI(answers) {
  const tally = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  answers.forEach((t) => { if (!t) return; tally[t] = (tally[t] || 0) + 1; });
  return [
    tally.E >= tally.I ? "E" : "I",
    tally.S >= tally.N ? "S" : "N",
    tally.T >= tally.F ? "T" : "F",
    tally.J >= tally.P ? "J" : "P",
  ].join("");
}

/* 카드(글래스) */
const Box = ({ children, style, className }) => (
  <div
    className={` ${className || ""}`}
    style={{
      borderRadius: 28,
      boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
      padding: "clamp(16px, 2.8vh, 28px)",
      background: "rgba(255,255,255,0.78)",
      overflow: "visible",
      ...style,
    }}
  >
    {children}
  </div>
);

/* 배경 장식 */
const Deco = () => (
  <>
    <div className="blob" />
    <div className="blob2" />
  </>
);

export default function MbtiTest() {
  useCuteFonts();
  useUiEffects();

  const [stage, setStage] = useState("start"); // start | quiz | done | result
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const NAV_H = useBottomNavHeight();
  
  const onChoose = (trait) => {
    const next = [...answers];
    next[index] = trait;
    setAnswers(next);
    if (index < QUESTIONS.length - 1) setIndex(index + 1);
    else setStage("done");
  };

    // --- 공유 관련 헬퍼들 ---
  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  // 친구에게 링크 공유하기 (모바일이면 네이티브 공유, 아니면 URL 복사)
  const shareToFriend = async () => {
    if (!shareUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "나의 공연 테스트",
          text: "내가 공연을 즐기는 유형을 알아보자!",
          url: shareUrl,
        });
      } else if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(shareUrl);
        alert("링크가 복사되었어요!");
      } else {
        // 아주 구형 브라우저용 fallback
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("링크가 복사되었어요!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 작은 팝업창 열기 (트위터 공유용)
  const openPopup = (url, name) => {
    if (typeof window === "undefined") return;
    const w = 560;
    const h = 720;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(
      url,
      name,
      `width=${w},height=${h},left=${left},top=${top},resizable=yes`
    );
  };

  // 트위터 공유하기
  const shareTwitter = () => {
    if (!shareUrl || typeof window === "undefined") return;
    const text = encodeURIComponent(
      "나의 공연 테스트 — 내가 공연을 즐기는 유형을 알아보자!"
    );
    const url = encodeURIComponent(shareUrl);
    openPopup(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "tw-share"
    );
  };

  // 키보드 1/2로 선택
  useEffect(() => {
    if (stage !== "quiz") return;
    const onKey = (e) => {
      if (e.key === "1") onChoose(QUESTIONS[index].options[0].trait);
      if (e.key === "2") onChoose(QUESTIONS[index].options[1].trait);
      if (e.key === "ArrowLeft") setIndex((v) => Math.max(0, v - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, index, answers]);

  const resultCode = useMemo(() => (stage === "result" ? computeMBTI(answers) : null), [stage, answers]);
  const result = resultCode ? RESULT_BOOK[resultCode] : null;

  // 잘 맞는 / 잘 안 맞는 모더지 정보
  const matchInfo = resultCode ? MATCH_BOOK[resultCode] : null;
  const goodMatch = matchInfo?.good ? RESULT_BOOK[matchInfo.good] : null;
  const badMatch  = matchInfo?.bad  ? RESULT_BOOK[matchInfo.bad]  : null;

  const wrapperStyle = {
    zIndex: 999, 
    position: (stage === "result" || stage === "gallery") ? "relative" : "fixed",
    minHeight: "100svh",
    width: "calc(100% + 32px)",
    boxSizing: "border-box",
    paddingTop:
    (stage === "result" || stage === "gallery")
      ? "calc(env(safe-area-inset-top, 0px) + 24px)"
      : "calc(env(safe-area-inset-top, 0px) + 24px)",
    paddingBottom: `calc(clamp(18px, 4vh, 40px) + ${NAV_H}px + env(safe-area-inset-bottom, 0px))`,
    paddingLeft: 12,
    paddingRight: 12,
    marginLeft: -16,
    marginTop: (stage === "result" || stage === "gallery") ? -60 : -40,

    background: (stage === "start" || stage === "quiz" || stage === "done") ? THEME.green : "#ffffff",
    display: "grid",
    gridTemplateRows: (stage === "result" || stage === "gallery") ? "auto 1fr" : "1fr auto 1fr",
    position: "relative",
    overflowX: "hidden",          
    overflowY: (stage === "result" || stage === "gallery") ? "auto" : "hidden",
    fontFamily:
      `'Jua', 'Gowun Dodum', system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif`,
    color: "#1C1C1E",
    isolation: "isolate",
  };

  const centerCell = {
    gridRow: 2,
    justifySelf: "center",
    width: "100%",
    maxWidth: "min(760px, 92vw)",
  };

  const titleStyle = {
    textWrap: "balance",
    fontSize: "clamp(18px, 3vw, 22px)",
    fontWeight: 500,
    lineHeight: 1.26,
    textAlign: "center",
    marginBottom: 6,
    color: "#1C1C1E",
  };

  // 버튼 공통
  const pill = {
    width: "100%",
    padding: "16px 18px",
    borderRadius: 20,
    border: "none",
    background: THEME.ivory,
    color: THEME.text,
    fontWeight: 700,
    fontSize: 15,
    lineHeight: 1.25,
    textAlign: "center",
    cursor: "pointer",
    whiteSpace: "normal",
    wordBreak: "keep-all",
    boxShadow: "0 4px 8px rgba(0,0,0,0.14)",
  };

  // 상단 진행 상태
  const progress = Math.round(((index + 1) / QUESTIONS.length) * 100);

  // 결과 페이지(상단 중앙)
  const resultWrap = {
    gridRow: 1, //  맨 위 row에 배치
    justifySelf: "center",
    alignSelf: "start",
    width: "100%",
    maxWidth: "min(1100px, 96vw)",
    textAlign: "center",
    paddingTop: 0,
  };
  const resultTitle = {
    fontSize: "clamp(32px, 8vw, 56px)",
    fontWeight: 900,
    lineHeight: 1.15,
    margin: 0,
  };
const AllTypesGallery = ({ onBack, navH = 0 }) => (
  <div
  className="no-scrollbar"
    style={{
      minHeight: "0",
      maxHeight: `calc(100svh - ${navH}px - 12px)`,
      overflowY: "auto",
      overflowX: "hidden",
    }}
  >
    <div
      style={{
        maxWidth: "min(1100px, 96vw)",
        margin: "0 auto",
        padding: "4px 0 20px",
      }}
      className="fade-up"
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          padding: "6px 0 10px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))",
          backdropFilter: "blur(6px)",
          zIndex: 1,
        }}
      >
        <h2 
          style={{
            fontSize: "clamp(18px, 4vw, 24px)",
            fontWeight: 900,
            textAlign: "center",
            margin: 0,
          }}
        >
          유형 전체보기
        </h2>
      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {Object.entries(RESULT_BOOK).map(([code, data]) => (
          <div
            key={code}
            className="card-in glass"
            style={{
              borderRadius: 16,
              padding: 10,
              textAlign: "center",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ aspectRatio: "3 / 4", width: "100%" }}>
              <img
                src={data.image}
                alt={data.title}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button className="btn" style={pill} onClick={onBack}>
          돌아가기
        </button>
      </div>
    </div>
  </div>
);



  return (
    <div style={wrapperStyle}>
    <Deco />

    {stage === "start" && (
        <div style={centerCell} className="fade-up">
        <Box style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E", marginTop: 4 }}>나의 공연 테스트</h2>
        <p style={{ color: "#2F2F2F", marginTop: -16, marginBottom: 16, fontSize: 14 }}>
                내가 공연을 즐기는 유형을 알아보자!
        </p>

        <button
            className="btn"
            style={{
                ...pill,
                background: THEME.ivory, 
                color: "#1C1C1E",      
                fontSize: 16,
                padding: "16px 20px",
            }}
            onClick={() => setStage("quiz")}
            >
            시작하기
        </button>
        </Box>
    </div>
    )}


      {stage === "quiz" && (
        <div style={centerCell}>
          <Box>
            {/* 상단 진행 바 */}
            <div className="progressWrap">
              <div className="progressTrack">
                <div className="progressBar" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* 1/12 배지 */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <div
                style={{
                  background: THEME.ivory,
                  border: "1px solid rgba(0,0,0,0.2)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontWeight: 800,
                  fontSize: 12,
                  color: "#0b0b0b",
                }}
              >
                {index + 1}/{QUESTIONS.length}
              </div>
            </div>

            {/* 질문 + 선택지 */}
            <div key={index} className="fade-up">
              <h2 style={titleStyle}>{QUESTIONS[index].text}</h2>

              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                {QUESTIONS[index].options.map((opt, i) => (
                  <button
                    key={i}
                    className="btn"
                    style={{
                      ...pill,
                      background:
                        "linear-gradient(180deg, rgba(255,245,225,1) 0%, rgba(255,248,234,1) 100%)",
                    }}
                    onClick={() => onChoose(opt.trait)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  className="btn"
                  style={{
                    ...pill,
                    background:"#3C9C68",
                    color: THEME.text,
                  }}
                  onClick={() => setIndex(Math.max(0, index - 1))}
                  disabled={index === 0}
                >
                  이전
                </button>
              </div>
            </div>
          </Box>
        </div>
      )}

      {stage === "done" && (
        <div style={centerCell} className="fade-up">
          <Box style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E", marginTop: 4 }}>모든 질문 완료!</h2>
            <p style={{ color: "#2F2F2F",  marginTop: -16, marginBottom: 16, fontSize: 14 }}>
              이제 나의 공연 성향 결과를 확인해보세요.
            </p>
            <button
              className="btn"
              style={{
                ...pill,
                background: THEME.ivory,
                color: "#1C1C1E",
                fontSize: 16,
                padding: "16px 20px",
              }}
              onClick={() => setStage("result")}
            >
              결과 보기
            </button>

            <div style={{ marginTop: 12 }}>
              <button
                className="btn"
                style={{
                  ...pill,
                  background: THEME.green,
                  color: "#1C1C1E",
                  fontSize: 16,
                  padding: "16px 20px",
                }}
                onClick={() => {
                  setStage("quiz");
                  setIndex(0);
                  setAnswers(Array(QUESTIONS.length).fill(null));
                }}
              >
                처음부터 다시
              </button>
            </div>
          </Box>
        </div>
      )}

      {stage === "result" && result && (
        <ScrollableContent>
            <div style={resultWrap} className="fade-up">
                {/* 메인 결과 이미지 */}
                <div
                style={{
                    margin: "0 auto 16px",
                    maxWidth: "min(420px, 90vw)",
                }}
                >
                <img
                    src={result.image}
                    alt={result.title}
                    style={{ width: "94%", height: "auto", display: "block", margin: "0 auto" }}

                />
                </div>

            {/* 🔴 왼쪽/오른쪽 : 잘 맞는 / 잘 안 맞는 모더지 */}
            {(goodMatch || badMatch) && (
            <div
                style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: 16,
                marginBottom: 18,
                }}
            >
                {/* 왼쪽 - 잘 맞는 모더지 */}
                {goodMatch && (
                <div
                    style={{
                    flex: "0 0 44%",
                    maxWidth: 190,
                    textAlign: "center",
                    transform: "scale(1.1)",  // 살짝 확대
                    }}
                >
                    <img
                    src={goodMatch.image}
                    alt={goodMatch.title}
                    style={{ width: "100%", height: "auto", display: "block" }}
                    />
                    <p
                    style={{
                        marginTop: 10,
                        fontSize: 16,
                        fontWeight: 900,
                        color: "#444",
                    }}
                    >
                    잘 맞는 타입
                    </p>
                </div>
                )}

                {/* 오른쪽 - 잘 안 맞는 모더지 */}
                {badMatch && (
                <div
                    style={{
                    flex: "0 0 44%",
                    maxWidth: 190,
                    textAlign: "center",
                    transform: "scale(1.1)",
                    }}
                >
                    <img
                    src={badMatch.image}
                    alt={badMatch.title}
                    style={{ width: "100%", height: "auto", display: "block" }}
                    />
                    <p
                    style={{
                        marginTop: 10,
                        fontSize: 16,
                        fontWeight: 900,
                        color: "#444",
                    }}
                    >
                    잘 안 맞는 타입
                    </p>
                </div>
                )}
            </div>
            )}

<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  }}
>
  {/* 1) 테스트 다시 하기 */}
  <button
    className="btn"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "14px 24px",
      borderRadius: 999,
      border: "none",
      background: THEME.green,
      color: "#1C1C1E",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
    }}
    onClick={() => {
      setStage("quiz");
      setIndex(0);
      setAnswers(Array(QUESTIONS.length).fill(null));
    }}
  >
    테스트 다시 하기
  </button>

  {/* 2) 유형 전체보기 */}
  <button
    className="btn"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "14px 24px",
      borderRadius: 999,
      border: "none",
      background: THEME.ivory,
      color: "#1C1C1E",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
    }}
    onClick={() => setStage("gallery")}
  >
    유형 전체보기
  </button>
</div>
</div>

        </ScrollableContent>
    )}
    {stage === "gallery" && (
  <AllTypesGallery onBack={() => setStage("result")} />
)}

    </div>
  );
}
