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

export default function FavoritePage() {
  const [selectedTab, setSelectedTab] = useState('performance');
  const authToken = localStorage.getItem('accessToken');

  // 공연 상태
  const [perfList, setPerfList] = useState([]);
  const [perfPage, setPerfPage] = useState(1);
  const [perfHasMore, setPerfHasMore] = useState(true);
  const [perfLoading, setPerfLoading] = useState(false);
  const perfSentinelRef = useRef(null);

  // 아티스트 상태
  const [artistList, setArtistList] = useState([]);
  const [artistPage, setArtistPage] = useState(1);
  const [artistHasMore, setArtistHasMore] = useState(true);
  const [artistLoading, setArtistLoading] = useState(false);
  const artistSentinelRef = useRef(null);

  const size = 30;

  // 공연 로드
  const loadPerformances = useCallback(async (pageNum) => {
    if (perfLoading) return;
    setPerfLoading(true);
    try {
      const res = await fetchLikedPerformances(pageNum, size, authToken);
      const newPerfs = res.performances ?? [];

      if (pageNum === 1) {
        setPerfList(newPerfs);
      } else {
        setPerfList(prev => [...prev, ...newPerfs]);
      }

      setPerfPage(pageNum + 1);
      setPerfHasMore(newPerfs.length >= size);
    } catch (e) {
      console.error('공연 로딩 실패:', e);
      if (pageNum === 1) {
        setPerfList([]);
      }
    } finally {
      setPerfLoading(false);
    }
  }, [authToken, perfLoading, size]);

  // 아티스트 로드
  const loadArtists = useCallback(async (pageNum) => {
    if (artistLoading) return;
    setArtistLoading(true);
    try {
      const res = await fetchLikedArtists({ page: pageNum, size, authToken });
      const newArtists = res.artists ?? [];

      if (pageNum === 1) {
        setArtistList(newArtists);
      } else {
        setArtistList(prev => [...prev, ...newArtists]);
      }

      setArtistPage(pageNum + 1);
      setArtistHasMore(newArtists.length >= size);
    } catch (e) {
      console.error('아티스트 로딩 실패:', e);
      if (pageNum === 1) {
        setArtistList([]);
      }
    } finally {
      setArtistLoading(false);
    }
  }, [authToken, artistLoading, size]);

  // 초기 로드
  useEffect(() => {
    setPerfPage(1);
    setPerfHasMore(true);
    loadPerformances(1);
  }, []);

  useEffect(() => {
    setArtistPage(1);
    setArtistHasMore(true);
    loadArtists(1);
  }, []);

  // 공연 무한 스크롤
  useEffect(() => {
    const el = perfSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && perfHasMore && !perfLoading) {
          loadPerformances(perfPage);
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [perfPage, perfHasMore, perfLoading, loadPerformances]);

  // 아티스트 무한 스크롤
  useEffect(() => {
    const el = artistSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && artistHasMore && !artistLoading) {
          loadArtists(artistPage);
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [artistPage, artistHasMore, artistLoading, loadArtists]);

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

  // 아티스트 찜 토글
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
    
      <ScrollableList>
        <FavoriteSection>
          {selectedTab === 'performance' ? (
            perfList.length ? (
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
                {perfHasMore && <Loader ref={perfSentinelRef}>더 불러오는 중...</Loader>}
                {!perfHasMore && <EndMessage>마지막 공연입니다.</EndMessage>}
              </>
            ) : (
              <Empty>찜한 공연이 없습니다.</Empty>
            )
          ) : artistList.length ? (
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
              {artistHasMore && <Loader ref={artistSentinelRef}>더 불러오는 중...</Loader>}
              {!artistHasMore && <EndMessage>마지막 아티스트입니다.</EndMessage>}
            </>
          ) : (
            <Empty>찜한 아티스트가 없습니다.</Empty>
          )}
        </FavoriteSection>
      </ScrollableList>
    </PageWrapper>
  );
}

const TabRow = styled.div`
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
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;
  margin-top: 32px;    
`;

const SectionInner = styled.div`
  padding-top: 16px;
  margin-bottom: 24px;

  h3 {
    margin-bottom: 8px;
  }
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;  /* 전체 화면 채우기 */
  height: 100dvh; /* 모바일 대응 */
  overflow: hidden; /* 스크롤 영역은 아래에서만 */
`;

const ScrollableList = styled.div`
  flex: 1; /* Header와 Tab을 제외한 나머지 영역 모두 차지 */
  overflow-y: auto;
  padding-bottom: 109px; /* 하단바 여백 */
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const FavoriteSection = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%; /* 내용이 적을 때도 영역 안정화 */
  padding-top: 16px; /* 탭 아래 여백 */
`;

const Loader = styled.div`
  padding: 16px 0;
  text-align: center;
  color: ${({ theme }) => theme.colors?.darkGray || '#666'};
  font-size: ${({ theme }) => theme.fontSizes?.sm || '14px'};
`;

const EndMessage = styled.div`
  padding: ${({ noTopPadding }) => (noTopPadding ? '0 0 16px 0' : '16px 0')};
  text-align: center;
  color: ${({ theme }) => theme.colors?.darkGray || '#666'};
  font-size: ${({ theme }) => theme.fontSizes?.sm || '14px'};
`;
