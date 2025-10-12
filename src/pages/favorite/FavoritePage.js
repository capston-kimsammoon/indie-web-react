// src/pages/favorite/FavoritePage.jsx
import React, { useEffect, useState } from 'react';
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
  const [selectedTab, setSelectedTab] = useState('performance'); // 'performance' | 'artist'

  // 공연/아티스트 각각 응답 배열로 상태 분리
  const [perfList, setPerfList] = useState([]);
  const [perfPageInfo, setPerfPageInfo] = useState({ page: 1, totalPages: 1 });

  const [artistList, setArtistList] = useState([]);
  const [artistPageInfo, setArtistPageInfo] = useState({
    page: 1,
    totalPages: 1,
  });

  const authToken = localStorage.getItem('accessToken');

  // 찜한 공연 목록
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchLikedPerformances(1, 20, authToken);
        setPerfList(res.performances ?? []);
        setPerfPageInfo({
          page: res.page ?? 1,
          totalPages: res.totalPages ?? 1,
        });
      } catch (e) {
        console.error('📛 찜 공연 로딩 실패:', e);
      }
    };
    load();
  }, [authToken]);

  // 찜한 아티스트 목록
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchLikedArtists({ page: 1, size: 20, authToken });
        setArtistList(res.artists ?? []);
        setArtistPageInfo({
          page: res.page ?? 1,
          totalPages: res.totalPages ?? 1,
        });
      } catch (e) {
        console.error('📛 찜 아티스트 로딩 실패:', e);
      }
    };
    load();
  }, [authToken]);

  // 공연 찜 토글
  const togglePerformanceLike = async (id, isLiked) => {
    try {
      if (isLiked) {
        await unlikePerformance(id, authToken);
        setPerfList((prev) => prev.filter((p) => p.id !== id)); // 언라이크 → 목록 제거
      } else {
        await likePerformance(id, authToken);
        // 필요 시 재조회
        // const res = await fetchLikedPerformances(perfPageInfo.page, 20, authToken);
        // setPerfList(res.performances ?? []);
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
        // 필요 시 재조회
        // const res = await fetchLikedArtists({ page: artistPageInfo.page, size: 20, authToken });
        // setArtistList(res.artists ?? []);
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

      <ScrollableList>
        <List>
          {selectedTab === 'performance' &&
            (perfList.length ? (
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
              <Empty>찜한 공연이 없습니다.</Empty>
            ))}

          {selectedTab === 'artist' &&
            (artistList.length ? (
              artistList.map((artist) => (
                <ArtistListCard
                  key={artist.id}
                  artist={artist}
                  onToggleLike={(id) =>
                    toggleArtistLike(id, artist.isLiked ?? true)
                  }
                  onToggleAlarm={(id, enabled) => toggleArtistAlarm(id, enabled)}
                />
              ))
            ) : (
              <Empty>찜한 아티스트가 없습니다.</Empty>
            ))}
        </List>
      </ScrollableList>
    </PageWrapper>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const TabRow = styled.div`
  display: flex;
  justify-content: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineGray};
  margin-bottom: 0.5rem;
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
