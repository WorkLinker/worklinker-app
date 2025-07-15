// Firebase to Supabase 데이터 이전 스크립트
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  console.log('필요한 환경 변수:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 컬렉션 이름 매핑 (Firebase → Supabase)
const COLLECTION_MAPPING = {
  'jobSeekers': 'job_seekers',
  'jobPostings': 'job_postings', 
  'jobApplications': 'job_applications',
  'references': 'recommendation_letters', // 주의: 테이블명 변경됨
  'events': 'events',
  'eventRegistrations': 'event_registrations',
  'posts': 'community_posts',
  'contacts': 'activity_logs', // contacts → activity_logs로 임시 저장
  'activityLogs': 'activity_logs',
  'siteContent': 'site_content',
  'designSettings': 'design_settings',
  'volunteerPostings': 'volunteer_postings',
  'volunteerApplications': 'volunteer_applications'
};

// 필드명 변환 함수
function convertFieldNames(data: any, tableName: string): any {
  const converted = { ...data };
  
  // 공통 변환
  if (converted.createdAt) converted.created_at = converted.createdAt;
  if (converted.updatedAt) converted.updated_at = converted.updatedAt;
  if (converted.approvedAt) converted.approved_at = converted.approvedAt;
  if (converted.rejectedAt) converted.rejected_at = converted.rejectedAt;
  
  // 테이블별 특별 변환
  switch (tableName) {
    case 'job_seekers':
      if (converted.resumeUrl) converted.resume_url = converted.resumeUrl;
      if (converted.resumeFileName) converted.resume_file_name = converted.resumeFileName;
      if (converted.rejectionReason) converted.rejection_reason = converted.rejectionReason;
      break;
      
    case 'job_postings':
      if (converted.jobType) converted.job_type = converted.jobType;
      if (converted.contactEmail) converted.contact_email = converted.contactEmail;
      if (converted.contactPhone) converted.contact_phone = converted.contactPhone;
      break;
      
    case 'job_applications':
      if (converted.jobPostingId) converted.job_posting_id = converted.jobPostingId;
      if (converted.coverLetter) converted.cover_letter = converted.coverLetter;
      if (converted.resumeUrl) converted.resume_url = converted.resumeUrl;
      if (converted.statusNotes) converted.status_notes = converted.statusNotes;
      if (converted.statusUpdatedAt) converted.status_updated_at = converted.statusUpdatedAt;
      break;
      
    case 'recommendation_letters':
      if (converted.studentName) converted.student_name = converted.studentName;
      if (converted.studentEmail) converted.student_email = converted.studentEmail;
      if (converted.recommenderName) converted.recommender_name = converted.recommenderName;
      if (converted.recommenderEmail) converted.recommender_email = converted.recommenderEmail;
      if (converted.recommenderPosition) converted.recommender_position = converted.recommenderPosition;
      if (converted.recommendationText) converted.recommendation_text = converted.recommendationText;
      if (converted.referenceFileUrl) converted.reference_file_url = converted.referenceFileUrl;
      if (converted.referenceFileName) converted.reference_file_name = converted.referenceFileName;
      break;
      
    case 'events':
      if (converted.maxParticipants) converted.max_participants = converted.maxParticipants;
      if (converted.createdBy) converted.created_by = converted.createdBy;
      break;
      
    case 'event_registrations':
      if (converted.eventId) converted.event_id = converted.eventId;
      if (converted.participantName) converted.participant_name = converted.participantName;
      if (converted.registeredAt) converted.registered_at = converted.registeredAt;
      break;
      
    case 'community_posts':
      if (converted.authorName) converted.author_name = converted.authorName;
      if (converted.authorEmail) converted.author_email = converted.authorEmail;
      break;
      
    case 'volunteer_postings':
      if (converted.timeCommitment) converted.time_commitment = converted.timeCommitment;
      if (converted.contactEmail) converted.contact_email = converted.contactEmail;
      if (converted.contactPhone) converted.contact_phone = converted.contactPhone;
      break;
      
    case 'volunteer_applications':
      if (converted.volunteerPostingId) converted.volunteer_posting_id = converted.volunteerPostingId;
      if (converted.applicantName) converted.applicant_name = converted.applicantName;
      break;
  }
  
  // Firebase 필드명 제거
  delete converted.createdAt;
  delete converted.updatedAt;
  delete converted.approvedAt;
  delete converted.rejectedAt;
  delete converted.resumeUrl;
  delete converted.resumeFileName;
  delete converted.rejectionReason;
  delete converted.jobType;
  delete converted.contactEmail;
  delete converted.contactPhone;
  delete converted.jobPostingId;
  delete converted.coverLetter;
  delete converted.statusNotes;
  delete converted.statusUpdatedAt;
  delete converted.studentName;
  delete converted.studentEmail;
  delete converted.recommenderName;
  delete converted.recommenderEmail;
  delete converted.recommenderPosition;
  delete converted.recommendationText;
  delete converted.referenceFileUrl;
  delete converted.referenceFileName;
  delete converted.maxParticipants;
  delete converted.createdBy;
  delete converted.eventId;
  delete converted.participantName;
  delete converted.registeredAt;
  delete converted.authorName;
  delete converted.authorEmail;
  delete converted.timeCommitment;
  delete converted.volunteerPostingId;
  delete converted.applicantName;
  
  return converted;
}

// 단일 컬렉션 이전
async function migrateCollection(collectionName: string, documents: any[]) {
  const tableName = COLLECTION_MAPPING[collectionName as keyof typeof COLLECTION_MAPPING];
  
  if (!tableName) {
    console.log(`⚠️  ${collectionName}: 매핑되지 않은 컬렉션 - 건너뜀`);
    return { success: 0, error: 0 };
  }
  
  if (documents.length === 0) {
    console.log(`📭 ${collectionName} → ${tableName}: 데이터 없음 - 건너뜀`);
    return { success: 0, error: 0 };
  }
  
  console.log(`📦 ${collectionName} → ${tableName}: ${documents.length}개 문서 이전 시작...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const doc of documents) {
    try {
      // Firebase ID 제거 및 필드명 변환
      const { id, ...dataWithoutId } = doc;
      const convertedData = convertFieldNames(dataWithoutId, tableName);
      
      // Supabase에 삽입
      const { error } = await supabase
        .from(tableName)
        .insert(convertedData);
      
      if (error) {
        console.error(`  ❌ 문서 삽입 실패 (원본 ID: ${id}):`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`  ❌ 문서 처리 실패 (원본 ID: ${doc.id}):`, error);
      errorCount++;
    }
  }
  
  console.log(`  ✅ ${successCount}개 성공, ❌ ${errorCount}개 실패`);
  return { success: successCount, error: errorCount };
}

// 전체 데이터 이전
async function migrateAllData(backupFilePath: string) {
  console.log('🚀 Firebase → Supabase 데이터 이전 시작...\n');
  
  // 백업 파일 읽기
  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ 백업 파일을 찾을 수 없습니다: ${backupFilePath}`);
    process.exit(1);
  }
  
  const backupContent = fs.readFileSync(backupFilePath, 'utf8');
  const backup = JSON.parse(backupContent);
  
  console.log(`📄 백업 파일: ${backupFilePath}`);
  console.log(`📅 백업 시간: ${backup.metadata.backupTimestamp}`);
  console.log(`📊 총 문서: ${backup.metadata.totalDocuments}개\n`);
  
  // Supabase 연결 테스트
  const { data, error } = await supabase.from('job_seekers').select('id').limit(1);
  if (error) {
    console.error('❌ Supabase 연결 실패:', error.message);
    process.exit(1);
  }
  console.log('✅ Supabase 연결 성공\n');
  
  // 각 컬렉션 이전
  const results: { [key: string]: { success: number; error: number } } = {};
  
  for (const collectionName of Object.keys(backup.data)) {
    const documents = backup.data[collectionName];
    results[collectionName] = await migrateCollection(collectionName, documents);
  }
  
  // 결과 요약
  console.log('\n🎉 데이터 이전 완료!\n');
  console.log('📊 이전 결과 요약:');
  
  let totalSuccess = 0;
  let totalError = 0;
  
  for (const [collection, result] of Object.entries(results)) {
    const tableName = COLLECTION_MAPPING[collection as keyof typeof COLLECTION_MAPPING];
    if (result.success > 0 || result.error > 0) {
      console.log(`  ${collection} → ${tableName}: ✅ ${result.success}개 성공, ❌ ${result.error}개 실패`);
    }
    totalSuccess += result.success;
    totalError += result.error;
  }
  
  console.log(`\n📈 전체 결과: ✅ ${totalSuccess}개 성공, ❌ ${totalError}개 실패`);
  
  if (totalError === 0) {
    console.log('\n🎊 모든 데이터가 성공적으로 이전되었습니다!');
  } else {
    console.log('\n⚠️  일부 데이터 이전에 실패했습니다. 오류를 확인해주세요.');
  }
  
  return { totalSuccess, totalError };
}

// 최신 백업 파일 찾기
function findLatestBackupFile(): string {
  const backupDir = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.error('❌ backups 폴더를 찾을 수 없습니다.');
    process.exit(1);
  }
  
  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('firebase-backup-') && file.endsWith('.json'))
    .sort()
    .reverse(); // 최신 파일이 첫 번째로
    
  if (files.length === 0) {
    console.error('❌ 백업 파일을 찾을 수 없습니다.');
    process.exit(1);
  }
  
  return path.join(backupDir, files[0]);
}

// 스크립트 실행
if (require.main === module) {
  const backupFilePath = process.argv[2] || findLatestBackupFile();
  
  migrateAllData(backupFilePath)
    .then((result) => {
      console.log(`\n✅ 이전 완료: 성공 ${result.totalSuccess}개, 실패 ${result.totalError}개`);
      process.exit(result.totalError > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n❌ 이전 실패:', error);
      process.exit(1);
    });
}

export { migrateAllData }; 