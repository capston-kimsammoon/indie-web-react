// src/utils/ga.js
const lastClickAt = new Map(); // 클릭한 링크(url)을 키로, 마지막 클릭 시간 저장
const DEDUP_WINDOW_MS = 2500;          // 2.5초 내 반복 클릭은 무시 

export function trackOutboundDetailLink({
  performanceId,
  performanceTitle,
  venueId,
  venueName,
  linkUrl,
  source = 'performance_detail', // 어디서 눌렀는지
  surface = 'web',               // 플랫폼 구분 (웹/앱 통합 시 분석 편의)
  userId,                        // 로그인 사용자 있으면 넘겨도 됨 (동의 준수)
}) {
  if (typeof window === 'undefined' || !window.gtag || !linkUrl) return;

  const now = Date.now();
  const last = lastClickAt.get(linkUrl) || 0;
  if (now - last < DEDUP_WINDOW_MS) return; // 같은 링크를 2.5초 안에 또 누르면 GA4로 이벤트 안 보냄 (하나의 클릭만 집계)
  lastClickAt.set(linkUrl, now);

  if (userId) { // user_id도 GA4에 포함시킬 거면 사용 (그런데 로그아웃 상태에서도 클릭이 가능하므로 지워도 될 듯..?)
    window.gtag('set', { user_id: String(userId) });
  }

  window.gtag('event', 'outbound_link_click', {
    event_category: 'engagement', // 이벤트 그룹
    event_label: 'Performance detail link', 
    link_url: linkUrl, // 클릭한 실제 url 
    performance_id: String(performanceId ?? ''), // 공연 ID
    performance_title: performanceTitle ?? '', // 공연명
    venue_id: String(venueId ?? ''), // 공연장 ID
    venue_name: venueName ?? '', // 공연장 이름
    source, // 클릭 출처 (예매 링크인지 상세 링크인지)
    surface, // 플랫폼 구분 (웹인지 앱인지)
    page_location: window.location.href, // 클릭 당시 페이지 경로 (ex. /performance/123)
    page_path: window.location.pathname + window.location.search, // 클릭 당시 페이지 경로 (ex. /performance/123)
    page_referrer: document.referrer || '', // 이전 페이지 
  });
}

// 1. 사용자가 상세/예매 링크 클릭 : trackOutboundDetailLink() 실행
// 2. gtag('event', 'outbounc_link_click, {...}) 호출 : GA4로 이벤트 전송
// 3. Google Analytics 수집 서버에서 저장 : 실시간 보고서 (바로 확인 ok) 및 탐색(다음날에 가능)에서 확인 가능
// 4. 등록한 맞춤 측정기준(공연 제목, 공연장 이름 등) : 하루 내에 자동 반영되어 리포트에서 표시 됨