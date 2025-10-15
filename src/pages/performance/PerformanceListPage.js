// src/pages/performance/PerformanceListPage.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'; // ✅ 추가: useRef, useLayoutEffect
import styled from 'styled-components';
import { useNavigate, useLocation, useNavigationType } from 'react-router-dom'; // ✅ 추가: useLocation, useNavigationType
import Header from '../../components/layout/Header';
import PerformanceListCard from '../../components/performance/PerformanceListCard';
import RegionSelectButton from '../venue/components/RegionSelectButton';
import RegionSelectSheet from '../venue/components/RegionSelectSheet';
import FilterButton from '../../components/common/FilterButton';
import CalendarIcon from '../../assets/icons/icon_calendar.svg';
import SortModal from '../../components/modals/SortModal';
import { fetchPerformances } from '../../api/performanceApi';

/* ===== 날짜 파싱 ===== */
const getDateTime = (p) => {
  const iso = p.datetime || p.dateTime || p.performanceDateTime || p.start_at;
  if (iso) return new Date(iso);

  if (p.date && p.time) return new Date(`${p.date}T${p.time}`);
  if (p.date) return new Date(`${p.date}T00:00:00`);
  return null;
};

/* ===== 썸네일 정규화 ===== */
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

  const [sortOption, setSortOption] = useState('latest');
  const [selectedRegions, setSelectedRegions] = useState(['전체']);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);

  const [performances, setPerformances] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const size = 15;

  // ✅ 추가: 내부 스크롤 컨테이너 ref + 라우팅 정보
  const scrollRef = useRef(null);
  const location = useLocation();
  const navigationType = useNavigationType();

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

      // ✅ 포스터 경로 보정
      list = list.map(normalizePoster);

      console.log('🎯 [공연 목록] 최종 리스트:', list);

      if (append) {
        setPerformances((prev) => [...prev, ...list]);
      } else {
        setPerformances(list);
      }

      // ✅ 다음 데이터가 더 이상 없으면 더보기 버튼 숨기기
      if (list.length < size) setHasMore(false);
      else setHasMore(true);

    } catch (err) {
      console.error('📛 공연 목록 API 호출 실패:', err?.response?.data || err.message);
      setPerformances([]);
    }
  };

  useEffect(() => {
    loadPerformances(page > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, selectedRegions, page]);

  // ✅ 추가 1: 언마운트(다른 페이지로 이동) 시 내부 스크롤 위치 저장
  useEffect(() => {
    return () => {
      try {
        const key = location.key || `perf-${location.pathname}`;
        const top = scrollRef.current ? scrollRef.current.scrollTop : 0;
        sessionStorage.setItem(`perf-scroll-${key}`, String(top));
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ✅ 추가 2: 뒤로/앞으로(POP)로 돌아왔을 때 페인트 전에 즉시 복원(깜빡임 방지)
  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      try {
        const key = location.key || `perf-${location.pathname}`;
        const saved = sessionStorage.getItem(`perf-scroll-${key}`);
        if (saved && scrollRef.current) {
          scrollRef.current.scrollTop = parseInt(saved, 10) || 0;
        }
      } catch (_) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

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

        <ScrollableContent ref={scrollRef}> {/* ✅ 추가: ref 연결 */}
          {performances.length > 0 ? (
            <>
              {performances.map((p) => (
                <PerformanceListCard
                  key={p.id}
                  performance={p}
                  onClick={() => navigate(`/performance/${p.id}`)}
                />
              ))}
              {hasMore && (
                <MoreButton onClick={() => setPage((prev) => prev + 1)}>
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
              onSelect={setSortOption}
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
  height: 100vh
  height: 100dvh; 
  padding-bottom: 68px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
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
  button {
    margin: 0 !important;
  }
`;

const CalendarIconButton = styled.button`
  width: 36px;
  height: 36px;
  background-color: rgba(60, 156, 103, 0.2);
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &::after {
    content: '';
    background-image: url(${CalendarIcon});
    background-size: 100% 100%;
    width: 1rem;
    height: 1rem;
  }
`;

const ModalBackground = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-end;
`;

const MoreButton = styled.button`
  width: 100%;
  height: 48px;
  margin-bottom: 16px;
  background-color: ${({ theme }) => theme.colors.bgWhite};
  color: ${({ theme }) => theme.colors.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  border-radius: 8px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
`;

const EmptyMessage = styled.div`
  margin-top: 16px;
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;  
`;
