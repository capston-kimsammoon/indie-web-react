// src/components/stamp/StampPopup.jsx

import React from "react";
import styled from "styled-components";
import CloseIcon from "../../assets/icons/icon_close.svg"; 
import StampCard from "./StampCard";

const formatDate = (isoDate) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }); 
};

export default function StampPopup({ onClose, stamps, onStampSelect }) {
  const list = Array.isArray(stamps) ? stamps : [];

  const grouped = list.reduce((acc, s) => {
    const dayKey = s.date ? s.date.split("T")[0] : "unknown"; 
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <ModalBackground>
      <PopupContainer>
        <FixedHeader>
          <CloseButton onClick={onClose}>
            <img src={CloseIcon} alt="닫기" />
          </CloseButton>
        </FixedHeader>

        <ScrollArea isEmpty={sortedDates.length === 0}>
          {sortedDates.map((day) => (
            <DateSection key={day}>
              <DateTitle>{formatDate(day)}</DateTitle>
              <CardGrid>
                {grouped[day].map((s) => (
                  <StampCard
                    key={s.id}
                    id={s.id}
                    posterUrl={s.posterUrl}
                    venue={s.venue}
                    onClick={() => onStampSelect?.(s)}
                  />
                ))}
              </CardGrid>
            </DateSection>
          ))}

          {sortedDates.length === 0 && (
            <Empty>표시할 공연이 없습니다.</Empty>
          )}
        </ScrollArea>
      </PopupContainer>
    </ModalBackground>
  );
}

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 68px;                      /* ✅ 하단바 높이만큼 제외 */
  display: flex;
  justify-content: center;           /* ✅ 좌우 중앙 */
  align-items: center;               /* ✅ 상하 중앙 (하단바 제외한 영역 기준) */
  padding: 16px;
  background: rgba(0,0,0,.2);
  z-index: 9999;
  overscroll-behavior: none;
  touch-action: none;
`;

const PopupContainer = styled.div`
  position: relative;
  margin: 0 auto;
  height: 93%;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 56px auto 0;        
  background: ${({ theme }) => theme.colors.bgWhite};       
  border-radius: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overscroll-behavior: none;
`;

const FixedHeader = styled.div`
  position: relative;
  height: 60px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.popGray};
  border-radius: 10px 10px 0 0;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  img { 
    width: 28px; 
    height: 28px; 
    display: block; 
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: ${({ isEmpty }) => (isEmpty ? "hidden" : "auto")};
  overflow-x: hidden;
  padding: 8px 16px 0 16px;
  display: ${({ isEmpty }) => (isEmpty ? "flex" : "block")};
  justify-content: ${({ isEmpty }) => (isEmpty ? "center" : "initial")};
  align-items: ${({ isEmpty }) => (isEmpty ? "center" : "initial")};
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior: contain;
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr); 
  column-gap: 20px; 
  row-gap: 32px;
  padding: 0;
`;

const Empty = styled.div`
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;
`;

const DateSection = styled.div`
  margin-bottom: 24px;
`;

const DateTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.themeGreen};
  margin-bottom: 16px;
`;
