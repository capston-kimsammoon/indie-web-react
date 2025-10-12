import './postitem.css';
import { MessageCirclePlus } from 'lucide-react';
import { baseUrl } from '../../api/config';
import Divider from '../common/Divider';

const formatDate = (isoDate) => {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return d.toLocaleDateString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
};

// 절대 URL 보정
const resolveThumb = (u) => {
  if (!u) return null;
  if (u.startsWith?.('http')) return u; // 이미 절대 경로
  if (u.startsWith?.('/')) return `${baseUrl}${u}`; // "/static/..." 등
  return `${baseUrl}/static/uploads/${u}`; // 파일명만 온 경우
};

function PostItem({ post, onClick }) {
  if (!post) return null;

  // ✅ 우선순위에 따라 썸네일 URL 추출
  const thumbnailSrc =
    resolveThumb(post.thumbnail_url) ??
    resolveThumb(post.thumbnail_filename) ??
    resolveThumb(post.thumbnail) ??
    resolveThumb(post.image_url) ??
    resolveThumb(post.thumbnailUrl);

  return (
    <>
      <li className="post-item" onClick={onClick}>
        <div className="post-text">
          <div>{post.title || '제목 없음'}</div>
          {!!post.dateText && <div className="date">{post.dateText}</div>}
          {!!post.content && <div>{post.content}</div>}

          <div className="meta">
            {typeof post.commentCount === 'number' && (
              <div className="comment-count">
                <MessageCirclePlus size={16} />
                {post.commentCount}
              </div>
            )}
            {(post.created_at || post.date) && (
              <div>{formatDate(post.created_at ?? post.date)}</div>
            )}
            {!!post.author && <div>{post.author}</div>}
          </div>
        </div>

        {!!thumbnailSrc && (
          <img
            src={thumbnailSrc}
            alt="썸네일"
            className="thumbnail"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </li>
      <Divider />
    </>
  );
}

export default PostItem;
