// ✅ src/pages/pick/PickDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import styled from 'styled-components';
import styles from './pickDetail.module.css';

// ✅ 매거진 API 연결
import { fetchMagazineDetail } from '../../api/magazineApi';

// [FAKE] 홈에서 넘어온 state가 없을 때를 대비한 폴백 데이터
const FAKE_PICK_BY_ID = {
  '1': {
    id: 1,
    title: 'Wow, Rich한 자신감으로 돌아온 aespa의 [Rich Man]',
    author: '김삼문관리자',
    createdAt: '2025-09-10T14:36:00+09:00',
    imageUrl: 'https://image.inews24.com/v1/dd35d151442f69.jpg',
    content: [
      'aespa가 거침없는 에너지와 ‘싹 맏’ 밴드 사운드를 담은 미니 6집 [Rich Man]으로 돌아왔어요! 다들 들어보셨나요? 😊',
      '타이틀곡은 ‘Rich Man’. 멤버의 단단하고 톡톡 튀는 톤에서 느껴지는 자신감이 인상적이고, 후렴 처음 등장할 때는 터치 트레몰로를 활용한 딜레이 사운드 같은 느낌이 있었습니다.',
      '…',
      '그래서 제가 가져온 이번 주의 추천 공연 첫 번째는요… 바로 이번주 금요일, 언클잭드 홍대에서 열리는 공연입니다.',
      '권진아밴드, 델마늘, 시오.\n여름밤에 핏덩어리로 오신다면, 어쿠스틱만 봐도 저는 벌써부터 가슴이 뛰어요. 저는 마지막 사운지 ‘신의 무지갯샘’을 편답니다. 사운지 보컬은 ‘주식’인데…',
      '이번 주의 추천 공연,\n마음 속에서 곡과 곡 사이를 연결해 함께 바라요! 인디붐온다!'
    ].join('\n\n'),
  },
};

const PickDetailPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { state } = useLocation();
  const { id } = useParams();

  // ✅ API에서 가져온 실제 데이터 저장 (blocks 포함)
  const [pick, setPick] = useState({
    ...(state ?? FAKE_PICK_BY_ID[String(id)] ?? {
      id,
      title: '제목이 없습니다',
      author: '김삼문관리자',
      createdAt: new Date().toISOString(),
      imageUrl: '',
      content: '내용이 없습니다.',
    }),
    blocks: [], // 🔑 블록 전체 저장
  });

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        // ✅ 항상 상세 API 호출하여 blocks 포함한 실제 데이터 확보
        const data = await fetchMagazineDetail(id);

        if (!mounted) return;

        setPick((prev) => ({
          ...prev,
          id: data?.id ?? prev.id,
          title: data?.title ?? prev.title ?? '',
          author: data?.author ?? prev.author ?? '관리자',
          createdAt: data?.createdAt ?? data?.created_at ?? prev.createdAt ?? '',
          // 썸네일로 쓰는 imageUrl은 홈 카드 전용 → 상세에서는 사용하지 않음
          imageUrl:
            data?.coverImageUrl ??
            data?.cover_image_url ??
            data?.image_url ??
            prev.imageUrl ??
            '',
          // 블록 전체를 그대로 저장 (순서/정렬/타입 그대로)
          blocks: Array.isArray(data?.blocks) ? data.blocks : [],
          content: prev.content,
        }));
      } catch (err) {
        console.error('📛 매거진 상세 조회 실패:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const formatKST = (d) => {
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  };

  // ✅ 텍스트 블록 내 개행을 단락으로 변환
  const renderParagraphs = (text, keyPrefix) =>
    String(text)
      .split(/\n{2,}/)
      .map((para, i) =>
        para.trim() ? (
          <p key={`${keyPrefix}-${i}`}>{para}</p>
        ) : (
          <div key={`${keyPrefix}-${i}`} className={styles.spacer} />
        )
      );

  // ✅ blocks를 order 값 순서대로 정렬
  const sortedBlocks = Array.isArray(pick.blocks)
    ? pick.blocks.slice().sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    : [];

  return (
    <PageWrapper>
      <Header title="modie 추천공연" onMenuClick={() => setIsSidebarOpen(true)} />
      {isSidebarOpen && <Sidebar onClose={() => setIsSidebarOpen(false)} />}

      <ScrollableList>
        <main className={styles.page}>
          {/* 제목 */}
          <h1 className={styles.title}>{pick.title}</h1>
  
          {/* 메타 + 구분선 */}
          <div className={styles.meta}>
            {formatKST(pick.createdAt)} {pick.author}
          </div>
          <div className={styles.hr} />
  
          {/* ✅ 블록을 순서대로 그대로 렌더링 */}
          {sortedBlocks.length > 0 && (
            <section className={styles.blocks}>
              {sortedBlocks.map((b) => {
                const type = b?.type;
  
                if (type === 'image') {
                  const src = b?.imageUrl || b?.image_url;
                  if (!src) return null;
                  const align = (b?.align ?? b?.meta?.align ?? 'center').toLowerCase();
                  return (
                    <figure
                      key={`img-${b.id}`}
                      className={styles.blockImage}
                      data-align={['left', 'center', 'right'].includes(align) ? align : 'center'}
                    >
                      <img src={src} alt={b?.caption ?? pick.title} />
                    </figure>
                  );
                }
  
                if (type === 'text' && b?.text) {
                  return (
                    <div key={`txt-${b.id}`} className={styles.blockText}>
                      {renderParagraphs(b.text, `txt-${b.id}`)}
                    </div>
                  );
                }
  
                if (type === 'quote' && b?.text) {
                  return (
                    <blockquote key={`q-${b.id}`} className={styles.blockQuote}>
                      “{b.text}”
                    </blockquote>
                  );
                }
  
                if (type === 'divider') {
                  return <hr key={`hr-${b.id}`} className={styles.blockDivider} />;
                }
  
                // embed 등은 필요 시 확장
                return null;
              })}
            </section>
          )}
        </main>
      </ScrollableList>
    </PageWrapper>
  );
};


const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    display: none; 
  }

  -ms-overflow-style: none; 
  scrollbar-width: none;

  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

export default PickDetailPage;
