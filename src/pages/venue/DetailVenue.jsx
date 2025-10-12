// ✅ src/pages/venue/DetailVenue.jsx
import styled from 'styled-components';
import dayjs from 'dayjs';
import Header from '../../components/layout/Header';
import Divider from '../../components/common/Divider';
import toast, { Toaster } from 'react-hot-toast';
import IconCopy from '../../assets/icons/icon_y_copy.svg';
import ChevronRightIcon from '../../assets/icons/icon_go.svg';
import MapView2 from '../../components/map/MapView2';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchVenueDetail } from '../../api/venueApi'; // ✅ API import
import { fetchReviewPreview } from '../../api/reviewApi'; // ✅ 미리보기 API
import ReviewCard from '../../components/review/ReviewCard';

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const ScrollableList = styled.div`
  margin-top: -8px;
  margin-bottom: 5px;
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

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
`;

const ProfileWrapper = styled.div`
  position: relative;
  width: 5rem;
  height: 5rem;
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

const ProfileInfo = styled.div`
  flex: 1;
  display: flex;
  margin-left: 22px;
  flex-direction: column;
  justify-content: center;
`;

const VenueName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.darkblack};
  margin-bottom: 8px;
`;

const InnerWrapper = styled.div`
  padding: 16px 0;
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

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  gap: 24px;
`;

const CopyIcon = styled.img`
  width: 0.95rem;
  height: 0.95rem;
  margin-left: 4px;
  margin-bottom: -2px;
  cursor: pointer;
`;

const ReviewScrollWrapper = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 8px;
  &::-webkit-scrollbar {
    display: none;
  }
`;
const ReviewRow = styled.div`
  display: flex;
  width: max-content;
  padding-bottom: 88px;
  gap: 12px;
  align-items: flex-start;      
`;

const ReviewCardWrapper = styled.div`
  width: 220px;         
  flex-shrink: 0;
`;

const ReviewMoreCard = styled.button`
  width: auto;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray };
  background: #e4e4e45a;
  border-radius: 8px;
  padding: 8px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  height: 100%;
`;

const ReviewMoreText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.darkGray};
  white-space: normal;       
  line-height: 1.4;          
  display: inline-block;    
  text-align: left;
`;

const ChevronImg = styled.img`
  margin-top: 14px;
  width: 12px;
  height: 12px;
`;

const PerformanceSection = styled.div`padding: 0.25rem 0;`;

const HorizontalScroll = styled.div`
  margin-top: 8px;
  display: flex;
  overflow-x: auto;
  gap: 16px;
  &::-webkit-scrollbar { display: none; }
`;

const EmptyMessage = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UpcomingCard = ({ data, onClick }) => {
  if (!data) return null;

  function toAbs(url) {
    if (!url) return '';
    const s = String(url).trim().replace(/^"+|"+$/g, '');
    if (!s) return '';
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
    if (s.startsWith('/')) return `${window.location.origin}${s}`;
    return `${window.location.origin}/${s}`;
  }

  function pickPoster(p) {
    return (
      p?.posterUrl ||
      p?.poster_url ||
      p?.thumbnail ||
      p?.image ||
      p?.image_url ||
      ''
    );
  }

  const rawPoster = pickPoster(data);
  const posterSrc = toAbs(rawPoster);

  return (
    <UpcomingCardContainer onClick={onClick}>
      <Poster
        src={posterSrc || undefined}
        alt={data?.title || 'poster'}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // 깨진 이미지 방지
          e.currentTarget.src =
            'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
        }}
      />
      <Title>{data?.title}</Title>
      <Date>{dayjs(data.date).format('YYYY-MM-DD')}</Date>
    </UpcomingCardContainer>
  );
};

const UpcomingCardContainer = styled.div`
  width: 5rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

const PastCard = ({ data, onClick }) => {
  if (!data) return null;

  // URL 처리 함수
  function toAbs(url) {
    if (!url) return '';
    const s = String(url).trim().replace(/^"+|"+$/g, '');
    if (!s) return '';
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
    if (s.startsWith('/')) return `${window.location.origin}${s}`;
    return `${window.location.origin}/${s}`;
  }

  function pickPoster(p) {
    return (
      p?.posterUrl ||
      p?.poster_url ||
      p?.thumbnail ||
      p?.image ||
      p?.image_url ||
      ''
    );
  }

  const rawPoster = pickPoster(data);
  const posterSrc = toAbs(rawPoster);

  return (
    <PastCardContainer onClick={onClick}>
      <Poster
        src={posterSrc || undefined}
        alt={data?.title || 'poster'}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // 깨진 이미지 방지
          e.currentTarget.src =
            'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
        }}
      />
      <Title>{data?.title}</Title>
      <Date>{dayjs(data.date).format('YYYY-MM-DD')}</Date>
    </PastCardContainer>
  );
};

const PastCardContainer = styled.div`
  width: 5rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

const Poster = styled.img`
  width: 78px;
  height: 104px;
  object-fit: cover;
  border-radius: 5px;
  display: block;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
`;

const Title = styled.div`
  margin-top: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.darkGray};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const Date = styled.div`
  margin-top: 4px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.lightGray};
