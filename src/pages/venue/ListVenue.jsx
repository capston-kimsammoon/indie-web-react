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

  // 🔥 필터만 기억할 거라 sessionStorage에서 이 필터만 복원
  const initialRegionsFromStorage = (() => {
    try {
      const saved = sessionStorage.getItem('venueSelectedRegions');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch (e) {}
    return ['전체'];
  })();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState(initialRegionsFromStorage);

  const [venues, setVenues] = useState([]);
  const [page, setPage] = useState(1); // 다음에 불러올 page
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const size = 20;
  const sentinelRef = useRef(null);

  // ✅ selectedRegions 바뀔 때마다 sessionStorage에 저장 (유지 목적)
  useEffect(() => {
    sessionStorage.setItem('venueSelectedRegions', JSON.stringify(selectedRegions));
  }, [selectedRegions]);

  // 실제 API 호출 함수
  const loadVenues = useCallback(
    async (pageNum, replace = false) => {
      if (loading) return;
      setLoading(true);

      const regionParam = selectedRegions.includes('전체')
        ? undefined
        : selectedRegions;

      try {
        const data = await fetchVenueList({
          page: pageNum,
          size,
          region: regionParam,
        });

        const venueList = Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
          ? data
          : [];

        if (replace) {
          // 새 필터로 다시 시작할 때 (pageNum=1)
          setVenues(venueList);
        } else {
          // 무한 스크롤 추가
          setVenues((prev) => [...prev, ...venueList]);
        }

        // 다음 요청 페이지 번호 업데이트
        setPage(pageNum + 1);

        // 다음 페이지 있는지 여부
        setHasMore(venueList.length >= size);
      } catch (err) {
        console.error('📛 공연장 목록 API 실패:', err);
        if (pageNum === 1) {
          setVenues([]);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedRegions, size, loading]
  );

  // ⬇ 첫 로드 + 필터 바뀔 때 마다 1페이지부터 다시 로딩
  useEffect(() => {
    // 필터 바뀌면 새로 시작
    setPage(1);
    setHasMore(true);
    loadVenues(1, true); // replace=true → venues 새로 세팅
  }, [selectedRegions, loadVenues]);

  // ⬇ 무한 스크롤 옵저버
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          if (hasMore && !loading) {
            loadVenues(page, false); // append
          }
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadVenues]);

  // ⬇ 지역 선택 핸들러 (그대로 유지)
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

      <ScrollableList>
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

            {hasMore && (
              <Loader ref={sentinelRef}>
                {loading && page > 1 ? '더 불러오는 중...' : ''}
              </Loader>
            )}
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
