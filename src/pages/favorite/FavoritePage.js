// src/pages/favorite/FavoritePage.jsx
import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import PerformanceListCard from '../../components/performance/PerformanceListCard';
import ArtistListCard from '../../components/artist/ArtistListCard';
import {
  fetchLikedPerformances,
  fetchLikedArtists,
  likePerformance,
  unlikePerformance,
  likeArtist,
  unlikeArtist,
  registerArtistAlert,
  cancelArtistAlert,
} from '../../api/likeApi';

const PAGE_SIZE = 20;

export default function FavoritePage() {
  const [selectedTab, setSelectedTab] = useState('performance'); // 'performance' | 'artist'
  const authToken = localStorage.getItem('accessToken');

  // 공연/아티스트 각각 응답 배열로 상태 분리
  const [perfList, setPerfList] = useState([]);
  const [perfPageInfo, setPerfPageInfo] = useState({ page: 1, totalPages: 1 });
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfHasMore, setPerfHasMore] = useState(true);

  const [artistList, setArtistList] = useState([]);
  const [artistPageInfo, setArtistPageInfo] = useState({ page: 1, totalPages: 1 });
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistHasMore, setArtistHasMore] = useState(true);

  const scrollRef = useRef(null);

  /* ---------- 공통: 더 로드 가능 여부 ---------- */
  const canLoadMoreByPage = (info) => (info?.page ?? 1) < (info?.totalPages ?? 1);

  /* ---------- 초기 로드: 공연 ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        setPerfLoading(true);
        const res = await fetchLikedPerformances(1, PAGE_SIZE, authToken);
        const items = res.performances ?? [];
        setPerfList(items);
        const page = res.page ?? 1;
        const totalPages = res.totalPages ?? 1;
        setPerfPageInfo({ page, totalPages });
        // totalPages 가 없다면 길이로 판정
        setPerfHasMore(totalPages > 1 || items.length === PAGE_SIZE);
      } catch (e) {
        console.error('📛 찜 공연 로딩 실패:', e);
        setPerfHasMore(false);
      } finally {
        setPerfLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  /* ---------- 초기 로드: 아티스트 ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        setArtistLoading(true);
        const res = await fetchLikedArtists(1, PAGE_SIZE, authToken);
        const items = res.artists ?? [];
        setArtistList(items);
        const page = res.page ?? 1;
        const totalPages = res.totalPages ?? 1;
        setArtistPageInfo({ page, totalPages });
        setArtistHasMore(totalPages > 1 || items.length === PAGE_SIZE);
      } catch (e) {
        console.error('📛 찜 아티스트 로딩 실패:', e);
        setArtistHasMore(false);
      } finally {
        setArtistLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  /* ---------- 더 불러오기: 공연 ---------- */
  const loadMorePerformances = async () => {
    if (perfLoading || !perfHasMore) return;
    setPerfLoading(true);
    try {
      const next = (perfPageInfo.page ?? 1) + 1;
      const res = await fetchLikedPerformances(next, PAGE_SIZE, authToken);
      const items = res.performances ?? [];
      setPerfList((prev) => [...prev, ...items]);

      const page = res.page ?? next;
      const totalPages = res.totalPages ?? (perfPageInfo.totalPages ?? 1);
      setPerfPageInfo({ page, totalPages });

      const hasMoreByPage = page < totalPages;
      const hasMoreByCount = items.length === PAGE_SIZE;
      setPerfHasMore(hasMoreByPage || hasMoreByCount);
    } catch (e) {
      console.error('📛 찜 공연 추가 로딩 실패:', e);
      setPerfHasMore(false);
    } finally {
      setPerfLoading(false);
    }
  };

  /* ---------- 더 불러오기: 아티스트 ---------- */
  const loadMoreArtists = async () => {
    if (artistLoading || !artistHasMore) return;
    setArtistLoading(true);
    try {
      const next = (artistPageInfo.page ?? 1) + 1;
      const res = await fetchLikedArtists(next, PAGE_SIZE, authToken);
      const items = res.artists ?? [];
      setArtistList((prev) => [...prev, ...items]);

      const page = res.page ?? next;
      const totalPages = res.totalPages ?? (artistPageInfo.totalPages ?? 1);
      setArtistPageInfo({ page, totalPages });

      const hasMoreByPage = page < totalPages;
      const hasMoreByCount = items.length === PAGE_SIZE;
      setArtistHasMore(hasMoreByPage || hasMoreByCount);
    } catch (e) {
      console.error('📛 찜 아티스트 추가 로딩 실패:', e);
      setArtistHasMore(false);
    } finally {
      setArtistLoading(false);
    }
  };

  /* ---------- 스크롤 핸들러: 하단 근접 시 다음 페이지 ---------- */
  const onScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120; // 임계치
    if (!nearBottom) return;

    if (selectedTab === 'performance') {
      if (!perfLoading && perfHasMore) loadMorePerformances();
    } else {
      if (!artistLoading && artistHasMore) loadMoreArtists();
    }
  };

  // 공연 찜 토글
  const togglePerformanceLike = async (id, isLiked) => {
    try {
      if (isLiked) {
        await unlikePerformance(id, authToken);
        setPerfList((prev) => prev.filter((p) => p.id !== id)); // 언라이크 → 목록 제거
      } else {
        await likePerformance(id, authToken);
      }
    } catch (e) {
      console.error('📛 공연 찜 토글 실패:', e);
    }
  };

  // 아티스트 찜 토글
  const toggleArtistLike = async (id, isLiked) => {
    try {
      if (isLiked) {
        await unlikeArtist(id, authToken);
        setArtistList((prev) => prev.filter((a) => a.id !== id)); // 언라이크 → 목록 제거
      } else {
        await likeArtist(id, authToken);
      }
    } catch (e) {
      console.error('📛 아티스트 찜 토글 실패:', e);
    }
  };

  // 아티스트 알림 토글 (POST/DELETE /alert)
  const toggleArtistAlarm = async (id, enabled) => {
    try {
      if (enabled) await cancelArtistAlert(id, authToken);
      else await registerArtistAlert(id, authToken);

      // 낙관적 업데이트
      setArtistList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isAlarmEnabled: !enabled } : a))
      );
    } catch (e) {
      console.error('📛 아티스트 알림 토글 실패:', e);
    }
  };

  return (
    <PageWrapper>
      <Header title="찜 리스트" />
      <div style={{ height: "16px" }} />

      <TabRow>
        <TabButton
          active={selectedTab === 'performance'}
          onClick={() => setSelectedTab('performance')}>
          공연
        </TabButton>
        <TabButton
          active={selectedTab === 'artist'}
          onClick={() => setSelectedTab('artist')}>
          아티스트
        </TabButton>
      </TabRow>

      <ScrollableList onScroll={onScroll} ref={scrollRef}>
        <FavoriteSection padded={selectedTab === 'performance'}>
          {selectedTab === 'performance' && (
            <div>
              {perfList.length ? (
                <>
                  {perfList.map((performance) => (
                    <PerformanceListCard
                      key={performance.id}
                      performance={performance}
                      onToggleLike={(id) =>
                        togglePerformanceLike(id, performance.isLiked ?? true)
                      }
                    />
                  ))}
                  {!perfHasMore && perfList.length > 0 && (
                    <Empty>마지막 공연입니다.</Empty>
                  )}
                </>
              ) : (
                !perfLoading && <Empty>찜한 공연이 없습니다.</Empty>
              )}
            </div>
          )}
      
          {selectedTab === 'artist' &&
            (artistList.length ? (
              <>
                {artistList.map((artist) => (
                  <ArtistListCard
                    key={artist.id}
                    artist={artist}
                    onToggleLike={(id) =>
                      toggleArtistLike(id, artist.isLiked ?? true)
                    }
                    onToggleAlarm={(id, enabled) =>
                      toggleArtistAlarm(id, enabled)
                    }
                  />
                ))}
                {!artistHasMore && artistList.length > 0 && (
                  <Empty>마지막 아티스트입니다.</Empty>
                )}
              </>
            ) : (
              !artistLoading && <Empty>찜한 아티스트가 없습니다.</Empty>
            ))}
        </FavoriteSection>
      </ScrollableList>
    </PageWrapper>
  );
}

/* ===== 스타일 (디자인 변경 없음) ===== */
const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const TabRow = styled.div`
  display: flex;
  justify-content: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineGray};
`;

const TabButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ active, theme }) =>
    active ? theme.colors.themeGreen : theme.colors.lightGray};
  border: none;
  border-bottom: ${({ active, theme }) =>
    active ? `1.5px solid ${theme.colors.themeGreen}` : theme.colors.lightGray};
  background-color: transparent;
  cursor: pointer;
  font-family: inherit; 
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Empty = styled.div`
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;    
`;

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

const FavoriteSection = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: ${({ padded }) => (padded ? '16px' : '0')};
`;
