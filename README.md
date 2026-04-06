# DuoLingual - Language Learning App MVP

An AI-powered language learning platform optimized for serious learners with spaced repetition, flashcards, and domain-specific vocabulary (TOEIC, Business, Electrical Engineering).

## 🎯 Features

### Core Learning System
- **Flashcards**: Interactive vocabulary cards with multiple examples
- **Spaced Repetition**: SM-2 algorithm for optimal review intervals
- **Local AI Content Engine**: Crawl public pages and generate examples without external AI API
- **Domain-Specific**: TOEIC, Business, and Electrical Engineering vocabularies
- **Progress Tracking**: Detailed statistics and weak word identification
- **Multiple Review Modes**: Recognition (multiple choice) and manual input

### User Features
- User authentication with JWT
- Personalized learning dashboard
- Weak words prioritization
- Learning statistics and accuracy tracking
- Clean, minimal UI (Duolingo-inspired)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **AI Integration**: Local corpus training + web crawling
- **Language**: TypeScript

### Frontend
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Language**: TypeScript

### Deployment
- Backend: Ready for Docker/Node.js hosts (Railway, Render, Heroku)
- Frontend: Ready for Vercel, Netlify
- Database: PostgreSQL cloud (Supabase, AWS RDS, Railway)

## 📦 Project Structure

```
duolingal/
├── backend/
│   ├── src/
│   │   ├── server.ts                 # Express app setup
│   │   ├── db/
│   │   │   ├── pool.ts              # DB connection pool
│   │   │   ├── init.ts              # Schema initialization
│   │   │   └── seed.ts              # Sample data
│   │   ├── controllers/              # Route handlers
│   │   │   ├── authController.ts
│   │   │   ├── wordController.ts
│   │   │   ├── reviewController.ts
│   │   │   └── aiController.ts
│   │   ├── routes/                   # API routes
│   │   │   ├── auth.ts
│   │   │   ├── words.ts
│   │   │   ├── review.ts
│   │   │   └── ai.ts
│   │   ├── services/                 # Business logic
│   │   │   ├── spacedRepetition.ts
│   │   │   └── aiService.ts
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT auth middleware
│   │   └── types/
│   │       └── index.ts             # TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── pages/                        # Next.js pages
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── index.tsx                # Home page
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── dashboard.tsx            # Main dashboard
│   │   ├── review.tsx               # Review interface
│   │   ├── words.tsx                # Word browser
│   │   └── [id].tsx                 # Word detail
│   ├── components/
│   │   ├── common.tsx               # Header, Card, Button, etc
│   │   ├── forms.tsx                # Auth & create forms
│   │   └── review.tsx               # Review-specific components
│   ├── lib/
│   │   ├── api.ts                   # API client
│   │   ├── store.ts                 # Global state (Zustand)
│   ├── hooks/
│   │   └── useAuth.ts               # Custom hooks
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
└── database/
    └── schema.md                     # Database documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Internet connection (for corpus crawling/training)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
# Required:
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (PostgreSQL)
# - JWT_SECRET (generate a strong secret)
# - CRAWLER_USER_AGENT (optional)
# - FRONTEND_URL (http://localhost:3000 for dev)

# Install dependencies
npm install

# Initialize database and seed data
npm run db:init
npm run db:seed

# Optional: import large English vocabulary list
npm run db:import:english

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

### Import Full English Vocabulary

To add a very large English vocabulary set (from an open-source word list) into `words`:

```bash
cd backend
npm run db:import:english
```

Optional environment variables:

- `WORD_IMPORT_LIMIT`: import only the first N words (for quick testing)
- `WORD_IMPORT_BATCH_SIZE`: batch size per insert (default: 2000)

### Import Offline Dictionary (Real Definitions + Part of Speech)

To replace placeholder definitions with real dictionary data from a local file:

```bash
cd backend
npm run db:import:dictionary
```

### Build WordNet Base Dataset + Context Examples

Use WordNet as the base dictionary source, then generate a structured dataset enriched with three context examples per word:

- `daily` English
- `business` English
- `technical` (electrical engineering context)

```bash
cd backend
npm run db:build:wordnet
```

Generated files:

- `backend/data/wordnet-structured.json`
- `backend/data/wordnet-structured.jsonl`

Optional environment variable:

- `WORDNET_LIMIT`: generate only first N entries (quick test mode)

### Import WordNet Structured Dataset into PostgreSQL

After building the dataset, import definitions, part of speech, and generated examples into `words` + `examples` tables:

```bash
cd backend
npm run db:import:wordnet
```

Optional environment variables:

- `WORDNET_STRUCTURED_FILE`: path to JSONL file (default: `backend/data/wordnet-structured.jsonl`)
- `WORDNET_IMPORT_BATCH_SIZE`: batch size for DB writes (default: 800)

Default dictionary file:

- `backend/data/offline-dictionary.sample.jsonl`

Supported formats:

- JSONL/NDJSON (recommended)
- CSV with columns: `word,part_of_speech,definition`
- JSON array of objects

Optional environment variables:

- `DICTIONARY_FILE`: absolute or relative path to your offline dictionary file

## 🌐 Publish an HTTPS Website on GitHub Pages

This repository now includes a ready-to-publish static page in [docs/index.html](docs/index.html).

### What is included

- Page source: [docs/index.html](docs/index.html)
- Styles: [docs/styles.css](docs/styles.css)
- Auto deploy workflow: [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)

### One-time setup on GitHub

1. Push this repository to GitHub (branch `main`).
2. Open repository settings -> `Pages`.
3. In `Build and deployment`, choose `GitHub Actions`.
4. Go to `Actions` tab and run `Deploy GitHub Pages` (or push to `main`).

### Your HTTPS URL

After deployment, your site URL will be:

`https://<your-github-username>.github.io/<your-repo-name>/`

