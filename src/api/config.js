// .env(Vercel)에서 값을 읽고, 끝 슬래시는 제거
const apiBase = (process.env.REACT_APP_API_BASE_URL || "/").replace(/\/$/, "");
const authBase = (process.env.REACT_APP_AUTH_BASE_URL || apiBase).replace(/\/$/, "");

// 주 사용 엔드포인트
export const apiBaseUrl  = apiBase || "/";
export const authBaseUrl = authBase || "/";

// 과거 호환
export const baseUrl = apiBaseUrl;

export default { apiBaseUrl, authBaseUrl, baseUrl };
