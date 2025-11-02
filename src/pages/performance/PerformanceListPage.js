// src/pages/performance/PerformanceListPage.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom'; // ✅ URL 쿼리 동기화를 위해 useSearchParams 추가
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
  const [searchParams, setSearchParams] = useSearchParams(); // ✅ URL 쿼리 읽기/쓰기용 훅 추가

  // ✅ URL 쿼리에서 초기 sortOption 불러오기 (없으면 'latest')
  const initialSortFromUrl = searchParams.get('sort') || 'latest';

  // ✅ URL 쿼리에서 초기 지역 불러오기
  // regions=서울,부산 이런 식으로 들어있다고 가정
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

  // ✅ 정렬/지역 변경 시 URL 쿼리도 같이 업데이트해주는 유틸
  const syncFiltersToUrl = (nextSortOption, nextSelectedRegions) => {
    // nextSortOption / nextSelectedRegions 가 없으면 현재 state 값을 사용
    const sortToSet = nextSortOption ?? sortOption;
    const regionsToSet = nextSelectedRegions ?? selectedRegions;

    const params = {};

    // sort는 항상 넣어줌
    params.sort = sortToSet;

    // 지역이 ['전체']이면 regions 쿼리는 안 넣고, 특정 지역들이면 콤마로 합쳐서 넣음
    if (!(regionsToSet.length === 1 && regionsToSet[0] === '전체')) {
      params.regions = regionsToSet.join(',');
    }

    setSearchParams(params);
  };

  // ✅ 지역 선택 로직 수정: state 갱신 + URL 반영
  const handleSelectRegion = (region) => {
    if (region === '전체') {
      const updated = ['전체'];
      setSelectedRegions(updated);
      syncFiltersToUrl(undefined, updated); // sortOption은 그대로 두고 지역만 업데이트
    } else {
      const alreadySelected = selectedRegions.includes(region);
      let updated = alreadySelected
        ? selectedRegions.filter((r) => r !== region)
        : selectedRegions.filter((r) => r !== '전체').concat(region);
      if (updated.length === 0) updated = ['전체'];

      setSelectedRegions(updated);
      syncFiltersToUrl(undefined, updated); // sortOption은 그대로 두고 지역만 업데이트
    }
  };

  // ✅ 정렬 선택 로직 수정: state 갱신 + URL 반영
  const handleSelectSort = (option) => {
    setSortOption(option);
    syncFiltersToUrl(option, undefined); // region은 그대로 두고 sortOption만 업데이트
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

        <ScrollableContent>
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
            {/* ✅ 기존 setSortOption 대신 handleSelectSort */}
            <SortModal
              selected={sortOption}
              onSelect={handleSelectSort}
              onClose={() => setIsSortModalOpen(false)}
            />
          </ModalBackground>
        )}

        {isRegionSheetOpen && (
          <>
            {/* ✅ 기존 handleSelectRegion 유지하지만 내부 로직이 URL도 반영하도록 변경됨 */}
            <RegionSelectSheet
              selectedRegions={selectedRegions}
              onSelectRegion={handleSelectRegion}
              onClose={() => setIsRegionSheetOpen(false)}
            />
          </>
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
