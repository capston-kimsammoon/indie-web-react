// src/api/artistApi.js
import http from './http';

/**
 * 🎵 아티스트 목록 조회 (견고한 정규화)
 * GET /artist
 * params: { page=1, size=20 }
 * 인증: 불필요
 *
 * 반환 형태: { artists: Artist[], page: number, totalPages: number, raw: any }
 */
export const fetchArtistList = async ({ page = 1, size = 20 } = {}) => {
  try {
    const { data } = await http.get(`/artist`, {
      params: { page, size },
      // withCredentials: false  // 공개 API면 불필요
    });

    // ---- 정규화: 어떤 스키마가 와도 artists 배열 뽑아낸다 ----
    const artists =
      Array.isArray(data?.artists) ? data.artists :
      Array.isArray(data?.items)   ? data.items   :
      Array.isArray(data?.data)    ? data.data    :
      Array.isArray(data)          ? data         : [];

    // 페이지 정보도 최대한 복원
    const currentPage  = Number(data?.page ?? page ?? 1);
    const totalPages   = Number(
      data?.totalPages ??
      // 서버가 total/size만 줄 수도 있으니 보조 계산
      (Number.isFinite(data?.total) && Number(size) > 0
        ? Math.max(1, Math.ceil(Number(data.total) / Number(size)))
        : 1)
    );

    return { artists, page: currentPage, totalPages, raw: data };
  } catch (error) {
    console.error('📛 아티스트 목록 조회 실패:', error);
    // 실패 시 빈 배열과 기본 페이지 정보로 반환 (컴포넌트 안전)
    return { artists: [], page: 1, totalPages: 1, raw: null };
  }
};

/**
 * 아티스트 상세 정보 조회
 * GET /artist/{id}
 */
export const fetchArtistDetail = async (artistId) => {
  try {
   const { data } = await http.get(`/artist/${artistId}`);

    return {
      ...data,
      // 백엔드 필드명을 프론트 표준 키로 매핑 (널 안전)
      profileImageUrl: data?.image_url ?? null,
      spotify: data?.spotify_url ?? null,
      instagram: data?.instagram_account ?? null,
      scheduledPerformances: Array.isArray(data?.upcomingPerformances)
        ? data.upcomingPerformances
        : [],
      pastPerformances: Array.isArray(data?.pastPerformances)
        ? data.pastPerformances
        : [],
    };
  } catch (error) {
    console.error('📛 아티스트 상세 정보 조회 실패:', error);
    throw error; // 상세는 실패 원인 확인이 필요하니 throw 유지
  }
};
