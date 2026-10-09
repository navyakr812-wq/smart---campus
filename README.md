# ⚡ CampusNow — Real-Time Campus Intelligence MVP

> **"What should I do right now?"**
> CampusNow is a mobile-first student companion that answers the most pressing question on campus. Rather than a generic dashboard, every recommendation, room status, attendance percentage, and crowd level is synthesized dynamically from the database.

---

## 🌟 Key Features

1. **Now Engine (Home Screen)**
   - Calculates the student's next class, the exact gap before it, and current lecture in progress.
   - Combines timetable schedules, live facility crowd levels, and campus events nearby into ranked, prioritized cards (e.g., *"Study Spot: Main Library (Quiet)"*, *"Campus Hackathon Starting in 40m"*, *"Quick Lunch at Cafeteria (Zero line)"*).
   - Includes a **Time Simulator** toggle so evaluators can test any time of day or day of week with realistic schedule presets.

2. **Live Crowd Tracker**
   - 1-tap check-ins (**Empty / Okay / Packed**) for campus facilities (Cafeteria, Library, Gym, Study Lounge, Labs).
   - **Weighted Decay Algorithm**: Crowd level is calculated using a 30-minute linear decay weight:
     $$w_i = \frac{30 - \Delta t}{30}$$
     where older check-ins count progressively less.
   - Shows *"no recent data"* when there are no check-ins within the last 30 minutes.
   - **Rate Limiting**: Enforces a strict 5-minute per-user per-facility rate limit with live countdown timers.

3. **Free Room Finder**
   - Automatically derives classroom availability from university timetables.
   - Computes which classrooms are free right now, how many minutes until the next scheduled lecture, and filters by duration (e.g., free for 30m+, 60m+, 90m+).

4. **Campus Issues with "Me Too" & Duplicate Detection**
   - Students report facility and campus infrastructure problems with Title, Description, Category, Location, and Priority.
   - **Automated Duplicate Detector**: Compares category, location, and token similarity. When a match is detected, prompts the student to tap **"Me Too"** to upvote the existing report rather than creating duplicate clutter.
   - Issues are ranked by upvote volume and priority.
   - **Admin Resolution Workflow**: Administrators update statuses (`Reported`, `Assigned`, `In Progress`, `Resolved`). Every status change **instantly broadcasts push notifications** to the reporter and all students who upvoted!

5. **Events Hub**
   - Real-time event catalog with category filtering (Tech, Cultural, Sports, Workshops).
   - 1-tap event registration and cancellation with live seat capacity tracking.

6. **Subject-Wise Attendance & Timetable**
   - Verified subject-wise attendance percentages from the database.
   - Automatic shortage alerts for subjects falling below the required **75% threshold**, with exact calculation of classes needed to recover eligibility.
   - Weekly interactive timetable highlighting the active lecture in real time.

7. **Official Announcements & Notification Center**
   - Faculty and Admin notices with priority tags (`NORMAL`, `URGENT`).
   - Read/unread notifications drawer tracking issue resolution updates and event reminders.

8. **CampusAI Assistant**
   - Deterministic, rule-based assistant querying live MongoDB models for ground truth data (next classes, free rooms, cafeteria crowd, attendance, campus directions).
   - Clearly labeled rule engine with zero hallucinations.
   - Pluggable LLM adapter (`queryRealLLM` hook) ready for external LLM API keys (OpenAI GPT-4o, Google Gemini, Anthropic Claude).

9. **Admin Analytics Dashboard**
   - Real-time metrics: enrolled students, faculty count, open vs. resolved issues, 30-day resolution rate, issues by category breakdown, most upvoted issues leaderboard, event participation rates, and busiest facilities by check-in volume. All derived from the database.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Mongoose
- **Database**: MongoDB (MongoDB Atlas in production; automated in-memory MongoDB fallback in local development)
- **Deployment**: Single Render Web Service hosting both the Express API and the compiled React SPA.

---

## 📋 Demo Accounts

All accounts use the demo password: **`CampusNow2026!`**

| Persona | Email | Role | Description |
| :--- | :--- | :--- | :--- |
| **Student 1** | `student@campus.test` | `STUDENT` | Alex Rivera (CS 3rd Year) • Full timetable, attendance & Now Engine |
| **Student 2** | `student2@campus.test` | `STUDENT` | Jordan Lee (CS 3rd Year) • Use to demonstrate "Me Too" duplicate upvoting |
| **Faculty** | `faculty@campus.test` | `FACULTY` | Dr. Evelyn Reed • Professor of CS • Post notices and timetable items |
| **Admin** | `admin@campus.test` | `ADMIN` | Campus Administrator • Issue status updates and analytics |

