-- 학생 구직 신청 테이블
CREATE TABLE job_seekers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    major TEXT,
    university TEXT,
    graduation_year INTEGER,
    resume_url TEXT,
    resume_file_name TEXT,
    approved BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 채용 공고 테이블
CREATE TABLE job_postings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    location TEXT,
    salary_range TEXT,
    contact_email TEXT,
    approved BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이벤트 테이블
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    organizer TEXT,
    max_participants INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 커뮤니티 게시글 테이블
CREATE TABLE community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    author TEXT NOT NULL,
    author_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활성 이미지 테이블 (디자인 에디터용)
CREATE TABLE active_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    image_name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, image_name)
);

-- 추천서 지원 테이블
CREATE TABLE references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    reference_type TEXT,
    reference_file_url TEXT,
    reference_file_name TEXT,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 봉사활동 공고 테이블
CREATE TABLE volunteer_postings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    description TEXT,
    location TEXT,
    date TIMESTAMP WITH TIME ZONE,
    contact_email TEXT,
    approved BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_views(posting_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE job_postings SET views = views + 1 WHERE id = posting_id;
END;
$$ LANGUAGE plpgsql;

-- 봉사활동 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_volunteer_views(posting_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE volunteer_postings SET views = views + 1 WHERE id = posting_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) 설정
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE references ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_postings ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Everyone can read job_seekers" ON job_seekers FOR SELECT USING (true);
CREATE POLICY "Everyone can read job_postings" ON job_postings FOR SELECT USING (true);
CREATE POLICY "Everyone can read events" ON events FOR SELECT USING (true);
CREATE POLICY "Everyone can read community_posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Everyone can read active_images" ON active_images FOR SELECT USING (true);
CREATE POLICY "Everyone can read references" ON references FOR SELECT USING (true);
CREATE POLICY "Everyone can read volunteer_postings" ON volunteer_postings FOR SELECT USING (true);

-- 삽입 정책 (모든 사용자가 삽입 가능)
CREATE POLICY "Everyone can insert job_seekers" ON job_seekers FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can insert job_postings" ON job_postings FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can insert community_posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can insert active_images" ON active_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can insert references" ON references FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can insert volunteer_postings" ON volunteer_postings FOR INSERT WITH CHECK (true);

-- 업데이트 정책 (모든 사용자가 업데이트 가능)
CREATE POLICY "Everyone can update job_seekers" ON job_seekers FOR UPDATE USING (true);
CREATE POLICY "Everyone can update job_postings" ON job_postings FOR UPDATE USING (true);
CREATE POLICY "Everyone can update events" ON events FOR UPDATE USING (true);
CREATE POLICY "Everyone can update community_posts" ON community_posts FOR UPDATE USING (true);
CREATE POLICY "Everyone can update active_images" ON active_images FOR UPDATE USING (true);
CREATE POLICY "Everyone can update references" ON references FOR UPDATE USING (true);
CREATE POLICY "Everyone can update volunteer_postings" ON volunteer_postings FOR UPDATE USING (true); 