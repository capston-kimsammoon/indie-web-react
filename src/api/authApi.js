// src/api/authApi.js
import http from './http'; // ✅ axios 인스턴스 (baseUrl + withCredentials)

export const getKakaoLoginUrl = async (force = false) => {
  const { data } = await http.get('/auth/kakao/login', {
    params: { force },
  });
  return data; // { loginUrl }
};

export const kakaoLoginCallback = async (authCode) => {
  const { data } = await http.get('/auth/callback', {
    params: { code: authCode, mode: 'json' },
  });
  return data; // { accessToken, refreshToken, user }
};

// 로그아웃 
export const logoutUser = async () => {
  const { data } = await http.post('/auth/logout');
  return data; // { message: "로그아웃되었습니다." }
};

// 탈퇴하기 
export const withdrawAccount = async () => {
  try {
    const res = await http.delete("/auth/withdraw", {
      headers: { "x-silent-error": "1" },
    });
    return res.data;
  } catch (e) {
    if (e?.response?.status === 401) return { message: "탈퇴되었습니다." };
    throw e;
  } finally {
   localStorage.removeItem('accessToken');
  }
}