If your repo is named `<your-github-username>.github.io`, the URL becomes:

`https://<your-github-username>.github.io/`

### Use one workflow file for full deployment

This repo now uses a single workflow file [ .github/workflows/deploy-pages.yml ](.github/workflows/deploy-pages.yml) to orchestrate:

1. GitHub Pages static site deployment
2. Render backend deployment trigger
3. Vercel frontend production deployment

Add these GitHub repository secrets:

1. `RENDER_DEPLOY_HOOK_URL`
2. `VERCEL_DEPLOY_HOOK_URL`

After secrets are set, every push to `main` runs all deploy steps automatically.

## ☁ Deploy Full Production App (Frontend + Backend + PostgreSQL)

GitHub Pages only publishes static files in `docs/`. To deploy the **full app** (Review, Words, Dashboard, API), use:

- Frontend: Vercel
- Backend: Render Web Service
- Database: Render PostgreSQL (or Supabase/Neon)

### 1. Deploy Backend on Render

This repo includes [render.yaml](render.yaml) for one-click Render Blueprint deployment.

Steps:

1. In Render, choose `New` -> `Blueprint`.
2. Connect your GitHub repo.
3. Render reads [render.yaml](render.yaml) and creates:
  - `prolingual-backend` (Node web service)
  - `prolingual-db` (PostgreSQL)
4. Set backend env vars:
  - `FRONTEND_URL=https://<your-vercel-domain>`
  - `FRONTEND_URLS=https://<your-vercel-domain>,https://<your-preview-domain>` (optional)
5. After first deploy, run DB initialization once (Render Shell):

```bash
cd backend
npm run db:init
npm run db:seed
```

### 2. Deploy Frontend on Vercel

1. Import your GitHub repo into Vercel.
2. Framework: Next.js.
3. Set **Root Directory** to `frontend`.
4. Add environment variables:
  - `NEXT_PUBLIC_API_URL=https://<your-render-backend-domain>`
  - `NEXT_PUBLIC_API_TIMEOUT_MS=12000` (optional)
5. Deploy.

### 3. Verify Production

Backend checks:

- `https://<your-render-backend-domain>/health`
- `https://<your-render-backend-domain>/health/details`

Frontend checks:

- Open `https://<your-vercel-domain>/review`
- Confirm words/reviews load from production API

### Required Env Summary

Backend (Render):

- `DATABASE_URL` (from Render DB)
- `DB_SSL=true`
- `JWT_SECRET` (strong random)
- `FRONTEND_URL`

Frontend (Vercel):

- `NEXT_PUBLIC_API_URL`
- `DICTIONARY_BATCH_SIZE`: rows per DB batch (default: 1000)
- `DICTIONARY_INSERT_MISSING`: `true` to insert words not yet in DB; default is `false` (update existing only)

Example (PowerShell):

```powershell
$env:DICTIONARY_FILE="D:\datasets\wiktionary-en.jsonl"
$env:DICTIONARY_BATCH_SIZE=2000
$env:DICTIONARY_INSERT_MISSING="true"
npm run db:import:dictionary
```

### 2. Frontend Setup

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Create .env.local (optional, defaults to http://localhost:5000)
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Start development server
npm run dev
# App runs on http://localhost:3000
```

### 3. Access the App

1. Open http://localhost:3000
2. Register a new account
3. Start learning!

## 📚 Database Schema

### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Words
```sql
CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) UNIQUE NOT NULL,
  definition TEXT NOT NULL,
  part_of_speech VARCHAR(50),
  domain VARCHAR(50) DEFAULT 'general', -- general, business, electrical, toeic
  difficulty_level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Examples
