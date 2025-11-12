// ✅ src/pages/artist/ArtistListPage.jsx
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import ArtistListCardLike from '../../components/artist/ArtistListCardLike.js';
import { fetchArtistList } from '../../api/artistApi';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 20;

export default function ArtistListPage() {
  const [artists, setArtists] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  // ==== 스크롤 저장/복원 ====
  const scrollerRef = useRef(null);
  const restoringRef = useRef(false);
  const savedAnchorRef = useRef({ anchorId: null, anchorOffset: 0 });
  const rafSaveRef = useRef(null);
  const STORAGE_KEY = 'artist:list';

  const loadArtists = async (append = false) => {
    try {
      const { artists: chunk } = await fetchArtistList({ page, size: PAGE_SIZE });
      const list = Array.isArray(chunk) ? chunk : [];
      if (append) setArtists((prev) => [...prev, ...list]);
      else setArtists(list);
      setHasMore(list.length >= PAGE_SIZE);
      // console.log(`🎯 [아티스트 목록] page=${page}, count=${list.length}`);
    } catch (err) {
      console.error('📛 아티스트 목록 API 호출 실패:', err);
      setArtists([]);
    }
  };

  useEffect(() => {
    if (restoringRef.current) return;
    loadArtists(page > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ==== 첫 가시 카드(앵커) 계산 ====
  const getFirstVisibleAnchor = () => {
    const sc = scrollerRef.current;
    if (!sc) return null;
    const items = Array.from(sc.querySelectorAll('[data-artist-id]'));
    const scRect = sc.getBoundingClientRect();
    for (const el of items) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > scRect.top) {
        const topInScroller = rect.top - scRect.top + sc.scrollTop;
        return {
          anchorId: el.getAttribute('data-artist-id'),
          anchorOffset: sc.scrollTop - topInScroller,
        };
      }
    }
    return null;
  };

  // ==== 스크롤 상태 저장 ====
  const saveStateToSession = () => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const anchor = getFirstVisibleAnchor();
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        scrollTop: sc.scrollTop,
        page,
        anchorId: anchor?.anchorId ?? null,
        anchorOffset: anchor?.anchorOffset ?? 0,
        ts: Date.now(),
      }),
    );
  };

  const handleScrollSave = () => {
    if (rafSaveRef.current) return;
    rafSaveRef.current = requestAnimationFrame(() => {
      rafSaveRef.current = null;
      saveStateToSession();
    });
  };

  // ==== 최초 마운트: 저장된 page 수만큼 순차 로드 후 위치 복구 ====
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const { scrollTop = 0, page: savedPage = 1, anchorId = null, anchorOffset = 0 } = JSON.parse(saved);
      restoringRef.current = true;
      savedAnchorRef.current = { anchorId, anchorOffset };

      (async () => {
        setArtists([]);
        let lastPageLen = PAGE_SIZE;
        for (let i = 1; i <= savedPage; i++) {
          const { artists: chunk } = await fetchArtistList({ page: i, size: PAGE_SIZE });
          const list = Array.isArray(chunk) ? chunk : [];
          lastPageLen = list.length;
          setArtists((prev) => (i === 1 ? list : [...prev, ...list]));
          // DOM 그려질 프레임 보장
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => requestAnimationFrame(r));
        }

        const sc = scrollerRef.current;
        if (sc) {
          const { anchorId: AID, anchorOffset: AO } = savedAnchorRef.current;
          if (AID) {
            const el = sc.querySelector(`[data-artist-id="${CSS.escape(String(AID))}"]`);
            if (el) {
              const rect = el.getBoundingClientRect();
              const scRect = sc.getBoundingClientRect();
              const topInScroller = rect.top - scRect.top + sc.scrollTop;
              sc.scrollTop = Math.max(0, topInScroller + AO);
            } else {
              sc.scrollTop = Math.max(0, Math.min(scrollTop, sc.scrollHeight - sc.clientHeight));
            }
          } else {
            sc.scrollTop = Math.max(0, Math.min(scrollTop, sc.scrollHeight - sc.clientHeight));
          }
        }

        setPage(savedPage);
        setHasMore(lastPageLen >= PAGE_SIZE);
        restoringRef.current = false;
      })();
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==== 언마운트/탭 전환 시 저장 ====
  useEffect(() => {
    const onHide = () => saveStateToSession();
    const onVis = () => { if (document.visibilityState === 'hidden') saveStateToSession(); };
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      saveStateToSession();
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY, page]);

  return (
    <PageWrapper>
      <Header title="아티스트" initialSearchTab="아티스트" />
      <div style={{ height: "16px" }} />
      <ScrollableList ref={scrollerRef} onScroll={handleScrollSave}>
        {artists.length > 0 ? (
          <Container>
            {artists.map((artist) => (
              <CardWrapper
                key={artist.id}
                data-artist-id={artist.id}
                onClick={() => { saveStateToSession(); navigate(`/artist/${artist.id}`); }}>
                <ArtistListCardLike artist={artist} />
              </CardWrapper>
            ))}
            {hasMore && (
              <MoreButton
                onClick={() => setPage((prev) => {
                  const next = prev + 1;
                  queueMicrotask(saveStateToSession);
                  return next;
                })}
              >
                더보기
              </MoreButton>
            )}
          </Container>
        ) : (
          <Empty>해당되는 아티스트가 없습니다.</Empty>
        )}
      </ScrollableList>
    </PageWrapper>
  );
}

const Container = styled.div`display:flex; flex-direction:column;`;

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const ScrollableList = styled.div`
  padding-top: 24px;
  margin-bottom: 109px;
  flex-grow: 1;
  overflow-y: auto;

  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;

  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

const CardWrapper = styled.div`
  cursor: pointer;
  caret-color: transparent;
`;

const Empty = styled.div`
  padding: 24px;
  text-align: center;
`;

const MoreButton = styled.button`
  width: 100%;
  height: 48px;
  margin-bottom: 16px;
  background-color: ${({ theme }) => theme.colors.bgWhite};
  color: ${({ theme }) => theme.colors.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.outlineGray};
  border-radius: 8px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
`;
