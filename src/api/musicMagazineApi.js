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

/** ✅ 블록 표준화 (노래 매거진 전용 확장: semititle, artistId 포함) */
const normalizeMusicBlocks = (blocks) => {
  const arr = safeArray({ data: blocks });

  return arr
    .map((b, idx) => {
      const type = (b?.type || '').toLowerCase();

      const base = {
        id: b?.id ?? null,
        order: b?.order ?? b?.display_order ?? idx,
        type,
        semititle: b?.semititle ?? null,
        artistId: b?.artist_id ?? b?.artistId ?? null,
        caption: b?.caption ?? null,
        meta: b?.meta ?? null,
        text: b?.text ?? null,
        imageUrl:
          b?.imageUrl ??
          b?.image_url ??
          b?.url ??
          b?.src ??
          null,
      };

      switch (type) {
        case 'text':
        case 'quote':
        case 'divider':
          return {
            ...base,
            value:
              b?.text ??
              b?.content ??
              b?.value ??
              b?.body ??
              '',
          };

        case 'image':
        case 'embed':
          return {
            ...base,
            value:
              base.imageUrl ??
              b?.value ??
              '',
          };

        case 'cta':
          return {
            ...base,
            value: b?.value ?? '',
          };

        default:
          return {
            ...base,
            type: 'text',
            value:
              b?.text ??
              b?.content ??
              b?.value ??
              b?.body ??
              '',
          };
      }
    })
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
 * GET /music-magazine
 * params: { limit?, page?, size? }
 */
export const fetchMusicMagazineList = async ({ limit, page, size } = {}) => {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (page) params.append('page', page);
    if (size) params.append('size', size);

    // ✅ 백엔드 경로 정확히 맞춤
    const { data } = await axios.get(`${baseUrl}/musicmagazine`, { params });
    const list = safeArray(data).map(normalizeMusicMagazineCard);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('📛 노래 매거진 목록 조회 실패:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * 🎵 노래 매거진 상세 (블록 포함)
 * GET /music-magazine/{id}
 */
export const fetchMusicMagazineDetail = async (id) => {
  try {
    // ✅ 백엔드 경로 정확히 맞춤
    const { data } = await axios.get(`${baseUrl}/musicmagazine/${id}`);

    const rawBlocks =
      data?.blocks ??
      data?.magazine_blocks ??
      data?.contentBlocks ??
      [];

    const normalizedBlocks = normalizeMusicBlocks(rawBlocks);

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
