// src/pages/performance/PerformanceListPage.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import PerformanceListCard from '../../components/performance/PerformanceListCard';
import RegionSelectButton from '../venue/components/RegionSelectButton';
import RegionSelectSheet from '../venue/components/RegionSelectSheet';
import FilterButton from '../../components/common/FilterButton';
import CalendarIcon from '../../assets/icons/icon_calendar.svg';
import SortModal from '../../components/modals/SortModal';
import { fetchPerformances } from '../../api/performanceApi';

const getDateTime = (p) => {
  const iso = p.datetime || p.dateTime || p.performanceDateTime || p.start_at;
  if (iso) return new Date(iso);
  if (p.date && p.time) return new Date(`${p.date}T${p.time}`);
  if (p.date) return new Date(`${p.date}T00:00:00`);
  return null;
};

const normalizePoster = (p) => {
  const thumbnail =
    p.thumbnail ||
    p.posterUrl ||
    p.poster_url ||
    p.poster ||
    p.image_url ||
    (Array.isArray(p.images) ? p.images[0] : '') ||
    '';
  return { ...p, thumbnail };
};

export default function PerformanceListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSortFromUrl = searchParams.get('sort') || 'latest';
  const initialRegionsFromUrlRaw = searchParams.get('regions');
  const initialRegionsFromUrl = initialRegionsFromUrlRaw
    ? initialRegionsFromUrlRaw.split(',').filter((r) => r.trim() !== '')
    : ['전체'];

  const [sortOption, setSortOption] = useState(initialSortFromUrl);
  const [selectedRegions, setSelectedRegions] = useState(initialRegionsFromUrl);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);

  const [performances, setPerformances] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const size = 15;

  /* === 스크롤 저장/복원용 추가 === */
  const scrollerRef = useRef(null);
  const restoringRef = useRef(false);
  const savedAnchorRef = useRef({ anchorId: null, anchorOffset: 0 });
  const rafSaveRef = useRef(null);
  const STORAGE_KEY = `perf:list?${searchParams.toString()}`;

  const syncFiltersToUrl = (nextSortOption, nextSelectedRegions) => {
    const sortToSet = nextSortOption ?? sortOption;
    const regionsToSet = nextSelectedRegions ?? selectedRegions;
    const params = {};
    params.sort = sortToSet;
    if (!(regionsToSet.length === 1 && regionsToSet[0] === '전체')) {
      params.regions = regionsToSet.join(',');
    }
    setSearchParams(params);
  };

  const handleSelectRegion = (region) => {
    if (region === '전체') {
      const updated = ['전체'];
      setSelectedRegions(updated);
      syncFiltersToUrl(undefined, updated);
    } else {
      const alreadySelected = selectedRegions.includes(region);
      let updated = alreadySelected
        ? selectedRegions.filter((r) => r !== region)
        : selectedRegions.filter((r) => r !== '전체').concat(region);
      if (updated.length === 0) updated = ['전체'];
      setSelectedRegions(updated);
      syncFiltersToUrl(undefined, updated);
    }
  };

  const handleSelectSort = (option) => {
    setSortOption(option);
    syncFiltersToUrl(option, undefined);
  };

  const loadPerformances = async (append = false) => {
    try {
      const sortMapping = { latest: 'created_at', popular: 'likes', date: 'date' };
      const sortParam = sortMapping[sortOption] || 'created_at';
      const regionParam = selectedRegions.includes('전체') ? undefined : selectedRegions;
      const data = await fetchPerformances({ region: regionParam, sort: sortParam, page, size });
      let list = Array.isArray(data) ? data : [];

      if (sortOption === 'date') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        list = list
          .map((p) => ({ ...p, __dt: getDateTime(p) }))
          .filter((p) => p.__dt && p.__dt >= startOfToday)
          .sort((a, b) => a.__dt - b.__dt)
          .map(({ __dt, ...rest }) => rest);
      }
      list = list.map(normalizePoster);

      if (append) setPerformances((prev) => [...prev, ...list]);
      else setPerformances(list);

      setHasMore(list.length >= size);
    } catch (err) {
      console.error('📛 공연 목록 API 호출 실패:', err?.response?.data || err.message);
      setPerformances([]);
    }
  };

  useEffect(() => {
    if (restoringRef.current) return;
    loadPerformances(page > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, selectedRegions, page]);

  /* === 첫 가시 카드(앵커) 계산 === */
  const getFirstVisibleAnchor = () => {
    const sc = scrollerRef.current;
    if (!sc) return null;
    const items = Array.from(sc.querySelectorAll('[data-perf-id]'));
    const scRect = sc.getBoundingClientRect();
    for (const el of items) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > scRect.top) {
        const topInScroller = rect.top - scRect.top + sc.scrollTop;
        return {
          anchorId: el.getAttribute('data-perf-id'),
          anchorOffset: sc.scrollTop - topInScroller,
        };
      }
    }
    return null;
  };

  /* === 스크롤 상태 저장 === */
  const saveStateToSession = () => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const anchor = getFirstVisibleAnchor();
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        scrollTop: sc.scrollTop,
        page,
        anchorId: anchor?.anchorId ?? null,
        anchorOffset: anchor?.anchorOffset ?? 0,
        ts: Date.now(),
      }),
    );
  };
  const handleScrollSave = () => {
    if (rafSaveRef.current) return;
    rafSaveRef.current = requestAnimationFrame(() => {
      rafSaveRef.current = null;
      saveStateToSession();
    });
  };

  /* === 최초 마운트: 저장된 page만큼 순차 로드 후 정확 위치 복구 === */
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const { scrollTop = 0, page: savedPage = 1, anchorId = null, anchorOffset = 0 } = JSON.parse(saved);
      restoringRef.current = true;
      savedAnchorRef.current = { anchorId, anchorOffset };

      (async () => {
        setPerformances([]);
        let lastPageLen = size;

        for (let i = 1; i <= savedPage; i++) {
          const sortMapping = { latest: 'created_at', popular: 'likes', date: 'date' };
          const sortParam = sortMapping[sortOption] || 'created_at';
          const regionParam = selectedRegions.includes('전체') ? undefined : selectedRegions;
          const data = await fetchPerformances({ region: regionParam, sort: sortParam, page: i, size });
          let list = Array.isArray(data) ? data : [];
          if (sortOption === 'date') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            list = list
              .map((p) => ({ ...p, __dt: getDateTime(p) }))
              .filter((p) => p.__dt && p.__dt >= startOfToday)
              .sort((a, b) => a.__dt - b.__dt)
              .map(({ __dt, ...rest }) => rest);
          }
          list = list.map(normalizePoster);
          lastPageLen = list.length;

          setPerformances((prev) => (i === 1 ? list : [...prev, ...list]));
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => requestAnimationFrame(r));
        }

        const sc = scrollerRef.current;
        if (sc) {
          const { anchorId: AID, anchorOffset: AO } = savedAnchorRef.current;
          if (AID) {
            const sel = `[data-perf-id="${CSS.escape(String(AID))}"]`;
            const el = sc.querySelector(sel);
            if (el) {
              const rect = el.getBoundingClientRect();
              const scRect = sc.getBoundingClientRect();
              const topInScroller = rect.top - scRect.top + sc.scrollTop;
              sc.scrollTop = Math.max(0, topInScroller + AO);
            } else {
              sc.scrollTop = Math.max(0, Math.min(scrollTop, sc.scrollHeight - sc.clientHeight));
            }
          } else {
            sc.scrollTop = Math.max(0, Math.min(scrollTop, sc.scrollHeight - sc.clientHeight));
          }
        }

        setPage(savedPage);
        setHasMore(lastPageLen >= size);
        restoringRef.current = false;
      })();
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 쿼리 변경 시엔 새로운 STORAGE_KEY가 되므로 최초만 시도

  /* === 언마운트/탭 전환 시 저장 === */
  useEffect(() => {
    const onHide = () => saveStateToSession();
    const onVis = () => { if (document.visibilityState === 'hidden') saveStateToSession(); };
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      saveStateToSession();
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY, page]);

  return (
    <>
      <Header title="공연" />
      <div style={{ height: "16px" }} />
      <Container>
        <FilterBar>
          <FilterGroup>
            <FilterButton onClick={() => setIsSortModalOpen(true)}>
              {sortOption === 'latest'
                ? '최근등록순'
                : sortOption === 'date'
                ? '공연임박순'
                : '인기순'}
            </FilterButton>

            <RegionSelectButton 
              selectedRegions={selectedRegions}
              onClick={() => setIsRegionSheetOpen(true)}
            />
          </FilterGroup>
          <CalendarIconButton onClick={() => navigate('/calendar')} />
        </FilterBar>

        {/* ref + onScroll 만 추가 */}
        <ScrollableContent ref={scrollerRef} onScroll={handleScrollSave}>
          {performances.length > 0 ? (
            <>
              {performances.map((p, i) => (
                <div key={p.id ?? `${p.title}-${p.date}-${i}`} data-perf-id={p.id ?? `${p.title}-${p.date}-${i}`}>
                  <PerformanceListCard
                    performance={p}
                    onClick={() => { saveStateToSession(); navigate(`/performance/${p.id}`); }}
                  />
                </div>
              ))}
              {hasMore && (
                <MoreButton onClick={() => setPage((prev) => {
                  const next = prev + 1;
                  queueMicrotask(saveStateToSession);
                  return next;
                })}>
                  더보기
                </MoreButton>
              )}
            </>
          ) : (
            <EmptyMessage>예정된 공연이 없습니다.</EmptyMessage>
          )}
        </ScrollableContent>

        {isSortModalOpen && (
          <ModalBackground onClick={() => setIsSortModalOpen(false)}>
            <SortModal
              selected={sortOption}
              onSelect={handleSelectSort}
              onClose={() => setIsSortModalOpen(false)}
            />
          </ModalBackground>
        )}

        {isRegionSheetOpen && (
          <RegionSelectSheet
            selectedRegions={selectedRegions}
            onSelectRegion={handleSelectRegion}
            onClose={() => setIsRegionSheetOpen(false)}
          />
        )}
      </Container>
    </>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  height: calc(100dvh - 56px); 
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.bgWhite};
`;

const ScrollableContent = styled.div`
  height: 100vh;
  height: 100dvh; 
  padding-bottom: 68px;
  overflow-y: auto;
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FilterGroup = styled.div`
  margin: 16px 0;
  display: flex;
  gap: 16px;
  button { margin: 0 !important; }
`;

const CalendarIconButton = styled.button`
  width: 36px;
  height: 36px;
  background-color: rgba(60, 156, 103, 0.2);
  border-radius: 50%;
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  &::after {
    content: '';
    background-image: url(${CalendarIcon});
    background-size: 100% 100%;
    width: 1rem; height: 1rem;
  }
`;

const ModalBackground = styled.div`
  position: fixed; inset: 0;
  background-color: rgba(0,0,0,0.3);
  z-index: 1000; display: flex; justify-content: center; align-items: flex-end;
`;

const MoreButton = styled.button`
  width: 100%; height: 48px; margin-bottom: 16px;
  background-color: ${({ theme }) => theme.colors.bgWhite};
  color: ${({ theme }) => theme.colors.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  border-radius: 8px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer; transition: all .2s ease;
  &:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
`;

const EmptyMessage = styled.div`
  margin-top: 16px; padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex; justify-content: center; align-items: center;
`;
