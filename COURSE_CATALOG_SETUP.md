# Course Catalog & Schedule Setup Guide

이 문서는 UMich LSA Course Catalog 크롤링 및 Schedule 페이지 설정 방법을 설명합니다.

## 개요

이 기능은 UMich LSA 공개 웹페이지에서 수업 정보를 크롤링하여 데이터베이스에 저장하고, Schedule 페이지에서 검색 및 시간표 생성을 가능하게 합니다.

## 데이터베이스 마이그레이션

먼저 Prisma 스키마 변경사항을 데이터베이스에 적용해야 합니다.

```bash
cd apps/api
npm run prisma:migrate
```

또는 개발 환경에서:

```bash
cd apps/api
npx prisma migrate dev --name add_course_catalog_models
```

## 환경 변수

다음 환경 변수가 설정되어 있는지 확인하세요:

- `DATABASE_URL`: PostgreSQL 데이터베이스 연결 문자열
- `JWT_SECRET`: JWT 토큰 시크릿 (인증용)

## 의존성 설치

크롤러는 Playwright를 사용하므로 브라우저를 설치해야 합니다:

```bash
cd apps/api
npx playwright install chromium
```

또는 전체 브라우저 설치:

```bash
npx playwright install
```

## 크롤링 실행

### 1. API 서버 시작

```bash
cd apps/api
npm run dev
```

### 2. 크롤 작업 시작

크롤 작업은 인증이 필요합니다. JWT 토큰을 사용하여 API를 호출합니다:

```bash
# 예시: ASIAN 과목을 Winter 2026 학기로 크롤링
curl -X POST http://localhost:8000/api/catalog/crawl/run \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "term": "Winter 2026",
    "subject": "ASIAN"
  }'
```

응답으로 `jobId`를 받습니다:

```json
{
  "jobId": "uuid-here"
}
```

### 3. 크롤 작업 상태 확인

```bash
curl http://localhost:8000/api/catalog/crawl/job/JOB_ID
```

작업 상태:
- `PENDING`: 대기 중
- `RUNNING`: 실행 중
- `COMPLETED`: 완료
- `FAILED`: 실패
- `CANCELLED`: 취소됨

## API 엔드포인트

### 과목 검색

```bash
GET /api/catalog/courses/search?term=Winter%202026&subject=ASIAN&q=101&limit=50&offset=0
```

쿼리 파라미터:
- `term` (optional): 학기 (예: "Winter 2026")
- `subject` (optional): 과목 코드 (예: "ASIAN")
- `q` (optional): 검색어 (과목명 또는 번호)
- `limit` (optional): 결과 수 제한 (기본값: 50)
- `offset` (optional): 페이지 오프셋 (기본값: 0)

### 과목 상세 정보

```bash
GET /api/catalog/courses/:courseId
```

### 스케줄 관리

```bash
# 스케줄 목록 조회
GET /api/schedules

# 스케줄 생성
POST /api/schedules
Body: { "name": "Fall 2026" }

# 스케줄에 과목 추가
POST /api/schedules/:scheduleId/items
Body: {
  "course_id": "course-uuid",
  "title": "ASIAN 101: Introduction",
  "day_of_week": 1,
  "start_minute": 540,
  "end_minute": 630,
  "location": "Angell Hall 123",
  "color": "#FF6B6B"
}
```

## 프론트엔드 사용

1. 웹 서버 시작:

```bash
cd apps/web
npm run dev
```

2. 브라우저에서 `http://localhost:3000/schedule` 접속

3. 기능:
   - **과목 검색**: 왼쪽 패널에서 Subject Code와 검색어로 과목 검색
   - **과목 상세 보기**: 검색 결과에서 과목 클릭 시 상세 정보 표시
   - **스케줄 생성**: 오른쪽 패널에서 "+ New" 버튼으로 새 스케줄 생성
   - **과목 추가**: 과목 상세에서 "Add to Schedule" 버튼으로 시간표에 추가
   - **시간 설정**: 모달에서 요일, 시작/종료 시간, 위치 설정

## 크롤러 동작 방식

1. **목록 수집**:
   - UMich LSA Course Catalog 페이지 접속
   - 필터 설정 (term, subject 등)
   - 검색 실행
   - 결과 페이지에서 과목 목록 추출

2. **상세 수집**:
   - 각 과목의 상세 페이지 접속
   - 설명, 학점, 선수과목 정보 추출
   - 데이터베이스에 저장

3. **안정성**:
   - 요청 간 랜덤 딜레이 (1-3초)
   - 재시도 로직
   - 에러 로깅

## 주의사항

1. **레이트 리밋**: 크롤러는 요청 간 딜레이를 두지만, 과도한 크롤링은 피해야 합니다.
2. **robots.txt**: UMich 웹사이트의 robots.txt를 확인하고 준수하세요.
3. **공개 데이터만**: 로그인이 필요한 데이터는 수집하지 않습니다.
4. **캐시**: 동일한 요청 반복을 피하기 위해 데이터베이스에 저장된 데이터를 우선 사용합니다.

## 문제 해결

### 크롤러가 과목을 찾지 못하는 경우

- 페이지 구조가 변경되었을 수 있습니다. 크롤러의 셀렉터를 확인하세요.
- Playwright가 페이지를 제대로 로드하지 못했을 수 있습니다. 타임아웃 설정을 확인하세요.

### 데이터베이스 연결 오류

- `DATABASE_URL` 환경 변수가 올바른지 확인하세요.
- 데이터베이스가 실행 중인지 확인하세요.

### Playwright 브라우저 오류

- `npx playwright install chromium` 명령으로 브라우저를 다시 설치하세요.
- 시스템 권한 문제일 수 있습니다.

## 테스트

### 단위 테스트 실행

```bash
cd apps/api
npm test
```

### 크롤러 통합 테스트

```bash
cd apps/api
npm test -- course-catalog-crawler.service.spec.ts
```

## 다음 단계

- [ ] 섹션 시간 정보 수집 (현재는 사용자가 직접 입력)
- [ ] 시간표 충돌 검사
- [ ] 시간표 내보내기 (iCal, PDF 등)
- [ ] 크롤러 스케줄링 (정기적 업데이트)
