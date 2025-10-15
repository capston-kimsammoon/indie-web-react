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

  if (p.date && p.time) return new Date(`${p.date}T$${p.time}`);
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

// ✅ 스크롤 위치 저장 키 상수화
const SCROLL_KEY = 'perf-list-scroll';
const STATE_KEY = 'perf-list-state'; // 상태 저장을 위한 키 추가 (선택적)

export default function PerformanceListPage() {
  const navigate = useNavigate();

  // ✅ 상태 관리: 정렬/필터 변경 시 page는 1로 초기화되어야 합니다.
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

  /* ===== 필터/정렬 변경 핸들러: page 상태를 1로 초기화하고 데이터 재로드 트리거 ===== */
  
  // ✅ 수정: 정렬 옵션 변경 시 page=1, 스크롤 최상단으로 이동
  const handleSortChange = (newSortOption) => {
    setSortOption(newSortOption);
    setPage(1); // 페이지 초기화
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };
  
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
    setPage(1); // 지역 필터 변경 시 페이지 초기화
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };
  
  const loadPerformances = async (append = false) => {
    try {
      // ✅ 로딩 시작 전, POP 액션이 아닐 때만 스크롤 위치를 0으로 초기화
      // POP 액션일 때는 useLayoutEffect에서 스크롤을 복원할 것이므로 건드리지 않음
      if (!append && navigationType !== 'POP' && scrollRef.current) {
         scrollRef.current.scrollTop = 0;
      }
      
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
      console.log(`📡 [데이터 로딩] 데이터 로드 완료. 리스트 길이: ${list.length}`); // 🎯 콘솔 추가

      if (append) {
        setPerformances((prev) => [...prev, ...list]);
      } else {
        // 뒤로가기로 돌아왔을 때 데이터가 이미 있을 경우 덮어쓰지 않도록 방지 (복원 로직과의 충돌 방지)
        if (navigationType !== 'POP' || performances.length === 0) {
           setPerformances(list);
        }
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
    // 필터/정렬/페이지네이션 변경 시 데이터를 로드합니다.
    loadPerformances(page > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, selectedRegions, page]);

  // ====================================================================
  // ✅ 1. JS: body 스크롤 비활성화/활성화 로직 및 로깅 추가
  // ====================================================================
  useEffect(() => {
    // 마운트 시 body 스크롤 숨기기
    document.body.style.overflow = 'hidden';
    console.log('✅ Body 스크롤 숨김 (hidden) 적용'); // 🎯 콘솔 추가

    return () => {
      // 언마운트 시 body 스크롤 다시 활성화 (다른 페이지는 body 스크롤 사용)
      document.body.style.overflow = '';
      console.log('❌ Body 스크롤 복원 (unmount) 해제'); // 🎯 콘솔 추가
    };
  }, []);

  // ====================================================================
  // ✅ 2. 스크롤 위치 복원 로직 및 로깅 추가
  // ====================================================================

  // ✅ 추가 1: 언마운트(다른 페이지로 이동) 시 내부 스크롤 위치 및 상태 저장
  useEffect(() => {
    return () => {
      try {
        // 스크롤 위치 저장 (라우팅 키를 사용)
        const key = location.key || `perf-${location.pathname}`;
        // ✅ 이제 scrollRef.current.scrollTop이 정확한 값을 반환합니다.
        const top = scrollRef.current ? scrollRef.current.scrollTop : 0; 
        sessionStorage.setItem(`${SCROLL_KEY}-${key}`, String(top));
        
        // 상태 저장 (현재 페이지, 필터/정렬)
        sessionStorage.setItem(STATE_KEY, JSON.stringify({ 
           page, sortOption, selectedRegions, performances, hasMore
        }));
        console.log(`✅ [언마운트] 스크롤 저장: ${top}`); // 🎯 콘솔 추가
        
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, page, sortOption, selectedRegions, performances, hasMore]);


  // ✅ 추가 2: 뒤로/앞으로(POP)로 돌아왔을 때 페인트 전에 즉시 상태 및 스크롤 복원
  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      try {
        // 1. 상태 복원
        const savedState = sessionStorage.getItem(STATE_KEY);
        if (savedState) {
          const state = JSON.parse(savedState);
          setPage(state.page || 1);
          setSortOption(state.sortOption || 'latest');
          setSelectedRegions(state.selectedRegions || ['전체']);
          setPerformances(state.performances || []); // 성능 목록 자체도 복원
          setHasMore(state.hasMore);
        }
        
        // 2. 스크롤 복원 (상태 복원 후 즉시 실행)
        const key = location.key || `perf-${location.pathname}`;
        const savedScroll = sessionStorage.getItem(`${SCROLL_KEY}-${key}`);
        
        // 🎯 콘솔 추가: 복원 시도 값 확인
        console.log(`🔍 [POP 액션] 복원 시도: 저장된 스크롤 값 ${savedScroll}`); 

        if (savedScroll && scrollRef.current) {
          const scrollValue = parseInt(savedScroll, 10) || 0;
          scrollRef.current.scrollTop = scrollValue;
          console.log(`🚀 스크롤 복원 완료: ${scrollValue} 적용`); // 🎯 콘솔 추가
        } else {
          console.log('🚧 스크롤 복원 실패: 저장된 값 없음'); // 🎯 콘솔 추가
        }
        
      } catch (e) {
        console.error("📛 상태/스크롤 복원 실패:", e);
      }
    } else {
      // POP이 아닐 경우 (PUSH/REPLACE), 페이지와 스크롤 상태를 초기화
      sessionStorage.removeItem(STATE_KEY);
      sessionStorage.removeItem(`${SCROLL_KEY}-${location.key || `perf-${location.pathname}`}`);
      console.log('🚀 [PUSH/REPLACE] 상태/스크롤 초기화'); // 🎯 콘솔 추가
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, navigationType]);
  
  // ====================================================================
  // ====================================================================

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
              onSelect={(newSort) => {
                 handleSortChange(newSort);
                 setIsSortModalOpen(false);
              }}
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
  padding: 0 16px; /* ✅ CSS 수정 1: 상하 패딩이 높이 계산을 방해하지 않도록 명확하게 지정 */
`;

const ScrollableContent = styled.div`
  /* ❌ 기존 height: 100vh, height: 100dvh 제거 (Flexbox 기반으로 높이 확보) */
  flex-grow: 1; /* ✅ CSS 수정 2: 남은 공간을 모두 차지하도록 함 (핵심) */
  flex-shrink: 0; /* ✅ CSS 수정 3: 높이가 줄어들지 않도록 보호 */
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
  flex-shrink: 0; /* ✅ FilterBar의 높이가 고정되도록 보호 */
  flex-grow: 0;
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