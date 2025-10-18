// src/pages/artist/ArtistDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import HeartButton from '../../components/common/HeartButton';
import NotifyButton from '../../components/common/NotifyButton';
import PerformanceTitleDateCard from '../../components/performance/PerformanceTitleDateCard';
import Divider from '../../components/common/Divider';
import Header from '../../components/layout/Header';

import { fetchArtistDetail } from '../../api/artistApi';
import { likeArtist, unlikeArtist } from '../../api/likeApi';
import { registerArtistAlert, cancelArtistAlert } from '../../api/alertApi';

export default function ArtistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artist, setArtist] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const [scheduledPerformances, setScheduledPerformances] = useState([]);
  const [pastPerformances, setPastPerformances] = useState([]);

  useEffect(() => {
    const loadArtist = async () => {
      try {
        const data = await fetchArtistDetail(id);
        console.log('🎯 [아티스트 상세] API 성공:', data);

        setArtist({
          ...data,
          profileImageUrl: data.image_url,
          spotify: data.spotify_url,
          instagram: data.instagram_account,
        });

        setIsLiked(data.isLiked || false);
        setIsNotified(data.isNotified || false);
        setScheduledPerformances(data.upcomingPerformances || []);
        setPastPerformances(data.pastPerformances || []);
      } catch (err) {
        console.error('📛 [아티스트 상세] API 실패:', err);
      }
    };

    loadArtist();
  }, [id]);

  //  찜 ON/OFF
  const toggleLike = async () => {
    try {
      if (isLiked) {
        await unlikeArtist(id);
        console.log('💔 [찜] 아티스트 언찜 API 성공');
      } else {
        await likeArtist(id);
        console.log('❤️ [찜] 아티스트 찜 API 성공');
      }
      setIsLiked((prev) => !prev);
    } catch (error) {
      console.error('📛 [찜] 아티스트 찜/언찜 API 실패:', error);
    }
  };

  //  알림 ON/OFF
  const toggleNotify = async () => {
    try {
      if (isNotified) {
        await cancelArtistAlert(id);
        setIsNotified(false);
        console.log('🔕 [알림] 아티스트 알림 취소 성공');
      } else {
        await registerArtistAlert(id);
        setIsNotified(true);
        console.log('🔔 [알림] 아티스트 알림 등록 성공');
      }
    } catch (error) {
      const detail = error.response?.data?.detail;

      if (detail === 'Alert already set') {
        setIsNotified(true);
        console.warn('🔔 [알림] 이미 등록된 알림입니다.');
      } else if (detail === 'Alert not found') {
        setIsNotified(false);
        console.warn('🔕 [알림] 등록되지 않은 알림입니다.');
      } else {
        console.error('📛 [알림] 알림 등록/취소 실패:', error);
        alert('알림 등록 중 오류가 발생했습니다.');
      }
    }
  };

  if (!artist) return <div>로딩 중...</div>;

  return (
    <>
      <PageWrapper>
      <Header title={artist.name} initialSearchTab="아티스트" />
        <ScrollableList>
        <div style={{ height: '16px' }} />
          <ProfileSection>
            <ProfileWrapper>
              <ProfileImage src={artist.profileImageUrl || '/default_profile.png'} alt={artist.name} />
              <StyledHeartButton isLiked={isLiked} onClick={toggleLike} />
            </ProfileWrapper>
            <ProfileInfo>
              <Name>{artist.name}</Name>
              <NotifyButton isNotified={isNotified} onClick={toggleNotify} label="공연알림" />
            </ProfileInfo>
          </ProfileSection>

          <Divider style={{ marginTop: '22px' }} />

          <InfoSection>
            <LabelRow>
              <Label>스포티파이</Label>
              <Value>
                {artist.spotify ? (
                  <a
                    href={`https://open.spotify.com/artist/${artist.spotify_url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    바로가기
                  </a>
                ) : '정보 없음'}
              </Value>
            </LabelRow>

            <LabelRow>
              <Label>인스타그램</Label>
              <Value>
                {artist.instagram ? (
                  <a href={`https://instagram.com/${artist.instagram}`} target="_blank" rel="noreferrer">
                    @{artist.instagram}
                  </a>
                ) : '정보 없음'}
              </Value>
            </LabelRow>

            <PerformanceSection>
              <Label>예정 공연</Label>
              <HorizontalScroll>
                {scheduledPerformances.length > 0 ? (
                  scheduledPerformances.map((p) => (
                    <PerformanceTitleDateCard
                      key={p.id}
                      performance={p}
                      onClick={() => navigate(`/performance/${p.id}`)}
                    />
                  ))
                ) : (
                  <EmptyMessage>예정 공연 없음</EmptyMessage>
                )}
              </HorizontalScroll>
            </PerformanceSection>

            <PerformanceSection>
              <Label>지난 공연</Label>
              <HorizontalScroll>
                {pastPerformances.length > 0 ? (
                  pastPerformances.map((p) => (
                    <PerformanceTitleDateCard
                      key={p.id}
                      performance={p}
                      onClick={() => navigate(`/performance/${p.id}`)}
                    />
                  ))
                ) : (
                  <EmptyMessage>지난 공연 없음</EmptyMessage>
                )}
              </HorizontalScroll>
            </PerformanceSection>
          </InfoSection>
        </ScrollableList>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const ProfileSection = styled.div`
  display: flex; 
  align-items: center; 
`;

const ProfileWrapper = styled.div`
  position: relative;
  width: 5rem;
  height: 5rem;
  margin-bottom: 0px; //22 6
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
`;

const StyledHeartButton = styled(HeartButton)`
  position: absolute; 
  bottom: -0.4rem; 
  right: -0.4rem;
  background-color: ${({ theme }) => theme.colors.bgWhite};
`;

const ProfileInfo = styled.div`
  flex: 1;
  display: flex;
  margin-left: 22px;
  flex-direction: column;
  justify-content: center;
`;

const Name = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.darkblack};
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

  word-break: break-all;
  overflow-wrap: break-word;

  a {
    color: ${({ theme }) => theme.colors.darkGray};
    text-decoration: underline;
    word-break: break-all; 
  }
`;

const PerformanceSection = styled.div`padding: 0.25rem 0;`;

const HorizontalScroll = styled.div`
  margin-top: 8px;
  display: flex;
  overflow-x: auto;
  gap: 16px;
  &::-webkit-scrollbar { display: none; }
`;

const ScrollableList = styled.div`
  margin-bottom: 102px;
  padding-top: 16px;
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

const EmptyMessage = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  align-items: center;
  justify-content: center;
`;
