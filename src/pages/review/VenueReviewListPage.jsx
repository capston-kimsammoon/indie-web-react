// ✅ src/pages/review/VenueReviewListPage.jsx
import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import ReviewCard from '../../components/review/ReviewCard';
import { fetchVenueDetail } from '../../api/venueApi';
import { fetchReviews, toggleReviewLike, deleteReview } from '../../api/reviewApi';
import { fetchUserInfo } from '../../api/userApi';

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const ScrollableList = styled.div`
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

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px var(--side) 0;
  margin-bottom: 12px;
`;

const WriteButton = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  border: none;
  background: ${({ disabled }) => (disabled ? '#a6d5bd' : '#3C9C68')};
  color: #fff;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  box-shadow: none;
  outline: none;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 var(--side);
  box-sizing: border-box;
`;

const EmptyMessage = styled.div`
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;  
`;

const Loader = styled.div`
  padding: 16px var(--side);
  text-align: center;
  color: ${({ theme }) => theme.colors?.darkGray || '#666'};
  font-size: ${({ theme }) => theme.fontSizes?.sm || '14px'};
  box-sizing: border-box;
`;

export default function VenueReviewListPage() {
  const { id } = useParams();
  const venueId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const [venueName, setVenueName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const size = 10;
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef(null);

  // API → 화면용 매핑
  const mapReviews = (list) =>
    list.map((x) => ({
      id: x.id,
      user: {
        id: x.user?.id,
        nickname: x.user?.nickname || x.author || '익명',
        profile_url: x.user?.profile_url || x.profile_url || '',
      },
      content: x.content ?? '',
      images: Array.isArray(x.images) ? x.images : [],
      created_at: x.created_at,
      like_count: x.like_count ?? 0,
      liked_by_me: x.liked_by_me ?? false,
    }));

  // 중복 제거 병합
  const mergeDedupe = (prevItems, nextItems) => {
    const map = new Map();
    [...nextItems, ...prevItems].forEach((it) => {
      if (it && it.id != null) map.set(it.id, it);
    });
    return Array.from(map.values());
  };

  // 공연장 이름
  useEffect(() => {
    (async () => {
      try {
        const v = await fetchVenueDetail(venueId);
        setVenueName(v?.name || '');
      } catch {
        setVenueName('');
      }
    })();
  }, [venueId]);

  // 로그인 상태
  useEffect(() => {
    (async () => {
      try {
        const me = await fetchUserInfo();
        if (me?.id) {
          setIsLoggedIn(true);
          setCurrentUserId(me.id);
        } else {
          setIsLoggedIn(false);
          setCurrentUserId(null);
        }
      } catch {
        setIsLoggedIn(false);
        setCurrentUserId(null);
      }
    })();
  }, []);

  // 첫 페이지
  useEffect(() => {
    let mounted = true;
    (async () => {
      setInitialLoading(true);
      try {
        const res = await fetchReviews(venueId, { page: 1, size, order: 'desc' });
        const list = Array.isArray(res?.items || res) ? (res.items || res) : [];
        if (!mounted) return;
        setItems(mapReviews(list));
        setPage(2);
        setHasMore(list.length >= size);
      } catch (e) {
        console.error('리뷰 목록 로드 실패:', e);
        setItems([]);
        setHasMore(false);
      } finally {
        setInitialLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [venueId]);

  // 더 불러오기
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchReviews(venueId, { page, size, order: 'desc' });
      const list = Array.isArray(res?.items || res) ? (res.items || res) : [];
      setItems((prev) => mergeDedupe(prev, mapReviews(list))); // ✅ dedupe
      setPage((p) => p + 1);
      if (list.length < size) setHasMore(false);
    } catch (e) {
      console.error('리뷰 추가 로드 실패:', e);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [venueId, page, size, hasMore, loadingMore]);

  // 무한 스크롤
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // 좋아요
  const handleToggleLike = async (reviewId, nextLiked) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const data = await toggleReviewLike(reviewId, !nextLiked); // 현재 상태 넘김
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

  // 삭제
  const handleDelete = async (reviewId) => {
    if (!isLoggedIn) return;
    if (!window.confirm('이 리뷰를 삭제할까요?')) return;
    try {
      await deleteReview(reviewId);
      setItems((prev) => prev.filter((it) => it.id !== reviewId));
    } catch (e) {
      console.error('리뷰 삭제 실패:', e);
      alert('삭제에 실패했습니다.');
    }
  };

  // 작성
  const goWrite = () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    navigate(`/venue/${venueId}/review/write`);
  };

  const title = useMemo(() => (venueName ? `${venueName} | 리뷰` : '리뷰'), [venueName]);
  const hasItems = items.length > 0;

  return (
    <PageWrapper>
      <Header title={title} />

      <ActionRow>
        <WriteButton onClick={goWrite} disabled={!isLoggedIn}>
          작성하기
        </WriteButton>
      </ActionRow>

      <ScrollableList>
        {initialLoading && <Loader>불러오는 중…</Loader>}
        {!initialLoading && !hasItems && <EmptyMessage>아직 등록된 리뷰가 없습니다.</EmptyMessage>}

        <List>
          {items.map((r) => (
            <ReviewCard
              key={r.id} // ✅ id만 사용 → 중복 key 제거
              review={r}
              variant="full"
              isLoggedIn={isLoggedIn}
              isOwner={r.user?.id && currentUserId && r.user.id === currentUserId}
              onToggleLike={handleToggleLike}
              onDelete={handleDelete}
            />
          ))}
        </List>

        {hasMore && <Loader ref={sentinelRef}>더 불러오는 중…</Loader>}
        {!hasMore && hasItems && <Loader>마지막 리뷰입니다.</Loader>}
      </ScrollableList>
    </PageWrapper>
  );
}
