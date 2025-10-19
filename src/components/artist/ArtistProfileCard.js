// ✅ components/artist/ArtistProfileCard.js
import styled from 'styled-components';

export default function ArtistProfileCard({ artist, onClick, showName = false }) {
  const safeImage =
    artist?.image_url && artist.image_url.trim() !== ''
      ? artist.image_url
      : '/default_profile.png';

  return (
    <Card onClick={onClick}>
      <ImageWrapper>
        <ProfileImage
          src={safeImage}
          alt={artist?.name || '아티스트'}
          onError={(e) => {
            if (e.target.src !== window.location.origin + '/default_profile.png') {
              e.target.src = '/default_profile.png';
            }
          }}
        />
      </ImageWrapper>

      {showName && <Name title={artist?.name || ''}>{artist?.name || '이름 없음'}</Name>}
    </Card>
  );
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 4rem;
  cursor: pointer;
`;

const ImageWrapper = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  box-sizing: border-box;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center; 
  display: block;
  border: none;
  box-sizing: border-box;
  transform: translateZ(0); 
  -webkit-backface-visibility: hidden;
`;

const Name = styled.div`
  margin-top: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.darkGray};
  max-width: 4rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
