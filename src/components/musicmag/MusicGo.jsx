import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

export default function MusicGo({ artist }) {
  const navigate = useNavigate();

  // artist가 없으면 아무것도 렌더링하지 않음
  if (!artist) return null;

  return (
    <Container>
      <Card onClick={() => navigate(`/artist/${artist.id}`)}>
        <ProfileImage
          src={artist.profileImageUrl || artist.image_url || '/default_profile.png'}
          alt={artist.name}
          onError={(e) => { e.currentTarget.src = '/default_profile.png'; }}
        />
        <ArtistName>{artist.name}</ArtistName>
      </Card>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: ${({ theme }) => theme.colors.bgwhite};
  cursor: pointer;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  border-radius: 10px;
`;

const ProfileImage = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  flex-shrink: 0;
`;

const ArtistName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkblack};
  flex: 1;
`;
