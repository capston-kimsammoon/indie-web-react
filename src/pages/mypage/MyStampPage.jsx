// 웹/src/pages/mypage/MyStampPage.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Header from '../../components/layout/Header';
import PeriodModal from '../../components/modals/PeriodModal';
import StampMyCard from '../../components/stamp/StampMyCard';
import FilterButtonNone from '../../components/common/FilterButtonNone';
import { fetchCollectedStamps } from '../../api/stampApi';

export default function MyStampPage() {
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear);
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(12);
  
  useEffect(() => {
    const loadStamps = async () => {
      try {
        setLoading(true);
        const data = await fetchCollectedStamps(startMonth, endMonth);
        setStamps(data);
      } catch (e) {
        console.error("📛 스탬프 불러오기 실패:", e);
        setError("스탬프를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadStamps();
  }, [startMonth, endMonth, startYear, endYear]); 

  return (
    <PageWrapper>
      <Header title="내 스탬프" />
      <div style={{ height: '26px' }} />
      <StampCount>
        <AllText>All</AllText> <CountText>{stamps.length}</CountText>
      </StampCount>
      <FilterBar>
        <FilterGroup>
          <FilterButtonNone onClick={() => setIsPeriodModalOpen(true)}>
            기간 설정
          </FilterButtonNone>
        </FilterGroup>
      </FilterBar>

      <ScrollableContent>
        <Content>
          {loading && <Message>불러오는 중...</Message>}
          {error && <Message>{error}</Message>}
          {!loading && !error && stamps.length === 0 && (
            <Message>수집한 스탬프가 없습니다.</Message>
          )}

          <StampGrid>
            {stamps
              .slice()
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(stamp => (
                  <StampMyCard
                  key={stamp.id}
                  id={stamp.performanceId}
                  posterUrl={stamp.posterUrl} 
                  title={stamp.title}              
                  venue={stamp.venue}              
                  date={stamp.date}                
                  />
              ))}
          </StampGrid>
        </Content>
      </ScrollableContent>

      {isPeriodModalOpen && (
        <PeriodModal
          startYear={startYear}
          startMonth={startMonth}
          endYear={endYear}
          endMonth={endMonth}

          onChange={({ startYear, startMonth, endYear, endMonth }) => {
            setStartYear(startYear);
            setStartMonth(startMonth);
            setEndYear(endYear);
            setEndMonth(endMonth);
          }}
          onClose={() => setIsPeriodModalOpen(false)}
        />
      )}
    </PageWrapper>
  );
}

const StampCount = styled.div`
  padding-top: 20px;
  padding-bottom: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const AllText = styled.span`
  color: ${({ theme }) => theme.colors.darkGray};
`;

const CountText = styled.span`
  color: ${({ theme }) => theme.colors.themeGreen};
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  padding-bottom: 94px; 
`;

const StampGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
`;

const Message = styled.div`
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;  
`;

const ScrollableContent = styled.div`
  margin-top: 16px;
  flex-grow: 1;
  overflow-y: auto;
  overscroll-behavior: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;
