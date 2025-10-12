import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from "../../components/layout/Header";
import ReviewCardAll from '../../components/review/ReviewCardAll';
import {
  fetchAllReviews,          // GET  /venue/reviews?page=&size=&order=
  // 아래 둘/셋은 프로젝트에 맞게 구현해두었으면 import만 바꿔 쓰면 돼요.
  toggleReviewLike,             // DELETE /venue/review/:id/like
  deleteReview            // DELETE /venue/review/:id
} from '../../api/reviewApi'; // 경로는 프로젝트 구조에 맞게 조정
import { fetchUserInfo } from '../../api/userApi';

/* ===================== 스타일 ===================== */
const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
`;

const Heading = styled.h1`
  font-size: 20px;
  font-weight: 700;
  margin: 10 0 12px 0;
`;

const SubBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const Stat = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #3C9C68;  
`;

const AllText = styled.span`
  color: #4B4B4B;       /* All은 검정색 */
`;

const CountText = styled.span`
  color: #3C9C68;    /* 숫자는 초록색 */
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

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
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

const EmptyMessage = styled.div`
  margin-top: 16px;
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.themePink};
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
  margin-bottom: 12px;
`;

const Skeleton = styled.div`
  height: 132px;
  border-radius: 10px;
  border: 1px solid #eee;
  background: linear-gradient(90deg,#fafafa 0%,#f3f4f6 50%,#fafafa 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  @keyframes shimmer {
    0% { background-position: 0% 0; }
    100% { background-position: -200% 0; }
  }
`;

const ScrollableList = styled.div`
  padding-bottom: 116px;
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

export default function AllReview({
  // prop으로 들어오면 우선 사용하고, 없으면 fetchUserInfo로 채움
  isLoggedIn: isLoggedInProp = undefined,
  currentUserId: currentUserIdProp = null,
}) {
  const navigate = useNavigate();            // ✅ 추가
  const location = useLocation();            // ✅ 추가

  // 로그인/내ID 상태 (prop이 오면 그걸 우선 사용)
  const [isLoggedIn, setIsLoggedIn] = useState(!!isLoggedInProp);
  const [currentUserId, setCurrentUserId] = useState(currentUserIdProp);

  // 목록/페이지 상태
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // 로그인 정보 로드 (prop 없을 때만)
  useEffect(() => {
    if (isLoggedInProp !== undefined) {
      setIsLoggedIn(!!isLoggedInProp);
      setCurrentUserId(currentUserIdProp ?? null);
      return;
    }
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
  }, [isLoggedInProp, currentUserIdProp]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / (size || 1))),
    [total, size]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const safeOrder = order === 'asc' ? 'asc' : 'desc';
      const res = await fetchAllReviews({ page, size, order: safeOrder });
      setItems(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch (e) {
      console.error('[AllReview] list error:', e);
      setErr('리뷰 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [page, size, order]);

  useEffect(() => { load(); }, [load]);

  // ✅ 좋아요 토글 (VenueReviewListPage와 동일한 흐름)
  const handleToggleLike = useCallback(async (reviewId, nextLiked) => {
    if (!isLoggedIn) {
      // 전체 리뷰 페이지 경로로 redirect 유지
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    // 1) 낙관적 업데이트
    setItems(prev => prev.map(it => {
      if (it.id !== reviewId) return it;
      const base = it.like_count ?? 0;
      return {
        ...it,
        like_count: Math.max(0, base + (nextLiked ? 1 : -1)),
        liked_by_me: nextLiked,
      };
    }));

    try {
      // 2) 서버 토글 (백엔드 시그니처: (id, isCurrentlyLiked))
      const data = await toggleReviewLike(reviewId, !nextLiked);

      // 3) 서버 값으로 보정
      setItems(prev => prev.map(it => {
        if (it.id !== reviewId) return it;
        return {
          ...it,
          like_count: typeof data?.like_count === 'number' ? data.like_count : it.like_count,
          liked_by_me: typeof data?.liked_by_me === 'boolean' ? data.liked_by_me : it.liked_by_me,
        };
      }));
    } catch (e) {
      console.error('[AllReview] like toggle failed:', e);
      // 4) 실패 롤백
      setItems(prev => prev.map(it => {
        if (it.id !== reviewId) return it;
        const base = it.like_count ?? 0;
        return {
          ...it,
          like_count: Math.max(0, base + (nextLiked ? -1 : 1)),
          liked_by_me: !nextLiked,
        };
      }));
      alert('좋아요 처리 중 오류가 발생했어요.');
    }
  }, [isLoggedIn, navigate, location.pathname]);

  // 삭제 (기존 그대로)
  const handleDelete = useCallback(async (id) => {
    if (!isLoggedIn) return;
    const ok = window.confirm('이 리뷰를 삭제할까요?');
    if (!ok) return;

    const prev = items;
    setItems(prev.filter(it => it.id !== id));
    setTotal(t => Math.max(0, t - 1));

    try {
      await deleteReview(id);
    } catch (e) {
      console.error('[AllReview] delete failed:', e);
      alert('삭제 중 오류가 발생했어요.');
      setItems(prev);
      setTotal(t => t + 1);
    }
  }, [isLoggedIn, items]);

  const rangeText = useMemo(() => {
    if (!total) return '0';
    const start = (page - 1) * size + 1;
    const end = Math.min(total, page * size);
    return `${start}–${end}`;
  }, [page, size, total]);

  return (
    <PageWrapper>
       <Header title='공연장 리뷰' />
       <div style={{ height: "32px" }} />
      {err && <ErrorBox role="alert">{err}</ErrorBox>}

      <SubBar>
        <Stat>
          <AllText>All </AllText>
          <CountText>{total}</CountText>
      </Stat>
        <Controls>
          <select
            aria-label="정렬"
            value={order}
            onChange={(e) => { setPage(1); setOrder(e.target.value === 'asc' ? 'asc' : 'desc'); }}
          >
            <option value="desc">최신순</option>
            <option value="asc">오래된순</option>
          </select>
        </Controls>
      </SubBar>

      {loading ? (
        <>
          <Skeleton /><Skeleton /><Skeleton />
        </>
      ) : items.length === 0 ? (
        <EmptyMessage>아직 작성된 리뷰가 없습니다.</EmptyMessage>
      ) : (
        <ScrollableList>
          <List>
            {items.map((rv) => (
              <ReviewCardAll
                key={rv.id}
                review={rv}
                isLoggedIn={isLoggedIn}                                 
                isOwner={!!currentUserId && rv?.user?.id === currentUserId}
                onToggleLike={handleToggleLike}
                onDelete={handleDelete}
              />
            ))}
          </List>

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
        </ScrollableList>
      )}
    </PageWrapper>
  );
}
