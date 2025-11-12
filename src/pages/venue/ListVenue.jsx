// src/pages/venue/ListVenue.jsx
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VenueItem from './components/VenueItem';
import RegionSelectButton from './components/RegionSelectButton';
import RegionSelectSheet from './components/RegionSelectSheet';
import { useNavigate } from 'react-router-dom';
import { fetchVenueList } from '../../api/venueApi';

function ListVenue() {
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState(['전체']);
  const [venues, setVenues] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const size = 20;

  const sentinelRef = useRef(null);
  const scrollerRef = useRef(null);

  // 초기 로딩/복원 상태
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // rAF 쓰로틀 저장
  const rafSaveRef = useRef(null);
  const STORAGE_KEY = 'venueListState';

  // 상태 저장
  const saveState = useCallback(() => {
    const sc = scrollerRef.current;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        scrollTop: sc ? sc.scrollTop : 0,
        selectedRegions,
        venues,
        page,
        ts: Date.now(),
      }),
    );
  }, [selectedRegions, venues, page]);

  const handleScrollSave = () => {
    if (rafSaveRef.current) return;
    rafSaveRef.current = requestAnimationFrame(() => {
      rafSaveRef.current = null;
      saveState();
    });
  };

  // 1) 최초 마운트: 상태 복원 or 1페이지 로드
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { scrollTop = 0, selectedRegions: sr = ['전체'], venues: vs = [], page: pg = 1 } = JSON.parse(saved);
        setSelectedRegions(sr);
        setVenues(vs);
        setPage(pg);
        // DOM 그려진 뒤 컨테이너 스크롤 복원
        requestAnimationFrame(() => {
          const sc = scrollerRef.current;
          if (sc) sc.scrollTop = scrollTop;
        });
      } catch {
        // 복원 실패 시 초기 로드로 폴백
        (async () => {
          await loadVenues(1);
        })();
      } finally {
        setIsInitialLoad(false);
      }
    } else {
      (async () => {
        await loadVenues(1);
        setIsInitialLoad(false);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) API 호출
  const loadVenues = useCallback(
    async (pageNum) => {
      if (loading) return;
      setLoading(true);
      try {
        const regionParam = selectedRegions.includes('전체') ? undefined : selectedRegions;
        const data = await fetchVenueList({ page: pageNum, size, region: regionParam });

        const venueList = Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
          ? data
          : [];

        if (pageNum === 1) {
          setVenues(venueList);
        } else {
          setVenues((prev) => [...prev, ...venueList]);
        }

        setHasMore(venueList.length >= size);
        setPage(pageNum + 1);
      } catch (err) {
        console.error('공연장 목록 API 호출 실패:', err);
        if (pageNum === 1) setVenues([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedRegions, size, loading]
  );

  // 3) 지역 변경 → 첫 페이지부터 다시
  useEffect(() => {
    if (isInitialLoad) return;
    setPage(1);
    setHasMore(true);
    loadVenues(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegions, isInitialLoad]);

  // 4) 무한 스크롤 (컨테이너를 root로)
  useEffect(() => {
    const el = sentinelRef.current;
    const root = scrollerRef.current;
    if (!el || !root) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          saveState();
          loadVenues(page);
        }
      },
      { root, rootMargin: '200px 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [page, hasMore, loading, loadVenues, saveState]);

  // 5) 언마운트/탭 전환 시 상태 저장
  useEffect(() => {
    const onHide = () => saveState();
    const onVis = () => { if (document.visibilityState === 'hidden') saveState(); };
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      saveState();
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [saveState]);

  const handleSelectRegion = (region) => {
    if (region === '전체') {
      setSelectedRegions(['전체']);
    } else {
      const already = selectedRegions.includes(region);
      let updated = already
        ? selectedRegions.filter((r) => r !== region)
        : selectedRegions.filter((r) => r !== '전체').concat(region);
      if (!updated.length) updated = ['전체'];
      setSelectedRegions(updated);
    }
  };

  return (
    <PageWrapper>
      <Header title="공연장" initialSearchTab="공연/공연장" />
      <div style={{ height: '16px' }} />
      <RegionSelectButton onClick={() => setIsSheetOpen(true)} selectedRegions={selectedRegions} />
      <ScrollableList ref={scrollerRef} onScroll={handleScrollSave}>
        {Array.isArray(venues) && venues.length > 0 ? (
          <>
            {venues.map((venue) => (
              <VenueItem
                key={venue.id}
                image={venue.image_url}
                name={venue.name}
                onClick={() => { saveState(); navigate(`/venue/${venue.id}`); }}
              />
            ))}
            {hasMore && <Loader ref={sentinelRef}>{loading ? '불러오는 중...' : '더 불러오는 중...'}</Loader>}
          </>
        ) : (
          !loading && <EmptyMessage>해당되는 공연장이 없습니다.</EmptyMessage>
        )}
      </ScrollableList>
      {isSheetOpen && (
        <RegionSelectSheet
          selectedRegions={selectedRegions}
          onSelectRegion={handleSelectRegion}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </PageWrapper>
  );
}

export default ListVenue;

/* ===== 스타일 ===== */
const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px;
  box-sizing: border-box;

  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;

  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

const EmptyMessage = styled.div`
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex; justify-content: center; align-items: center;
  margin-top: 32px;
`;

const Loader = styled.div`
  padding: 16px 0;
  text-align: center;
  color: ${({ theme }) => theme.colors?.darkGray || '#666'};
  font-size: ${({ theme }) => theme.fontSizes?.sm || '14px'};
`;
