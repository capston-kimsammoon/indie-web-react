import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VenueItem from './components/VenueItem';
import RegionSelectButton from './components/RegionSelectButton';
import RegionSelectSheet from './components/RegionSelectSheet';
import { useNavigate, useSearchParams } from 'react-router-dom'; // ✅ 추가: useSearchParams
import { fetchVenueList } from '../../api/venueApi';

function ListVenue() {
  const navigate = useNavigate();

  // ✅ URL 쿼리 읽기/쓰기 훅
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ URL 쿼리에서 초기 지역값 불러오기 (예: ?regions=경기,부산)
  const initialRegionsFromUrl = (() => {
    const raw = searchParams.get('regions');
    if (!raw || raw.trim() === '') {
      return ['전체'];
    }
    // "경기,부산" → ['경기','부산']
    return raw
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r !== '');
  })();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState(initialRegionsFromUrl);
  const [venues, setVenues] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const size = 20;
  const sentinelRef = useRef(null);

  // ✅ 상태 복원 (원본 그대로 유지)
  useEffect(() => {
    const saved = sessionStorage.getItem('venueListState');
    if (saved) {
      const { scrollY, selectedRegions, venues, page } = JSON.parse(saved);

      // 단! selectedRegions은 URL이 우선임.
      // URL에 regions가 있으면 그걸 우선 유지해야 하니까
      // sessionStorage에 있는 selectedRegions로 강제로 덮지 않도록 조건 분기
      if (!searchParams.get('regions')) {
        setSelectedRegions(selectedRegions || ['전체']);
      }

      setVenues(venues || []);
      setPage(page || 1);

      // 스크롤 복원 (렌더 이후)
      setTimeout(() => {
        window.scrollTo(0, scrollY || 0);
      }, 0);
    } else {
      // 저장된 상태가 없을 때만 새로 로드
      loadVenues(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 스크롤 복원용 useEffect (원본 그대로)
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

  // ✅ 언마운트 시 상태 저장 (원본 그대로)
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

  // API 호출 함수 (원본 그대로)
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

  // ✅ 지역 변경 시 첫 페이지부터 다시 로드 (원본 그대로)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadVenues(1);
  }, [selectedRegions, loadVenues]);

  // 무한 스크롤 센티넬 (원본 그대로)
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

  // ✅ URL 쿼리에 현재 필터 반영하는 함수 (새로 추가)
  const syncRegionsToUrl = (regionsArr) => {
    // regionsArr가 ['전체']면 URL은 깔끔하게 비워줌
    if (!regionsArr || regionsArr.length === 0 || (regionsArr.length === 1 && regionsArr[0] === '전체')) {
      setSearchParams({});
    } else {
      setSearchParams({
        regions: regionsArr.join(','), // 예: ['경기','부산'] -> regions=경기,부산
      });
    }
  };

  // ✅ 지역 선택 핸들러 (URL까지 업데이트하도록 변경)
  const handleSelectRegion = (region) => {
    if (region === '전체') {
      const updated = ['전체'];
      setSelectedRegions(updated);
      syncRegionsToUrl(updated); // ← URL도 맞춰줌
    } else {
      const alreadySelected = selectedRegions.includes(region);
      let updated = alreadySelected
        ? selectedRegions.filter((r) => r !== region)
        : selectedRegions.filter((r) => r !== '전체').concat(region);

      if (updated.length === 0) updated = ['전체'];

      setSelectedRegions(updated);
      syncRegionsToUrl(updated); // ← URL도 맞춰줌
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
            {hasMore && <Loader ref={sentinelRef}>{loading ? '더 불러오는 중...' : ''}</Loader>}
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
