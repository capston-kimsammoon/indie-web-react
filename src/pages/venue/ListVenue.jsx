import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VenueItem from './components/VenueItem';
import RegionSelectButton from './components/RegionSelectButton';
import RegionSelectSheet from './components/RegionSelectSheet';
import { useNavigate, useSearchParams } from 'react-router-dom'; // ✅ 추가
import { fetchVenueList } from '../../api/venueApi';

function ListVenue() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // ✅ URL용

  // ✅ URL에서 지역 필터 초기값 복원 (?regions=경기,부산)
  const initialRegionsFromUrl = (() => {
    const raw = searchParams.get('regions');
    if (!raw || raw.trim() === '') {
      return ['전체'];
    }
    return raw
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r !== '');
  })();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState(initialRegionsFromUrl);

  const [venues, setVenues] = useState([]);
  const [page, setPage] = useState(1); // 다음에 불러올 page 번호
  const [hasMore, setHasMore] = useState(true); // 다음 페이지 더 있는지
  const [loading, setLoading] = useState(false);
  const size = 20;
  const sentinelRef = useRef(null);

  // ✅ 상태 복원 (원본 로직 유지하되, URL 값이 있으면 그걸 우선으로 쓴다)
  useEffect(() => {
    const saved = sessionStorage.getItem('venueListState');
    if (saved) {
      const { scrollY, selectedRegions: savedRegions, venues, page } = JSON.parse(saved);

      // URL에 regions가 없을 때만 sessionStorage의 지역필터를 쓴다
      if (!searchParams.get('regions')) {
        setSelectedRegions(savedRegions || ['전체']);
      }

      setVenues(venues || []);
      setPage(page || 1);

      // 스크롤 복원 (렌더 이후)
      setTimeout(() => {
        window.scrollTo(0, scrollY || 0);
      }, 0);
    } else {
      // 저장된 상태가 없으면 첫 페이지 로드
      loadVenues(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 스크롤 복원 (원본)
  useEffect(() => {
    const saved = sessionStorage.getItem('venueListState');
    if (!saved) return;

    const { scrollY } = JSON.parse(saved);

    if (venues.length > 0) {
      setTimeout(() => {
        window.scrollTo(0, scrollY || 0);
      }, 50);
    }
  }, [venues]);

  // ✅ 언마운트 시 상태 저장 (원본)
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

  // ✅ 실제 API 호출
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
          // 첫 페이지 새로 로드
          setVenues(venueList);
        } else {
          // 다음 페이지 이어붙이기
          setVenues((prev) => [...prev, ...venueList]);
        }

        // 다음에 요청할 페이지 번호는 +1
        setPage(pageNum + 1);

        // 다음 페이지 있는지 여부 (20개 미만이면 false)
        setHasMore(venueList.length >= size);
      } catch (err) {
        console.error('공연장 목록 API 호출 실패:', err);
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

  // ✅ 지역 변경 시 첫 페이지부터 다시 로드 (원본 유지)
  useEffect(() => {
    // 지역 바뀌면 페이지/hasMore 리셋하고 첫 페이지 다시 불러
    setPage(1);
    setHasMore(true);
    loadVenues(1);
  }, [selectedRegions, loadVenues]);

  // ✅ 무한 스크롤
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          loadVenues(page);
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadVenues]);

  // ✅ URL 쿼리에 지역 필터 저장
  const syncRegionsToUrl = (regionsArr) => {
    if (!regionsArr || regionsArr.length === 0 || (regionsArr.length === 1 && regionsArr[0] === '전체')) {
      // 전체면 쿼리 깔끔하게 제거
      setSearchParams({});
    } else {
      setSearchParams({
        regions: regionsArr.join(','), // ['경기','부산'] -> regions=경기,부산
      });
    }
  };

  // ✅ 지역 선택 핸들러
  const handleSelectRegion = (region) => {
    if (region === '전체') {
      const updated = ['전체'];
      setSelectedRegions(updated);
      syncRegionsToUrl(updated);
    } else {
      const alreadySelected = selectedRegions.includes(region);
      let updated = alreadySelected
        ? selectedRegions.filter((r) => r !== region)
        : selectedRegions.filter((r) => r !== '전체').concat(region);

      if (updated.length === 0) updated = ['전체'];

      setSelectedRegions(updated);
      syncRegionsToUrl(updated);
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

            {hasMore && (
              <Loader ref={sentinelRef}>
                {loading && page > 2 ? '더 불러오는 중...' : ''}
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
