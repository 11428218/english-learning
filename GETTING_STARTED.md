# Getting Started Guide

Quick steps to get DuoLingual running locally.

## Prerequisites

Before you begin, make sure you have:

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 12+** - [Download](https://www.postgresql.org/)
3. **Internet access** - for crawling and training local corpus

## Step 1: Clone/Download Project

```bash
cd duolingal
```

## Step 2: Setup Backend

### 2a. Configure Environment

```bash
cd backend
cp .env.example .env

# Edit .env with your settings
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Essential configuration:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=duolingual
DB_USER=postgres
DB_PASSWORD="DuoLingual_PG_2026!9fQ7#Lm2"
JWT_SECRET=your-random-secret-key
CRAWLER_USER_AGENT=duolingual-local-ai-bot/1.0
```

### 2b. Install Dependencies

```bash
npm install
```

### 2c. Initialize Database

Make sure PostgreSQL is running, then:

```bash
# Create schema and tables
npm run db:init

# Seed sample data (TOEIC, Business, Electrical terms)
npm run db:seed
```

### 2d. Start Backend Server

```bash
npm run dev

# Output should show:
# ✓ Server running on port 5000
# ✓ Frontend URL: http://localhost:3000
# ✓ Database schema initialized successfully
```

## Step 3: Setup Frontend

In a **new terminal** (keep backend running):

```bash
cd frontend
npm install
npm run dev

# Output should show:
# ▲ Next.js 14.0.0
# - Local: http://localhost:3000
```

## Step 4: Access the App

Open your browser and go to:

```
http://localhost:3000
```

## Step 5: Create Account and Test

1. **Register** - Create a new account
2. **Dashboard** - See your learning stats
3. **Add Words** - Go to "Words" tab to add vocabulary
4. **Start Review** - Click "Start Review" to practice

## Common Issues

### "Cannot connect to database"

**Solution:**
```bash
# Check PostgreSQL is running
# Windows: Services → Look for PostgreSQL
# Mac: brew services list
# Linux: sudo service postgresql status

# If not running:
# Windows: Services → Start PostgreSQL
# Mac: brew services start postgresql
# Linux: sudo service postgresql start
```

### "Port 5000 already in use"

```bash
# Find what's using port 5000
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000

# Kill the process or use different port:
# In backend/.env: PORT=5001
```

### "AI result quality is low"

1. Call `POST /ai/train-corpus` before generating examples
2. Increase `max_pages` in the training request
3. Add high-quality source URLs in the `urls` array
4. Retry generation after corpus grows

### Frontend can't reach backend

Make sure backend is running on http://localhost:5000:

```bash
# Check if backend is running
curl http://localhost:5000/health

# Should return:
# {"status":"ok"}
```

## Next Steps

1. **Try the review system** - Add a word and practice with its spaced repetition
2. **Explore domains** - Browse Business or TOEIC vocabulary
3. **Check weak words** - See which words you struggle with
4. **Create custom words** - Add words relevant to your interests

## Learning Efficiently

**Recommended daily routine:**
1. Review due words (20-30 minutes)
2. Add 3-5 new words
3. Focus on weak words
4. Check statistics to track progress

**Tips for success:**
- Review consistently every day
- Aim for 85%+ accuracy
- Practice words until lowest ease factor increases
- Mix domains for variety

## Production Deployment

When ready to deploy:

### Backend (Example: Render.com)
```bash
1. Push code to GitHub
2. Connect Render to GitHub repo
3. Select PostgreSQL addon
4. Set environment variables
5. Deploy
```

### Frontend (Example: Vercel)
```bash
1. Push to GitHub
2. Import to Vercel
3. Set NEXT_PUBLIC_API_URL=(your backend URL)
4. Deploy
```

## Need Help?

1. Check the [main README.md](./README.md)
2. Review [Spaced Repetition docs](./SPACED_REPETITION.md)
3. Check [API documentation](./README.md#-api-endpoints)
4. See troubleshooting in README

Happy learning! 🚀
