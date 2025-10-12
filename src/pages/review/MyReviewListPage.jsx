// ✅ src/pages/review/MyReviewListPage.jsx
import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Header from '../../components/layout/Header';
import ReviewCard from '../../components/review/ReviewCard';
import { fetchMyReviews, toggleReviewLike, deleteReview } from '../../api/reviewApi';
import { fetchUserInfo } from '../../api/userApi';

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const SubBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const Stat = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #3C9C68;  
`;

const AllText = styled.span`
  color: #4B4B4B;
`;

const CountText = styled.span`
  color: #3C9C68;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  select, button {
    border: 1px solid #e5e7eb;
    background: #fff;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
  }
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

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
`;

const Loader = styled.div`
  padding: 16px 16px;
  text-align: center;
  color: ${({ theme }) => theme.colors?.darkGray || '#666'};
  font-size: ${({ theme }) => theme.fontSizes?.sm || '14px'};
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

const ErrorBox = styled.div`
  padding: 12px 14px;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  margin: 16px 16px 0 16px;
`;

export default function MyReviewListPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const size = 20;
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [order, setOrder] = useState('desc');
  const sentinelRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchUserInfo();
        setIsLoggedIn(!!me?.id);
        setCurrentUserId(me?.id ?? null);
      } catch {
        setIsLoggedIn(false);
        setCurrentUserId(null);
      }
    })();
  }, []);

  const mapReviews = (list) => (list || []).map(x => ({
    id: x.id,
    user: { id: x.user?.id, nickname: x.user?.nickname || '익명', profile_url: x.user?.profile_url || '' },
    content: x.content ?? '',
    images: Array.isArray(x.images) ? x.images : [],
    created_at: x.created_at,
    like_count: x.like_count ?? 0,
    liked_by_me: x.liked_by_me ?? false,
  }));

  const mergeDedupe = (prev, next) => {
    const m = new Map();
    [...next, ...prev].forEach(it => it?.id != null && m.set(it.id, it));
    return [...m.values()];
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setInitialLoading(true);
      setLoadError(null);
      try {
        const res = await fetchMyReviews({ page: 1, size, order });
        const list = Array.isArray(res?.items) ? res.items : [];
        if (!mounted) return;
        setItems(mapReviews(list));
        setTotal(res?.total ?? list.length);
        setPage(2);
        setHasMore(list.length >= size);
      } catch (e) {
        if (!mounted) return;
        setLoadError(e);
        setItems([]);
        setHasMore(false);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [order]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loadError) return;
    setLoadingMore(true);
    try {
      const res = await fetchMyReviews({ page, size, order });
      const list = Array.isArray(res?.items) ? res.items : [];
      setItems(prev => mergeDedupe(prev, mapReviews(list)));
      setPage(p => p + 1);
      if (list.length < size) setHasMore(false);
    } catch (e) {
      setLoadError(e);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, size, hasMore, loadingMore, loadError, order]);

  useEffect(() => {
    if (loadError) return;
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(e => e[0].isIntersecting && loadMore(), { rootMargin: '200px 0px' });
    ob.observe(el);
    return () => ob.disconnect();
  }, [loadMore, loadError]);

  const handleToggleLike = async (reviewId, nextLiked) => {
    if (!isLoggedIn) return;
    try {
      const isCurrentlyLiked = !nextLiked;
      const data = await toggleReviewLike(reviewId, isCurrentlyLiked);
      setItems((prev) =>
        prev.map((it) =>
          it.id === reviewId
            ? {
                ...it,
                like_count:
                  typeof data?.like_count === 'number'
                    ? data.like_count
                    : it.like_count + (nextLiked ? 1 : -1),
                liked_by_me:
                  typeof data?.liked_by_me === 'boolean'
                    ? data.liked_by_me
                    : nextLiked,
              }
            : it
        )
      );
    } catch (e) {
      console.error('좋아요 토글 실패:', e);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!isLoggedIn) return;
    if (!window.confirm('이 리뷰를 삭제하시겠습니까?')) return;
    try {
      await deleteReview(reviewId);
      setItems((prev) => prev.filter((it) => it.id !== reviewId));
      setTotal(t => Math.max(0, t - 1));
    } catch (e) {
      console.error('리뷰 삭제 실패:', e);
      alert('삭제에 실패했습니다.');
    }
  };

  const hasItems = items.length > 0;

  return (
    <PageWrapper>
      <Header title="내 리뷰" />      
      <div style={{ height: "16px" }} />

      {loadError && <ErrorBox role="alert">리뷰를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</ErrorBox>}

      <SubBar>
        <Stat>
          <AllText>My </AllText>
          <CountText>{total}</CountText>
        </Stat>
        <Controls>
          <select
            aria-label="정렬"
            value={order}
            onChange={(e) => setOrder(e.target.value === 'asc' ? 'asc' : 'desc')}
          >
            <option value="desc">최신순</option>
            <option value="asc">오래된순</option>
          </select>
        </Controls>
      </SubBar>

      <ScrollableList>
        {initialLoading && <Loader>불러오는 중…</Loader>}
        {!initialLoading && !loadError && !hasItems && <Empty>작성한 리뷰가 없습니다.</Empty>}

        <List>
          {items.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              variant="full"
              isLoggedIn={isLoggedIn}
              isOwner={r.user?.id && currentUserId && r.user.id === currentUserId}
              onToggleLike={handleToggleLike}
              onDelete={handleDelete}
            />
          ))}
        </List>

        {hasMore && !loadError && <Loader ref={sentinelRef}>더 불러오는 중…</Loader>}
        {!hasMore && hasItems && <Empty>마지막 리뷰입니다.</Empty>}
      </ScrollableList>
    </PageWrapper>
  );
}
