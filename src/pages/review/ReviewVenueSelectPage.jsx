import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { fetchVenueList } from '../../api/venueApi';
import Header from '../../components/layout/Header';

/* ===================== 스타일 ===================== */
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 16px;
  padding-bottom: 16px;
  box-sizing: border-box;
  height: 100dvh;
`;

const VenueGrid = styled.div`
  flex-grow: 1;          
  overflow-y: auto;      
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px 0 120px 0;

  overscroll-behavior: contain;  
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SearchBar = styled.div`
  width: 100%; /* 부모 기준 전체 너비 */
  display: flex;
  gap: 8px;
  background-color: #fff;
  padding: 12px 0;
  box-sizing: border-box;
  border-bottom: 1px solid #e5e7eb;
`;


const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3c9c68;
    box-shadow: 0 0 0 2px rgba(60, 156, 104, 0.2);
  }
`;

const VenueCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background-color: #fff;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 140px;
  height: auto;
  color: #2F2F2F;
  background: none; 
  appearance: none; 
  outline: none;

  &:hover {
    background-color: #f3f9f5;
    border-color: #3c9c68;
  }
`;

const VenueName = styled.span`
  display: -webkit-box;        /* line-clamp 사용 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;      /* 최대 2줄 */
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  width: 100%;
  word-break: break-word;
`;

const VenueImageWrapper = styled.div`
  width: 60px;
  height: 60px;          /* 이미지 영역 고정 */
  margin-bottom: 8px;
  flex-shrink: 0;        /* 카드 크기에 의해 줄어들지 않도록 */
  display: flex;
  align-items: center;
  justify-content: center;
`;

const VenueImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  object-fit: cover;
`;

const LoadingMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: #6b7280;
  grid-column: span 3;
`;

export default function ReviewVenueSelectPage() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredVenues, setFilteredVenues] = useState([]);

  const loadVenues = useCallback(async () => {
    setLoading(true);
    try {
      // size 크게 해서 한 번에 모든 데이터 불러오기
      const list = await fetchVenueList({ page: 1, size: 1000 });
      setVenues(list);
      setFilteredVenues(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  // 검색 필터
  useEffect(() => {
    if (!searchText) {
      setFilteredVenues(venues);
    } else {
      const filtered = venues.filter(v =>
        v.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredVenues(filtered);
    }
  }, [searchText, venues]);

  return (
    <PageWrapper>
      <Header title="공연장 선택" />
      <SearchBar>
        <SearchInput
          placeholder="공연장 이름 검색"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </SearchBar>

        <VenueGrid>
        {loading ? (
            <LoadingMessage>Loading...</LoadingMessage>
        ) : filteredVenues.length === 0 ? (
            <LoadingMessage>검색 결과가 없습니다.</LoadingMessage>
        ) : (
            filteredVenues.map(v => (
                <VenueCard
                    key={v.id}
                    onClick={() => navigate(`/venue/${v.id}/review/write`)}
                    >
                    <VenueImageWrapper>
                        <VenueImage src={v.image_url || '/default-venue.png'} alt={v.name} />
                    </VenueImageWrapper>
                <VenueName>{v.name}</VenueName>
            </VenueCard>

            ))
        )}
        </VenueGrid>
    </PageWrapper>
  );
}
