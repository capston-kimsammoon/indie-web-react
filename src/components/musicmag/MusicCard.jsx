// src/components/musicmag/MusicCard.jsx
import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const MusicCard = ({ id, title, text, imageUrl, onClick }) => {
  const titleRef = useRef(null);
  const [contentMaxLines, setContentMaxLines] = useState(3);

  useEffect(() => {
    if (!titleRef.current) return;

    const titleElement = titleRef.current;
    const lineHeight = parseFloat(window.getComputedStyle(titleElement).lineHeight);
    const titleHeight = titleElement.offsetHeight;
    const titleLines = Math.round(titleHeight / lineHeight);

    setContentMaxLines(titleLines === 1 ? 4 : 3);
  }, [title]);

  return (
    <Card onClick={onClick}>
      {imageUrl && (
        <ThumbWrap>
          <Thumb src={imageUrl} alt={title} />
        </ThumbWrap>
      )}
      <TextBox>
        <Title ref={titleRef}>{title}</Title>
        <Content $maxLines={contentMaxLines}>{text}</Content>
      </TextBox>
    </Card>
  );
};

export default MusicCard;

const Card = styled.div`
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;

  display: grid;
  grid-template-columns: var(--thumb-w) 1fr;
  align-items: stretch;
  margin-bottom: 56px;

  --thumb-w: 136px;
  --thumb-h: 102px;

  @media (max-width: 360px) {
    --thumb-w: 108px;
    --thumb-h: 76px;
  }
`;

const ThumbWrap = styled.div`
  width: var(--thumb-w);
  height: var(--thumb-h);
  border-radius: 5px;
  overflow: hidden;
  background: #f2f2f2;
`;

const Thumb = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`;

const TextBox = styled.div`
  height: var(--thumb-h);
  overflow: hidden;
  min-width: 0;
  margin-left: 12px;
  position: relative;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2f2f2f;
  margin: 0;
  line-height: 1.4;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Content = styled.p`
  font-size: 14px;
  font-weight: 400;
  color: #4b4b4b;
  margin: 0;
  padding-top: 6px;
  line-height: 1.2;

  display: -webkit-box;
  -webkit-line-clamp: ${({ $maxLines }) => $maxLines};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

