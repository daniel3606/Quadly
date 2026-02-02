# 아키텍처 문서

## 개요

Quadly는 monorepo 구조로 구성된 풀스택 애플리케이션입니다. 하나의 백엔드 API를 통해 iOS, Android, Web 클라이언트가 동일한 기능을 제공합니다.

## 프로젝트 구조

```
quadly/
├── apps/
│   ├── api/              # NestJS 백엔드 API
│   ├── web/              # Next.js 웹 앱
│   └── mobile/           # Expo React Native 모바일 앱
├── packages/
│   └── shared/           # 공통 타입, 검증 스키마, 유틸리티
└── turbo.json           # Turborepo 설정
```

## 기술 스택

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Passport)
- **Validation**: Zod (shared package)
- **Documentation**: Swagger/OpenAPI

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: (추가 예정)

### Frontend (Mobile)
- **Framework**: Expo React Native
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: (추가 예정)

### Shared
- **Types**: TypeScript interfaces
- **Validation**: Zod schemas
- **Utils**: 공통 유틸리티 함수

## 데이터베이스 스키마

주요 엔티티:
- User: 사용자 정보
- Board: 게시판 설정
- Post: 게시글
- Comment: 댓글
- Course: 강의 정보
- Review: 강의 평가
- Schedule: 시간표
- ScheduleItem: 시간표 항목
- Report: 신고
- Block: 차단

자세한 스키마는 `apps/api/prisma/schema.prisma` 참조.

## API 설계 원칙

1. RESTful API 설계
2. 일관된 응답 형식
3. 에러 핸들링 표준화
4. 인증: JWT Bearer Token
5. 페이지네이션: page, pageSize 쿼리 파라미터

## 인증 흐름

1. 이메일 인증 코드 요청 (`POST /api/auth/request-email-code`)
2. 인증 코드 검증 및 회원가입/로그인 (`POST /api/auth/verify-email-code`)
3. JWT 토큰 발급
4. 이후 요청에 Bearer Token 포함

## Anonymous Policy

- **General Board**: Anonymous optional
- **Private Board**: Anonymous forced
- **Info Board**: Default nickname, anonymous optional
- **Hot Board**: Follows original board settings

시스템 내부에서는 항상 `user_id`를 추적하여 악성 사용자 제재 가능.

## 인기 게시판 랭킹 알고리즘

```
hot_score = (like_count * 2) + (comment_count * 3) + log(view_count + 1)
time_decay = 1 / ((hours_since_post + 2) ^ 1.3)
final_score = hot_score * time_decay
```

## 모더레이션

- 신고 시스템: 사용자가 컨텐츠 신고 가능
- 자동 블라인드: 신고 N회 이상 시 임시 숨김
- 관리자 콘솔: 신고 처리 및 사용자 제재

## 보안 고려사항

1. UMich 이메일만 가입 허용 (`@umich.edu`)
2. Rate Limiting (Redis 사용 예정)
3. 입력 검증 (Zod 스키마)
4. SQL Injection 방지 (Prisma ORM)
5. XSS 방지 (입력 sanitization)

## 배포 전략

### 개발 환경
- 로컬 개발: 각 앱 개별 실행 또는 Turborepo로 동시 실행

### 프로덕션 환경 (예정)
- **API**: Railway, Render, 또는 AWS
- **Web**: Vercel 또는 Netlify
- **Mobile**: Expo EAS Build
- **Database**: PostgreSQL (managed service)
- **Cache**: Redis (managed service)

## 모니터링 및 로깅 (예정)

- 에러 추적: Sentry
- 로깅: Winston 또는 Pino
- 메트릭: Prometheus + Grafana

## 성능 최적화

1. 데이터베이스 인덱싱 (Prisma schema에 정의)
2. 쿼리 최적화
3. 캐싱 전략 (Redis)
4. 이미지 최적화 (S3 + CDN)
