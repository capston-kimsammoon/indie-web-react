// src/pages/musicmag/MusicmagListPage.jsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import MusicCard from '../../components/musicmag/MusicCard';
import { fetchMusicMagazineList } from '../../api/musicMagazineApi';
import { useNavigate } from 'react-router-dom';

const MusicmagListPage = () => {
  const navigate = useNavigate();
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const [size] = useState(10); // 한 페이지 10개
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadMagazines();
  }, [page]);

  const loadMagazines = async () => {
    try {
      setLoading(true);
      const data = await fetchMusicMagazineList({ page, size });
      console.log("📦 서버에서 받은 응답:", data);

      // normalized data
      const normalizedData = data.map((item) => ({
        id: item.id,
        title: item.title ?? '',
        excerpt: item.excerpt ?? item.content ?? '',
        coverImageUrl: item.coverImageUrl ?? item.cover_image_url ?? item.image_url ?? null,
      }));

      setMagazines(normalizedData);

      // 마지막 페이지 판단
      if (data.length < size) {
        setTotalPages(page); // 마지막 페이지
      } else {
        setTotalPages(page + 1); // 다음 페이지 존재 가능성
      }
    } catch (err) {
      console.error('📛 음악 매거진 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Header title="모디의 디깅" />

      <ScrollableContent>
        <ContentContainer>
          {loading && <LoadingMessage>로딩 중...</LoadingMessage>}

          {!loading && magazines.length === 0 && (
            <EmptyMessage>아직 등록된 음악 매거진이 없습니다.</EmptyMessage>
          )}

          {!loading && magazines.length > 0 && (
            <>
              <MagazineGrid>
                {magazines.map((mag) => (
                  <CardWrapper key={mag.id}>
                    <MusicCard
                      id={mag.id}
                      title={mag.title}
                      text={mag.excerpt}
                      coverImageUrl={mag.coverImageUrl}
                      onClick={() => navigate(`/musicmagazine/${mag.id}`)}
                    />
                  </CardWrapper>
                ))}
              </MagazineGrid>

              <Pager>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  ←
                </button>
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  →
                </button>
              </Pager>
            </>
          )}
        </ContentContainer>
      </ScrollableContent>
    </PageWrapper>
  );
};

export default MusicmagListPage;

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

const ContentContainer = styled.div`
  padding: 40px 0 120px;
  min-height: calc(100% - 120px);
  box-sizing: border-box;
`;

const MagazineGrid = styled.div`
  display: flex;
  flex-direction: column;
`;

const CardWrapper = styled.div`
  width: 100%;
  margin-bottom: -28px;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #666;
  font-size: 14px;
`;

const EmptyMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #999;
  font-size: 14px;
`;

const Pager = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-top: -4px;
  margin-bottom: 12px;

  button {
    min-width: 36px;
    height: 32px;
    border: 1px solid #3C9C68;
    border-radius: 8px;
    background: #3C9C68;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
      background: #e5e7eb;
      border-color: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
    }
  }
`;
