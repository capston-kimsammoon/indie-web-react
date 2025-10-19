import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Pencil, User, Heart, Stamp, ChevronRight } from 'lucide-react';
import defaultProfile from '../../assets/icons/icon_user_default_profile.svg';
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
  removeProfileImage,
  logout,
} from '../../api/userApi';


// 파일 상단 import 아래에 추가
const ModalBackdrop = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
`;

const ModalCard = styled.div`
  width: 92%; max-width: 420px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(0,0,0,0.25);
  overflow: hidden;
  animation: fadeIn .15s ease-out;
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); }
                      to   { opacity: 1; transform: translateY(0); } }
`;

const ModalHeader = styled.div`
  padding: 18px 20px 8px;
`;

const ModalTitle = styled.div`
  font-weight: 800; font-size: 16px; color: #111827;
`;

const ModalDesc = styled.div`
  margin-top: 6px; font-size: 13px; color: #6b7280;
`;

const ModalButtons = styled.div`
  display: flex; flex-direction: column;
  padding: 10px;
  gap: 10px; /* 버튼 사이 간격 */
`;

const ModalBtn = styled.button`
  width: 100%; height: 48px;
  border: 0; border-radius: 14px;
  background: #f3f4f6; color: #111827;
  font-weight: 700; font-size: 15px;
  cursor: pointer; transition: transform .02s ease, background .15s ease;
  &:active { transform: translateY(1px); }
`;

const PrimaryBtn = styled(ModalBtn)`
  background: #ffffff; border: 1px solid #e5e7eb;
  &:hover { background: #f9fafb; }
`;

const DangerBtn = styled(ModalBtn)`
  background: #fff; color: #3c9c68; border: 1px solid #368d5dff;
  &:hover { background: #fff5f5; }
`;



function MyPage() {
  const navigate = useNavigate(); 
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
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

  // 모달 열릴 때 바디 스크롤 잠금
  useEffect(() => {
    if (imageMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [imageMenuOpen]);


  const handleProfileClick = () => setImageMenuOpen(true);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await updateProfileImage(file);
      const url = res?.profileImageUrl || '';   
      setProfileImage(url ? `${url}?t=${Date.now()}` : '');
      setImageError(false);
    } catch (err) {
      console.error('[MyPage] 프로필 이미지 업로드 오류:', err);
    } finally {
    setImageMenuOpen(false);                         // 메뉴 닫기
    }
  };

  // 이미지 삭제
  const handleImageRemove = async () => {
    try {
    const res = await removeProfileImage();      
    setProfileImage('');                       
    setImageError(true);                        
  } catch (err) {
    console.error('[MyPage] 프로필 이미지 삭제 오류:', err);
  } finally {
    setImageMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    await logout(); // 쿠키/세션 초기화
  } catch (err) {
    console.error('[MyPage] 로그아웃 오류:', err);
  } finally {
    navigate('/home', { replace: true }); // 홈으로 이동
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
            <button 
              className="logout__button" 
              onClick={() => navigate('/support')}
            >
              고객센터
            </button>
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
                   <img src={defaultProfile} alt="기본 프로필" className="profile__left__img" />
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

          {imageMenuOpen && (
           <ModalBackdrop
             onClick={() => setImageMenuOpen(false)}
             onKeyDown={(e) => e.key === 'Escape' && setImageMenuOpen(false)}
             role="dialog" aria-modal="true" aria-labelledby="profile-modal-title"
           >
             <ModalCard onClick={(e) => e.stopPropagation()}>
               <ModalHeader>
                 <ModalTitle id="profile-modal-title">프로필 사진</ModalTitle>
                 <ModalDesc>사진을 변경하시겠습니까?</ModalDesc>
               </ModalHeader>

               <ModalButtons>
                  <DangerBtn onClick={handleImageRemove}>기본 이미지로</DangerBtn>
                  <PrimaryBtn onClick={() => fileInputRef.current?.click()}>사진 선택</PrimaryBtn>

                 <ModalBtn onClick={() => setImageMenuOpen(false)}>취소</ModalBtn>
                 </ModalButtons>
            </ModalCard>
          </ModalBackdrop>
)}


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