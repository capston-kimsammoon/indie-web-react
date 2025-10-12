import { useEffect, useState } from 'react';
import './LoginPage.css';  
import Header from '../../components/layout/Header';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const KAKAO_BTN_SRC =
  'https://developers.kakao.com/tool/resource/static/img/button/login/full/ko/kakao_login_large_wide.png';

export default function LoginPage() {
  const [checking, setChecking] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/user/me`, { credentials: 'include' });
        if (r.status === 401) return;
        if (!r.ok) throw new Error('user/me failed');
        const data = await r.json();
        if (alive) setMe(data);
      } catch {
        /* noop */
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const startKakao = async () => {
    const r = await fetch(`${API_BASE}/auth/kakao/login`);
    const { loginUrl } = await r.json();
    window.location.href = loginUrl;
  };

  if (checking) return <div className="login-page">로그인 상태 확인 중…</div>;
  if (me)       return <div className="login-page">이미 로그인 상태입니다. 홈으로 이동해 주세요.</div>;

  return (
    <div className="login-page">
      <Header title="로그인" />
      <div className="login-box">
        <img
          src={KAKAO_BTN_SRC}
          alt="카카오로 로그인"
          className="kakao-btn"
          onClick={startKakao}
          draggable={false}
        />
      </div>
    </div>
  );
}
