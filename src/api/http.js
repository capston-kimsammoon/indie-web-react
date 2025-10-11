// src/api/http.js
import axios from "axios";
import { apiBaseUrl, authBaseUrl } from "./config";

const http = axios.create({
  baseURL: apiBaseUrl,       // ✅ 기본은 백엔드(run.app)로
  withCredentials: true,     // ✅ 쿠키 자동 포함(매우 중요)
  validateStatus: (s) => s < 500,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((cfg) => {
  const u = typeof cfg.url === "string" ? cfg.url : "";
  // /auth/* 엔드포인트만 별도 baseURL로 라우팅 (현재는 동일 도메인)
  if (u.startsWith("/auth/")) {
    cfg.baseURL = authBaseUrl;
  }
  return cfg;
});

// ⛔ 401 자동 리다이렉트 금지 (호출부에서 처리)
http.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default http;