`;

const DetailVenue = () => {
  const { id } = useParams();
  const venueId = Number(id);
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [upcomingConcerts, setUpcomingConcerts] = useState([]);
  const [pastConcerts, setPastConcerts] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const loadVenueDetail = async () => {
      try {
        const data = await fetchVenueDetail(id);
        console.log('🎯 [공연장 상세] API 응답:', data);

        setVenue(data || null);
        setUpcomingConcerts(
          Array.isArray(data?.upcomingPerformance) ? data.upcomingPerformance : []
        );
        setPastConcerts(
          Array.isArray(data?.pastPerformance) ? data.pastPerformance : []
        );

        try {
          const preview = await fetchReviewPreview(venueId, 2);
          const items = Array.isArray(preview?.items || preview) ? (preview.items || preview) : [];
          setReviews(
            items.slice(0, 2).map((x) => ({
              id: x.id,
              user: { nickname: x.user?.nickname || x.author || '익명', profile_url: x.user?.profile_url || x.profile_url || '' },
              content: x.content ?? '',
              images: Array.isArray(x.images) ? x.images : [],
              created_at: x.created_at,
              like_count: x.like_count ?? 0,
              liked_by_me: x.liked_by_me ?? false,
            }))
          );
        } catch (e) {
          console.warn('⚠️ 리뷰 미리보기 로드 실패:', e);
          setReviews([]);
        }
      } catch (err) {
        console.error('📛 공연장 상세 API 호출 실패:', err);
        setVenue(null);
        setUpcomingConcerts([]);
        setPastConcerts([]);
        setReviews([]);
      }
    };
    loadVenueDetail();
  }, [id, venueId]);

  if (!venue) return <div>로딩 중...</div>;

  return (
    <>
      <Toaster />
      <PageWrapper>
      <Header title={venue.name} />
      <div style={{ height: '16px' }} />
        <ScrollableList>
          <InnerWrapper>
            <ProfileSection>
            <ProfileWrapper>
              <ProfileImage src={venue.image_url || '/default_venue.png'} alt={venue.name || '공연장 이미지'} />
            </ProfileWrapper>
            <ProfileInfo>
              <VenueName>{venue.name || '공연장 이름 없음'}</VenueName>
            </ProfileInfo>
          </ProfileSection>

          <Divider style={{ marginTop: '16px', marginBottom: '16px' }} />

          <InfoSection>
          <LabelRow>
            <Label>인스타그램</Label>
            <Value>
              {venue.instagram_account ? (
                <a href={`https://instagram.com/${venue.instagram_account}`} target="_blank" rel="noreferrer">
                  @{venue.instagram_account}
                </a>
              ) : '정보 없음'}
            </Value>
          </LabelRow>
            
          <LabelRow>
            <Label>주소</Label>
            <Value>{venue.address || '주소 정보 없음'}
              <CopyIcon
                src={IconCopy}
                alt="복사 아이콘"
                onClick={() => {
                  if (venue.address) {
                    navigator.clipboard.writeText(venue.address);
                    toast.success('주소가 복사되었습니다.', {
                      position: 'bottom-center',
                      duration: 2000,
                      style: { marginBottom: '88px' }, 
                      iconTheme: {
                        primary: '#3C9C68', 
                        secondary: '#fff',   
                      },
                    });
                  }
                }}
              />
            </Value>
          </LabelRow>

          <MapView2
            data={
              venue.latitude && venue.longitude
                ? [
                    {
                      name: venue.name,
                      latitude: venue.latitude,
                      longitude: venue.longitude,
                    },
                  ]
                : []
            }
          />

          <PerformanceSection>
            <Label>예정 공연</Label>
            <HorizontalScroll>
              {upcomingConcerts.length > 0 ? (
                upcomingConcerts.map((item) => (
                  <UpcomingCard
                    key={item.id}
                    data={item}
                    onClick={() => navigate(`/performance/${item.id}`)}
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
              {pastConcerts.length > 0 ? (
                pastConcerts.map((item) => (
                  <PastCard
                  key={item.id}
                    data={item}
                    onClick={() => navigate(`/performance/${item.id}`)}
                  />
                ))
              ) : (
                <EmptyMessage>지난 공연 없음</EmptyMessage>
              )}
            </HorizontalScroll>
          </PerformanceSection>

          <Label style={{ marginBottom: '-16px' }}>리뷰</Label>
          <ReviewScrollWrapper>
            <ReviewRow>
              {reviews.length > 0 ? (
                <>
                  {reviews.map((r) => (
                    <ReviewCardWrapper key={r.id}>
                      <ReviewCard
                        review={r}
                        variant="venueDetail"   
                        isLoggedIn={false}    
                        isOwner={false}
                      />
                    </ReviewCardWrapper>
                  ))}

                  <ReviewMoreCard
                    type="button"
                    onClick={() => navigate(`/venue/${venueId}/review`)}
                    aria-label="리뷰 더보기"
                    title="리뷰 더보기"
                  >
                    <ReviewMoreText>리뷰<br />더보기</ReviewMoreText>
                    <ChevronImg src={ChevronRightIcon} alt=">" />
                  </ReviewMoreCard>
                </>
              ) : (
                <>
                  <div style={{ marginTop: '8px', color: '#4B4B4B', fontSize: '14px', lineHeight: '1.4' }}>
                    등록된 리뷰가<br />없습니다.
                  </div>
                  <ReviewMoreCard
                    type="button"
                    onClick={() => navigate(`/venue/${venueId}/review`)}
                    aria-label="리뷰 작성하기"
                    title="리뷰 작성하기"
                  >
                    <ReviewMoreText>리뷰<br />작성하기</ReviewMoreText>
                    <ChevronImg src={ChevronRightIcon} alt=">" />
                  </ReviewMoreCard>
                </>
              )}
            </ReviewRow>
          </ReviewScrollWrapper>
          </InfoSection>
        </InnerWrapper>
        </ScrollableList>
      </PageWrapper>
    </>
  );
};

export default DetailVenue;
