// src/utils/dateUtils.js

// ISO 문자열 → Date 객체 (안전 파서)
export function parseDateTime(value) {
  if (!value) return null;
  // 'YYYY-MM-DD'만 오면 로컬 자정으로 보정
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** 내부용: HH:MM -> HH:MM:00 보정 */
function normalizeTime(t) {
  if (!t) return '00:00:00';
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return t; // 이미 HH:MM:SS면 그대로
}

/** 내부용: time이 비었거나 00:00(또는 00:00:00)인지 */
function isZeroTime(t) {
  if (!t) return true;
  return /^0{2}:0{2}(:0{2})?$/.test(t.trim());
}

/**
 * 날짜/시간 문자열을 "YYYY-MM-DD (요일) 오전/오후 N시"로 포맷
 * ex) 2025-09-25T19:00:00 → "2025-09-25 (목) 오후 7시"
 */
export function formatKoreanDateTime(value) {
  const dt = parseDateTime(value);
  if (!dt) return '';

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[dt.getDay()];

  let hour = dt.getHours();
  const ampm = hour < 12 ? '오전' : '오후';
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;

  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} (${weekday}) ${ampm} ${displayHour}시`;
}

/** 날짜만: "YYYY-MM-DD (요일)" */
export function formatKoreanDateOnly(value) {
  const dt = parseDateTime(value);
  if (!dt) return '';
  const weekdays = ['일','월','화','수','목','금','토'];
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const weekday = weekdays[dt.getDay()];
  return `${yyyy}-${mm}-${dd} (${weekday})`;
}

export function formatKoreanFlexible(dateStr, timeStr) {
  // ISO에 시간이 포함된 경우
  if (dateStr && typeof dateStr === 'string' && dateStr.includes('T')) {
    const dt = parseDateTime(dateStr);
    if (!dt) return '';
    const hh = dt.getHours();
    const mm = dt.getMinutes();
    return (hh === 0 && mm === 0)
      ? formatKoreanDateOnly(dateStr)
      : formatKoreanDateTime(dateStr);
  }
  // date + time 분리인 경우
  if (isZeroTime(timeStr)) {
    return formatKoreanDateOnly(dateStr);
  }
  return formatKoreanFromParts(dateStr, timeStr);
}

/* date + time이 분리되어 오는 경우 */
export function formatKoreanFromParts(dateStr, timeStr) {
  if (!dateStr) return '';

  const dt = parseDateTime(dateStr);
  if (!dt) return '';

  const weekdays = ['일','월','화','수','목','금','토'];
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const weekday = weekdays[dt.getDay()];

  // 내부 헬퍼: 시/분 포맷
  function _formatFromNumbers(hourNum, minuteNum) {
    if (Number.isNaN(hourNum) || Number.isNaN(minuteNum)) return '';

    const ampm = hourNum >= 12 ? '오후' : '오전';
    const displayHour = hourNum % 12 || 12;

    // 분이 0이면 생략, 0이 아니면 그대로 표시
    const minutePart = minuteNum > 0 ? ` ${minuteNum}분` : '';

    return `${ampm} ${displayHour}시${minutePart}`;
  }

  // dateStr이 ISO 문자열(T 포함)이면 시/분만 사용
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    const dtIso = parseDateTime(dateStr);
    if (!dtIso) return '';
    return `${yyyy}-${mm}-${dd} (${weekday}) ` + _formatFromNumbers(dtIso.getHours(), dtIso.getMinutes());
  }

  // timeStr 처리
  const t = normalizeTime(timeStr); // "HH:MM:SS"
  const [hour, minute] = t.split(':').map((v) => parseInt(v, 10));

  return `${yyyy}-${mm}-${dd} (${weekday}) ` + _formatFromNumbers(hour, minute);
}
