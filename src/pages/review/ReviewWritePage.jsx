import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { createReview } from '../../api/reviewApi';
import { fetchVenueDetail } from '../../api/venueApi';
import { fetchUserInfo } from '../../api/userApi';

const Page = styled.div`
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
`;

const Container = styled.div`
  padding: 0;   
  box-sizing: border-box;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TextareaWrap = styled.div`
  position: relative;
  border: 1px solid ${({ theme }) => theme.colors?.border || '#E4E4E4'};
  border-radius: 12px;
  background: #fff;
  padding: 12px 12px 36px; /* 하단에 아이콘 자리 */
  width: 100%;
  box-sizing: border-box;
`;

const Textarea = styled.textarea`
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  box-sizing: border-box;   /*  내용+패딩 포함 */
`;

const AttachRow = styled.div`
  position: absolute;
  left: 8px;
  bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AttachIconButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors?.border || '#E4E4E4'};
  background: ${({ theme }) => theme.colors?.white || '#fff'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const Hint = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors?.lightGray || '#B0B0B0'};
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 72px;
  gap: 8px;
  margin-top: 12px;
  box-sizing: border-box; 
`;

const PreviewItem = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors?.border || '#E4E4E4'};
`;

const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveImgBtn = styled.button`
  position: absolute;
  right: 4px;
  top: 4px;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  border: none;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 14px 0;
  border-radius: 8px;
  background: #3C9C68;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  margin-top: 16px;
  box-shadow: none;    /* ✅ 그림자 제거 */
  outline: none;       /* ✅ 포커스시 외곽선 제거 */

  &:disabled {
    background: #a6d5bd;
    cursor: not-allowed;
    box-shadow: none;  /* ✅ 비활성화시에도 그림자 제거 */
  }
`;

export default function ReviewWritePage() {
  const { id } = useParams();
  const venueId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const [venueName, setVenueName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);      // File[]
  const [previews, setPreviews] = useState([]); // string[]
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef(null);
  const MAX_FILES = 6;
  const MIN_LEN = 1;

  // 로그인/공연장명 로드
  useEffect(() => {
    (async () => {
      try {
        const me = await fetchUserInfo();
        setIsLoggedIn(!!me?.id);
        if (!me?.id) {
          // 비로그인 → 로그인으로 보내기
          navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
          return;
        }
      } catch {
        setIsLoggedIn(false);
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
        return;
      }
      try {
        const v = await fetchVenueDetail(venueId);
        setVenueName(v?.name || '');
      } catch {
        setVenueName('');
      }
    })();
  }, [venueId, navigate, location.pathname]);

  const title = useMemo(() => (venueName ? `${venueName} | 리뷰 작성` : '리뷰 작성'), [venueName]);
  const canSubmit = isLoggedIn && !submitting && content.trim().length >= MIN_LEN;

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    const remain = Math.max(0, MAX_FILES - files.length);
    const next = picked.slice(0, remain);

    const nextFiles = [...files, ...next];
    setFiles(nextFiles);

    const nextPreviews = [
      ...previews,
      ...next.map((f) => URL.createObjectURL(f)),
    ];
    setPreviews(nextPreviews);

    // 파일 인풋 초기화 (같은 파일 다시 선택 가능)
    e.target.value = '';
  };

  const removeFileAt = (idx) => {
    const nf = files.slice();
    const np = previews.slice();
    nf.splice(idx, 1);
    URL.revokeObjectURL(np[idx]);
    np.splice(idx, 1);
    setFiles(nf);
    setPreviews(np);
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createReview(venueId, { content: content.trim(), images: files });
      // 완료 후 목록으로
      navigate(`/venue/${venueId}/review`, { replace: true });
    } catch (e) {
      console.error('리뷰 등록 실패:', e);
      alert('리뷰 등록에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Header title={title} />
      <div style={{ height: "6px" }} />

      <Container>
        <Field>
          <TextareaWrap>
            <Textarea
              placeholder="공연장에 대한 솔직한 후기를 남겨주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
            />
            <AttachRow>
              <AttachIconButton
                type="button"
                aria-label="이미지 첨부"
                onClick={() => fileRef.current?.click()}
                title="이미지 첨부"
              >
                {/* 간단한 이미지 아이콘 (SVG) */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="M21 15l-5-5L5 21"></path>
                </svg>
              </AttachIconButton>
              <Hint>{previews.length}/{MAX_FILES}</Hint>
            </AttachRow>
            <HiddenFileInput
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
            />
          </TextareaWrap>

          {previews.length > 0 && (
            <PreviewGrid>
              {previews.map((src, idx) => (
                <PreviewItem key={src}>
                  <PreviewImg src={src} alt={`첨부 이미지 ${idx + 1}`} />
                  <RemoveImgBtn type="button" onClick={() => removeFileAt(idx)} aria-label="이미지 삭제">×</RemoveImgBtn>
                </PreviewItem>
              ))}
            </PreviewGrid>
          )}

          <SubmitBtn type="button" onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? '등록 중…' : '등록'}
          </SubmitBtn>
        </Field>
      </Container>
    </Page>
  );
}
