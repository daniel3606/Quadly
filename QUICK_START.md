# Quick Start Guide

## 1분 안에 시작하기

### 1. 데이터베이스 시작 (Docker)

**먼저 Docker Desktop이 실행 중인지 확인하세요.**

```bash
docker-compose up -d
```

### 2. 환경 변수 설정

`apps/api/.env` 파일 생성:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quadly?schema=public"
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
API_PORT=8000
WEB_URL="http://localhost:3000"
```

### 3. 의존성 설치 및 마이그레이션

```bash
# 루트에서
npm install

# API 디렉토리에서
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

### 4. 개발 서버 실행

```bash
# 루트에서 (모든 앱 동시 실행)
npm run dev

# 또는 개별 실행
# 터미널 1: API
cd apps/api && npm run dev

# 터미널 2: Web
cd apps/web && npm run dev

# 터미널 3: Mobile
cd apps/mobile && npm start
```

### 5. 확인

- API: http://localhost:8000/api/health
- API Docs: http://localhost:8000/api/docs
- Web: http://localhost:3000

## 다음 단계

1. [SETUP.md](./SETUP.md) - 상세 설정 가이드
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - 아키텍처 문서
3. [SPRINT_ROADMAP.md](./SPRINT_ROADMAP.md) - 개발 로드맵

## 문제 해결

### Docker daemon 오류
```
Cannot connect to the Docker daemon... Is the docker daemon running?
```

**해결 방법:**
- macOS: Docker Desktop 앱을 실행하세요
- Linux: `sudo systemctl start docker` 실행
- Docker Desktop이 실행 중인지 확인: `docker ps` 명령어로 테스트

### 포트 충돌
- PostgreSQL: 5432
- Redis: 6379
- API: 8000
- Web: 3000

포트가 사용 중이면 `docker-compose.yml` 또는 환경 변수에서 변경하세요.

### 데이터베이스 연결 오류
```bash
# PostgreSQL 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs postgres
```

### Prisma 오류
```bash
cd apps/api
npx prisma generate
npx prisma migrate reset  # 주의: 데이터 삭제됨
```
