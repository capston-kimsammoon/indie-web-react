import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import HeartButton from '../common/HeartButton';
import { formatKoreanFlexible, formatKoreanDateTime } from '../../utils/dateUtils';

// ---- helpers ----
const toAbs = (url) => {
  if (!url) return '';
  const s = String(url).trim().replace(/^"+|"+$/g, '');
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  if (s.startsWith('/')) return `${window.location.origin}${s}`;
  return `${window.location.origin}/${s}`;
};

const pickPoster = (p) =>
  p?.thumbnail || p?.posterUrl || p?.poster_url || p?.image || p?.image_url || '';

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    
    return `${year}-${month}-${day} (${dayOfWeek}) ${hours}:${minutes}`;
  } catch (e) {
    return dateString;
  }
};

export default function PerformanceListCard({ performance, onToggleLike }) {
  const navigate = useNavigate();
  const location = useLocation();
  const posterSrc = toAbs(pickPoster(performance));
  const { title, venue, date, isLiked } = performance;

  const rawTime =
  performance.time ||
  performance.start_time ||
  performance.startTime ||
  null;

  const formattedDate = rawTime
  ? formatKoreanFlexible(date, rawTime)
  : formatKoreanFlexible(date); // ISO에 시간이 있으면 내부에서 판단

  const handleClick = () => {
    navigate(`/performance/${performance.id}`);
  };

  return (
    <Card onClick={handleClick}>
      <LeftSection>
        <Poster
          src={posterSrc || undefined}
          alt={title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
          }}
        />
        <Info>
          <Title>{title}</Title>
          <Venue>{venue}</Venue>
          <Date>{formattedDate}</Date>
        </Info>
      </LeftSection>
      {location.pathname === '/favorite' && (
        <RightSectionWrapper onClick={(e) => e.stopPropagation()}>
          <HeartButton isLiked={isLiked} onClick={() => onToggleLike(performance.id)} />
        </RightSectionWrapper>
      )}
    </Card>
  );
}

const Card = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.bgWhite};
  cursor: pointer;
  position: relative;
  padding-bottom: 16px;
  margin-bottom: 16px;
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.outlineGray};
  }
  
  /* 마지막 카드: 하단 선, 여백, 마진 모두 제거 */
  &:last-child {
    padding-bottom: 0;
    margin-bottom: 16px;  /* 하단바 위로 16px만 유지 */
    
    &::after {
      display: none;
    }
  }
`;

const LeftSection = styled.div`
  display: flex;
`;

const Poster = styled.img`
  width: 20vw;
  max-width: 5rem;
  height: auto;
  aspect-ratio: 0.8;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  object-fit: cover;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  margin: 8px 0;
  margin-left: 12px;
  flex: 1;
`;

const Title = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.black};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
`;

const Venue = styled.div`
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.black};
`;

const Date = styled.div`
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.darkGray};
`;

const RightSectionWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;
