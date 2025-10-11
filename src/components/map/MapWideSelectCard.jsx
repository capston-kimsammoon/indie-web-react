// src/pages/map/components/MapWideSelectCard.jsx

import React from 'react';
import styled from 'styled-components';
import MapWideCard from './MapWideCard';

const Wrapper = styled.div`
  display: flex;
  width: calc(100% - 4px);
  justify-content: center;
  border-radius: 10px;
  box-sizing: border-box;
  caret-color: transparent;
  cursor: default;
`;

const MapWideSelectCard = ({
  name,
  address,
  poster,
  upcomingPerformance,
  venue_id,
}) => {
  return (
    <Wrapper>
      <MapWideCard
        data={{
          id: venue_id,
          name,
          address,
          upcomingPerformance: Array.isArray(upcomingPerformance)
            ? upcomingPerformance.filter(Boolean)
            : [],
          image_url: poster,
        }}
        noTopPadding
      />
    </Wrapper>
  );
};

export default MapWideSelectCard;
