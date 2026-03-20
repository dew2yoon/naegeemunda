-- entries 테이블
CREATE TABLE entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  font_family TEXT NOT NULL DEFAULT 'Noto Sans KR',
  font_size   TEXT NOT NULL DEFAULT '15px',
  photos      TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 접근
CREATE POLICY "Users can CRUD own entries"
  ON entries FOR ALL
  USING (auth.uid() = user_id);

-- 최신순 조회 인덱스
CREATE INDEX entries_user_created ON entries(user_id, created_at DESC);

-- interview_sessions 테이블 (Phase 3에서 사용)
CREATE TABLE interview_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword     TEXT NOT NULL,
  questions   TEXT[] NOT NULL,
  answers     TEXT[] NOT NULL,
  photos      JSONB DEFAULT '[]',
  font_family TEXT NOT NULL DEFAULT 'Noto Sans KR',
  font_size   TEXT NOT NULL DEFAULT '15px',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own interview_sessions"
  ON interview_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX interview_sessions_user_created ON interview_sessions(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- Storage: entry-photos 버킷 RLS 정책
-- Supabase 대시보드 > Storage > entry-photos 버킷이 이미 생성된 상태에서 실행
-- ─────────────────────────────────────────────────────────────────

-- 인증된 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY "Authenticated users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'entry-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 인증된 사용자는 자신의 파일만 삭제 가능
CREATE POLICY "Authenticated users can delete own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'entry-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 공개 읽기 (버킷이 public 설정이면 이 정책 없어도 됨 — 안전망으로 추가)
CREATE POLICY "Public read entry photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'entry-photos');
