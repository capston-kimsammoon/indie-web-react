import React from 'react';
import styled from 'styled-components';
import IconMore from '../../assets/icons/icon_y_more.svg'
import IconCopy from '../../assets/icons/icon_y_copy.svg';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CardWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-left: 6px;
  box-sizing: border-box;
  border: 1.4px solid rgba(60, 156, 103);
  border-radius: 10px;
  padding: 8px;
`;

const Poster = styled.img`
  width: 90px;
  height: 120px;
  border-radius: 5px;
  object-fit: cover;
`;

const InfoBox = styled.div`
  margin-left: 12px;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 120px;
  min-width: 0;
`;

const TopInfoBox = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.black};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Time = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.darkGray};
  margin-top: 4px;
`;

const BottomInfoBox = styled.div`
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
`;

const RowWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const TextWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
`;

const VenueText = styled.div`
  flex-shrink: 1;
  padding-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.black};
  min-width: 0;
`;

const AddressText = styled.div`
  flex-shrink: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.darkGray};
  min-width: 0;
`;

const FixedIcon = styled.img`
  width: 12px;
  height: 12px;
  margin-left: 6px;
  flex-shrink: 0;
`;

const formatTimeOnly = (timeStr) => {
  if (!timeStr) return '-';
  const [hourStr, minuteStr] = timeStr.split(':');
  const h = parseInt(hourStr, 10);
  const m = parseInt(minuteStr, 10);
  const period = h >= 12 ? '오후' : '오전';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${hour12}시${m === 0 ? '' : ` ${m}분`}`;
};

const MapWideCard = ({ data, noTopPadding = false }) => {
  const navigate = useNavigate();
  const { name, address, upcomingPerformance = [] } = data;
  console.log('🔥 upcomingPerformance:', data.upcomingPerformance);
  const perf = upcomingPerformance[0];

  const handleVenueClick = () => {
    if (data?.venue_id || data?.id) {
      navigate(`/venue/${data.venue_id ?? data.id}`);
    }
  };

  const handleAddressClick = () => {
    const copyTarget = perf?.address ?? address;
    if (copyTarget) {
      navigator.clipboard.writeText(copyTarget).then(() => {
        toast.success('주소가 복사되었습니다.', {
          position: 'bottom-center', 
          duration: 2000,    
          style: {
            marginBottom: '84px',
          },       
          iconTheme: {
            primary: '#3C9C68', 
            secondary: '#FFFFFF', 
          },
        });
      });
    }
  };

  return (
    <CardWrapper $noTopPadding={noTopPadding}>
      <Poster src={perf?.image_url ?? '/default.jpg'} alt="poster" />
      <InfoBox>
        <TopInfoBox>
          <Title>{perf?.title}</Title>
          <Time>{perf?.time ? formatTimeOnly(perf.time) : '-'}</Time>
        </TopInfoBox>

        <BottomInfoBox>
          <RowWrapper onClick={handleVenueClick}>
            <TextWrapper>
              <VenueText>{name}</VenueText>
              <FixedIcon src={IconMore} alt="more" style={{ paddingBottom: '3px' }}/>
            </TextWrapper>
          </RowWrapper>

          <RowWrapper onClick={handleAddressClick}>
            <TextWrapper>
              <AddressText>{perf?.address ?? address ?? '-'}</AddressText>
              <FixedIcon src={IconCopy} alt="copy" style={{ paddingTop: '1px' }}/>
            </TextWrapper>
          </RowWrapper>
        </BottomInfoBox>
      </InfoBox>
    </CardWrapper>
  );
};

export default MapWideCard;
