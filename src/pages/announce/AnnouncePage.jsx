import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from "../../components/layout/Header";

function AnnouncePage() {
  const navigate = useNavigate(); 

  return (
    <PageWrapper>
      <Header title="공지사항" />
      <div style={{ height: "16px" }} />
      
      <ScrollableList>
        <EmptyMessage>아직 등록된 공지사항이 없습니다.</EmptyMessage>
      </ScrollableList>
    </PageWrapper>
  );
}

export default AnnouncePage;

const EmptyMessage = styled.div`
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;  
`;

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const ScrollableList = styled.div`
  padding-bottom: 109px;
  flex-grow: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none; 
  }

  -ms-overflow-style: none; 
  scrollbar-width: none;

  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;
