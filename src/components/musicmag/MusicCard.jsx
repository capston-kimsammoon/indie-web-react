import React from 'react';
import styled from 'styled-components';

export default function MusicCard({ id, title, text, coverImageUrl, onClick }) {
  return (
    <Card onClick={onClick}>
      {coverImageUrl && (
        <ThumbWrap>
          <Thumb src={coverImageUrl} alt={title} />
        </ThumbWrap>
      )}
      <TextBox>
        <Title>{title}</Title>
        <Content>{text}</Content>
      </TextBox>
    </Card>
  );
}

const Card = styled.div`
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: grid;
  grid-template-columns: 136px 1fr;
  align-items: stretch;
  margin-bottom: 56px;

  @media (max-width: 360px) {
    grid-template-columns: 108px 1fr;
  }
`;

const ThumbWrap = styled.div`
  width: 136px;
  height: 102px;
  border-radius: 5px;
  overflow: hidden;
  background: #f2f2f2;

  @media (max-width: 360px) {
    width: 108px;
    height: 76px;
  }
`;

const Thumb = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`;

const TextBox = styled.div`
  height: 102px;
  overflow: hidden;
  min-width: 0;
  margin-left: 12px;
  position: relative;

  @media (max-width: 360px) {
    height: 76px;
  }
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2F2F2F;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Content = styled.p`
  font-size: 14px;
  font-weight: 400;
  color: #4B4B4B;
  margin: 0;
  padding-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
