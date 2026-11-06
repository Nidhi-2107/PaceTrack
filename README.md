# PaceTrack

> **Move More. Track Better. Compete Together.**

A complete fitness tracking platform engineered for high performance, reliability, and cross-platform flexibility across Android and Web.

---

## Architecture Overview

PaceTrack uses a **modular monolith** backend paired with a **cross-platform React Native + Expo** frontend.

```
PaceTrack/
├── .env.example                     # Environment template with sane defaults
├── .gitignore                       # Git ignore rules for Maven, Node, IDEs, and Docker
├── docker-compose.yml               # Local PostgreSQL 16 container configuration
├── README.md                        # Project documentation
│
├── backend/                         # Spring Boot 3 + Java 24 Modular Monolith
│   ├── pom.xml                      # Maven configuration with Spring Data JPA, Flyway, Security
│   ├── src/main/java/com/pacetrack/
│   │   ├── PaceTrackApplication.java
│   │   ├── common/                  # Cross-cutting architecture
│   │   │   ├── api/                 # ApiResponse, ErrorResponse
│   │   │   ├── config/              # SecurityConfig, CorsConfig
│   │   │   └── exception/           # GlobalExceptionHandler
│   │   └── modules/                 # Bounded contexts
│   │       ├── health/              # Health & readiness endpoint (/api/v1/health)
│   │       ├── auth/                # (Planned) JWT auth & registration
│   │       ├── user/                # (Planned) User profiles & privacy
│   │       ├── activity/            # (Planned) GPS tracker & offline sync
│   │       ├── goal/                # (Planned) Daily & weekly fitness goals
│   │       ├── gamification/        # (Planned) Streaks & achievements
│   │       ├── social/              # (Planned) Friends & activity feed
│   │       └── challenge/           # (Planned) Leaderboards & challenges
│   ├── src/main/resources/
│   │   ├── application.yml          # Production-ready YAML config with env variables
│   │   ├── application-dev.yml      # Local dev profile with SQL query logging
│   │   └── db/migration/            # Flyway database migrations
│   │       └── V1__init_schema.sql  # Baseline PostgreSQL schema
│   └── src/test/                    # Automated integration & unit tests
│
└── frontend/                        # React Native + Expo Router + TypeScript
    ├── package.json                 # Expo SDK, Expo Router, React Native Web
    ├── app.json                     # Universal Expo configuration (Android & Web)
    ├── tsconfig.json                # TypeScript compiler configuration
    ├── app/                         # File-based navigation (Expo Router)
    │   ├── _layout.tsx              # Root SafeArea & Navigation Stack layout
    │   ├── index.tsx                # Welcome & Backend Health check dashboard
    │   └── +not-found.tsx           # 404 handler
    └── src/
        ├── components/              # Header, HealthCard, FeatureCard
        ├── constants/               # Brand theme tokens & dynamic API config
        ├── services/api/            # Typed fetch API client for backend communication
        └── types/                   # TypeScript interfaces matching backend DTOs
```

---

## Prerequisites

- **Java**: JDK 24 (or 21+)
- **Maven**: 3.9+
- **Node.js**: v20+ (tested on v22.19.0)
- **Docker & Docker Compose**: For local PostgreSQL database

---

## Quickstart Guide

### 1. Start the PostgreSQL Database

```powershell
# Copy environment template if not present
cp .env.example .env

# Start PostgreSQL container in background
docker compose up -d
```

> **Port Notice**: The PostgreSQL host port is set to `5433` by default (`POSTGRES_PORT=5433`) in `.env` to prevent collisions with existing PostgreSQL instances running on `5432`.

### 2. Run the Spring Boot Backend

```powershell
cd backend
mvn spring-boot:run
```

- Health Endpoint: `http://localhost:8080/api/v1/health`
- Actuator Health: `http://localhost:8080/actuator/health`

### 3. Run the Frontend (Web & Android)

```powershell
cd frontend
npm install

# Start for Web in browser
npm run web

# Start for Android (requires Android Studio / emulator or Expo Go)
npm run android
```
