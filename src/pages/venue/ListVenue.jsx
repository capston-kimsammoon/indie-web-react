import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const scrollContainerRef = useRef(null);

  const SESSION_KEY = 'venueListState';
  const PAGE_NAME = 'venueListPage';

  const getScrollPosition = () => {
    return JSON.parse(sessionStorage.getItem(PAGE_NAME) || '0');
  };
  
  const setScrollPosition = (position) => {
    sessionStorage.setItem(PAGE_NAME, JSON.stringify(position));
  };

  // ---------------------------
  // 1) 마운트 시 상태 복원
  // ---------------------------
  useEffect(() => {
    const saved = sessionStorage.getItem('venueListState');
    if (saved) {
      const { selectedRegions: savedRegions, venues: savedVenues, page: savedPage } = JSON.parse(saved);
      setSelectedRegions(savedRegions || ['전체']);
      setVenues(savedVenues || []);
      setPage(savedPage || 1);
      setHasMore(savedVenues && savedVenues.length >= size);
      
      // ❌ 여기서 window.scrollTo 제거
    } else {
      loadVenues(1);
    }
  }, []);

  useEffect(() => {
    if (venues.length > 0 && scrollContainerRef.current) {
      const prevScrollPosition = getScrollPosition();
      scrollContainerRef.current.scrollTop = prevScrollPosition;
    }
  }, [venues]);

  // ---------------------------
  // 2) 언마운트 시 상태 저장
  // ---------------------------
  useEffect(() => {
    return () => {
      if (scrollContainerRef.current) {
        setScrollPosition(scrollContainerRef.current.scrollTop);
      }
      sessionStorage.setItem(
        'venueListState',
        JSON.stringify({
          selectedRegions,
          venues,
          page,
        })
      );
    };
  }, [selectedRegions, venues, page]);

  // ---------------------------
  // 3) API 호출
  // ---------------------------
  const loadVenues = useCallback(
    async (pageNum) => {
      if (loading) return;
      setLoading(true);
      try {
        const regionParam =
          selectedRegions.includes('전체') ? undefined : selectedRegions;

        const data = await fetchVenueList({ page: pageNum, size, region: regionParam });

        const venueList = Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
          ? data
          : [];

        setVenues((prev) => (pageNum === 1 ? venueList : [...prev, ...venueList]));
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

  // ---------------------------
  // 4) 지역 변경 시 리로드
  // ---------------------------
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setVenues([]);
    loadVenues(1);
    
    // ✅ 지역 변경 시 스크롤 초기화 추가
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      setScrollPosition(0);
    }
  }, [selectedRegions]);

  // ---------------------------
  // 5) 무한 스크롤
  // ---------------------------
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadVenues(page);
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadVenues]);

  // ---------------------------
  // 6) 지역 선택 처리
  // ---------------------------
  const handleSelectRegion = (region) => {
    if (region === '전체') {
      setSelectedRegions(['전체']);
    } else {
      const alreadySelected = selectedRegions.includes(region);
      let updated = alreadySelected
        ? selectedRegions.filter((r) => r !== region)
        : selectedRegions.filter((r) => r !== '전체').concat(region);
      if (updated.length === 0) updated = ['전체'];
      setSelectedRegions(updated);
    }
  };

  return (
    <PageWrapper>
      <Header title="공연장" initialSearchTab="공연/공연장" />
      <div style={{ height: '16px' }} />

      <RegionSelectButton
        onClick={() => setIsSheetOpen(true)}
        selectedRegions={selectedRegions}
      />

      <ScrollableList ref={scrollContainerRef}>
        {venues.length > 0 ? (
          <>
            {venues.map((venue) => (
              <VenueItem
                key={venue.id}
                image={venue.image_url}
                name={venue.name}
                onClick={() => navigate(`/venue/${venue.id}`)}
              />
            ))}
            {hasMore && <Loader ref={sentinelRef}>더 불러오는 중...</Loader>}
          </>
        ) : (
          <EmptyMessage>해당되는 공연장이 없습니다.</EmptyMessage>
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

const PageWrapper = styled.div`
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

const EmptyMessage = styled.div`
  padding: 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 32px;
`;

const Loader = styled.div`
  padding: 16px 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.darkGray || '#666'};
  font-size: ${({ theme }) => theme.fontSizes.sm || '14px'};
`;
