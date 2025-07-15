#!/usr/bin/env npx tsx

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBzy34Qfj6ESjm5cvHazgktCad1DHu71uo",
  authDomain: "client-web-d9c86.firebaseapp.com",
  projectId: "client-web-d9c86",
  storageBucket: "client-web-d9c86.appspot.com",
  messagingSenderId: "1036185501709",
  appId: "1:1036185501709:web:711bdf1a5473b73fffd544"
};

// Supabase 설정
const supabaseUrl = 'https://bphskpqfvatrjvbwrddf.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // 실제 키로 교체 필요

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Supabase 초기화
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupFirebaseData() {
  console.log('🔥 Firebase 테스트 데이터 정리 시작...');
  
  const collections = [
    'jobSeekers',
    'jobPostings', 
    'events',
    'communityPosts',
    'volunteerPostings',
    'volunteerApplications',
    'jobApplications',
    'references'
  ];

  for (const collectionName of collections) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      console.log(`📋 ${collectionName}: ${querySnapshot.size}개 문서 발견`);
      
      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnapshot.id));
        console.log(`🗑️ 삭제됨: ${collectionName}/${docSnapshot.id}`);
      }
      
      console.log(`✅ ${collectionName} 컬렉션 정리 완료`);
    } catch (error) {
      console.error(`❌ ${collectionName} 정리 오류:`, error);
    }
  }
}

async function cleanupSupabaseData() {
  console.log('💾 Supabase 테스트 데이터 정리 시작...');
  
  const tables = [
    'job_seekers',
    'job_postings',
    'events', 
    'community_posts',
    'volunteer_postings',
    'volunteer_applications',
    'job_applications',
    'recommendation_letters'
  ];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id');
        
      if (error) {
        console.log(`⚠️ ${tableName} 테이블이 존재하지 않거나 접근할 수 없습니다`);
        continue;
      }
      
      console.log(`📋 ${tableName}: ${data?.length || 0}개 레코드 발견`);
      
      if (data && data.length > 0) {
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제
          
        if (deleteError) {
          console.error(`❌ ${tableName} 삭제 오류:`, deleteError);
        } else {
          console.log(`✅ ${tableName} 테이블 정리 완료`);
        }
      }
    } catch (error) {
      console.error(`❌ ${tableName} 정리 오류:`, error);
    }
  }
}

async function cleanupStorageFiles() {
  console.log('📁 Supabase 스토리지 파일 정리 시작...');
  
  try {
    // 업로드된 파일들 목록 조회
    const { data: files, error: listError } = await supabase.storage
      .from('uploads')
      .list();
      
    if (listError) {
      console.log('⚠️ 스토리지 버킷에 접근할 수 없습니다:', listError.message);
      return;
    }
    
    console.log(`📋 uploads 버킷: ${files?.length || 0}개 파일 발견`);
    
    if (files && files.length > 0) {
      const fileNames = files.map(file => file.name);
      
      const { error: deleteError } = await supabase.storage
        .from('uploads')
        .remove(fileNames);
        
      if (deleteError) {
        console.error('❌ 스토리지 파일 삭제 오류:', deleteError);
      } else {
        console.log('✅ 스토리지 파일 정리 완료');
      }
    }
  } catch (error) {
    console.error('❌ 스토리지 정리 오류:', error);
  }
}

async function main() {
  console.log('🧹 테스트 데이터 정리 시작...\n');
  
  try {
    await cleanupFirebaseData();
    console.log('\n');
    
    await cleanupSupabaseData();
    console.log('\n');
    
    await cleanupStorageFiles();
    console.log('\n');
    
    console.log('🎉 모든 테스트 데이터 정리 완료!');
    console.log('📝 이제 깨끗한 상태로 클라이언트에게 납품할 수 있습니다.');
  } catch (error) {
    console.error('❌ 데이터 정리 중 오류 발생:', error);
    process.exit(1);
  }
}

// 확인 프롬프트
console.log('⚠️  경고: 이 스크립트는 모든 테스트 데이터를 삭제합니다!');
console.log('계속하려면 스크립트를 실행하세요.\n');

main(); 