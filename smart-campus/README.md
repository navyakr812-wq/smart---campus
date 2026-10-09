# Smart Campus (MVP)
Express + MongoDB (Mongoose) backend with a no-build vanilla JS frontend served from `public/`.

## Run
```
npm install
cp .env.example .env     # set JWT_SECRET
npm start                # http://localhost:5000
```
Dev without MongoDB: leave `MONGO_URI` empty and a temporary in-memory DB is used (data resets on restart).
Production: set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`; `SEED_DEMO` is ignored. The server exits if MongoDB is unreachable.

## Demo accounts (password `Demo@1234`, only created when SEED_DEMO=true in dev)
student@campus.test · faculty@campus.test · admin@campus.test

## Demo flow
Student: dashboard → CampusAI ("When is my next class?") → timetable → attendance → register for an event → report an issue.
Then log out, log in as admin → Issues → change status → Analytics. Log back in as the student to see the notification.

## API
POST /api/auth/register|login · GET /api/me · GET /api/dashboard · GET|POST /api/announcements · GET|POST /api/events · POST /api/events/:id/register
GET /api/attendance · GET /api/timetable · GET|POST /api/issues · PATCH /api/issues/:id · GET /api/notifications · POST /api/notifications/read
GET /api/facilities · GET /api/admin/analytics · POST /api/assistant

## Not included yet
React/TypeScript frontend, assignments, clubs, shuttle data, issue image upload, attendance trend chart, faculty attendance marking, admin user management.
