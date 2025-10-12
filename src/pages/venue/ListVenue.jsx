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

  // API 호출 함수
  const loadVenues = useCallback(async (pageNum) => {
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
        setVenues(prev => [...prev, ...venueList]);
      }

      // 20개 미만이면 더 이상 데이터 없음
      setHasMore(venueList.length >= size);
      setPage(pageNum + 1);
    } catch (err) {
      console.error('공연장 목록 API 호출 실패:', err);
      if (pageNum === 1) {
        setVenues([]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedRegions, size, loading]);

  // 지역 변경 시 첫 페이지부터 다시 로드
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadVenues(1);
  }, [selectedRegions]);

  // 무한 스크롤 센티넬
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadVenues(page);
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadVenues]);

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

      <RegionSelectButton onClick={() => setIsSheetOpen(true)} selectedRegions={selectedRegions} />
      
      <ScrollableList>
        {Array.isArray(venues) && venues.length > 0 ? (
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
            {!hasMore && <EndMessage>마지막 공연장입니다.</EndMessage>}
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

  &::-webkit-scrollbar {
    display: none; 
  }

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
  display: flex;
  justify-content: center; 
  align-items: center;
  margin-top: 32px;
`;

const Loader = styled.div`
  padding: 16px 0;
  text-align: center;
  color: ${({ theme }) => theme.colors?.darkGray || '#666'};
  font-size: ${({ theme }) => theme.fontSizes?.sm || '14px'};
`;

const EndMessage = styled.div`
  padding: 16px 0;
  text-align: center;
  color: ${({ theme }) => theme.colors?.darkGray || '#666'};
  font-size: ${({ theme }) => theme.fontSizes?.sm || '14px'};
`;
