// src/components/performance/NewConcertList.jsx
// NEW 업로드 공연을 가로 스크롤로 보여주는 리스트 컴포넌트야.
// 여기에 아까 만든 ConcertCard를 반복 렌더링할 거야.

import React from 'react';
import styles from './NewConcertList.module.css';
import ConcertCard from './ConcertCard';
import { performanceSampleData } from '../../data/performanceSampleData';
import iconGo from '../../assets/icons/icon_go_hyunjin.svg'; // ✅ 아이콘 import
import { useNavigate } from 'react-router-dom';

const NewConcertList = () => {
  return (
    <div className={styles.sectionContainer}>
      <div className={styles.titleRow}>
        <h2 className={styles.sectionTitle}>NEW 업로드 공연</h2>
        <img src={iconGo} alt="go" className={styles.goIcon} />{' '}
        {/* ✅ 경로 수정 */}
      </div>
      <div className={styles.listContainer}>
        {performanceSampleData.map((item, index) => (
          <ConcertCard
            key={item.id}
            id={item.id}
            title={item.title}
            posterUrl={item.posterUrl}
            place={item.venue}
            date={item.date}
          />
        ))}
      </div>
    </div>
  );
};

export default NewConcertList;
