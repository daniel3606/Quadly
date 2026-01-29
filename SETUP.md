# Setup Guide

## 사전 요구사항

- Node.js 18 이상
- PostgreSQL 14 이상
- Redis 6 이상 (선택사항, 캐싱 및 레이트 리밋용)
- npm 또는 yarn

## 1. 프로젝트 클론 및 설치

```bash
cd 17_Quadly
npm install
```

## 2. 데이터베이스 설정

### PostgreSQL 데이터베이스 생성

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE quadly;

# 종료
\q
```

### 환경 변수 설정

`apps/api/.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/quadly?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
API_PORT=8000
WEB_URL="http://localhost:3000"
API_URL="http://localhost:8000"

# Google OAuth (see GOOGLE_OAUTH_SETUP.md for setup instructions)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:8000/api/auth/google/callback"
```

### Prisma 마이그레이션

```bash
# Prisma 클라이언트 생성
cd apps/api
npx prisma generate

# 데이터베이스 마이그레이션 실행
npx prisma migrate dev --name init

# (선택사항) Prisma Studio로 데이터베이스 확인
npx prisma studio
```

### 초기 데이터 시드

게시판 데이터를 초기화하려면 API 서버를 시작한 후 다음 엔드포인트를 호출하세요:

```bash
# API 서버가 실행 중일 때
curl http://localhost:8000/api/boards
```

또는 `apps/api/src/main.ts`에서 서버 시작 시 자동으로 초기화하도록 설정할 수 있습니다.

## 3. 개발 서버 실행

### 모든 앱 동시 실행 (Turborepo)

```bash
# 루트 디렉토리에서
npm run dev
```

### 개별 실행

#### API 서버
```bash
cd apps/api
npm run dev
# http://localhost:8000 에서 실행
```

#### Web 앱
```bash
cd apps/web
npm run dev
# http://localhost:3000 에서 실행
```

#### Mobile 앱
```bash
cd apps/mobile
npm start
# Expo 개발 서버가 시작됩니다
```

## 4. API 문서 확인

API 서버 실행 후 Swagger 문서를 확인할 수 있습니다:

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## 5. 테스트

### API 테스트

```bash
# Health check
curl http://localhost:8000/api/health

# 게시판 목록 조회
curl http://localhost:8000/api/boards
```

## 문제 해결

### 데이터베이스 연결 오류

- PostgreSQL이 실행 중인지 확인: `pg_isready`
- `DATABASE_URL` 환경 변수가 올바른지 확인
- 데이터베이스가 생성되었는지 확인

### 포트 충돌

- API: `apps/api/.env`에서 `API_PORT` 변경
- Web: `apps/web/package.json`의 `dev` 스크립트에서 포트 변경

### Prisma 오류

```bash
cd apps/api
npx prisma generate
npx prisma migrate reset  # 주의: 모든 데이터 삭제됨
```
