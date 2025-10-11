// MapPage.jsx
import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import Divider from '../../components/common/Divider';
import ScrollableContainer from '../../components/common/ScrollableContainer';
import MapView from '../../components/map/MapView';
import MapTime from '../../components/map/MapTime';
import MapGrid from '../../components/map/MapGrid';
import styled from 'styled-components';
import axios from 'axios';
import { baseUrl } from '../../api/config';

const MapPage = () => {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  const attachFirstUpcoming = (venueList) => {
    return venueList.map(venue => ({
      ...venue,
      upcomingPerformance: venue.performance.slice(0, 1)
    }));
  };

  // 핀(마커) 클릭 시: 해당 장소만 공연 갱신 + 선택 동기화
  const handleMarkerClick = async (venue) => {
    try {
      const now = new Date();
      const isoNow = now.toISOString();

      const { data: performances } = await axios.get(
        `${baseUrl}/nearby/venue/${venue.venue_id}/performance`,
        { params: { after: isoNow } }
      );
      
      const updatedVenue = {
        ...venue,
        upcomingPerformance: performances.slice(0, 1),
      };

      setSelectedVenue(updatedVenue);
      setSelectedCardId(updatedVenue.venue_id);

      setVenues((prev) =>
        prev.map((v) =>
          v.venue_id === updatedVenue.venue_id ? updatedVenue : v
        )
      );
    } catch (error) {
      console.error('공연 정보 불러오기 실패:', error);
    }
  };

  // 최초 로딩: 내 위치 기준 지도 범위 내 공연장 검색
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setMyLocation({ lat: latitude, lng: longitude });

        const latDelta = 0.009; 
        const lngDelta = 0.012; 
        const sw_lat = latitude - latDelta;
        const sw_lng = longitude - lngDelta;
        const ne_lat = latitude + latDelta;
        const ne_lng = longitude + lngDelta;

        try {
          const { data: nearbyVenues } = await axios.post(
            `${baseUrl}/nearby/performance`,
            {
              sw_lat,
              sw_lng,
              ne_lat,
              ne_lng,
            }
          );
          setVenues(attachFirstUpcoming(nearbyVenues));
        } catch (error) {
          console.error('🎯 근처 공연장 불러오기 실패:', error);
        }
      },
      (err) => {
        console.error('❌ 위치 정보 가져오기 실패:', err);
      }
    );
  }, []);

  return (
    <PageWrapper>
      <Header title="주변 공연" />
      <div style={{ height: "16px" }} />

      <MapView
        data={venues}
        myLocation={myLocation}
        selectedVenue={selectedVenue}
        setSelectedVenue={setSelectedVenue}
        setSelectedCardId={setSelectedCardId}
        handleMarkerClick={handleMarkerClick}
        onSearchInMap={async ({ sw_lat, sw_lng, ne_lat, ne_lng }) => {
          try {
            const { data: venueList } = await axios.post(
              `${baseUrl}/nearby/performance`,
              {
                sw_lat,
                sw_lng,
                ne_lat,
                ne_lng,
              }
            );
            setVenues(attachFirstUpcoming(venueList));
            setSelectedVenue(null);
            setSelectedCardId(null);
          } catch (error) {
            console.error('🎯 지도 내 공연장 불러오기 실패:', error);
          }
        }}
      />

      <MapTime />
      <Divider />

      <ScrollableList>
        <MapGrid
          data={venues}
          selectedCardId={selectedCardId}
          onChangeSelected={(id) => {
            setSelectedCardId(id);
            const found = venues.find((v) => v.venue_id === id) || null;
            setSelectedVenue(found);
          }}
          onSelectVenue={setSelectedVenue}
        />
      </ScrollableList>
    </PageWrapper>
  );
};

export default MapPage;

const PageWrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;  
  overflow-y: auto;
`;

const ScrollableList = styled.div`
  margin-bottom: 110px;
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;
