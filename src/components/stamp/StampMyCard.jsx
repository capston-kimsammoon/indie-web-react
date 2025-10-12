// src/components/stamp/StampMyCard.jsx
import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

export default function StampMyCard({ id, posterUrl, title, venue, date }) {

  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/performance/${id}`);  
  };

   return (
    <CardWrapper onClick={handleClick}>
      <Poster src={posterUrl} alt={title} />
      <Info>
        <Title>{title}</Title>
        <Venue>{venue}</Venue>
        <Date>{date}</Date>
      </Info>
    </CardWrapper>
  );
}

const CardWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 160px;
  background:  ${({ theme }) => theme.colors.bgwhite};
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  border-radius: 10px;
  display: flex;
  padding: 8px; 
  box-sizing: border-box;
  cursor: pointer;

   &:hover {
    background: ${({ theme }) => theme.colors.bgLightGray};
  }
`;

const Poster = styled.img`
  width: 20vw; 
  max-width: 5rem; 
  height: auto; 
  object-fit: cover;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 16px; 
`;

const Title = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: 24px;
  color: ${({ theme }) => theme.colors.black};

  display: -webkit-box;        
  -webkit-line-clamp: 3;        
  -webkit-box-orient: vertical; 
  overflow: hidden;            
  text-overflow: ellipsis;     
`;

const Venue = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 20px;
  color: ${({ theme }) => theme.colors.black};
  margin-top: 4px;

  display: -webkit-box;        
  -webkit-line-clamp: 1;        
  -webkit-box-orient: vertical; 
  overflow: hidden;            
  text-overflow: ellipsis; 
`;

const Date = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 20px;
  color: ${({ theme }) => theme.colors.darkGray};
  margin-top: 4px;
`;
