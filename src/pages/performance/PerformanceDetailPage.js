// src/pages/performance/PerformanceDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import getDday from '../../utils/getDday';
import Divider from '../../components/common/Divider';
import NotifyButton from '../../components/common/NotifyButton';
import ArtistProfileCard from '../../components/artist/ArtistProfileCard';
import Header from '../../components/layout/Header';
import HeartOutlineIcon from '../../assets/icons/icon_heart_outline.svg';
import HeartFilledIcon from '../../assets/icons/icon_heart_filled.svg';
import ChevronRightIcon from '../../assets/icons/icon_go.svg';
import { formatKoreanFromParts } from '../../utils/dateUtils';

// ✅ API
import { fetchPerformanceDetail } from '../../api/performanceApi';
import { likePerformance, unlikePerformance } from '../../api/likeApi';
import { registerPerformanceAlert, cancelPerformanceAlert } from '../../api/alertApi';

export default function PerformanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [performance, setPerformance] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isAlarmed, setIsAlarmed] = useState(false); // ✅ 알림

  const authToken = localStorage.getItem('accessToken');

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const data = await fetchPerformanceDetail(id);
        console.log('🎯 [공연 상세] API 응답:', data);
        setPerformance(data);
        setIsLiked(data.isLiked || false);
        setIsAlarmed(data.isAlarmed || false);
        setLikeCount(data.likeCount || 0);
      } catch (err) {
        console.error('📛 공연 상세 API 호출 실패:', err);
      }
    };
    loadPerformance();
  }, [id]);

  const toggleLike = async () => {
    try {
      if (isLiked) {
        await unlikePerformance(id, authToken);
        setLikeCount((prev) => Math.max(prev - 1, 0));
      } else {
        await likePerformance(id, authToken);
        setLikeCount((prev) => prev + 1);
      }
      setIsLiked((prev) => !prev);
    } catch (err) {
      console.error('📛 찜 API 호출 실패:', err);
    }
  };

  const toggleNotify = async () => {
    try {
      if (isAlarmed) {
        await cancelPerformanceAlert(id, authToken);
      } else {
        await registerPerformanceAlert(id, authToken);
      }
      setIsAlarmed((prev) => !prev);
    } catch (err) {
      console.error('📛 알림 API 호출 실패:', err);
    }
  };

  if (!performance) return <div>로딩 중...</div>;

  // ✅ 안전한 링크 값 처리
  const shortcode =
    typeof performance.shortcode === 'string'
      ? performance.shortcode.trim()
      : performance.shortcode || performance.short_code || '';
  const detailUrl =
    typeof performance.detail_url === 'string'
      ? performance.detail_url.trim()
      : performance.detailLink?.trim() || '';

  return (
    <>
      <Header title={performance.title} />
      <div style={{ height: '16px' }} />
      <Container>
        <PosterSection>
          <PosterWrapper>
            <Poster src={performance.posterUrl || performance.thumbnail || ''} alt="poster" />
            <LikeButton onClick={toggleLike}>
              <HeartIcon $isLiked={isLiked} />
              <LikeCount>{likeCount}</LikeCount>
            </LikeButton>
          </PosterWrapper>
          <InfoWrapper>
            <Dday $isToday={getDday(performance.date) === 'D-Day'}>
              {getDday(performance.date)}
            </Dday>
            <Title>{performance.title}</Title>
            <NotifyButton isNotified={isAlarmed} onClick={toggleNotify} label="예매알림" />
          </InfoWrapper>
        </PosterSection>

        <Divider />

        <InfoSection>
          <LabelRow>
            <Label>공연일시</Label>
            <Value>{formatKoreanFromParts(performance.date, performance.time)}</Value>
          </LabelRow>

          <LabelRow>
            <Label>공연장</Label>
            <VenueValue onClick={() => navigate(`/venue/${performance.venueId}`)}>
              {performance.venue || '공연장 정보 없음'} <ChevronIcon src={ChevronRightIcon} />
            </VenueValue>
          </LabelRow>

          <LabelRow style={{ display: 'block' }}>
            <Label>출연진</Label>
            <ScrollContainer>
              {performance.artists?.map((artist) => (
                <ArtistProfileCard
                  key={artist.id}
                  artist={artist}
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  showName
                />
              ))}
            </ScrollContainer>
          </LabelRow>

          <LabelRow>
            <Label>티켓 가격</Label>
            <Value>{performance.price}</Value>
          </LabelRow>

          <LabelRow>
            <Label>티켓 오픈</Label>
            <Value>
              {formatKoreanFromParts(performance.ticket_open_date, performance.ticket_open_time)}
            </Value>
          </LabelRow>

          {/* ✅ 상세 정보 */}
          <LabelRow>
            <Label>상세 정보</Label>
            <LinkValue>
              {shortcode ? (
                <a
                  href={`https://www.instagram.com/p/${shortcode}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  공연 게시물 바로가기
                </a>
              ) : (
                <span>상세 정보 없음</span>
              )}
            </LinkValue>
          </LabelRow>

          {/* ✅ 예매 링크 */}
          <LabelRow>
            <Label>예매 링크</Label>
            <LinkValue>
              {detailUrl ? (
                <a href={detailUrl} target="_blank" rel="noreferrer">
                  예매 사이트 바로가기
                </a>
              ) : (
                <span>예매 링크 없음</span>
              )}
            </LinkValue>
          </LabelRow>
        </InfoSection>
      </Container>
    </>
  );
}

// ✅ 스타일은 그대로 유지
const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const PosterSection = styled.div`
  display: flex;
  margin: 16px 0;
`;

const PosterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Poster = styled.img`
  width: 120px;
  height: 160px;
  margin-bottom: 8px;
  object-fit: cover;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
`;

const LikeButton = styled.button`
  display: inline-flex;
  align-items: center;
  height: 1.5rem;
  padding: 12px 8px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.outlineGray};
  border: 1.5px solid ${({ theme }) => theme.colors.outlineGray};
  border-radius: 1.5rem;
  background-color: ${({ theme }) => theme.colors.bgWhite};
  cursor: pointer;
  gap: 0.25rem;
`;

const HeartIcon = styled.span`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  background-image: ${({ $isLiked }) =>
    $isLiked ? `url(${HeartFilledIcon})` : `url(${HeartOutlineIcon})`};
  background-size: 100% 100%;
`;

const LikeCount = styled.span`
  color: ${({ theme }) => theme.colors.darkGray};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
`;

const InfoWrapper = styled.div`
  flex: 3;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin: 4px 0;
  margin-left: 16px;
`;

const Dday = styled.div`
  color: ${({ $isToday, theme }) =>
    $isToday ? theme.colors.themeGreen : theme.colors.lightGray};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.darkblack};
  margin-top: 12px;
  margin-bottom: 8px; 
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  gap: 24px;
`;

const LabelRow = styled.div`
  display: grid;
  grid-template-columns: 6rem 1fr;
  align-items: center;
`;

const Label = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkblack};
`;

const Value = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.darkGray};
`;

const VenueValue = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.darkGray};
  cursor: pointer;
`;

const ChevronIcon = styled.img`
  width: 0.75rem;
  height: 0.75rem;
`;

const LinkValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.darkGray};
  word-break: break-all;
  overflow-wrap: break-word;

  a {
    color: ${({ theme }) => theme.colors.darkGray};
    text-decoration: underline;
    word-break: break-all;
  }
`;

const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  margin-top: 12px;
  gap: 24px;
  &::-webkit-scrollbar {
    display: none;
  }
`;
