// ✅ src/api/musicMagazineApi.js
import axios from 'axios';
import { baseUrl } from './config';

/** ✅ 항상 배열 보장 */
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

/** ✅ 카드(리스트) 표준화 */
const normalizeMusicMagazineCard = (m) => ({
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

/** ✅ 블록 표준화 - magazineApi와 동일하게 단순화 */
const normalizeMusicBlocks = (blocks) => {
  const arr = safeArray({ data: blocks });
  
  return arr
    .map((b) => ({
      ...b,
      id: b?.id ?? null,
      type: b?.type ?? 'text',
      order: b?.order ?? b?.display_order ?? 0,
      
      // 텍스트 관련
      semititle: b?.semititle ?? null,
      value: b?.value ?? b?.text ?? b?.content ?? b?.body ?? '',
      
      // 이미지 관련
      imageUrl: b?.imageUrl ?? b?.image_url ?? b?.url ?? b?.src ?? null,
      caption: b?.caption ?? null,
      align: b?.align ?? b?.meta?.align ?? 'center',
      
      // CTA 관련 (아티스트)
      artistId: b?.artist_id ?? b?.artistId ?? null,
      
      // 기타
      meta: b?.meta ?? null,
    }))
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
};

/** 내부: 첫 번째 이미지 URL 추출 (카드 커버용) */
const extractFirstImageUrl = (blocks = []) => {
  const img = blocks.find((b) => {
    const t = (b?.type || '').toLowerCase();
    const url =
      b?.imageUrl ??
      b?.image_url ??
      b?.url ??
      b?.src ??
      null;
    return (t === 'image' || t === 'embed') && !!url;
  });
  return (
    img?.imageUrl ??
    img?.image_url ??
    img?.url ??
    img?.src ??
    null
  );
};

/**
 * 🎵 노래 매거진 목록
 * GET /musicmagazine
 * params: { limit?, page?, size? }
 */
export const fetchMusicMagazineList = async ({ limit, page, size } = {}) => {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (page) params.append('page', page);
    if (size) params.append('size', size);

    console.log('🔍 음악 매거진 API 요청:', `${baseUrl}/musicmagazine?${params}`);
    
    const { data } = await axios.get(`${baseUrl}/musicmagazine`, { params });
    
    console.log('🔍 음악 매거진 API 원본 응답:', data);
    
    const list = safeArray(data).map(normalizeMusicMagazineCard);
    
    console.log('🔍 표준화된 목록:', list);
    
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('📛 노래 매거진 목록 조회 실패:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * 🎵 노래 매거진 상세 (블록 포함)
 * GET /musicmagazine/{id}
 */
export const fetchMusicMagazineDetail = async (id) => {
  try {
    console.log('🔍 음악 매거진 상세 요청:', `${baseUrl}/musicmagazine/${id}`);
    
    const { data } = await axios.get(`${baseUrl}/musicmagazine/${id}`);

    console.log('🔍 음악 매거진 상세 원본 응답:', data);

    const rawBlocks =
      data?.blocks ??
      data?.magazine_blocks ??
      data?.contentBlocks ??
      [];

    const normalizedBlocks = normalizeMusicBlocks(rawBlocks);
    
    console.log('🔍 표준화된 블록:', normalizedBlocks);

    const coverImageUrl =
      data?.coverImageUrl ??
      data?.cover_image_url ??
      extractFirstImageUrl(normalizedBlocks) ??
      null;

    return {
      ...data,
      id: data?.id ?? null,
      slug: data?.slug ?? null,
      title: data?.title ?? '',
      author: data?.author ?? data?.writer ?? null,
      coverImageUrl,
      createdAt: data?.created_at ?? data?.createdAt ?? null,
      blocks: normalizedBlocks,
    };
  } catch (error) {
    console.error('📛 노래 매거진 상세 조회 실패:', error?.response?.data || error.message);
    throw error;
  }
};
