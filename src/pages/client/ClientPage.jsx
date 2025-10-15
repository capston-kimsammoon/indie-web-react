import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from "../../components/layout/Header";

function ClientPage() {
  const navigate = useNavigate(); 

  return (
    <PageWrapper>
      <Header title="고객센터" />
      <div style={{ height: "16px" }} />
      
      <ScrollableList>
        <EmptyMessage>
          공연장 및 아티스트 등록, 불편사항 등 모든 문의사항은
          <br />
          인스타그램 @modiemodie_ 또는 메일 kimthreemun@gmail.com 으로 문의부탁드립니다.
        </EmptyMessage>
      </ScrollableList>
    </PageWrapper>
  );
}

export default ClientPage;

const EmptyMessage = styled.div`
  padding: 16px 0;
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
