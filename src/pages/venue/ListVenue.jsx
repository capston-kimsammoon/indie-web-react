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

  // 현재 지역 선택 상태
  const [selectedRegions, setSelectedRegions] = useState(['전체']);

  // 화면에 뿌리는 공연장들
  const [venues, setVenues] = useState([]);

  // 다음에 불러올 page 번호(=다음 요청할 page)
  const [page, setPage] = useState(1);

  // 더 불러올 게 있는지
  const [hasMore, setHasMore] = useState(true);

  // 지금 API 부르는 중인지
  const [loading, setLoading] = useState(false);

  // 한 번에 몇 개씩 받아오는지 (백엔드 요청 size)
  const size = 20;

  // 무한스크롤용 sentinel
  const sentinelRef = useRef(null);

  // "지금은 복원중이라 selectedRegions 바뀌어도 API 다시 부르지 마" 플래그
  const isRestoringRef = useRef(false);

  /******************************************************************
   * 1. 마운트 시: sessionStorage에서 상태 복구
   ******************************************************************/
  useEffect(() => {
    const saved = sessionStorage.getItem('venueListState');
    if (saved) {
      const { scrollY, selectedRegions, venues, page } = JSON.parse(saved);

      console.log('[RESTORE] 복구 시작');
      console.log('[RESTORE] saved.selectedRegions =', selectedRegions);
      console.log('[RESTORE] saved.venues.length =', venues?.length);
      console.log('[RESTORE] saved.page(nextToRequest) =', page);

      // 복구중 플래그 ON
      isRestoringRef.current = true;

      setSelectedRegions(selectedRegions || ['전체']);
      setVenues(venues || []);
      setPage(page || 1); // 여기 page는 "다음에 불러올 page"로 우리가 계속 쓰는 값

      // 스크롤도 복원 (살짝 뒤에)
      setTimeout(() => {
        window.scrollTo(0, scrollY || 0);
        console.log('[RESTORE] scroll restored to', scrollY || 0);
      }, 0);
    } else {
      console.log('[INIT] sessionStorage 없음 → 첫 로드 page=1 호출');
      loadVenues(1, true); // 초기 로드
    }
  }, []);

  /******************************************************************
   * 2. venues가 실제로 채워진 다음 스크롤 한번 더 복원 (원래 있던 로직)
   ******************************************************************/
  useEffect(() => {
    const saved = sessionStorage.getItem('venueListState');
    if (!saved) return;
    const { scrollY } = JSON.parse(saved);

    if (venues.length > 0) {
      setTimeout(() => {
        window.scrollTo(0, scrollY || 0);
        console.log('[RESTORE] post-render scroll adjust to', scrollY || 0);
      }, 50);
    }
  }, [venues]);

  /******************************************************************
   * 3. 언마운트 시 현재 상태 저장 (원래 있던 로직)
   ******************************************************************/
  useEffect(() => {
    return () => {
      console.log('[UNMOUNT] 상태 저장중...');
      sessionStorage.setItem(
        'venueListState',
        JSON.stringify({
          scrollY: window.scrollY,
          selectedRegions,
          venues,
          page, // 이건 "다음 호출할 page"
        })
      );
    };
  }, [selectedRegions, venues, page]);

  /******************************************************************
   * 4. 공연장 목록 불러오는 함수
   *    pageNum: 불러올 페이지 번호
   *    replace: true면 새 리스트로 덮어쓰기(=첫 페이지 로딩),
   *             false면 뒤에 이어붙이기(=무한스크롤)
   ******************************************************************/
  const loadVenues = useCallback(
    async (pageNum, replace = false) => {
      if (loading) {
        console.log('[LOAD] 이미 로딩중이라 skip');
        return;
      }

      setLoading(true);
      console.log(
        `[LOAD] 요청 시작: pageNum=${pageNum}, replace=${replace}, selectedRegions=`,
        selectedRegions
      );

      try {
        const regionParam = selectedRegions.includes('전체')
          ? undefined
          : selectedRegions;

        console.log('[LOAD] API params:', {
          page: pageNum,
          size,
          region: regionParam,
        });

        const data = await fetchVenueList({
          page: pageNum,
          size,
          region: regionParam,
        });

        // 백엔드가 data.content로 줄 수도 있고 배열로 줄 수도 있어서 방어
        const venueList = Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
          ? data
          : [];

        console.log('[LOAD] API 응답 개수:', venueList.length);

        if (replace) {
          // 첫 페이지 로딩이거나 필터 바꾼 직후
          setVenues(venueList);
        } else {
          // 무한 스크롤 더 불러오기
          setVenues((prev) => [...prev, ...venueList]);
        }

        // 다음에 부를 page 번호 미리 세팅
        setPage(pageNum + 1);

        // hasMore 결정 로직 (원래 네 코드 흐름 유지: 받은 게 size보다 작으면 더 없음)
        const more = venueList.length >= size;
        console.log('[LOAD] setHasMore ->', more, '(받은개수:', venueList.length, ')');
        setHasMore(more);
      } catch (err) {
        console.error('📛 공연장 목록 API 호출 실패:', err);
        if (pageNum === 1) {
          setVenues([]);
        }
      } finally {
        setLoading(false);
        console.log('[LOAD] 요청 끝');
      }
    },
    [selectedRegions, size, loading]
  );

  /******************************************************************
   * 5. 지역필터(selectedRegions)가 바뀌면 리스트를 새 기준으로 다시 로딩
   *    단, "초기 복원 중"일 때는 강제로 다시 불러서 덮어씌우지 않음
   ******************************************************************/
  useEffect(() => {
    if (isRestoringRef.current) {
      console.log('[FILTER] 복원 단계: API 강제 호출 안 함');
      isRestoringRef.current = false; // 한 번만 PASS하고 다음부터는 정상 동작
      return;
    }

    console.log('[FILTER] 사용자가 필터 변경:', selectedRegions);

    // 필터 바꿨으니까 초기화 후 새로 불러
    setPage(1);
    setHasMore(true);

    // 새 지역 기준으로 1페이지를 새로 집어넣는다(replace=true)
    loadVenues(1, true);
  }, [selectedRegions, loadVenues]);

  /******************************************************************
   * 6. 무한 스크롤 옵저버
   *    sentinelRef가 화면에 보이면 다음 page 불러옴
   ******************************************************************/
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          console.log(
            '[IO] sentinel 보임. hasMore=',
            hasMore,
            'loading=',
            loading,
            '다음 page=',
            page
          );

          // 조건: 더 불러올 수 있고, 지금 로딩중 아니면
          if (hasMore && !loading) {
            // 이어붙이기 모드(replace=false)
            loadVenues(page, false);
          }
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadVenues]);

  /******************************************************************
   * 7. 지역 선택 핸들러 (기존 그대로)
   ******************************************************************/
  const handleSelectRegion = (region) => {
    console.log('[UI] 사용자가 지역 클릭:', region);

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

  /******************************************************************
   * 8. 렌더
   *    - Loader: 이제는 "로딩 중이고 page>1일 때만" 문구를 보여준다
   *      -> 평소엔 바닥에 텍스트 안 깔림
   ******************************************************************/
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
