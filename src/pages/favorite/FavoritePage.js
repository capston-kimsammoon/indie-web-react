// src/pages/favorite/FavoritePage.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
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

const SIZE = 20;

export default function FavoritePage() {
  const [selectedTab, setSelectedTab] = useState('performance'); // 'performance' | 'artist'
  const authToken = localStorage.getItem('accessToken');

  // 공연
  const [perfList, setPerfList] = useState([]);
  const [perfPageInfo, setPerfPageInfo] = useState({ page: 0, totalPages: 1 });
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfHasMore, setPerfHasMore] = useState(true);

  // 아티스트
  const [artistList, setArtistList] = useState([]);
  const [artistPageInfo, setArtistPageInfo] = useState({ page: 0, totalPages: 1 });
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistHasMore, setArtistHasMore] = useState(true);

  const scrollRef = useRef(null);

  const canLoadMore = (info) => info.page < info.totalPages;

  // 초기 로드
  useEffect(() => {
    // 공연 1페이지
    (async () => {
      try {
        setPerfLoading(true);
        const res = await fetchLikedPerformances(1, SIZE, authToken);
        setPerfList(res.performances ?? []);
        setPerfPageInfo({ page: res.page ?? 1, totalPages: res.totalPages ?? 1 });
        setPerfHasMore((res.page ?? 1) < (res.totalPages ?? 1));
      } catch (e) {
        console.error('📛 찜 공연 로딩 실패:', e);
        setPerfHasMore(false);
      } finally {
        setPerfLoading(false);
      }
    })();
    // 아티스트 1페이지
    (async () => {
      try {
        setArtistLoading(true);
        const res = await fetchLikedArtists({ page: 1, size: SIZE, authToken });
        setArtistList(res.artists ?? []);
        setArtistPageInfo({ page: res.page ?? 1, totalPages: res.totalPages ?? 1 });
        setArtistHasMore((res.page ?? 1) < (res.totalPages ?? 1));
      } catch (e) {
        console.error('📛 찜 아티스트 로딩 실패:', e);
        setArtistHasMore(false);
      } finally {
        setArtistLoading(false);
      }
    })();
  }, [authToken]);

  // 더 불러오기 (공연)
  const loadMorePerf = useCallback(async () => {
    if (perfLoading || !canLoadMore(perfPageInfo)) return;
    setPerfLoading(true);
    try {
      const next = perfPageInfo.page + 1;
      const res = await fetchLikedPerformances(next, SIZE, authToken);
      const items = res.performances ?? [];
      setPerfList((prev) => [...prev, ...items]);
      const page = res.page ?? next;
      const total = res.totalPages ?? perfPageInfo.totalPages;
      setPerfPageInfo({ page, totalPages: total });
      setPerfHasMore(page < total);
    } catch (e) {
      console.error('📛 찜 공연 추가 로딩 실패:', e);
      setPerfHasMore(false);
    } finally {
      setPerfLoading(false);
    }
  }, [authToken, perfLoading, perfPageInfo]);

  // 더 불러오기 (아티스트)
  const loadMoreArtist = useCallback(async () => {
    if (artistLoading || !canLoadMore(artistPageInfo)) return;
    setArtistLoading(true);
    try {
      const next = artistPageInfo.page + 1;
      const res = await fetchLikedArtists({ page: next, size: SIZE, authToken });
      const items = res.artists ?? [];
      setArtistList((prev) => [...prev, ...items]);
      const page = res.page ?? next;
      const total = res.totalPages ?? artistPageInfo.totalPages;
      setArtistPageInfo({ page, totalPages: total });
      setArtistHasMore(page < total);
    } catch (e) {
      console.error('📛 찜 아티스트 추가 로딩 실패:', e);
      setArtistHasMore(false);
    } finally {
      setArtistLoading(false);
    }
  }, [authToken, artistLoading, artistPageInfo]);

  // 스크롤 하단 근접 시 더 로드
  const onScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120; // 임계치
    if (!nearBottom) return;
    if (selectedTab === 'performance') {
      if (!perfLoading && perfHasMore) loadMorePerf();
    } else {
      if (!artistLoading && artistHasMore) loadMoreArtist();
    }
  };

  // 탭 전환 시 스크롤 상단으로
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedTab]);

  // 공연 찜 토글
  const togglePerformanceLike = async (id, isLiked) => {
    try {
      if (isLiked) {
        await unlikePerformance(id, authToken);
        setPerfList((prev) => prev.filter((p) => p.id !== id));
      } else {
        await likePerformance(id, authToken);
      }
    } catch (e) {
      console.error('공연 찜 토글 실패:', e);
    }
  };

  const toggleArtistLike = async (id, isLiked) => {
    try {
      if (isLiked) {
        await unlikeArtist(id, authToken);
        setArtistList((prev) => prev.filter((a) => a.id !== id));
      } else {
        await likeArtist(id, authToken);
      }
    } catch (e) {
      console.error('아티스트 찜 토글 실패:', e);
    }
  };

  // 아티스트 알림 토글
  const toggleArtistAlarm = async (id, enabled) => {
    try {
      if (enabled) await cancelArtistAlert(id, authToken);
      else await registerArtistAlert(id, authToken);
      setArtistList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isAlarmEnabled: !enabled } : a))
      );
    } catch (e) {
      console.error('아티스트 알림 토글 실패:', e);
    }
  };

  return (
    <PageWrapper>
      <Header title="찜 리스트" />
      <div style={{ height: '16px' }} />

      <TabRow>
        <TabButton
          active={selectedTab === 'performance'}
          onClick={() => setSelectedTab('performance')}
        >
          공연
        </TabButton>
        <TabButton
          active={selectedTab === 'artist'}
          onClick={() => setSelectedTab('artist')}
        >
          아티스트
        </TabButton>
      </TabRow>

      <ScrollableList ref={scrollRef} onScroll={onScroll}>
        <List>
          {selectedTab === 'performance' ? (
            <>
          <ListSection>
            {perfList.length ? (
              perfList.map((performance) => (
                <PerformanceListCard
                  key={performance.id}
                  performance={performance}
                  onToggleLike={(id) =>
                    togglePerformanceLike(id, performance.isLiked ?? true)
                  }
                />
              ))
            ) : (
              !perfLoading && <Empty>찜한 공연이 없습니다.</Empty>
            )}
          </ListSection>

          {perfLoading && perfHasMore && <Loading>더 불러오는 중…</Loading>}
          {!perfHasMore && perfList.length > 0 && <End>마지막입니다.</End>}
        </>
      ) : (
        <>
          <ListSection>
            {artistList.length ? (
              artistList.map((artist) => (
                <ArtistListCard
                  key={artist.id}
                  artist={artist}
                  onToggleLike={(id) => toggleArtistLike(id, artist.isLiked ?? true)}
                  onToggleAlarm={(id, enabled) => toggleArtistAlarm(id, enabled)}
                />
              ))
            ) : (
              !artistLoading && <Empty>찜한 아티스트가 없습니다.</Empty>
            )}
          </ListSection>

          {artistLoading && artistHasMore && <Loading>더 불러오는 중…</Loading>}
          {!artistHasMore && artistList.length > 0 && <End>마지막입니다.</End>}
        </>
      )}
    </List>
    </ScrollableList>
    </PageWrapper>
  );
}

const ListSection = styled.div`
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px; 
`;

const Loading = styled.div`
  padding: 16px;
  color: ${({ theme }) => theme.colors.darkGray};
  text-align: center;
`;

const End = styled(Loading)``;

const TabRow = styled.div`
  padding-bottom: 12px;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineGray};
  min-height: 32px;
  max-height: 32px;
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
  padding-top: ${({ padded }) => (padded ? '16px' : '0')};
`;

const Empty = styled.div`
  padding: 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;    
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
`;

const ScrollableList = styled.div`
  flex: 1; 
  overflow-y: auto;
  padding-bottom: 109px;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