```sql
CREATE TABLE examples (
  id SERIAL PRIMARY KEY,
  word_id INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general', -- general, business, technical
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### User Words (Spaced Repetition Tracking)
```sql
CREATE TABLE user_words (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  word_id INT NOT NULL REFERENCES words(id),
  next_review_date TIMESTAMP,
  review_interval INT DEFAULT 1,
  ease_factor FLOAT DEFAULT 2.5,
  correct_streak INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Review History
```sql
CREATE TABLE review_history (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  word_id INT NOT NULL REFERENCES words(id),
  is_correct BOOLEAN NOT NULL,
  review_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 🧠 Spaced Repetition Algorithm

Uses a simplified SM-2 algorithm:

```
If correct:
  - ease_factor' = ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  - interval = previous_interval * ease_factor'
  
If wrong:
  - ease_factor' = max(1.3, current_ease_factor - 0.2)
  - interval = 1 (reset)

Quality: 5 = perfect, 0 = complete failure
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Words
- `GET /words` - List all words (with filters)
- `GET /words/:id` - Get word details
- `POST /words` - Create word (admin)
- `PUT /words/:id` - Update word (admin)
- `DELETE /words/:id` - Delete word (admin)
- `POST /words/user/add` - Add word to user's list

### Review
- `GET /review/today` - Get words due for review
- `POST /review/answer` - Submit review answer
- `GET /review/weak` - Get weak words
- `GET /review/stats` - Get user statistics

### AI
- `POST /ai/generate-examples` - Generate example sentences
- `POST /ai/save-example` - Save example to database

All endpoints except auth require JWT token in header:
```
Authorization: Bearer <token>
```

## 📝 Sample Data

The database is seeded with 15+ words across domains:

### TOEIC Words (5)
- comprehensive, facilitate, meticulous, ambiguous, resilient

### Business Words (5)
- leverage, synergy, scalable, benchmark, milestone

### Electrical Engineering (5)
- impedance, capacitance, rectification, voltage, conductor

Each word has 3 example sentences (daily, business, technical contexts).

## 🎨 UI Features

### Dashboard
- Quick stats display
- Due today counter
- Weak words list
- Quick action buttons

### Review Interface
- Large, clear word display
- Multiple choice questions
- Progress bar
- Flip cards animation
- Example sentences in context

### Word Browser
- Search and filter by domain
- Difficulty level display
- Quick add to learning list
- Word detail view

### Authentication
- Clean login/register forms
- JWT token persistence
- Protected routes

## 🚀 Deployment

### Backend (Example: Railway)
1. Push code to GitHub
2. Connect Railway to repo
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import to Vercel
3. Set `NEXT_PUBLIC_API_URL` env variable
4. Deploy (automatic on push)

### Database (Supabase)
1. Create Supabase project
2. Get connection string
3. Use in backend `.env`
4. Run migrations

## 📊 Performance Optimizations

- Database connection pooling
- JWT token-based auth (stateless)
- SQL query optimization with indices
- Frontend caching with React hooks
- Minimal CSS with Tailwind
- Next.js image optimization

## 🔐 Security

- Password hashing with bcryptjs
- JWT token validation
- CORS configuration
- SQL injection prevention (parameterized queries)
- Environment variables for secrets

## 🛠️ Development

### Backend
```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Database operations
npm run db:init    # Initialize schema
npm run db:seed    # Seed sample data
```

### Frontend
```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint
```

## 📖 Learning Path

Recommended progression:
1. Start with general vocabulary (5-10 words)
2. Add domain-specific words (business or technical)
3. Daily review (20-30 minutes)
4. Focus on weak words
5. Gradually increase vocabulary size

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify `.env` configuration
- Check port 5000 is not in use

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check CORS configuration in backend

### Database initialization fails
- Ensure PostgreSQL version 12+
- Check user has CREATE TABLE permissions
- Review error logs for details

### AI generation quality is weak
- Run corpus training for your target topic/domain first
- Add manual URLs in `/ai/train-corpus` input for better domain coverage
- Verify the crawled pages are English and content-rich

## 📋 Future Enhancements

- [ ] Audio pronunciation guide
- [ ] Image-based mnemonics
- [ ] Community vocabulary sharing
- [ ] Mobile app (React Native)
- [ ] Export/import word lists
- [ ] Achievement badges
- [ ] Social features (leaderboards, groups)
- [ ] Advanced analytics
- [ ] Dark mode
- [ ] Multiple languages

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 👨‍💻 Contributing

Contributions welcome! Please follow the existing code style and add tests for new features.

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review GitHub issues
3. Create a new issue with detailed description

---

**Built for serious language learners who want results, not distractions.** ✨
