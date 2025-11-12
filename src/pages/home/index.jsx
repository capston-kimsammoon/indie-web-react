import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import TodayConcertCarousel from '../../components/performance/TodayConcertCarousel';
import NewConcertList from '../../components/performance/NewConcertList';
import TicketOpenList from '../../components/performance/TicketOpenList';
import { useNavigate } from 'react-router-dom';
import modieHeaderLogo from '../../assets/icons/modie_header.png';
import Header from '../../components/layout/Header';

import BannerMBTI from './Banner_MBTI.png';
import PickCard from '../../components/performance/Pick/PickCard';
import MusicCard from '../../components/musicmag/MusicCard';
import MoodSection from '../../components/performance/mood/MoodSection';
import PopularConcertList from '../../components/performance/popular/PopularConcertList';
import HomeNaviBar from '../../components/home_navibar/HomeNaviBar';
import axios from 'axios';
import { baseUrl } from '../../api/config';
import { fetchMagazineList, fetchMagazineDetail } from '../../api/magazineApi';
import { fetchMusicMagazineList, fetchMusicMagazineDetail } from '../../api/musicMagazineApi';

import {
  fetchTodayPerformances,
  fetchRecentPerformances,
  fetchTicketOpeningPerformances,
  fetchPopularPerformances,
} from '../../api/performanceApi';

const HomePage = () => {
  const navigate = useNavigate();
  const carouselRef = useRef();

  const [todayPerformances, setTodayPerformances] = useState([]);
  const [recentPerformances, setRecentPerformances] = useState([]);
  const [ticketOpenPerformances, setTicketOpenPerformances] = useState([]);
  const [popularPerformances, setPopularPerformances] = useState([]);
  const [pickItem, setPickItem] = useState(null);
  const [musicMagazine, setMusicMagazine] = useState(null);
  const fetchedRef = useRef(false);

  const now = new Date();
  const todayStr = `${now.getMonth() + 1}월 ${now.getDate()}일 공연`;
  const handleGoNext = () => {
    if (carouselRef.current) carouselRef.current.slickNext();
  };

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

  const fetchRecentFallback = async (limit) => {
    const res = await axios.get(`${baseUrl}/performance/home/recent`, {
      params: { limit },
    });
    return toArray(res.data);
  };

  const fetchTicketOpeningFallback = async (startDate, endDate) => {
    const res = await axios.get(`${baseUrl}/performance/home/ticket-opening`, {
      params: { startDate, endDate, start_date: startDate, end_date: endDate },
    });
    return toArray(res.data);
  };

  const PICK_FALLBACK = {
    id: 1,
    title: '"인디의 모든 순간을 한눈에" — 공연부터 예매까지, 인디 플랫폼 Modie의 등장',
    content: `(서울, 2025년) — "공연 정보를 찾으려면 인스타그램을 뒤지고, 티켓 예매는 또 다른 사이트에서 해야 했던" 인디 팬들의 불편함을 없애줄 플랫폼이 등장했다.  
독립음악 전용 데이터 플랫폼 **Modie (modie.com)** 은 흩어진 인디 공연 정보를 한곳에 모아주는 신개념 서비스다.`,
    imageUrl: 'https://i.ibb.co/VYNPQ5XL/image.png',
    author: 'Modie 관리자',
    createdAt: '2025-10-15',
  };

  const MUSIC_MAGAZINE_FALLBACK = {
    id: 1,
    title: '이달의 음악 매거진',
    text: '최신 인디 음악 트렌드와 아티스트 인터뷰를 만나보세요.',
    coverImageUrl: 'https://i.ibb.co/VYNPQ5XL/image.png',
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const loadHomeData = async () => {
      try {
        const { today, sevenDaysLater } = getDateRange();

        // 1) 오늘 공연
        const todayData = await fetchTodayPerformances();

        // 2) NEW 업로드
        let recentData = await fetchRecentPerformances(6);
        if (toArray(recentData).length === 0) {
          recentData = await fetchRecentFallback(6);
        }

        // 3) 티켓 오픈 예정
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

        // 4) 인기 많은 공연
        const popularData = await fetchPopularPerformances(6);

        setTodayPerformances(toArray(todayData).map(normalizePerf));
        setRecentPerformances(toArray(recentData).map(normalizePerf));
        setTicketOpenPerformances(toArray(ticketOpeningData));
        setPopularPerformances(toArray(popularData).map(normalizePerf));

        // 5) [PICK] 매거진 최신 1건
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
            setPickItem(PICK_FALLBACK);
          }
        } catch (err) {
          console.warn('[HomePage] 매거진 로딩 실패(폴백 사용):', err);
          setPickItem(PICK_FALLBACK);
        }

        // 6) [음악 매거진] 최신 1건
        try {
          const musicMags = await fetchMusicMagazineList({ limit: 1 });
          const arr = toArray(musicMags);
          
          if (arr.length > 0) {
            const first = arr[0];
            
            setMusicMagazine({
              id: first.id,
              title: first.title ?? '',
              text: first.excerpt ?? first.summary ?? '',
              coverImageUrl: first.coverImageUrl ?? first.cover_image_url ?? null,
            });
          } else {
            setMusicMagazine(MUSIC_MAGAZINE_FALLBACK);
          }
        } catch (err) {
          setMusicMagazine(MUSIC_MAGAZINE_FALLBACK);
        }

    } catch (err) {
      console.error('📛 홈 API 호출 중 오류 발생:', err);
    }
  };

  loadHomeData();
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

        <Banner onClick={() => navigate('/test/mbti')}>
          <img src={BannerMBTI} alt="모더지 공연 MBTI 테스트" />
        </Banner>

        <SurveyButton 
          style={{ marginBottom: "40px" }}
          onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSeJvWeIGEMKfXN1-7vMDrZ3f43aREMs_GBN5Xl5QJF2mtlP7A/viewform?usp=dialog', '_blank')}>
          ▶  만족도 조사 설문 부탁드립니다 ! 추첨으로 커피 기프티콘 증정  ◀
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

        <DivideSectionBack />

        {pickItem && (
          <>
            <SectionHeader>
              <span>모디 Pick 공연</span>
              <MoreButton onClick={() => navigate('/picks')}>
                ›
              </MoreButton>
            </SectionHeader>
            <PickCard
              id={pickItem.id}
              title={pickItem.title}
              content={pickItem.content}
              imageUrl={pickItem.imageUrl}
              onClick={() => navigate(`/pick/${pickItem.id}`, { state: pickItem })}
            />
          </>
        )}

        {musicMagazine && (
          <>
            <SectionHeader>
              <span>모디의 디깅</span>
              <MoreButton onClick={() => navigate('/musicmagazines')}>
                ›
              </MoreButton>
            </SectionHeader>
            <MusicCard
              id={musicMagazine.id}
              title={musicMagazine.title}
              text={musicMagazine.text}
              coverImageUrl={musicMagazine.coverImageUrl}
              onClick={() => navigate(`/musicmagazine/${musicMagazine.id}`)}
            />
          </>
        )}
      
        <DivideSectionBack style={{ marginTop: "-20px;", marginBottom: "32px" }} />

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
  margin: 4px 0 52px 0;
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

