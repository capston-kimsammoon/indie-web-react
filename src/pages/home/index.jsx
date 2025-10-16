import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import TodayConcertCarousel from '../../components/performance/TodayConcertCarousel';
import NewConcertList from '../../components/performance/NewConcertList';
import TicketOpenList from '../../components/performance/TicketOpenList';
import styles from './home.module.css';
// import iconCalendar from '../../assets/icons/icon_calendar_hyunjin.svg'; // [DISABLED] 캘린더 아이콘 임포트 (렌더 비활성화)
import Sidebar from '../../components/sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import modieHeaderLogo from '../../assets/icons/modie_header.png';
import Header from '../../components/layout/Header';
import { ReactComponent as IconWeb } from '../../assets/icons/icon_heart_outline.svg';   // ← 좌측 웹아이콘(임시)
import { ReactComponent as IconSearch } from '../../assets/icons/icon_y_search.svg';      // ← 검색
import { ReactComponent as IconNotify } from '../../assets/icons/icon_notify_on.svg';     // ← 알림
import modieIcon from '../../assets/icons/modie_icon.png';

import PickCard from '../../components/performance/Pick/PickCard';
import MoodSection from '../../components/performance/mood/MoodSection';
import PopularConcertList from '../../components/performance/popular/PopularConcertList';
import HomeNaviBar from '../../components/home_navibar/HomeNaviBar';
import axios from 'axios';
import { baseUrl } from '../../api/config';
import { fetchMagazineList } from '../../api/magazineApi';
import {
  fetchTodayPerformances,
  fetchRecentPerformances,
  fetchTicketOpeningPerformances,
  fetchPopularPerformances,
} from '../../api/performanceApi';

