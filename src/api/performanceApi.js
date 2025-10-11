import axios from 'axios';
import http from './http';
import { baseUrl } from './config';

// ✅ [공통 함수] 안전하게 배열 반환
const safeArray = (data) => (Array.isArray(data) ? data : data?.performances || []);

// 홈-1. 오늘 예정된 공연
export const fetchTodayPerformances = async () => {
  try {
    const response = await axios.get(`${baseUrl}/performance/home/today`);
    return safeArray(response.data); // ✅ 배열만 반환
  } catch (error) {
    console.error('❌ 오늘 공연 조회 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 홈-2. NEW 업로드 공연
export const fetchRecentPerformances = async (limit) => {
  try {
    const response = await axios.get(`${baseUrl}/performance/home/recent`, {
      params: { limit },
    });
    return safeArray(response.data);
  } catch (error) {
    console.error('❌ 최근 공연 조회 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 홈-3. 티켓 오픈 예정 공연
export const fetchTicketOpeningPerformances = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${baseUrl}/performance/home/ticket-opening`, {
      params: { startDate, endDate },
    });
    return safeArray(response.data);
  } catch (error) {
    console.error('❌ 티켓 오픈 예정 공연 조회 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 홈-4. 맞춤 추천 공연
export const fetchRecommendedPerformances = async (authToken) => {
  try {
    // ✅ 토큰이 있을 때만 Authorization 헤더를 붙임
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const response = await axios.get(`${baseUrl}/performance/home/recommendation`, { headers });

    // ✅ 항상 배열을 반환 (응답은 { userId, recommendations: [...] })
    return Array.isArray(response.data?.recommendations)
      ? response.data.recommendations
      : [];
  } catch (error) {
    console.error('❌ 맞춤 추천 공연 조회 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 캘린더-2. 날짜별 공연 리스트
export const fetchPerformancesByDate = async (date) => {
  try {
    const response = await axios.get(`${baseUrl}/performance/by-date`, { params: { date } });
    return safeArray(response.data);
  } catch (error) {
    console.error('❌ 날짜별 공연 조회 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 공연-1. 공연 목록 조회 (수정 완료 ✅)
export const fetchPerformances = async ({ region, sort, page, size }) => {
  try {
    const params = new URLSearchParams();

    if (region && Array.isArray(region)) {
      region.forEach((r) => params.append('region', r));
    } else if (region) {
      params.append('region', region);
    }

    if (sort) params.append('sort', sort);
    if (page) params.append('page', page);
    if (size) params.append('size', size);

    const response = await axios.get(`${baseUrl}/performance`, {
      params,
    });

    return Array.isArray(response.data?.performances)
      ? response.data.performances
      : [];
  } catch (error) {
    console.error('❌ 공연 목록 조회 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 공연-2. 공연 상세 정보 조회 (단일 객체 반환)
export const fetchPerformanceDetail = async (id) => {
  const res = await http.get(`/performance/${id}`); // ✅ withCredentials 포함
  return res.data;
};

// 가까운 공연 찾기-2. 지도 영역 내 예정 공연 조회 (POST)
export const fetchPerformancesInArea = async (swLat, swLng, neLat, neLng) => {
  try {
    const response = await axios.post(`${baseUrl}/nearby/performance`, {
      sw_lat: swLat,
      sw_lng: swLng,
      ne_lat: neLat,
      ne_lng: neLng,
    });
    return safeArray(response.data);
  } catch (error) {
    console.error('❌ 지도 영역 내 공연 조회 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 가까운 공연 찾기-3. 특정 공연장의 예정 공연 조회
export const fetchUpcomingPerformancesByVenue = async (venueId, afterTime) => {
  try {
    const response = await axios.get(`${baseUrl}/nearby/venue/${venueId}/performance`, {
      params: { after: afterTime },
    });
    return safeArray(response.data);
  } catch (error) {
    console.error('❌ 특정 공연장 예정 공연 조회 실패:', error.response?.data || error.message);
    throw error;
  }
};


// 홈-5. 인기 많은 공연
export const fetchPopularPerformances = async (limit = 6) => {
  // ✅ 리스트 페이지와 동일 규약: sort=likes, page=1, size=limit
  const list = await fetchPerformances({ sort: 'likes', page: 1, size: limit });
  return Array.isArray(list) ? list : [];
};
