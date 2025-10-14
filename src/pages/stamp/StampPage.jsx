// src/pages/stamp/StampPage.jsx
import styled from "styled-components";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/layout/Header";
import StampLogin from "../../components/stamp/StampLogin";
import { fetchUserInfo } from "../../api/userApi";
import PeriodModal from "../../components/modals/PeriodModal";
import StampButtonIcon from "../../assets/icons/modie_stamp.png";
import FilterButtonNone from "../../components/common/FilterButtonNone";
import StampPopup from "../../components/stamp/StampPopup";
import StampPopupSmall from "../../components/stamp/StampPopupSmall";
import StampPopupSmall2 from "../../components/stamp/StampPopupSmall2";
import StampDetailPopup from "../../components/stamp/StampDetailPopup";

import {
  fetchCollectedStamps,
  fetchAvailableStamps,
  collectStamp,
} from "../../api/stampApi";

export default function StampPage() {

  const navigate = useNavigate();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear);
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(12);

  const [isStampPopupOpen, setIsStampPopupOpen] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState(null);

  const [isConfirmPopupOpen, setIsConfirmPopupOpen] = useState(false);
  const [selectedStampDetail, setSelectedStampDetail] = useState(null);
  const [isStampSmall2Open, setIsStampSmall2Open] = useState(false);

  // ✅ API 연결 관련 상태
  const [collectedStamps, setCollectedStamps] = useState([]);
  const [availableStamps, setAvailableStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await fetchUserInfo();
        if (!mounted) return;
        setIsLoggedIn(!!me?.id);
      } catch {
        if (!mounted) return;
        setIsLoggedIn(false);
      }
    })();
    // 다른 탭/화면에서 로그인 상태가 바뀐 경우 대비
    const sync = async () => {
      try {
        const me = await fetchUserInfo();
        setIsLoggedIn(!!me?.id);
      } catch {
        setIsLoggedIn(false);
      }
    };
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => { mounted = false; window.removeEventListener("focus", sync); window.removeEventListener("storage", sync); };
  }, []);

  // ✅ 수집한 스탬프 목록 로드
  useEffect(() => {
     if (!isLoggedIn) return;  
    const loadCollectedStamps = async () => {
      try {
        setLoading(true);
        const stamps = await fetchCollectedStamps(startMonth, endMonth);
        setCollectedStamps(stamps);
      } catch (e) {
        console.error("📛 수집한 스탬프 로딩 실패:", e);
        if (e?.response?.status === 401) { // 토큰 만료 등
          setIsLoggedIn(false);
          return;
        }
        setError("스탬프를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadCollectedStamps();
  }, [isLoggedIn, startMonth, endMonth, startYear, endYear]); 

  // ✅ 사용 가능한 스탬프 목록 로드 (팝업 열렸을 때)
  useEffect(() => {
    if (!isLoggedIn || !isStampPopupOpen) return;

    (async () => {
      try {
        const list = await fetchAvailableStamps({ days: 30 });
        console.log("🎯 available stamps:", list);
        setAvailableStamps(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("❌ available 오류", e?.response?.data || e.message);
        if (e?.response?.status === 401) {
          setIsLoggedIn(false);
          return;
        }
        setAvailableStamps([]);
      }
    })();
  }, [isLoggedIn, isStampPopupOpen]);

  // ✅ 스탬프 수집 처리
  const handleStampCollect = async (stampData) => {
    
      if (!isLoggedIn) return;
      try {
      await collectStamp(stampData.id);
      // 성공 후 수집한 스탬프 목록 새로고침
      const updatedStamps = await fetchCollectedStamps(startMonth, endMonth);
      setCollectedStamps(updatedStamps);

      setIsConfirmPopupOpen(false);
      setIsStampPopupOpen(false);
      setSelectedStamp(null);
    } catch (e) {
      if (e?.response?.status === 401) { setIsLoggedIn(false); return; }
      console.error("📛 스탬프 수집 실패:", e);
      alert("스탬프 수집에 실패했습니다.");
    }
  };

  return (
    <>
    <PageWrapper>
      <Header title="스탬프" />
      <div style={{ height: "16px" }} />

      <MainContent className="app-scroll">
        <FilterBar>
          <FilterGroup>
            <FilterButtonNone onClick={() => setIsPeriodModalOpen(true)}>
              기간 설정
            </FilterButtonNone>
          </FilterGroup>
        </FilterBar>

        {/* ✅ 메인 스탬프판 */}
        <StampBoard>
          <ScrollableList>
            {collectedStamps.length > 0 ? (
              <StampPageContainer>
                {(() => {
                  const rows = [];
                  const sorted = collectedStamps
                    .slice()
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                  
                  for (let i = 0; i < sorted.length; i += 3) {
                    const slice = sorted.slice(i, i + 3);
                    while (slice.length < 3) slice.push(null);
                    rows.push(slice);
                  }
                  
                  return rows.map((rowItems, rowIndex) => (
                    <StampRow key={rowIndex}>
                      {rowItems.map((stamp, colIndex) => (
                        <StampItemWrapper key={colIndex}>
                          {stamp && (
                            <StampItem onClick={() => setSelectedStampDetail(stamp)}>
                              <StampImage src={stamp.venueImageUrl} alt={stamp.place} />
                              <StampDate>{stamp.date}</StampDate>
                            </StampItem>
                          )}
                        </StampItemWrapper>
                      ))}
                    </StampRow>
                  ));
                })()}
              </StampPageContainer>
            ) : (
              <EmptyMessage>받은 스탬프가 없습니다.</EmptyMessage>
            )}
          </ScrollableList>
        </StampBoard>

        <StampButton onClick={() => setIsStampPopupOpen(true)}>
          <img
            src={StampButtonIcon}
            alt="스탬프 찍기"
            style={{ height: '8px', width: 'auto' }}
          />
        </StampButton>

        {/* ✅ 스탬프 팝업 */}
        {isStampPopupOpen && (
          <StampPopup
            onClose={() => setIsStampPopupOpen(false)}
            stamps={availableStamps}
            onStampSelect={(stamp) => {
              if (stamp.is_collected) {
                setIsStampSmall2Open(true);
              } else {
                setSelectedStamp(stamp);
                setIsConfirmPopupOpen(true);
              }
            }}
          />
        )}

        {/* ✅ 수집 확인 팝업 */}
        {isConfirmPopupOpen && (
          <StampPopupSmall
            onConfirm={() => handleStampCollect(selectedStamp)}
            onCancel={() => setIsConfirmPopupOpen(false)}
          />
        )}

        {/* ✅ 이미 수집된 스탬프 팝업 */}
        {isStampSmall2Open && (
          <StampPopupSmall2 onClose={() => setIsStampSmall2Open(false)} />
        )}

        {/* ✅ 스탬프 상세 팝업 */}
        {selectedStampDetail && (
          <StampDetailPopup
            concert={selectedStampDetail}
            onClose={() => setSelectedStampDetail(null)}
            onPosterClick={(pid) => {
              if (!pid) return;
              setSelectedStampDetail(null);         // 팝업 닫고
              navigate(`/performance/${pid}`);      // 상세로 이동
            }}
          />
        )}

        {/* ✅ 기간 설정 모달 */}
        {isPeriodModalOpen && (
          <PeriodModal
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            onChange={({ startYear, startMonth, endYear, endMonth }) => {
              setStartYear(startYear);
              setStartMonth(startMonth);
              setEndYear(endYear);
              setEndMonth(endMonth);
            }}
            onClose={() => setIsPeriodModalOpen(false)}
          />
        )}
        {!isLoggedIn && <StampLogin />}
      </MainContent>
    </PageWrapper>

    {isPeriodModalOpen && (
      <PeriodModal
        startYear={startYear}
        startMonth={startMonth}
        endYear={endYear}
        endMonth={endMonth}
        onChange={({ startYear, startMonth, endYear, endMonth }) => {
          setStartYear(startYear);
          setStartMonth(startMonth);
          setEndYear(endYear);
          setEndMonth(endMonth);
        }}
        onClose={() => setIsPeriodModalOpen(false)}
      />
    )}
    {!isLoggedIn && <StampLogin />}
  </>
  );
}

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  flex-shrink: 0;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column; 
`;

const StampButton = styled.button`
  position: fixed;
  right: 20px;
  bottom: 100px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.primaryGreen || '#3C9C67'};
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  font-weight: bold;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.95);
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.3);
  }

  @media (min-width: ${({ theme }) => theme.layout.maxWidth}) {
    right: calc((100vw - ${({ theme }) => theme.layout.maxWidth}) / 2 + 20px);
  }
`;

const StampBoard = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
  padding: 0 0 108px 0;
  overflow: hidden;
  touch-action: pan-y;
  box-sizing: border-box;
  
  & > * {
    box-sizing: border-box;
  }
`;

const StampPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
`;

const StampRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
  justify-content: center;
`;

const StampItemWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  caret-color: transparent;
  min-width: 0;
  touch-action: pan-y;
  user-select: none;
`;

const StampItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 100%;
`;

const StampImage = styled.img`
  width: 20vw;
  max-width: 100px;
  height: 20vw;
  max-height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.6px solid ${({ theme }) => theme.colors.outlineGray};
`;

const StampDate = styled.div`
  margin-top: 12px;
  margin-bottom: 16px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.stampGray};
`;

const ScrollableList = styled.div`
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;  

  &::-webkit-scrollbar {
    display: none; 
  }

  -ms-overflow-style: none; 
  scrollbar-width: none;

  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
`;

const EmptyMessage = styled.div`
  width: 100%;
  padding: 16px 0;
  display: flex;                
  justify-content: center;      
  align-items: center;          
  text-align: center;          
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
`;
