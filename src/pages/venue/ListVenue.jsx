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
  const [page, setPage] = useState(1);            // 다음에 로드할 페이지 번호
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const size = 20;

  const sentinelRef = useRef(null);
  const scrollerRef = useRef(null);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const rafSaveRef = useRef(null);
  const STORAGE_KEY = 'venueListState';

  // 앵커 복원용
  const restoringRef = useRef(false);
  const savedAnchorRef = useRef({ anchorId: null, anchorOffset: 0 });

  // 현재 스크롤에서 첫 가시 아이템의 id/상대 오프셋 계산
  const getFirstVisibleAnchor = () => {
    const sc = scrollerRef.current;
    if (!sc) return null;
    const items = Array.from(sc.querySelectorAll('[data-venue-id]'));
    const scRect = sc.getBoundingClientRect();
    for (const el of items) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > scRect.top) {
        const topInScroller = rect.top - scRect.top + sc.scrollTop;
        return {
          anchorId: el.getAttribute('data-venue-id'),
          anchorOffset: sc.scrollTop - topInScroller,
        };
      }
    }
    return null;
  };

  // 상태 저장 (앵커 포함)
  const saveState = useCallback(() => {
    const sc = scrollerRef.current;
    const anchor = getFirstVisibleAnchor();
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        scrollTop: sc ? sc.scrollTop : 0,
        selectedRegions,
        venues,
        page,
        anchorId: anchor?.anchorId ?? null,
        anchorOffset: anchor?.anchorOffset ?? 0,
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

  // 최초: 세션 복원 or 1페이지 로드
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      (async () => {
        try {
          const { scrollTop = 0, selectedRegions: sr = ['전체'], venues: vs = [], page: pg = 1, anchorId = null, anchorOffset = 0 } = JSON.parse(saved);
          setSelectedRegions(sr);
          setVenues(vs);
          setPage(pg);
          restoringRef.current = true;
          savedAnchorRef.current = { anchorId, anchorOffset };

          requestAnimationFrame(() => {
            const sc = scrollerRef.current;
            if (!sc) return;
            if (anchorId) {
              const el = sc.querySelector(`[data-venue-id="${CSS.escape(String(anchorId))}"]`);
              if (el) {
                const rect = el.getBoundingClientRect();
                const scRect = sc.getBoundingClientRect();
                const topInScroller = rect.top - scRect.top + sc.scrollTop;
                sc.scrollTop = Math.max(0, topInScroller + anchorOffset);
              } else {
                sc.scrollTop = Math.max(0, Math.min(scrollTop, sc.scrollHeight - sc.clientHeight));
              }
            } else {
              sc.scrollTop = Math.max(0, Math.min(scrollTop, sc.scrollHeight - sc.clientHeight));
            }
            // 컨텐츠가 낮아서 비면 다음 페이지 미리 로드
            if (sc.scrollHeight <= sc.clientHeight + 8 && hasMore && !loading) {
              loadVenues(pg);
            }
            restoringRef.current = false;
          });

          if (!vs || vs.length === 0) {
            await loadVenues(1);
          }
        } finally {
          setIsInitialLoad(false);
        }
      })();
    } else {
      (async () => {
        await loadVenues(1);
        setIsInitialLoad(false);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // API 호출
  const loadVenues = useCallback(
    async (pageNum) => {
      if (loading) return;
      setLoading(true);
      try {
        const regionParam = selectedRegions.includes('전체') ? undefined : selectedRegions;
        const data = await fetchVenueList({ page: pageNum, size, region: regionParam });

        // 다양한 응답 포맷 방어
        const raw =
          (Array.isArray(data) && data) ||
          data?.items ||
          data?.content ||
          data?.results ||
          data?.data ||
          [];

        const venueList = Array.isArray(raw) ? raw : [];

        if (pageNum === 1) setVenues(venueList);
        else setVenues((prev) => [...prev, ...venueList]);

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

  // 지역 변경 → 처음부터
  useEffect(() => {
    if (isInitialLoad) return;
    setPage(1);
    setHasMore(true);
    loadVenues(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegions, isInitialLoad]);

  // 무한 스크롤 (컨테이너 root)
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

  // 언마운트/탭 전환 시 저장
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
              <div key={venue.id} data-venue-id={venue.id}>
                <VenueItem
                  image={venue.image_url}
                  name={venue.name}
                  onClick={() => { saveState(); navigate(`/venue/${venue.id}`); }}
                />
              </div>
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
