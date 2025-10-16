import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

export default function StampMyCard({ id, posterUrl, title, venue, date }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/performance/${id}`);
  };

  return (
    <Card onClick={handleClick}>
      <LeftSection>
        <Poster src={posterUrl} alt={title} />
        <Info>
          <Title>{title}</Title>
          <Venue>{venue}</Venue>
          <Date>{date}</Date>
        </Info>
      </LeftSection>
    </Card>
  );
}

const Card = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.bgwhite};
  cursor: pointer;
  position: relative;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  border-radius: 10px;
  padding: 8px; 
`;

const LeftSection = styled.div`
  display: flex;
`;

const Poster = styled.img`
  width: 20vw;
  max-width: 5rem;
  height: auto;
  aspect-ratio: 0.8;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  object-fit: cover;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  margin: 8px 0;
  margin-left: 12px;
  flex: 1;
`;

const Title = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.black};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
`;

const Venue = styled.div`
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.black};
`;

const Date = styled.div`
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.darkGray};
`;
