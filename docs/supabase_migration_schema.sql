-- ==========================================
-- Firebase to Supabase 마이그레이션 스키마
-- ==========================================

-- 1. 구직자 신청서 테이블 (jobSeekers)
CREATE TABLE job_seekers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    grade TEXT NOT NULL,
    school TEXT NOT NULL,
    skills TEXT NOT NULL,
    availability TEXT NOT NULL CHECK (availability IN ('full-time', 'part-time', 'volunteer')),
    resume_url TEXT DEFAULT '',
    resume_file_name TEXT DEFAULT '',
    approved BOOLEAN DEFAULT FALSE,
    rejected BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 기업 채용공고 테이블 (jobPostings)
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT DEFAULT '',
    salary TEXT DEFAULT '',
    job_type TEXT NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
    industry TEXT DEFAULT '',
    contact_email TEXT NOT NULL,
    contact_phone TEXT DEFAULT '',
    approved BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    applications INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 구인공고 지원서 테이블 (jobApplications)
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    cover_letter TEXT DEFAULT '',
    resume_url TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    status_notes TEXT DEFAULT '',
    status_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 추천서 테이블 (recommendation_letters)
CREATE TABLE recommendation_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    recommender_name TEXT NOT NULL,
    recommender_email TEXT NOT NULL,
    recommender_position TEXT NOT NULL,
    relationship TEXT NOT NULL,
    recommendation_text TEXT NOT NULL,
    reference_file_url TEXT DEFAULT '',
    reference_file_name TEXT DEFAULT '',
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 이벤트 테이블 (events)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('job-fair', 'workshop', 'seminar', 'networking')),
    max_participants INTEGER DEFAULT 0,
    organizer TEXT NOT NULL,
    agenda JSONB DEFAULT '[]',
    benefits JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 이벤트 참가 신청 테이블 (eventRegistrations)
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    grade TEXT DEFAULT '',
    school TEXT DEFAULT '',
    motivation TEXT DEFAULT '',
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 커뮤니티 게시글 테이블 (posts)
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'job-tips', 'experiences', 'questions', 'announcements')),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 게시글 댓글 테이블
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 봉사활동 공고 테이블 (volunteerPostings)
CREATE TABLE volunteer_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT DEFAULT '',
    time_commitment TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT DEFAULT '',
    approved BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    applications INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 봉사활동 지원서 테이블
CREATE TABLE volunteer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_posting_id UUID REFERENCES volunteer_postings(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    motivation TEXT NOT NULL,
    availability TEXT NOT NULL,
    experience TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 활동 로그 테이블
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 사이트 콘텐츠 설정 테이블
CREATE TABLE site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT NOT NULL UNIQUE,
    content JSONB NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. 디자인 설정 테이블
CREATE TABLE design_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_type TEXT NOT NULL CHECK (setting_type IN ('colors', 'fonts', 'images')),
    settings JSONB NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 인덱스 생성 (성능 최적화)
-- ==========================================

-- 자주 조회되는 컬럼들에 인덱스 생성
CREATE INDEX idx_job_seekers_email ON job_seekers(email);
CREATE INDEX idx_job_seekers_approved ON job_seekers(approved);
CREATE INDEX idx_job_seekers_created_at ON job_seekers(created_at DESC);

CREATE INDEX idx_job_postings_approved ON job_postings(approved);
CREATE INDEX idx_job_postings_industry ON job_postings(industry);
CREATE INDEX idx_job_postings_created_at ON job_postings(created_at DESC);

CREATE INDEX idx_job_applications_job_posting_id ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_email ON job_applications(email);
CREATE INDEX idx_job_applications_status ON job_applications(status);

CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_type ON events(type);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_email ON event_registrations(email);

CREATE INDEX idx_community_posts_approved ON community_posts(approved);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);

CREATE INDEX idx_volunteer_postings_approved ON volunteer_postings(approved);
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ==========================================
-- Row Level Security (RLS) 정책
-- ==========================================

-- RLS 활성화
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (승인된 데이터만)
CREATE POLICY "Public can view approved job seekers" ON job_seekers FOR SELECT USING (approved = true);
CREATE POLICY "Public can view approved job postings" ON job_postings FOR SELECT USING (approved = true);
CREATE POLICY "Public can view approved events" ON events FOR SELECT USING (true);
CREATE POLICY "Public can view approved posts" ON community_posts FOR SELECT USING (approved = true);
CREATE POLICY "Public can view approved volunteer postings" ON volunteer_postings FOR SELECT USING (approved = true);

-- 삽입 정책 (모든 사용자 가능)
CREATE POLICY "Anyone can submit job seeker application" ON job_seekers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit job posting" ON job_postings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit job application" ON job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit reference" ON recommendation_letters FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can register for events" ON event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit community post" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit volunteer application" ON volunteer_applications FOR INSERT WITH CHECK (true);

-- ==========================================
-- 초기 데이터 삽입
-- ==========================================

-- 사이트 기본 콘텐츠
INSERT INTO site_content (section, content, updated_by) VALUES
('homepage', '{"title": "캐나다 학생 취업 플랫폼", "subtitle": "뉴브런즈윅 주 고등학생을 위한 전문 구직 서비스"}', 'system'),
('about', '{"content": "저희는 캐나다 뉴브런즈윅 주의 고등학생들이 성공적인 진로를 찾을 수 있도록 돕는 플랫폼입니다."}', 'system');

-- 기본 디자인 설정
INSERT INTO design_settings (setting_type, settings, updated_by) VALUES
('colors', '{"primary": "#0ea5e9", "secondary": "#64748b", "accent": "#f59e0b", "background": "#f8fafc"}', 'system'),
('fonts', '{"bodyFont": "Inter", "headingFont": "Inter", "bodySize": 16, "headingSize": 24, "lineHeight": 1.6}', 'system');

-- ==========================================
-- 함수 및 트리거 (자동 업데이트)
-- ==========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_job_seekers_updated_at BEFORE UPDATE ON job_seekers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recommendation_letters_updated_at BEFORE UPDATE ON recommendation_letters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteer_postings_updated_at BEFORE UPDATE ON volunteer_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteer_applications_updated_at BEFORE UPDATE ON volunteer_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_design_settings_updated_at BEFORE UPDATE ON design_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 