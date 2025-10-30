// src/api/magazineApi.js
import axios from 'axios';
import { baseUrl } from './config';

/** ✅ 공통: 항상 배열 보장 */
const safeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    return (
      data.magazines ||
      data.items ||
      data.data ||
      data.results ||
      data.list ||
      []
    );
  }
  return [];
};

/** ✅ 리스트용 표준화 (카드용 필드 통일) */
const normalizeMagazineCard = (m) => ({
  ...m,
  id: m?.id ?? m?.magazine_id ?? null,
  slug: m?.slug ?? m?.magazine_slug ?? null,
  title: m?.title ?? '',
  excerpt: m?.excerpt ?? m?.summary ?? m?.content_preview ?? null,
  coverImageUrl:
    m?.coverImageUrl ??
    m?.cover_image_url ??
    m?.image_url ??
    m?.thumbnail ??
    m?.cover_url ??
    null,
  author: m?.author ?? m?.writer ?? null,
  createdAt: m?.created_at ?? m?.createdAt ?? null,
});

/** ✅ 블록 표준화 (렌더 스위치의 입력 형태 고정) */
const normalizeBlocks = (blocks) => {
  const arr = safeArray({ data: blocks });
  return arr
    .map((b) => ({
      ...b,
      imageUrl: b?.imageUrl ?? b?.image_url ?? null,
      caption: b?.caption ?? null,
      align: b?.align ?? b?.meta?.align ?? 'center',
      meta: b?.meta ?? null,
    }))
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
};

/**
 * 📰 매거진 목록 조회
 * GET /magazine
 * params: { limit?, page?, size? }
 * 반환: Magazine[] (카드용 표준화)
 */
export const fetchMagazineList = async ({ limit, page, size } = {}) => {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (page) params.append('page', page);
    if (size) params.append('size', size);

    const { data } = await axios.get(`${baseUrl}/magazine`, { params });
    
    console.log("🔍 목록 API 원본 응답:", data); // 🔍 추가
    
    const list = safeArray(data).map(normalizeMagazineCard);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('📛 매거진 목록 조회 실패:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * 📰 매거진 상세 조회 (블록 포함)
 * GET /magazine/{idOrSlug}
 * 반환: 단일 객체 (필드 표준화 + blocks 정리)
 */
export const fetchMagazineDetail = async (idOrSlug) => {
  try {
    const { data } = await axios.get(`${baseUrl}/magazine/${idOrSlug}`);

    console.log("🔍 원본 API 응답 (magazineApi):", data);
    // 서버 응답이 다른 키를 쓸 수 있으므로 유연 매핑
    const rawBlocks = data?.blocks ?? data?.magazine_blocks ?? data?.contentBlocks ?? [];

    return {
      ...data,
      id: data?.id ?? null,
      slug: data?.slug ?? null,
      title: data?.title ?? '',
      author: data?.author ?? data?.writer ?? null,
      coverImageUrl:
        data?.coverImageUrl ??
        data?.cover_image_url ??
        data?.image_url ??
        null,
      createdAt: data?.created_at ?? data?.createdAt ?? null,
      blocks: normalizeBlocks(rawBlocks),
      content: data?.content ?? data?.performance_id ?? data?.performanceId ?? null,
    };
  } catch (error) {
    console.error('📛 매거진 상세 조회 실패:', error?.response?.data || error.message);
    throw error;
  }
};
