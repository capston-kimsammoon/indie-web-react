import axios from 'axios';
import { baseUrl } from './config';
import http from './http';

/**
 *  공연 검색 
 */
export const searchPerformance = async ({ keyword, page, size }) => {
  try {
   // console.log(`🔗 요청 URL: ${url}?keyword=${keyword}&page=${page}&size=${size}`);
    const response = await http.get('/search/performance', { params: { keyword, page, size } });
    console.log('🎯 공연 검색 API 응답:', response.data);

    return {
      performances: response.data?.performance || [],
    };
  } catch (error) {
    console.error('📛 공연 검색 실패:', error);
    return { performances: [] };
  }
};

/**
 *  공연장 검색 
 */
export const searchVenue = async ({ keyword, page, size }) => {
  try {
   // console.log(`🔗 요청 URL: ${url}?keyword=${keyword}&page=${page}&size=${size}`);
    const response = await http.get('/search/venue', { params: { keyword, page, size } });
    console.log('🎯 공연장 검색 API 응답:', response.data);

    return {
      venues: response.data?.venues || []
    };
  } catch (error) {
    console.error('📛 공연장 검색 실패:', error);
    return { venues: [] };
  }
};

/**
 *  아티스트 검색
 */
export const searchArtist = async ({ keyword, page, size }) => {
  try {
    const response = await http.get('/search/artist', { params: { keyword, page, size } });
    return response.data?.artists || [];
  } catch (error) {
    console.error('📛 아티스트 검색 실패:', error);
    return [];
  }
};

/**
 *  자유게시판 검색
 */
export const searchPost = async ({ keyword, page, size }) => {
  try {
    const url = `${baseUrl}/search/post`;
    const response = await axios.get(url, { params: { keyword, page, size } });
    return response.data?.posts || [];
  } catch (error) {
    console.error('📛 자유게시판 검색 실패:', error);
    return [];
  }
};

