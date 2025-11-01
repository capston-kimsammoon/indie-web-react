import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import { fetchMusicMagazineDetail } from '../../api/musicMagazineApi';
import theme from '../../styles/theme';

const DetailMusicmag = () => {
  const { id } = useParams();

  const [magazine, setMagazine] = useState({
    id,
    title: '',
    author: '',
    createdAt: '',
    coverImageUrl: '',
    blocks: [],
  });

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        const data = await fetchMusicMagazineDetail(id);
        if (!mounted) return;

        setMagazine({
          id: data.id,
          title: data.title,
          author: data.author,
          createdAt: data.createdAt,
          coverImageUrl: data.coverImageUrl,
          blocks: data.blocks,
        });
      } catch (err) {
        console.error('📛 매거진 상세 조회 실패:', err);
      }
    })();

    return () => { mounted = false; };
  }, [id]);

  const formatKST = (d) => {
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).format(date);
    } catch { return ''; }
  };

  const blocks = magazine.blocks || [];

  // ✅ map 밖에서 한 번만 계산
  const semititleBlocks = blocks.filter(b => b.type === 'text' && b.semititle && !b.value);
  const firstSemititleOrder = semititleBlocks.length
    ? Math.min(...semititleBlocks.map(b => b.display_order))
    : null;

  return (
    <PageWrapper>
      <Header title="음악 매거진" />

      <ScrollableList>
        <Title>{magazine.title}</Title>
        <Time>{formatKST(magazine.createdAt)} {magazine.author}</Time>
        <Divider />

        {blocks.map((b) => {
          const type = b.type;

          // 🔹 이미지
          if (type === 'image' && b.imageUrl) {
            return (
              <ImageBlock key={b.id} align={b.align ?? 'center'}>
                <img src={b.imageUrl} alt={b.caption ?? magazine.title} />
              </ImageBlock>
            );
          }

          // 🔹 텍스트 (세미타이틀만 있는 경우)
          if (type === 'text' && b.semititle && !b.value) {
            const addMarginTop = b.display_order !== firstSemititleOrder;
            return <Semititle key={b.id} addMarginTop={addMarginTop}>{b.semititle}</Semititle>;
          }

          // 🔹 텍스트 (본문)
          if (type === 'text' && b.value && !b.semititle) {
            return <TextBlock key={b.id}>{b.value}</TextBlock>;
          }

          // 🔹 구분선
          if (type === 'divider') {
            return <Divider key={b.id} />;
          }

          return null;
        })}
      </ScrollableList>
    </PageWrapper>
  );
};

export default DetailMusicmag;

const PageWrapper = styled.div`
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 8px 128px 8px;
  box-sizing: border-box;

  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none; 
  scrollbar-width: none;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

const Title = styled.h1`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.darkblack};
  text-align: center;
  line-height: 1.1;
  margin: 8px 0 8px 0;
`;

const Time = styled.div`
  text-align: right;
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.lightGray};
`;

const Divider = styled.hr`
  height: 1px;
  background: ${({ theme }) => theme.colors.outlineGray};
  border: 0;
`;

const Semititle = styled.h2`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.darkblack};
  margin-top: 24px; 
`;

const TextBlock = styled.p`
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.darkblack};
  line-height: 1.35;
  white-space: pre-wrap;
  margin-bottom: 12px;
`;

const ImageBlock = styled.figure`
  text-align: ${({ align }) => align || 'center'};

  img {
    display: block;
    width: 80%;
    max-width: 600px;
    height: auto;
    border-radius: 16px;
    margin-left: auto;
    margin-right: auto;
  }
`;
