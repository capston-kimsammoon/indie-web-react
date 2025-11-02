import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VenueItem from './components/VenueItem';
import RegionSelectButton from './components/RegionSelectButton';
import RegionSelectSheet from './components/RegionSelectSheet';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ useLocation 추가
import { fetchVenueList } from '../../api/venueApi';

function ListVenue() {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ useLocation 훅 사용
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState(['전체']);
  const [venues, setVenues] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const size = 20;
  const sentinelRef = useRef(null);

  // ✅ 추가: 초기 로딩/복원 상태를 추적하는 플래그
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 1. ✅ 상태 복원 및 초기 로드 (수정됨: 초기화 로직 추가)
  useEffect(() => {
    // 브라우저 탐색 타입 확인 (back_forward가 아니면 새로 진입으로 간주)
    const navigationType = window.performance.getEntriesByType("navigation")[0]?.type;
    const isRestoring = navigationType === 'back_forward'; // 뒤로가기/앞으로가기 시 복원

    let saved = sessionStorage.getItem('venueListState');
    
    // 🚩 상태 초기화 조건: 뒤로가기가 아닌데(새로운 메뉴 진입) 저장된 상태가 있다면 초기화
    if (!isRestoring && saved) {
      sessionStorage.removeItem('venueListState');
      saved = null; 
    }

    if (saved) {
      const { scrollY, selectedRegions, venues, page } = JSON.parse(saved);
      setSelectedRegions(selectedRegions || ['전체']);
      setVenues(venues || []);
      setPage(page || 1);

      // 스크롤 복원 (렌더 이후)
      setTimeout(() => {
        window.scrollTo(0, scrollY || 0);
      }, 0);
      
      // 복원 후에는 초기 로드가 끝났음을 표시
      setIsInitialLoad(false); 
    } else {
      // 저장된 상태가 없거나 초기화된 경우 새로 로드
      loadVenues(1);
      setIsInitialLoad(false); // 초기 로드 시작 후 플래그 변경
    }
  }, []);

  // 2. ✅ 스크롤 복원용 useEffect (기존 코드 유지)
  useEffect(() => {
    const saved = sessionStorage.getItem('venueListState');
    if (!saved) return;

    const { scrollY } = JSON.parse(saved);

    // venues가 실제로 렌더링된 후 복원
    if (venues.length > 0) {
      setTimeout(() => {
        window.scrollTo(0, scrollY || 0);
      }, 50); // 살짝 지연 (렌더 타이밍 맞추기)
    }
  }, [venues]);

  // 3. ✅ 언마운트 시 상태 저장 (기존 코드 유지)
  useEffect(() => {
    return () => {
      sessionStorage.setItem(
        'venueListState',
        JSON.stringify({
          scrollY: window.scrollY,
          selectedRegions,
          venues,
          page,
        })
      );
    };
  }, [selectedRegions, venues, page]);

  // API 호출 함수 (기존 코드 유지)
  const loadVenues = useCallback(
    async (pageNum) => {
      if (loading) return;
      setLoading(true);
      try {
        const regionParam = selectedRegions.includes('전체')
          ? undefined
          : selectedRegions;
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

        if (pageNum === 1) {
          setVenues(venueList);
        } else {
          setVenues((prev) => [...prev, ...venueList]);
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
    },
    [selectedRegions, size, loading]
  );

  // 4. ✅ 지역 변경 시 첫 페이지부터 다시 로드 (수정됨: 복원 시 재로드 방지)
  useEffect(() => {
    if (isInitialLoad) {
        return;
    }
    setPage(1);
    setHasMore(true);
    loadVenues(1);
  }, [selectedRegions, isInitialLoad]);

  // 5. ✅ 무한 스크롤 센티넬 (기존 코드 유지)
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