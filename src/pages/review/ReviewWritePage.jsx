// src/pages/review/ReviewWritePage.jsx
import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { createReview } from '../../api/reviewApi';
import { fetchVenueDetail, fetchVenueList } from '../../api/venueApi';
import { fetchUserInfo } from '../../api/userApi';

/* ====== 스타일 정의 (기존 ReviewWritePage와 동일) ====== */
const Page = styled.div`width: 100%; margin: 0 auto; box-sizing: border-box;`;
const Container = styled.div`padding: 0; box-sizing: border-box;`;
const Field = styled.div`margin-top: 16px; display: flex; flex-direction: column; gap: 8px;`;
const TextareaWrap = styled.div`position: relative; border: 1px solid #E4E4E4; border-radius: 12px; background: #fff; padding: 8px; width: 100%; box-sizing: border-box;`;
const Textarea = styled.textarea`width: 100%; border: none; outline: none; resize: none; font-size: 14px; box-sizing: border-box;`;
const AttachRow = styled.div`position: absolute; left: 8px; bottom: 6px; display: flex; align-items: center; gap: 8px;`;
const AttachIconButton = styled.button`width: 28px; height: 28px; border-radius: 6px; border: 1px solid #E4E4E4; background: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;`;
const Hint = styled.span`font-size: 12px; color: #B0B0B0;`;
const HiddenFileInput = styled.input`display: none;`;
const PreviewGrid = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 72px; gap: 8px; margin-top: 12px; box-sizing: border-box;`;
const PreviewItem = styled.div`position: relative; width: 100%; height: 100%; border-radius: 8px; overflow: hidden; border: 1px solid #E4E4E4;`;
const PreviewImg = styled.img`width: 100%; height: 100%; object-fit: cover;`;
const RemoveImgBtn = styled.button`position: absolute; right: 4px; top: 4px; width: 20px; height: 20px; border-radius: 9999px; background: rgba(0,0,0,0.55); color: #fff; border: none; font-size: 14px; line-height: 20px; cursor: pointer;`;
const SubmitBtn = styled.button`
  width: 100%; padding: 14px 0; border-radius: 8px; background: #3C9C68; color: #fff; font-size: 16px; font-weight: 600; border: none; cursor: pointer; margin-top: 16px;
  &:disabled { background: #a6d5bd; cursor: not-allowed; }
`;
const VenueList = styled.ul`padding: 16px; list-style: none; margin: 0;`;
const VenueItem = styled.li`margin: 4px 0;`;
const VenueButton = styled.button`padding: 8px 12px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer; width: 100%; text-align: left;`;

/* ====== 컴포넌트 ====== */
export default function ReviewWritePage() {
  const { id } = useParams();
  const venueIdParam = id ? Number(id) : null;
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [selectedVenue, setSelectedVenue] = useState(venueIdParam ? { id: venueIdParam, name: '' } : null);
  const [venues, setVenues] = useState([]);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const MAX_FILES = 6;
  const MIN_LEN = 1;

  // 로그인 및 venue 정보 로드
  useEffect(() => {
    (async () => {
      try {
        const me = await fetchUserInfo();
        if (!me?.id) {
          navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
          return;
        }
        setIsLoggedIn(true);
      } catch {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
        return;
      }

      if (venueIdParam) {
        // 특정 공연장
        try {
          const v = await fetchVenueDetail(venueIdParam);
          if (v) setSelectedVenue({ id: v.id, name: v.name });
        } catch {
          setSelectedVenue(null);
        }
      } else {
        // 전체 리뷰 -> 공연장 선택
        try {
          const list = await fetchVenueList({ page: 1, size: 100 });
          setVenues(list);
        } catch {
          setVenues([]);
        }
      }
    })();
  }, [venueIdParam, navigate, location.pathname]);

  const title = useMemo(() => selectedVenue ? `${selectedVenue.name} | 리뷰 작성` : '공연장 선택', [selectedVenue]);
  const canSubmit = isLoggedIn && !submitting && content.trim().length >= MIN_LEN;

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const remain = Math.max(0, MAX_FILES - files.length);
    const next = picked.slice(0, remain);
    setFiles([...files, ...next]);
    setPreviews([...previews, ...next.map(f => URL.createObjectURL(f))]);
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
    if (!canSubmit || !selectedVenue) return;
    setSubmitting(true);
    try {
      await createReview(selectedVenue.id, { content: content.trim(), images: files });
      navigate(selectedVenue.id ? `/venue/${selectedVenue.id}/review` : `/reviews`, { replace: true });
    } catch (e) {
      console.error('리뷰 등록 실패:', e);
      alert('리뷰 등록에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // venue 선택 UI
  if (!selectedVenue) {
    return (
      <Page>
        <Header title="공연장 선택" />
        {venues.length === 0 ? <p style={{ padding: 16 }}>불러오는 중…</p> : (
          <VenueList>
            {venues.map(v => (
              <VenueItem key={v.id}>
                <VenueButton type="button" onClick={() => setSelectedVenue({ id: v.id, name: v.name })}>
                  {v.name}
                </VenueButton>
              </VenueItem>
            ))}
          </VenueList>
        )}
      </Page>
    );
  }

  // 리뷰 작성 폼
  return (
    <Page>
      <Header title={title} />
      <div style={{ height: "13px" }} />
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
              <AttachIconButton type="button" onClick={() => fileRef.current?.click()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <PreviewImg src={src} alt="" />
                  <RemoveImgBtn type="button" onClick={() => removeFileAt(idx)}>×</RemoveImgBtn>
                </PreviewItem>
              ))}
            </PreviewGrid>
          )}
        </Field>
        <SubmitBtn type="button" disabled={!canSubmit} onClick={onSubmit}>리뷰 등록</SubmitBtn>
      </Container>
    </Page>
  );
}
