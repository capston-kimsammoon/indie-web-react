// 리뷰 관련 API 유틸
// - 백엔드 FastAPI 기준 엔드포인트 가정
// - 인증 토큰은 http 인스턴스가 알아서 헤더에 붙이는 형태로 전제

import http from './http';
import { baseUrl } from './config';

// URL 보정(상대/절대 혼용 방지)
const resolveUrl = (url) => {
  if (!url) return '';
  const s = String(url).trim().replace(/"/g, '');
  if (!s) return '';
  if (s.startsWith('http')) return s;
  if (s.startsWith('/')) return `${baseUrl.replace(/\/$/, '')}${s}`;
  return `${baseUrl.replace(/\/$/, '')}/${s.replace(/^\//, '')}`;
};

// 2xx만 통과, 그 외 throw
const ensureOk = (res) => {
  if (res && res.status >= 200 && res.status < 300) return res;
  const status = res?.status;
  const data = res?.data;
  const msg =
    (data && (data.detail || data.message)) ||
    `HTTP ${status || 'ERR'} on ${res?.config?.method?.toUpperCase?.() || ''} ${res?.config?.url || ''}`;
  const err = new Error(msg);
  err.status = status;
  err.data = data;
  throw err;
};

/**
 * 공연장 상세 페이지 하단 미리보기(최대 2개)
 * - 최신순 2개만 가져오기
 */
export async function fetchReviewPreview(venueId, limit = 2) {
  const url = resolveUrl(`/venue/${venueId}/review/preview?limit=${limit}`);
  const res = await http.get(url);
  ensureOk(res);
  return res.data; // { items: ReviewItem[], total: number, ... } 형태 가정
}


/**
 * 전체 공연장 리뷰 목록
 * - GET /venue/reviews?page=&size=&order=
 * - order: 'desc' | 'asc'  (백엔드 최신순 정렬 파라미터와 일치)
 * - 반환 가정: { items, total, page, size }
 */
export async function fetchAllReviews({ page = 1, size = 10, order = 'desc' } = {}) {
 // const qs = new URLSearchParams({
 //   page: String(page),
 //   size: String(size),
 //   order,
 // }).toString();

 // const url = resolveUrl(`/venue/reviews?${qs}`);
  try {
   const res = await http.get('/venue/reviews/all', {
     params: { page, size, order: order === 'asc' ? 'asc' : 'desc' },
     validateStatus: () => true,
   });

   // JSON 응답 보장: 프론트 서버 HTML을 받으면 즉시 에러 발생시켜 원인 드러내기
   const ct = res.headers?.['content-type'] || res.headers?.get?.('content-type') || '';
   if (!ct.includes('application/json')) {
     throw new Error(`Non-JSON response from ${res.config.baseURL || ''}${res.config.url}`);
   }
    ensureOk(res);
  //  console.log(res.data)
    console.info('[fetchAllReviews] data:', res.data);   // info 탭에서 확인
    return res.data;
  } catch (e) {
   // console.error('[fetchAllReviews] error:', e?.response?.status, e?.response?.data);
   // const status = e?.response?.status;

    const status = e?.status ?? e?.response?.status;
   const data   = e?.data   ?? e?.response?.data;
   console.log(JSON.stringify(e))
    // 404/422는 "빈 리스트"로 처리해 페이지 크래시 방지
    if (status === 404 || status === 422) {
      return { items: [], total: 0, page, size };
    }
    throw e;
  }
}

/**
 * 공연장 리뷰 목록
 * - page, size, order(desc=최신순)
 */
export async function fetchReviews(venueId, { page = 1, size = 10, order = 'desc' } = {}) {
  const url = resolveUrl(`/venue/${venueId}/review?page=${page}&size=${size}&order=${order}`);
  const res = await http.get(url);
  ensureOk(res);
  console.log(res.data)
  return res.data;
}


/**
 * 리뷰 작성 (텍스트 + 이미지(여러 장))
 * - multipart/form-data
 * - images: File[] (선택)
 */
export async function createReview(venueId, { content, images = [] }) {
  const url = resolveUrl(`/venue/${venueId}/review/write`);
  const form = new FormData();
  form.append('content', content || '');
  // 백엔드가 "images" 필드명으로 여러 파일 받도록 가정
  images.forEach((file) => {
    if (file) form.append('images', file);
  });

  
  const res = await http.post(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  ensureOk(res);
  return res.data;
}

/**
 * 리뷰 삭제
 * - 작성자 본인 + 로그인 필요
 */
export async function deleteReview(reviewId) {
  const url = resolveUrl(`/venue/review/${reviewId}`);
  const res = await http.delete(url);
  ensureOk(res);
  return res.data;
}

/**
 * 좋아요 토글
 * - 이미 좋아요면 DELETE, 아니면 POST
 * - 반환: { like_count, liked_by_me }
 */
export async function toggleReviewLike(reviewId, isCurrentlyLiked) {
  const url = resolveUrl(`/venue/review/${reviewId}/like`); // ✅ 경로 수정
  const res = isCurrentlyLiked ? await http.delete(url) : await http.post(url);
  ensureOk(res);
  return res.data;
}


export async function fetchMyReviews({ page = 1, size = 20, order = 'desc' } = {}) {
  const qs = new URLSearchParams({
    page: String(page),
    size: String(size),
    order,
  }).toString();

  const url = resolveUrl(`/venue/my/review?${qs}`);

  try {
    const res = await http.get(url);             // axios 인스턴스라면 withCredentials 설정 확인!
    ensureOk(res);                               // 2xx 아니면 throw 하게 되어 있다면
    return res.data;                             // { items, total, page, size }
  } catch (e) {
    // 디버깅용 로그 — 422/401/404가 무엇인지 확인
    console.error('[fetchMyReviews] error:', e?.response?.status, e?.response?.data);

    // 404/422는 빈 목록으로 처리해서 무한 재시도/크래시 방지
    const status = e?.response?.status;
    if (status === 404 || status === 422) {
      return { items: [], total: 0, page, size };
    }
    // 나머지는 그대로 던져서 상위에서 표시
    throw e;
  }
}