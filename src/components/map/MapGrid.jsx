// src/components/map/MapGrid.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import MapWideSelectCard from './MapWideSelectCard';

const formatOnlyTime = (timeStr) => {
  if (!timeStr) return '-';
  const [hourStr, minuteStr = '00'] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const period = hour >= 12 ? '오후' : '오전';
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0
    ? `${period} ${formattedHour}시`
    : `${period} ${formattedHour}시 ${minute}분`;
};

const formatKoreanDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date)) return '시간 정보 없음';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? '오후' : '오전';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${y}.${m}.${d} ${period} ${hour}:${min}`;
};

/** ✅ 이제 제어형: selectedCardId, onChangeSelected 을 부모로부터 받는다 */
const MapGrid = ({
  data = [],
  selectedCardId,
  onChangeSelected,
  onSelectVenue,
}) => {
  // 3개 단위로 끊기
  const rows = [];
  for (let i = 0; i < data.length; i += 3) {
    const slice = data.slice(i, i + 3);
    while (slice.length < 3) slice.push(null);
    rows.push(slice);
  }

  if (data.length === 0) {
    return (
      <Container>
        <EmptyMessage>예정 공연이 없습니다</EmptyMessage>
      </Container>
    );
  }

  return (
    <Container>
      {rows.map((rowItems, rowIndex) => {
        const selectedItem = data.find(
          (item) => item?.venue_id === selectedCardId
        );
        const isSelectedInThisRow = rowItems.some(
          (item) => item?.venue_id === selectedCardId
        );

        return (
          <div key={rowIndex}>
            <Row>
              {rowItems.map((item, colIndex) => {
                if (!item) return <CardContainer key={colIndex} />;

                const firstUpcoming = item.upcomingPerformance?.[0];
                const isSelected = item.venue_id === selectedCardId;

                return (
                  <CardContainer key={colIndex}>
                    <MapCard
                      poster={firstUpcoming?.image_url}
                      venue={item.name}
                      time={
                        firstUpcoming
                          ? formatOnlyTime(firstUpcoming.time)
                          : '예정 공연 없음'
                      }
                      onClick={() => {
                        const next = isSelected ? null : item.venue_id;
                        onChangeSelected?.(next); // ✅ 선택 토글은 부모에 위임
                        onSelectVenue?.(item); // ✅ 지도 이동/InfoWindow
                      }}
                      isSelected={isSelected}
                    />
                  </CardContainer>
                );
              })}
            </Row>

            <AnimatePresence initial={false}>
              {isSelectedInThisRow &&
                selectedItem &&
                (() => {
                  const firstUpcoming =
                    selectedItem.upcomingPerformance?.[0] ?? null;
                  return (
                    <motion.div
                      key={`wide-${selectedItem.venue_id}`}
                      layout
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{
                        duration: 0.4,
                        ease: [0.43, 0.13, 0.23, 0.96],
                      }}
                      style={{
                        overflow: 'hidden',
                        width: '100%',
                        padding: '0 4px',
                        marginTop: '12px',
                        boxSizing: 'border-box',
                      }}>
                      <MapWideSelectCard
                        title={firstUpcoming?.title ?? '공연 없음'}
                        time={
                          firstUpcoming?.date
                            ? formatKoreanDateTime(
                                `${firstUpcoming.date}T${
                                  firstUpcoming.time ?? ''
                                }`
                              )
                            : formatOnlyTime(firstUpcoming?.time)
                        }
                        name={selectedItem.name}
                        address={
                          firstUpcoming?.address ?? selectedItem.address ?? '-'
                        }
                        poster={
                          firstUpcoming?.image_url ?? selectedItem.image_url
                        }
                        upcomingPerformance={
                          firstUpcoming ? [firstUpcoming] : []
                        }
                        venue_id={selectedItem.venue_id}
                      />
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </div>
        );
      })}
    </Container>
  );
};

const MapCard = ({ poster, venue, time, onClick, isSelected }) => (
  <CardWrapper onClick={onClick} $isSelected={isSelected}>
    <Poster src={poster} alt={venue} />
    <Venue>{venue}</Venue>
    <Time>{time}</Time>
  </CardWrapper>
);

export default MapGrid;

const Container = styled.div`
  width: 100%;
  position: relative;
  padding: 0 2px 140px 2px; //116
  z-index: 1;
  overflow-x: hidden;
  touch-action: pan-y;
`;

const Row = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 8px;
  touch-action: pan-y; 
  user-select: none;
`;

const CardContainer = styled.div`
  flex: 1; /* width: 30% 대신 flex 사용 */
  max-width: calc(33.333% - 5.33px); /* gap 8px 분배 고려 */
  margin: 0 8px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  caret-color: transparent;
  min-width: 0;
  flex-shrink: 0;
  touch-action: pan-y;
  user-select: none;
`;

const CardWrapper = styled.div`
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 6px; /* 8px → 6px로 줄임 */
  border-radius: 10px;
  cursor: pointer;
  box-sizing: border-box;
  background-color: ${({ $isSelected, theme }) =>
    $isSelected ? 'rgba(60, 156, 103, 0.2)' : 'white'}; 
  position: relative;
  flex-shrink: 0;
`;

const Poster = styled.img`
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 10px;
  object-fit: cover;
  display: block; 
  flex-shrink: 0; 
`;

const Venue = styled.div`
  margin-top: 6px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.black};
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Time = styled.div`
  margin-top: 4px;
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.darkGray};
  line-height: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyMessage = styled.div`
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;  
`;