const DivideSectionBack = styled.section`
  background-color: #F7F7F8;
  margin-top: -20px;
  margin-left: -16px;
  margin-right: -16px;
  margin-bottom: 32px;
  padding-top: 8px;
`;

const SectionTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};            
  font-weight: ${({ theme }) => theme.fontWeights.regular};        
  margin: 0 0 20px 0;   
  text-align: center;       
  cursor: default;           
  color: ${({ theme }) => theme.colors.darkblack};
  flex: 1;
`;

const Banner = styled.div`
  height: 48px;
  background-color: #FFF5E1;
  color: ${({ theme }) => theme.colors.darkblack};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  padding: 12px 16px;
  text-align: center;
  cursor: pointer;
  margin: 32px -16px 8px -16px; 
  overflow: hidden;
  display: flex;         
  align-items: center;     
  justify-content: center;

  img {
    height: 170%;
    width: auto;
    object-fit: cover;
    object-position: center;
  }
`;

const SurveyButton = styled.div`
  padding: 0 0; 
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

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  gap: 8px;
  
  span {
    font-size: ${({ theme }) => theme.fontSizes.lg};            
    font-weight: ${({ theme }) => theme.fontWeights.regular};           
    color: ${({ theme }) => theme.colors.darkblack};
  }
`;

const MoreButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-top: -4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes.xl};            
  color: ${({ theme }) => theme.colors.lightGray}; 
  font-weight: ${({ theme }) => theme.fontWeights.light};           
  line-height: 1;
  
  &:active {
    opacity: 0.7;
  }
`;
