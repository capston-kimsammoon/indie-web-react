import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, BellOff, Heart } from 'lucide-react';
import Searchbar from '../../components/ui/searchbar';
import styled from 'styled-components';
import PostItem from '../../components/ui/postitem';
import Header from '../../components/layout/Header';

// API Import
import {  searchPerformance, searchVenue, searchArtist } from '../../api/searchApi';
import {
  likeArtist,
  unlikeArtist,
  registerArtistAlert,
  cancelArtistAlert,
} from '../../api/likeApi';

/* ===== styles ===== */
const TabRow = styled.div`
  display: flex;
  justify-content: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineGray};
`;

const TabButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ active, theme }) =>
    active ? theme.colors.themeGreen : theme.colors.darkGray};
  border: none;
  border-bottom: ${({ active, theme }) =>
    active ? `1.5px solid ${theme.colors.themeGreen}` : 'none'};
  background-color: transparent;
  cursor: pointer;
`;


function Search() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const keywordFromURL = searchParams.get('keyword') || '';

  const [keyword, setKeyword] = useState(keywordFromURL);
  const [recent, setRecent] = useState([]);
  const [tab, setTab] = useState('공연'); // ✅ 기본값을 '공연'으로 설정

  const [concerts, setConcerts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [artists, setArtists] = useState([]);

  const [alarmState, setAlarmState] = useState({});
  const [likedState, setLikedState] = useState({});

  // 다른 페이지들과 동일: 컴포넌트 상단에서 accessToken 한 번 읽음
  const authToken = localStorage.getItem('accessToken');

  // ---- 헬퍼들 ----
  const ensureHttp = (u) => {
    if (!u) return null;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('//')) return `https:${u}`;
    if (u.startsWith('/')) return `http://localhost:8001${u}`; // 백엔드 상대경로 처리
    return `https://${u}`; // placeholder 같은 문자열 처리
  };

  const formatRange = (startISO, endISO) => {
   if (!startISO && !endISO) return null;

    const toYYYYMMDD = (d) => {
      const date = new Date(d);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;   // 2025-09-25
  };

  return startISO && endISO
    ? `${toYYYYMMDD(startISO)} ~ ${toYYYYMMDD(endISO)}`
    : toYYYYMMDD(startISO || endISO);
  };

  // 공연 → PostItem 포맷 정규화 (이미지/날짜/장소 보강)
  const toPostFromPerformance = (p) => {
    const rawThumb =
      p.poster_url ?? p.posterUrl ?? p.poster ??
      p.image_url ?? p.imageUrl ?? p.image ??
      p.thumbnail_url ?? p.thumbnailUrl ?? p.thumbnail ??
      p.main_image ?? p.mainImage ?? null;

    const start =
      p.start_at ?? p.startAt ??
      p.performance_start_at ?? p.performanceStartAt ??
      p.open_date ?? p.openDate ??
      p.performance_date ?? p.performanceDate ??
      p.date ?? p.startDate ?? null;

    const end =
      p.end_at ?? p.endAt ??
      p.performance_end_at ?? p.performanceEndAt ??
      p.endDate ?? null;

    return {
      id: p.id,
      title: p.title ?? p.performanceTitle ?? p.name ?? '제목 없음',
      content: p.subtitle ?? p.description ?? '',
      thumbnail: ensureHttp(rawThumb) || '/no-image.png',
      dateText: formatRange(start, end),
      author: p.venue_name ?? p.venueName ?? p.venue ?? '',
    };
  };

  const fetchSearchResults = useCallback(async (searchKeyword, currentTab) => {
    if (!searchKeyword) return;

    setConcerts([]);
    setVenues([]);
    setArtists([]);
 

    try {
      if (currentTab === '공연') {
        const res = await searchPerformance({ keyword: searchKeyword, page: 1, size: 10 });
        const uniqueConcerts = Array.from(new Map((res.performances || []).map(p => [p.id, p])).values());
        setConcerts(uniqueConcerts);
      } else if (currentTab === '공연장') {
        const res = await searchVenue({ keyword: searchKeyword, page: 1, size: 10 });
        const uniqueVenues = Array.from(new Map((res.venues || []).map(v => [v.id, v])).values());
        setVenues(uniqueVenues);
      } else if (currentTab === '아티스트') {
        const artistRes = await searchArtist({ keyword: searchKeyword, page: 1, size: 10 });
        setArtists(artistRes);

        // 상태 초기화
        const initialLiked = {};
        const initialAlarm = {};
        artistRes.forEach((artist) => {
          initialLiked[artist.id] = artist.isLiked;
          initialAlarm[artist.id] = artist.isAlarmEnabled;
        });
        setLikedState(initialLiked);
        setAlarmState(initialAlarm);
      } 
    } catch (err) {
      console.error('📛 검색 API 호출 실패:', err);
    }
  }, []);

  // ✅ URL에서 keyword가 있으면 초기 로드
  useEffect(() => {
    if (keywordFromURL) {
      fetchSearchResults(keywordFromURL, '공연');
    }
  }, []);

  const handleSearch = (newKeyword) => {
    setKeyword(newKeyword);
    setRecent((prev) => [newKeyword, ...prev.filter((w) => w !== newKeyword)].slice(0, 10));
    navigate(`/search?keyword=${newKeyword}`, { state: { initialTab: '공연' } });
    fetchSearchResults(newKeyword, '공연'); // ✅ 항상 공연 탭으로 검색
  };

  // ✅ 탭 변경 시 현재 keyword로 검색
  useEffect(() => {
    if (keyword) {
      fetchSearchResults(keyword, tab);
    }
  }, [tab, keyword, fetchSearchResults]);

  // 알림 토글: 다른 상세 페이지들과 동일하게 토큰 스킵 로직 제거
  const handleToggleAlarm = async (artistId) => {
    const isOn = alarmState[artistId];
    try {
      if (isOn) {
        await cancelArtistAlert(artistId, authToken);
      } else {
        await registerArtistAlert(artistId, authToken);
      }
      setAlarmState((prev) => ({ ...prev, [artistId]: !isOn }));
    } catch (err) {
      if (err.response?.status === 409) {
        console.warn('🔔 이미 처리된 상태입니다');
      } else {
        console.error('📛 알림 토글 실패:', err);
      }
    }
  };

  // 찜 토글: 동일하게 스킵 로직 제거
  const handleToggleLike = async (artistId) => {
    const isOn = likedState[artistId];
    try {
      if (isOn) {
        await unlikeArtist(artistId, authToken);
      } else {
        await likeArtist(artistId, authToken);
      }
      setLikedState((prev) => ({ ...prev, [artistId]: !isOn }));
    } catch (err) {
      if (err.response?.status === 409) {
        console.warn('❤️ 이미 처리된 상태입니다');
      } else {
        console.error('📛 찜 토글 실패:', err);
      }
    }
  };

  return (
    <PageWrapper>
      <Header title="검색" showBack initialSearchTab={tab} showSearch={false} />
      <div style={{ height: '16px' }} />

      <Searchbar value={keyword} onChange={(e) => setKeyword(e.target.value)} onSearch={handleSearch} />
    
      <TabRow>
        <TabButton
          active={tab === '공연'}
          onClick={()=>setTab('공연')}>
          공연
        </TabButton>
        <TabButton
          active={tab === '공연장'}
          onClick={()=>setTab('공연장')}>
          공연장
        </TabButton>
        <TabButton
          active={tab === '아티스트'}
          onClick={()=>setTab('아티스트')}>
          아티스트
        </TabButton>
      </TabRow>

      <ScrollableList>
      {/* 공연 */}
      {keyword && tab === '공연' && (
        <div className="search-section">
          <div className="section">
            {concerts.length > 0 ? concerts.map((item) => {
              const postLike = toPostFromPerformance(item);
              return (
                <PostItem
                  key={postLike.id}
                  post={postLike}
                  onClick={() => navigate(`/performance/${item.id}`)}
                />
              );
            }) : <p><strong>{keyword}</strong>와(과) 일치하는 공연이 없습니다.</p>}
          </div>
        </div>
      )}

      {/* 공연장 */}
      {keyword && tab === '공연장' && (
        <div className="search-section">
          <div className="section">
            {venues.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {venues.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => navigate(`/venue/${item.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f2',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={item.image_url || '/no-image.png'}
                      alt={item.name}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '4px',
                        objectFit: 'cover',
                        border: '1px solid #E4E4E4',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#1c1c1e',
                    }}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p><strong>{keyword}</strong>와(과) 일치하는 공연장이 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {/* 아티스트 */}
      {keyword && tab === '아티스트' && (
        <div className="search-section">
          <div className="section">
            {artists.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {artists.map((artist) => (
                  <div 
                    key={artist.id} 
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f2',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={artist.profile_url || artist.image_url || '/default_profile.png'}
                      alt={artist.name}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #E4E4E4',
                      }}
                      onError={(e) => {
                        if (!e.currentTarget.src.endsWith('/default_profile.png')) {
                          e.currentTarget.src = '/default_profile.png';
                        }
                      }}
                    />
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#1c1c1e',
                    }}>
                      {artist.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p><strong>{keyword}</strong>와(과) 일치하는 아티스트가 없습니다.</p>
            )}
          </div>
        </div>
      )}
      </ScrollableList>
    </PageWrapper>
  );
}

export default Search;

const PageWrapper = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
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