const HomePage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const carouselRef = useRef();

  const [todayPerformances, setTodayPerformances] = useState([]);
  const [recentPerformances, setRecentPerformances] = useState([]);
  const [ticketOpenPerformances, setTicketOpenPerformances] = useState([]);
  const [popularPerformances, setPopularPerformances] = useState([]);
  const [pickItem, setPickItem] = useState(null);
  const fetchedRef = useRef(false);

  const now = new Date();
  const todayStr = `${now.getMonth() + 1}월 ${now.getDate()}일 공연`;
  const handleGoNext = () => {
    if (carouselRef.current) carouselRef.current.slickNext();
  };

  // ---- 날짜 로컬(KST) 기준으로 계산 (UTC 밀림 방지)
  const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
  const formatLocalYMD = (d) => {
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${y}-${m}-${day}`;
  };
  const getDateRange = () => {
    const now = new Date();
    const today = formatLocalYMD(now);
    const sevenDaysLater = formatLocalYMD(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
    );
    return { today, sevenDaysLater };
  };

  // ---- 배열 정규화 유틸 (홈 내부 전용)
  const toArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      return (
        data.items ||
        data.performances ||
        data.results ||
        data.list ||
        data.data ||
        []
      );
    }
    return [];
  };

  // ✅ 공통 스키마로 표준화 (섹션 컴포넌트가 posterUrl/venue/date만 읽어도 동작)
  const normalizePerf = (p) => ({
    ...p,
    posterUrl:
      p?.posterUrl ||
      p?.image_url ||
      p?.thumbnail ||
      p?.poster_url ||
      p?.poster ||
      null,
    venue: p?.venue || p?.venue_name || p?.place || (p?.venue?.name ?? ''),
    date: p?.date || p?.performance_date || p?.start_date || p?.show_date || '',
  });

  // ---- 폴백 요청: API가 0건 줄 때만 직접 호출해서 items 등도 수용
  const fetchRecentFallback = async (limit) => {
    const res = await axios.get(`${baseUrl}/performance/home/recent`, {
      params: { limit },
    });
    return toArray(res.data);
  };

  const fetchTicketOpeningFallback = async (startDate, endDate) => {
    const res = await axios.get(`${baseUrl}/performance/home/ticket-opening`, {
      // 서버가 snake/camel 어느 쪽을 받든 걸리게 둘 다 보냄
      params: { startDate, endDate, start_date: startDate, end_date: endDate },
    });
    return toArray(res.data);
  };

  // ✅ [PICK] 더미 폴백 (API가 비었을 때만 사용)
  const PICK_FALLBACK = {
    id: 1,
    title: '“인디의 모든 순간을 한눈에” — 공연부터 예매까지, 인디 플랫폼 Modie의 등장',
  
    content: `
(서울, 2025년) — “공연 정보를 찾으려면 인스타그램을 뒤지고, 티켓 예매는 또 다른 사이트에서 해야 했던” 인디 팬들의 불편함을 없애줄 플랫폼이 등장했다.  
독립음악 전용 데이터 플랫폼 **Modie (modie.com)** 은 흩어진 인디 공연 정보를 한곳에 모아주는 신개념 서비스다.  
Modie는 단순한 공연 정보 모음 사이트가 아니다. 운영팀이 직접 공연장·아티스트의 데이터를 수집하고 정제해, 사용자가 손쉽게 인디 공연 정보를 탐색할 수 있도록 만든다.  

> “원래 인디 공연 정보를 얻으려면 인스타그램에서 공연장 계정을 하나하나 찾아봐야 했죠.  
> 우리는 그 과정을 완전히 없앴습니다.”  
> — Modie 개발팀 인터뷰 중  

이 말처럼, Modie는 전국의 공연장, 아티스트, 티켓 판매 링크, 가격, 날짜 정보를 직접 크롤링·정리하여 제공한다.  
덕분에 사용자는 검색 한 번으로 **공연 일정**, **예매 링크**, **Spotify 아티스트 페이지**, **포스터 이미지**까지 한눈에 확인할 수 있다.  

**“오늘 뭐 볼까?” — 날짜별 공연 캘린더**  

Modie의 핵심 기능 중 하나는 **‘공연 캘린더(Calendar)’**다.  
매일, 매주 어떤 공연이 열리는지 직관적인 달력 인터페이스로 보여주며, 사용자는 클릭 한 번으로 세부 정보를 바로 열람할 수 있다.  
뿐만 아니라 **“예매 임박순”**, **“가장 인기 있는 공연”**, **“오늘 열리는 공연”** 등으로 자동 정렬되어, 지금 당장 볼 수 있는 공연을 손쉽게 찾을 수 있다.  

 **“오늘의 무드에 맞는 공연 추천”**  

Modie는 단순한 정보 집계 사이트를 넘어, **공연 무드 기반 추천 시스템**을 제공한다.  
‘따뜻한’, ‘신나는’, ‘몽환적인’ 등 감정 키워드에 따라 어울리는 공연을 추천해주며,  
사용자는 기분이나 날씨에 맞는 공연을 쉽게 발견할 수 있다.  

이러한 기능은 단순한 데이터 필터링이 아닌, **Modie가 자체적으로 구축한 공연 분위기 태깅 시스템**을 기반으로 작동한다.  
덕분에 사용자 경험은 “공연 정보 검색”이 아닌 “취향 맞춤 탐색”에 가까워진다.  

 **아티스트 중심, 팬 중심**  

Modie는 인디 씬의 중심을 ‘사람’—아티스트와 팬—으로 되돌리는 것을 목표로 한다.  
플랫폼에는 각 아티스트의 **Spotify 링크**, **Instagram 계정**, **공연 이력**, **사진**이 정리되어 있으며,  
팬은 Modie를 통해 새로운 아티스트를 발견하고 즉시 예매로 연결할 수 있다.  
`,

imageUrl: 'https://i.ibb.co/VYNPQ5XL/image.png',
    author: 'Modie 관리자',
    createdAt: '2025-10-15',
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const loadHomeData = async () => {
      try {
        const { today, sevenDaysLater } = getDateRange();

        // 1) 오늘 공연
        const todayData = await fetchTodayPerformances();

        // 2) NEW 업로드 (API 우선, 비면 폴백)
        let recentData = await fetchRecentPerformances(6);
        if (toArray(recentData).length === 0) {
          recentData = await fetchRecentFallback(6);
        }

        // 3) 티켓 오픈 예정 (API 우선, 비면 폴백)
        let ticketOpeningData = await fetchTicketOpeningPerformances(
          today,
          sevenDaysLater
        );
        if (toArray(ticketOpeningData).length === 0) {
          ticketOpeningData = await fetchTicketOpeningFallback(
            today,
            sevenDaysLater
          );
        }

        // ✅ 4) 인기 많은 공연 (6개)
        const popularData = await fetchPopularPerformances(6);

        // ✅ 여기서만 표준화해서 섹션에 내려줌
        setTodayPerformances(toArray(todayData).map(normalizePerf));
        setRecentPerformances(toArray(recentData).map(normalizePerf));
        setTicketOpenPerformances(toArray(ticketOpeningData));
        setPopularPerformances(toArray(popularData).map(normalizePerf));

        // ✅ [PICK] 매거진 최신 1건 로드 (빈 배열이면 더미 사용)
        try {
          const magazines = await fetchMagazineList({ limit: 1 });
          const arr = toArray(magazines);
          if (arr.length > 0) {
            const first = arr[0];
            setPickItem({
              id: first.id,
              title: first.title ?? '',
              content: first.excerpt ?? '',
              imageUrl:
                first.coverImageUrl ??
                first.cover_image_url ??
                first.image_url ??
                null,
              author: first.author ?? '관리자',
              createdAt: first.createdAt ?? null,
            });
          } else {
            setPickItem(PICK_FALLBACK); // ✅ 폴백
          }
        } catch (err) {
          console.warn('[HomePage] 매거진 로딩 실패(폴백 사용):', err);
          setPickItem(PICK_FALLBACK); // ✅ 폴백
        }
      } catch (err) {
        console.error('📛 홈 API 호출 중 오류 발생:', err);
      }
    };

    loadHomeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <HeaderWrapper>
        <Header logoSrc={modieHeaderLogo} />
      </HeaderWrapper>
      <div style={{ height: "16px" }} />

      <ScrollableContent>
        <TodaySection>
          <TodayTitle>{todayStr}</TodayTitle>
          <FullWidthSection>
            <TodayConcertCarousel
              ref={carouselRef}
              performances={todayPerformances}
              onClickPerformance={(id) => navigate(`/performance/${id}`)}
            />
          </FullWidthSection>
        </TodaySection>

        <HomeNaviBar
          routes={{
            performance: '/performance',
            venues: '/venue',
            artists: '/artist',
            review: '/venue/reviews/all'
          }}
        />

        <SurveyButton onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSeJvWeIGEMKfXN1-7vMDrZ3f43aREMs_GBN5Xl5QJF2mtlP7A/viewform?usp=dialog', '_blank')}>
          ▶  만족도 조사 설문 부탁드립니다 ! 추첨으로 커피 기프티콘 증정 !
        </SurveyButton>

        <FullWidthSectionBack>
          <SectionTitle>인기 많은 공연</SectionTitle>
          <PopularConcertList performances={popularPerformances} />

          <SectionTitle>NEW 업로드</SectionTitle>
          <NewConcertList performances={recentPerformances} />
        </FullWidthSectionBack>

        <FullWidthSection>
          <SectionTitle>티켓 오픈 예정</SectionTitle>
          <TicketOpenList performances={ticketOpenPerformances} />
        </FullWidthSection>
        {pickItem && (
          <>
            <SectionTitle>modie 추천공연</SectionTitle>
            <PickCard
              id={pickItem.id}
              title={pickItem.title}
              content={pickItem.content}
              imageUrl={pickItem.imageUrl}
              onClick={() => navigate(`/pick/${pickItem.id}`, { state: pickItem })}
            />
          </>
        )}

        <FullWidthSection>
          <SectionTitle>키워드별 공연</SectionTitle>
          <MoodSection />
        </FullWidthSection>
      </ScrollableContent>
    </>
  );
};

export default HomePage;

const HeaderWrapper = styled.div`
  img {
    height: 18px !important;
    width: auto;
  }
`;

const ScrollableContent = styled.div`
  height: calc(100dvh - 56px); 
  overflow-y: auto;
  padding: 0 16px; 
  margin: 0 -16px; 
  
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

const TodayTitle = styled.div`
  margin-top: 17px;
  margin-left: 16px;
  font-size: ${({ theme }) => theme.fontSizes.lg}; 
  font-weight: ${({ theme }) => theme.fontWeights.semibold};  
  color: ${({ theme }) => theme.colors.darkblack}; 
`;

const TodaySection = styled.section`
  margin: 4px 0 52px 0; // 8px
  display: flow-root;
`;

const FullWidthSection = styled.section`
  margin-left: -16px;
  margin-right: -16px;
`;

const FullWidthSectionBack = styled.section`
  background-color: #F7F7F8;
  margin-left: -16px;
  margin-right: -16px;
  margin-top: 20px;
  margin-bottom: 32px;
  padding: 32px 0 8px 0;
`;

const SectionTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};            
  font-weight: ${({ theme }) => theme.fontWeights.regular};        
  margin: 0 0 20px 0;   
  text-align: center;       
  cursor: default;           
  color: ${({ theme }) => theme.colors.darkblack};
`;

const SurveyButton = styled.div`
  padding: 16px 16px; 
  font-size: ${({ theme }) => theme.fontSizes.xs}; 
  font-weight: ${({ theme }) => theme.fontWeights.regular}; 
  color: ${({ theme }) => theme.colors.lightGray}; 
  display: flex; 
  justify-content: center; 
  align-items: center;
  cursor: pointer;
  text-decoration: underline;  
  margin: 16px;
`;

