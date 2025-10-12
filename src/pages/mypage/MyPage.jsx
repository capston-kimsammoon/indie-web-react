import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Pencil, User, Heart, Stamp, ChevronRight } from 'lucide-react';
import styled from 'styled-components';
import './Mypage.css';
import Toggle from '../../components/ui/toggle';
import Header from "../../components/layout/Header";
import Divider from '../../components/common/Divider';
import {
  fetchUserInfo,
  updateNickname,
  updateUserSettings,
  updateProfileImage,
  logout,
} from '../../api/userApi';

function MyPage() {
  const navigate = useNavigate(); 
  const [profileImage, setProfileImage] = useState('');
  const [nickname, setNickname] = useState('');
  const [editingNickname, setEditingNickname] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await fetchUserInfo();
        if (!user) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }
        setIsLoggedIn(true);
        const profileUrl = user.profile_url;
        setProfileImage(profileUrl ? `${profileUrl}?t=${Date.now()}` : '');
        setNickname(user.nickname || '');
        setAlarmEnabled(Boolean(user.alarm_enabled));
        setLocationEnabled(Boolean(user.location_enabled));
        setImageError(!profileUrl);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleProfileClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await updateProfileImage(file);
      setProfileImage(`${res.profileImageUrl}?t=${Date.now()}`);
      setImageError(false);
    } catch (err) {
      console.error('[MyPage] 프로필 이미지 업로드 오류:', err);
    }
  };

  const handleNicknameSave = async () => {
    setEditingNickname(false);
    try {
      await updateNickname(nickname);
    } catch (err) {
      console.error('[MyPage] 닉네임 수정 오류:', err);
    }
  };

  const handleSettingChange = async (key, value) => {
    const prevAlarm = alarmEnabled;
    const prevLoc = locationEnabled;

    const nextAlarm = key === 'alarm' ? value : alarmEnabled;
    const nextLoc = key === 'location' ? value : locationEnabled;

    setAlarmEnabled(nextAlarm);
    setLocationEnabled(nextLoc);
    try {
      await updateUserSettings(nextAlarm, nextLoc);
    } catch (err) {
      console.error('[MyPage] 설정 실패:', err);
      setAlarmEnabled(prevAlarm);
      setLocationEnabled(prevLoc);
    }
  };

  const handleLogout = async () => {
  try {
    await logout(); // ✅ 쿠키/세션 초기화
  } catch (err) {
    console.error('[MyPage] 로그아웃 오류:', err);
  } finally {
    navigate('/home', { replace: true }); // ✅ 홈으로 이동
  }
};

  if (loading) {
    return (
      <div className="page">
        <Header title="마이페이지" />
        <div style={{ height: "16px" }} />
      </div>
    );
  }

  return (
    <PageWrapper>
      <Header title="마이페이지" />
      <div style={{ height: "16px" }} />

      {!isLoggedIn ? (
        <div className="guest">
          <button className="guest__cta" onClick={() => (window.location.href = '/login')}>
            로그인 / 회원가입
          </button>
          <p className="guest__message">로그인 후 이용 가능합니다.</p>
          <div className="footer-actions">
            <button className="logout__button" onClick={handleLogout}>공지사항</button>
          </div>
        </div>
      ) : (
        <ScrollableList>
          {/* 상단 프로필 */}
          <div className="profile">
            <div className="profile__container">
              <div className="profile__left">
                {profileImage && !imageError ? (
                  <img
                    src={profileImage}
                    alt="프로필"
                    className="profile__left__img"
                    onError={(e) => {
                      if (e.currentTarget.src.includes('/static/profiles/')) setImageError(true);
                    }}
                  />
                ) : (
                  <User size={64} className="profile__left__img" />
                )}

                <Settings className="profile__left__settings" onClick={handleProfileClick} />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="profile__name">
                {editingNickname ? (
                  <div className="edit-nickname">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                    <button onClick={handleNicknameSave}>저장</button>
                  </div>
                ) : (
                  <>
                    <p>{nickname}</p>
                    <Pencil className="profile__name__edit" onClick={() => setEditingNickname(true)} />
                  </>
                )}
              </div>
            </div>
          </div>
                
          {/* 🔹 퀵 메뉴 3개 */}
          <div className="quick">
            <div className="quick__grid">
              <button className="quick__item" onClick={() => navigate('/favorite')}>
                <Heart className="quick__icon" />
                <span className="quick__label">찜</span>
              </button>
              <button className="quick__item" onClick={() => navigate('/venue/my/review')}>
                <Pencil className="quick__icon" />
                <span className="quick__label">내가 쓴 리뷰</span>
              </button>
              <button className="quick__item" onClick={() => navigate('/my/stamps')}>
                <Stamp className="quick__icon" />
                <span className="quick__label">스탬프 리스트</span>
              </button>
            </div>
          </div>

          <Divider />
          
          {/* 🔹 설정 + 링크 리스트 */}
          <div className='list'>
            <div className="list-item">
              <span className="list-item__label">공지사항</span>
              <button 
                className="chev-button" 
                onClick={() => navigate('/notice')}
              >
                <ChevronRight className="chev" />
              </button>
            </div>

            <div className="list-item">
              <span className="list-item__label">고객센터</span>
              <button 
                className="chev-button" 
                onClick={() => navigate('/support')}
              >
                <ChevronRight className="chev" />
              </button>
            </div>
          </div>

          {/* ✅ 하단 고정된 로그아웃/탈퇴하기 영역 */}
          <div className="footer-actions">
            <button className="logout__button" onClick={handleLogout}>로그아웃</button>
            <span style={{ color: '#B0B0B0', fontSize: '12px' }}> | </span>
            <div className="withdraw">탈퇴하기</div>
          </div>
        </ScrollableList>
      )}
    </PageWrapper>
  );
}

export default MyPage;

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const ScrollableList = styled.div`
  padding-bottom: 109px;
  flex-grow: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none; 
  }

  -ms-overflow-style: none; 
  scrollbar-width: none;

  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;