> 💡 **Quick Login**: The login screen includes **1-Tap Demo Buttons** to instantly log into any of the 4 personas without typing!

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` or configure in your deployment dashboard:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (`development` or `production`) | `production` |
| `PORT` | Web service listening port | `5000` |
| `MONGO_URI` | MongoDB connection URI (**Required in production**) | `mongodb+srv://user:pass@cluster0.mongodb.net/campusnow` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `min_32_characters_secret_key` |
| `SEED_DEMO` | Seed realistic demo data if database is empty | `true` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `LLM_API_KEY` | *(Optional)* External LLM API key for CampusAI adapter | `sk-...` |

> ⚠️ **Production Safety Guarantee**: In production (`NODE_ENV=production`), if `MONGO_URI` is missing or MongoDB cannot connect, the server logs a clear error and immediately exits with `process.exit(1)`. It **NEVER** falls back to an in-memory database in production.

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js >= 18
- npm >= 9

### 1. Clone & Build
```bash
git clone https://github.com/your-username/campusnow.git
cd campusnow

# Installs dependencies and builds both client and server
npm run build
```

### 2. Run Locally
```bash
# Starts the unified service on http://localhost:5000
npm start
```
*(In development, if `MONGO_URI` is omitted, the server automatically starts an in-memory MongoDB instance for zero-friction testing!)*

### Development Mode (with hot-reloading)
In two separate terminals:
```bash
# Terminal 1: Backend API with tsx watch on port 5000
npm run dev:server

# Terminal 2: Vite React client with HMR on port 5173
npm run dev:client
```

---

## 🌐 Render Deployment (One Web Service)

CampusNow includes a `render.yaml` blueprint for one-click deployment on Render.

### Deployment Steps:

1. **MongoDB Atlas Preparation**:
   - Create a free MongoDB Atlas cluster.
   - In **Database Access**, create a user with read/write access.
   - **CRITICAL STEP**: In **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere (`0.0.0.0/0`)**. This is required so Render's cloud containers can connect to your database.
   - Copy your connection string (`mongodb+srv://...`).

