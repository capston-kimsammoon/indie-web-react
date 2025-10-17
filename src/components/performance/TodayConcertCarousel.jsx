// src/components/performance/TodayConcertCarousel.jsx
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';
import TodayConcertCard from './TodayConcertCard';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { theme } from '../../styles/theme';

const TodayConcertCarousel = forwardRef(({ performances = [], onClickPerformance }, ref) => {
  const sliderRef = useRef();

  useImperativeHandle(ref, () => ({
    next: () => sliderRef.current?.slickNext(),
  }));

  // ✅ 외부 placeholder 도메인이나 빈 값 방어: 항상 정상 이미지가 뜨도록 치환
  const safePoster = (url, seed) =>
    !url || /placeholder\.com/i.test(url)
      ? `https://picsum.photos/seed/${encodeURIComponent(seed || 'today')}/300/400`
      : url;

  // ✅ 공연이 없을 때: 빈 상태 박스 렌더 (null 반환 대신)
  if (!performances || performances.length === 0) {
    const border = theme?.colors?.gray200 ?? '#eee';
    const text = theme?.colors?.gray500 ?? '#666';
    const bg = theme?.colors?.bgWhite ?? '#fff';

    return (
      <div
        style={{
          marginTop: '16px',
          width: '100%',
          overflow: 'visible',
          minHeight: '200px', // ✅ 높이 유지
        }}
      >
        <div
          style={{
            width: '100%',
            minHeight: 180,
            border: `1px solid ${border}`,
            borderRadius: 12,
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: text,
          }}
        >
          당일 예정된 공연이 없습니다. 
        </div>
      </div>
    );
  }

  const settings = {
    dots: performances.length > 1,
    infinite: performances.length > 1,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
    centerMode: true,         
    centerPadding: '24px',     
    autoplay: true,          
    autoplaySpeed: 3000,     
    pauseOnHover: true, 
  };

  return (
    <div
      style={{
        marginTop: '16px',
        width: '100%',
        overflow: 'visible',
        minHeight: '200px', // ✅ 밑변 잘림 방지
      }}
    >
      {performances.length === 1 ? (
        <TodayConcertCard
          key={performances[0].id}
          title={performances[0].title}
          posterUrl={safePoster(performances[0].posterUrl, performances[0].id || performances[0].title)} 
          place={performances[0].venue}
          date={performances[0].date}
          placeColor={theme.colors.gray600}   
          dateColor={theme.colors.gray400}    
          onClick={() => onClickPerformance?.(performances[0].id)}
        />
      ) : (
        <StyledSlider {...settings} ref={sliderRef}>
          {performances.map((item) => (
            <TodayConcertCard
              key={item.id}
              title={item.title}
              posterUrl={safePoster(item.posterUrl, item.id || item.title)} 
              place={item.venue}
              date={item.date}
              placeColor={theme.colors.gray600}  
              dateColor={theme.colors.gray400}  
              onClick={() => onClickPerformance?.(item.id)}
            />
          ))}
        </StyledSlider>
      )}
    </div>
  );
});

export default TodayConcertCarousel;

const StyledSlider = styled(Slider)`
  .slick-prev, .slick-next {
    width: 24px;
    height: 24px;
    z-index: 2;
  }
  .slick-prev {
    left: 8px;   
  }
  .slick-next {
    right: 8px;  
  }
  .slick-prev:before,
  .slick-next:before {
    font-size: 24px;
    color: ${({ theme }) => theme.colors.outlineGray}; 
  }

  .slick-dots {
    display: flex !important;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    max-width: 100%;
    white-space: nowrap;  
    overflow: hidden;     
    padding: 0 16px;      
  }

  .slick-dots li {
    margin: 0 0
  }
  .slick-dots li button:before {
    font-size: 4px;          
    color: ${({ theme }) => theme.colors.black}; 
    opacity: 0.3;            
  }
  .slick-dots li.slick-active button:before {
    color: ${({ theme }) => theme.colors.black}; 
    opacity: 0.6;
  }
`;
