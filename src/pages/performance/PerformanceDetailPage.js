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

// API
import { fetchPerformanceDetail } from '../../api/performanceApi';
import { likePerformance, unlikePerformance } from '../../api/likeApi';
import { registerPerformanceAlert, cancelPerformanceAlert } from '../../api/alertApi';

// GA4
import { trackOutboundDetailLink } from '../../utils/ga';

export default function PerformanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [performance, setPerformance] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isAlarmed, setIsAlarmed] = useState(false); // ✅ 알림
  const [showModal, setShowModal] = useState(false);

   const displayPerformanceDateTime =
   formatKoreanFromParts(performance?.date, performance?.time) ||
   [performance?.date, performance?.time].filter(Boolean).join(' ');
  // 🔑 하드코딩 제거 → localStorage에서 토큰 가져오기 (아티스트 상세페이지와 동일 패턴)
  const authToken = localStorage.getItem('accessToken');

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const data = await fetchPerformanceDetail(id);
        console.log('🎯 [공연 상세] API 응답:', data);
        setPerformance(data);
        setIsLiked(data.isLiked || false);
        setIsAlarmed(data.isAlarmed || false);
        setLikeCount(data.likeCount || 0); // ✅ count 반영
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

  return (
    <>
      <PageWrapper>
        <Header title={performance.title} />
        <div style={{ height: '16px' }} />
        <ScrollableList>
          <PosterSection>
            <PosterWrapper>
              <Poster src={performance.posterUrl || performance.thumbnail || ''} 
                alt="poster" 
                onClick={() => setShowModal(true)}
                style={{ cursor: 'pointer' }}/>
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
                  <ArtistProfileCard key={artist.id} artist={artist} onClick={() => navigate(`/artist/${artist.id}`)}  showName/>
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
                {performance.ticket_open_date || performance.ticket_open_time
                  ? formatKoreanFromParts(performance.ticket_open_date, performance.ticket_open_time)
                  : '정보 없음'}
              </Value>
            </LabelRow>
            <LabelRow style={{ position: 'relative' }}>
              <Label>상세 정보</Label>
              <LinkValue>
                {performance.shortcode ? (
                  <>
                    <a
                      href={`https://www.instagram.com/p/${performance.shortcode}/`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        trackOutboundDetailLink({
                          performance_id: performance.id,
                          performance_title: performance.title,
                          venue_id: performance.venueId,
                          venue_name: performance.venue,
                          link_url: `https://www.instagram.com/p/${performance.shortcode}/`,
                          source: 'performance_detail_instagram',
                        })
                      }
                    >
                      공연 상세 페이지 바로가기
                    </a>
                  <MoreMessage>＊ 상세 페이지에서 더 많은 정보를 확인해보세요</MoreMessage>
                </>
                ) : (
                  <span>상세 정보 없음</span>
                )}
              </LinkValue>
            </LabelRow>
            <LabelRow>
              <Label>예매 링크</Label>
              <LinkValue>
                {performance.detailLink ? (
                  <a
                    href={performance.detailLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      trackOutboundDetailLink({
                        performance_id: performance.id,
                        performance_title: performance.title,
                        venue_id: performance.venueId,
                        venue_name: performance.venue,
                        link_url: performance.detailLink,
                        source: 'performance_detail_ticket',
                      })
                    }
                  >
                    예매 사이트 바로가기
                  </a>
                ) : (
                  <Value>정보 없음</Value>
                )}
              </LinkValue>
            </LabelRow>
          </InfoSection>
        </ScrollableList>
      </PageWrapper>

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalImage 
            src={performance.posterUrl || performance.thumbnail || ''} 
            alt="poster"
            onClick={(e) => e.stopPropagation()}
          />
        </ModalOverlay>
      )}
    </>
  );
}

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 0 40px;
`;

const ModalImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 5px;

  @media (min-width: 768px) {
    max-width: 400px;
    max-height: 600px;
  }
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
  background-image: ${({ $isLiked }) => $isLiked ? `url(${HeartFilledIcon})` : `url(${HeartOutlineIcon})`};
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

const ScrollableList = styled.div`
  margin-bottom: 106px;
  padding-bottom: 24px;
  flex-grow: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none; 
  }

  -ms-overflow-style: none; 
  scrollbar-width: none;

  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

const MoreMessage = styled.div`
  position: absolute;
  margin-top: 2px;
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.lightGray};
`;
