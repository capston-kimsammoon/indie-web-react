// src/components/artist/ArtistListCard.js
import React from 'react';
import styled from 'styled-components';
import HeartButton from '../common/HeartButton';
import NotifyButton from '../common/NotifyButton';

export default function ArtistListCard({
  artist,
  onToggleLike,
  onToggleAlarm,
}) {
  if (!artist) return null;

  const { id, name, profile_url, image_url, isLiked, isAlarmEnabled } = artist;
  const avatar =
    (profile_url && profile_url.trim()) ||
    (image_url && image_url.trim()) ||
    '/default_profile.png';

  return (
    <Row>
      {/* 왼쪽: 아바타 */}
      <Left>
        <Avatar
          src={avatar}
          alt={name ?? '아티스트'}
          referrerPolicy="no-referrer"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith('/default_profile.png')) {
              e.currentTarget.src = '/default_profile.png';
            }
          }}
        />
      </Left>

      {/* 가운데: 정보 */}
      <Center>
        <Name>{name ?? '이름 없음'}</Name>
      </Center>

      {/* 오른쪽: 알림 + 하트 */}
      <Right onClick={(e) => e.stopPropagation()}>
        <NotifyButton
          isNotified={!!isAlarmEnabled}
          onClick={() => onToggleAlarm?.(id, !!isAlarmEnabled)}
          label="" // 텍스트 없이 아이콘만
        />
        <HeartButton
          isLiked={isLiked ?? true} // 찜 목록이므로 기본 true
          onClick={() => onToggleLike?.(id, isLiked ?? true)} // 언라이크용
        />
      </Right>
    </Row>
  );
}

/* ===== styles ===== */
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  background: ${({ theme }) => theme.colors.bgWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineGray};
`;

const Left = styled.div`
  flex: 0 0 auto;
`;

const Avatar = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
`;

const Center = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

const Name = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.black};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
`;