2. **Deploy on Render**:
   - Push your code to GitHub.
   - On Render, click **New +** -> **Blueprint** and select your repository (it will read `render.yaml`), OR create a **Web Service** manually:
     - **Runtime**: `Node`
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       - `NODE_ENV`: `production`
       - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/campusnow?retryWrites=true&w=majority`
       - `JWT_SECRET`: *(Click Generate or enter a random 32+ char secret)*
       - `SEED_DEMO`: `true`
       - `CORS_ORIGIN`: `*`
   - Click **Create Web Service**. Express will serve both `/api` routes and the static React SPA from `client/dist`.

---

## 🔌 API Overview

All API endpoints return standard JSON responses and are prefixed with `/api`.

### Health & Auth
- `GET /api/health` — Service health, uptime, and database connectivity state.
- `POST /api/auth/register` — Public sign-up (**strictly creates STUDENT role**).
- `POST /api/auth/login` — Sign in with email and password.
- `GET /api/auth/me` — Retrieve current authenticated user profile.

### Core Intelligence
- `GET /api/now` — Computes next class, gap duration, and ranked intelligent recommendations. (Accepts optional `time` and `day` parameters).
- `GET /api/crowd` — Live crowd statuses for all facilities with 30-minute weighted averages.
- `POST /api/crowd/checkin` — 1-tap check-in (`EMPTY` / `OKAY` / `PACKED`) with 5-minute cooldown.
- `GET /api/crowd/:facilityId/recent` — Recent check-in timeline.
- `GET /api/rooms/free` — Free classrooms derived from schedule, with free duration countdown.

### Community Issues & Notifications
- `GET /api/issues` — Issues ranked by upvotes and severity.
- `POST /api/issues/check-duplicate` — Pre-submission duplicate check based on category, location, and token overlap.
- `POST /api/issues` — Create a new issue (blocks duplicates unless force-confirmed).
- `POST /api/issues/:id/upvote` — "Me Too" upvote toggle.
- `PATCH /api/issues/:id/status` — **Admin only**. Updates status (`Reported`, `Assigned`, `In Progress`, `Resolved`) and **broadcasts notifications to all reporters & upvoters**.
- `GET /api/notifications` — User notification center with unread count.
- `PATCH /api/notifications/:id/read` — Mark notification as read.
- `POST /api/notifications/read-all` — Mark all notifications as read.

### Academics, Events & Assistant
- `GET /api/attendance` — Subject-wise attendance percentages with <75% shortage warnings.
- `GET /api/attendance/timetable` — Weekly timetable with the current lecture highlighted.
- `GET /api/events` — Campus events list with category filters.
- `POST /api/events/:id/register` — Register for an event.
- `POST /api/events/:id/unregister` — Cancel registration.
- `GET /api/announcements` — Official notice board.
- `POST /api/announcements` — **Faculty/Admin only**. Publish official announcement.
- `POST /api/chat` — CampusAI rule engine querying live DB models.
- `GET /api/analytics` — **Admin only**. Campus metrics, top categories, most upvoted issues, and facility check-in volumes.

---

## ⏱️ 3-Minute End-to-End Demo Script

Follow this step-by-step walkthrough to experience the entire hackathon MVP in 3 minutes:

### 1. Student Logs In & Sees Now Engine (0:00 - 0:45)
1. Navigate to the web application.
2. Tap **"Student 1 (Alex Rivera)"** on the login screen to sign in with one tap.
3. The **Now Engine** immediately calculates:
   - Next class (*CS301 Distributed Systems in Room 204*).
   - Time remaining and gap before class.
   - Ranked smart suggestion cards combining quiet study spots in the Library and upcoming campus events.
4. *(Optional)* Click the clock pill in the top header to simulate different schedule scenarios (e.g. *Break Gap* or *Lunch Break*).

### 2. Live Crowd Check-In & Free Room Finder (0:45 - 1:15)
1. Tap the **"Crowd"** tab in the navigation bar.
2. View real-time crowd gauges calculated from weighted 30-minute decay.
3. Tap **"🔴 Packed"** at **Central Cafeteria**.
4. Notice the crowd meter immediately recalculates with a live toast confirmation, and a **5-minute cooldown timer** activates to prevent spam!
5. Tap the **"Rooms"** tab to open the **Free Room Finder**. View rooms free right now (e.g., Room 101, Lab 301) and how many minutes they remain free until the next lecture.

### 3. Report Issue with Live Duplicate Detection (1:15 - 1:45)
1. Tap the **"Issues"** tab.
2. Click **"Report Campus Issue"**.
3. Select Category: **"Infrastructure"**, Location: **"Main University Library 3rd Floor"**, and enter Title: **"AC unit making loud grinding noise"**.
4. Notice the **instant duplicate detector** appears in real time:
   > *"Possible Duplicate Detected (85% Match): 'AC unit blowing warm air in 3rd Floor Quiet Zone' (4 Me Too votes)"*
5. Tap **"Create Anyway"** or submit a new issue (e.g., Title: *"Water tap leaking on 2nd Floor Block C"*, Category: *"Cleanliness"*, Location: *"Block C 2nd Floor"*).
6. The new issue is immediately added to the community queue.

### 4. Second Student Upvotes via "Me Too" (1:45 - 2:15)
1. Open the user profile dropdown in the top-right and tap **"Jordan Lee (Student 2 - Me Too)"**.
2. Jordan Lee is instantly logged in.
3. Go to the **"Issues"** tab.
4. Locate the newly reported issue and tap **"Me Too"**.
5. The upvote count increments, moving the issue higher in the community priority ranking!

### 5. Admin Changes Status & Student Receives Notification (2:15 - 2:40)
1. Open the profile dropdown in the top-right and switch to **"Campus Admin (Admin)"**.
2. In the **"Issues"** tab, notice the admin controls are now visible.
3. Click **"Change Status"** on the top-voted issue.
4. Change status to **"In Progress"** (or **"Resolved"**) with a note: *"Technician dispatched and repair completed."*
5. Switch back to **"Alex Rivera (Student 1)"**.
6. Notice the **Notification Bell** badge has updated! Open the notifications drawer to see:
   > *"Issue Status Update: In Progress — Issue was updated by Campus Administration."*

### 6. CampusAI Query & Admin Analytics (2:40 - 3:00)
1. Tap **"Ask AI"** in the top navigation bar.
2. Tap the quick chip: **"What is my next class?"** or **"Where can I study right now?"**.
3. CampusAI provides instant, deterministic answers queried directly from the MongoDB models.
4. Switch to **Campus Admin** and open the **"Admin Analytics"** tab to review complete campus metrics: student population, open/resolved issue rates, top issue categories, and busiest facilities by check-in volume.
