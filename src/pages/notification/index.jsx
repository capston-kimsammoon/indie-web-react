// src/pages/notification/NotificationPage.jsx
import React, { useEffect, useState } from 'react';
import styles from './notification.module.css';
import styled from 'styled-components';
import NotificationCard from '../../components/notification/NotificationCard';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import {
  fetchNotifications,
  markNotificationRead,
  removeNotification,
} from '../../api/alertApi';

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const list = await fetchNotifications();
      setNotifications(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // 최초 로드
    const t = setInterval(load, 10000); // 10초 폴링
    return () => clearInterval(t);
  }, []);

  const handleRemove = async (id) => {
    try {
      await removeNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error('알림 삭제 실패:', e);
    }
  };

  const handleClick = async (n) => {
    // 1) 읽음 처리(낙관적 업데이트)
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
    );
    try {
      if (!n.is_read) await markNotificationRead(n.id);
    } catch (e) {
      console.warn('읽음 처리 실패(무시 가능):', e);
    }

    // 2) 이동 경로 계산: link_url 우선, 없으면 payload.performance_id 사용
    let href = n?.link_url;

    // payload 기반 폴백
    if (!href) {
      const perfId = n?.payload?.performance_id;
      if (perfId) href = `/performance/${perfId}`;
    }

    if (!href) return; // 이동할 곳 없으면 종료

    // 절대 URL이면 풀 리로드, 상대경로면 SPA navigate
    if (/^https?:\/\//i.test(href)) {
      window.location.href = href;
    } else {
      navigate(href);
    }
  };

  return (
    <PageWrapper>
      <Header title="알림" showBack showSearch={false} />
      <div style={{ height: 30 }} />

      <ScrollableList>
        <div className={styles.container}>
          {loading ? (
            <div className={styles.empty}>불러오는 중…</div>
          ) : notifications.length === 0 ? (
            <EmptyMessage>새 알림이 없습니다.</EmptyMessage>
          ) : (
            <div className={styles.list}>
              {notifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  content={n.body} // 본문
                  highlight={n.title} // 파란 굵은 텍스트
                  isRead={!!n.is_read} // 읽음 스타일
                  onClick={() => handleClick(n)} // 카드 클릭 → 이동
                  onRemove={() => handleRemove(n.id)} // X 클릭 → 삭제
                />
              ))}
            </div>
          )}
        </div>
      </ScrollableList>
    </PageWrapper>
  );
}

export default NotificationPage;

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

const EmptyMessage = styled.div`
  padding: 16px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.darkGray};
  display: flex;
  justify-content: center; 
  align-items: center;  
`;
