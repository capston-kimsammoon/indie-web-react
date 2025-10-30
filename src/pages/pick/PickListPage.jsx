// src/pages/pick/PickListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import PickCard from '../../components/performance/Pick/PickCard';
import styled from 'styled-components';
import { fetchMagazineList } from '../../api/magazineApi';

const PickListPage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const [size] = useState(10); // 한 페이지 10개
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadMagazines();
  }, [page]);

  const loadMagazines = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchMagazineList({ page, size });

      const normalizedData = data.map(item => ({
        id: item.id,
        title: item.title ?? '',
        content: item.excerpt ?? item.content ?? '',
        imageUrl: item.coverImageUrl ?? item.cover_image_url ?? item.image_url ?? null,
        author: item.author ?? '관리자',
        createdAt: item.createdAt ?? item.created_at ?? null,
      }));

      setMagazines(normalizedData);

      // 마지막 페이지 판단
      if (data.length < size) {
        setTotalPages(page); // 마지막 페이지
      } else {
        setTotalPages(page + 1); // 다음 페이지 존재 가능성
      }
    } catch (err) {
      console.error('📛 매거진 목록 로딩 실패:', err);
      setError('매거진을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (magazine) => {
    navigate(`/pick/${magazine.id}`, { state: magazine });
  };

  return (
    <PageWrapper>
      <Header
        title="modie 추천공연"
        onMenuClick={() => setIsSidebarOpen(true)}
        showBack={true}
      />
      {isSidebarOpen && <Sidebar onClose={() => setIsSidebarOpen(false)} />}

      <ScrollableContent>
        <ContentContainer>
          {loading && <LoadingMessage>매거진을 불러오는 중...</LoadingMessage>}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {!loading && !error && magazines.length === 0 && (
            <EmptyMessage>아직 등록된 매거진이 없습니다.</EmptyMessage>
          )}

          {!loading && !error && magazines.length > 0 && (
            <>
              <MagazineGrid>
                {magazines.map((magazine) => (
                  <CardWrapper key={magazine.id}>
                    <PickCard
                      id={magazine.id}
                      title={magazine.title}
                      content={magazine.content}
                      imageUrl={magazine.imageUrl}
                      onClick={() => handleCardClick(magazine)}
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

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
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

const ErrorMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #ff4444;
  font-size: 14px;
  text-align: center;
  padding: 0 20px;
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
  margin: 16px 0 8px;

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

export default PickListPage;
