# Quadly

UMich 인증 학생만 들어올 수 있는 캠퍼스 커뮤니티 플랫폼입니다.

## 주요 기능

- **게시판**: 자유, 비밀, 정보, 인기 게시판
- **시간표**: 주간 시간표 관리 및 학점 계산기
- **강의 평가**: 코스별 리뷰 및 평점 시스템

## 프로젝트 구조

```
quadly/
├── apps/
│   ├── api/          # NestJS 백엔드 API
│   ├── web/          # Next.js 웹 앱
│   └── mobile/       # Expo React Native 모바일 앱
├── packages/
│   └── shared/       # 공통 타입, 검증 스키마, 유틸리티
└── turbo.json        # Turborepo 설정
```

## 기술 스택

- **Monorepo**: Turborepo
- **Backend**: NestJS, Prisma, PostgreSQL, Redis
- **Web**: Next.js 14 (App Router)
- **Mobile**: Expo React Native
- **Shared**: TypeScript, Zod

## 시작하기

**처음 시작하시나요?** → [QUICK_START.md](./QUICK_START.md)를 먼저 읽어보세요!

**어떤 문서를 읽어야 할지 모르시나요?** → [DOCUMENTATION_GUIDE.md](./DOCUMENTATION_GUIDE.md)를 확인하세요.

자세한 설정 가이드는 [SETUP.md](./SETUP.md)를 참고하세요.

### 빠른 시작 (Docker)

```bash
# PostgreSQL과 Redis를 Docker로 실행
docker-compose up -d

# 의존성 설치
npm install

# 데이터베이스 마이그레이션
cd apps/api && npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

### 수동 설정

1. PostgreSQL과 Redis 설치 및 실행
2. `apps/api/.env` 파일 생성 및 설정
3. `npm install` 실행
4. `cd apps/api && npx prisma migrate dev` 실행
5. `npm run dev` 실행

자세한 내용은 [SETUP.md](./SETUP.md) 참조.

## 스프린트 로드맵

- **스프린트 1**: 이메일 인증 가입, 자유 게시판, 신고/차단
- **스프린트 2**: 게시판 4종 완성, 인기 보드 랭킹
- **스프린트 3**: 강의 평가 MVP
- **스프린트 4**: 시간표와 학점 계산기
- **스프린트 5**: Atlas 연동
- **스프린트 6**: 확장 기능 (채팅/중고거래/식당 메뉴 중 선택)

## 라이선스

Private
