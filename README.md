# Quadly

A campus community platform exclusively for verified UMich students.

## Introduction

Quadly is a comprehensive campus community platform designed to connect University of Michigan students through various features including discussion boards, course reviews, and schedule management. Built as a monorepo with separate applications for web, mobile, and API, Quadly provides a unified experience across all platforms.

### Key Features

- **Discussion Boards**: Free, Secret, Info, and Hot boards for different types of discussions
- **Course Reviews**: Course ratings, reviews, and difficulty/workload metrics
- **Schedule Management**: Weekly schedule planner with credit calculator
- **University Verification**: UMich email authentication required for access

### Project Structure

```
quadly/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── web/          # Next.js web application
│   └── mobile/       # Expo React Native mobile app
├── packages/
│   └── shared/       # Shared types, validation schemas, utilities
└── turbo.json        # Turborepo configuration
```

### Tech Stack

- **Monorepo**: Turborepo
- **Backend**: NestJS, Prisma, PostgreSQL
- **Web**: Next.js 14 (App Router)
- **Mobile**: Expo React Native
- **Shared**: TypeScript, Zod

## Roadmap

### Sprint 1: Basic Authentication & Boards (2 weeks)
- Email authentication system
- Free board CRUD operations
- Comment system
- Like functionality
- Report and block features
- Rate limiting
- Basic admin console

### Sprint 2: Board Expansion (2 weeks)
- Secret board (forced anonymity)
- Info board
- Hot board ranking algorithm
- Search functionality
- In-app notifications

### Sprint 3: Course Reviews MVP (2 weeks)
- Course model and API
- Course search functionality
- Review creation and viewing
- Average metrics calculation (rating, difficulty, workload)
- Review reporting and moderation

### Sprint 4: Schedule & Credit Calculator (2 weeks)
- Weekly schedule UI (grid layout)
- Schedule item CRUD
- Credit sum calculation
- Schedule save/load functionality
- Atlas link integration
- Mobile optimization

### Sprint 5: Atlas Integration (2 weeks)
- UMich official API access verification
- Course search automation (if API available)
- Alternative course submission system enhancement
- Course data synchronization

### Sprint 6: Extended Features (2 weeks)
Choose one of the following:
- **Chat**: 1-on-1 and group chat
- **Marketplace**: Buy/sell items
- **Dining Menu**: Today's menu lookup

## Getting Started

For detailed setup instructions, see:
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [SETUP.md](./SETUP.md) - Detailed setup instructions
- [DOCUMENTATION_GUIDE.md](./DOCUMENTATION_GUIDE.md) - Documentation overview

## License

Private
