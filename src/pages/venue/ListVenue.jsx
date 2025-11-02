import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VenueItem from './components/VenueItem';
import RegionSelectButton from './components/RegionSelectButton';
import RegionSelectSheet from './components/RegionSelectSheet';
import { useNavigate, useSearchParams } from 'react-router-dom'; // ⬅️ useSearchParams 추가
import { fetchVenueList } from '../../api/venueApi';

function ListVenue() {
  const navigate = useNavigate();

  // ✅ URL 쿼리 제어용
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ URL 쿼리에서 초기 지역값 복원 (예: ?regions=경기,부산)
  const initialRegionsFromUrlRaw = searchParams.get('regions');
  const initialRegionsFromUrl = initialRegionsFromUrlRaw
    ? initialRegionsFromUrlRaw
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r !== '')
    : ['전체'];

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState(initialRegionsFromUrl);
  const [venues, setVenues] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const size = 20;
  const sentinelRef = useRef(null);

  // ✅ 상태 복원
  useEffect(() => {
    const saved = sessionStorage.getItem('venueListState');
    if (saved) {
      const { scrollY, selectedRegions, venues, page } = JSON.parse(saved);

      // 🟢 기존 sessionStorage 복원 로직 유지
      setSelectedRegions(selectedRegions || ['전체']);
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
  }, []);

  // ✅ 스크롤 복원용 useEffect (리스트 로드 완료 후 실행)
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

  // ✅ 언마운트 시 상태 저장
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

  // API 호출 함수
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

  // 지역 변경 시 첫 페이지부터 다시 로드
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadVenues(1);
  }, [selectedRegions, loadVenues]);

  // 무한 스크롤 센티넬
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

  // ✅ URL에 지역 필터 반영하는 함수
  const syncRegionsToUrl = (regionsArr) => {
    if (
      !regionsArr ||
      regionsArr.length === 0 ||
      (regionsArr.length === 1 && regionsArr[0] === '전체')
    ) {
      // 전체만 선택된 경우 쿼리 깔끔하게 비워줌
      setSearchParams({});
    } else {
      // ex) ['경기','부산'] -> ?regions=경기,부산
      setSearchParams({
        regions: regionsArr.join(','),
      });
    }
  };

  // ✅ 지역 선택 시: 필터 반영 + 캐시 폐기 + 상태 초기화
  const handleSelectRegion = (region) => {
    let updated;

    if (region === '전체') {
      updated = ['전체'];
    } else {
      const alreadySelected = selectedRegions.includes(region);
      updated = alreadySelected
        ? selectedRegions.filter((r) => r !== region)
        : selectedRegions.filter((r) => r !== '전체').concat(region);

      if (updated.length === 0) updated = ['전체'];
    }

    // 1) 상태 반영
    setSelectedRegions(updated);

    // 2) URL 쿼리 반영
    syncRegionsToUrl(updated);

    // 3) 🔥 예전 페이지/스크롤/venues 중간상태 캐시 제거
    sessionStorage.removeItem('venueListState');

    // 4) 🔥 현재 메모리도 깨끗하게 초기화해서
    //    이전 지역에서 받아 둔 중간 스냅샷이 섞이지 않게 함
    setVenues([]);
    setPage(1);
    setHasMore(true);
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
