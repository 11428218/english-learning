# API Documentation

Complete reference for all DuoLingual API endpoints.

Base URL: `http://localhost:5000` (development)

## Authentication

### Register User

```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login User

```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Words Management

### Get All Words

```
GET /words?domain=business&difficulty=2
```

**Query Parameters:**
- `domain` (optional): "general", "business", "electrical", "toeic"
- `difficulty` (optional): 1-5

**Response (200):**
```json
[
  {
    "id": 1,
    "word": "leverage",
    "definition": "Use something to maximum advantage",
    "part_of_speech": "verb",
    "domain": "business",
    "difficulty_level": 2,
    "examples": [
      {
        "id": 1,
        "sentence": "We can leverage our resources.",
        "type": "business"
      }
    ]
  }
]
```

### Get Specific Word

```
GET /words/:id
```

**Response (200):**
```json
{
  "id": 1,
  "word": "leverage",
  "definition": "Use something to maximum advantage",
  "part_of_speech": "verb",
  "domain": "business",
  "difficulty_level": 2,
  "examples": [
    {
      "id": 1,
      "sentence": "We can leverage our resources.",
      "type": "business"
    }
  ]
}
```

### Create Word

```
POST /words
Authorization: Bearer <token>
```

**Request:**
```json
{
  "word": "synergy",
  "definition": "Combined effect greater than separate effects",
  "part_of_speech": "noun",
  "domain": "business",
  "difficulty_level": 2,
  "examples": [
    {
      "sentence": "The merger created significant synergy.",
      "type": "business"
    }
  ]
}
```

**Response (201):**
```json
{
  "id": 2,
  "word": "synergy",
  "definition": "Combined effect greater than separate effects",
  "part_of_speech": "noun",
  "domain": "business",
  "difficulty_level": 2,
  "examples": [...]
}
```

### Update Word

```
PUT /words/:id
Authorization: Bearer <token>
```

**Request:**
```json
{
  "definition": "Updated definition",
  "difficulty_level": 3
}
```

**Response (200):** Updated word object

### Delete Word

```
DELETE /words/:id
Authorization: Bearer <token>
```

**Response:** 204 No Content

### Add Word to User

```
POST /words/user/add
Authorization: Bearer <token>
```

**Request:**
```json
{
  "wordId": 1
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "word_id": 1,
  "next_review_date": "2024-04-01T00:00:00Z",
  "review_interval": 1,
  "ease_factor": 2.5,
  "correct_streak": 0,
  "total_reviews": 0,
  "times_correct": 0,
  "created_at": "2024-03-31T12:00:00Z"
}
```

## Review System

### Get Today's Reviews

```
GET /review/today
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "words": [
    {
      "id": 1,
      "word": "leverage",
      "definition": "Use something to maximum advantage",
      "part_of_speech": "verb",
      "domain": "business",
      "difficulty_level": 2,
      "user_word_id": 5,
      "current_streak": 2,
      "review_interval": 3,
      "ease_factor": 2.5,
      "examples": [
        {
          "id": 1,
          "sentence": "We can leverage our resources.",
          "type": "business"
        }
      ]
    }
  ],
  "count": 1
}
```

### Submit Review Answer

```
POST /review/answer
Authorization: Bearer <token>
```

**Request:**
```json
{
  "user_word_id": 5,
  "is_correct": true,
  "review_type": "recognition"
}
```

**Response (200):**
```json
{
  "success": true,
  "userWord": {
    "id": 5,
    "user_id": 1,
    "word_id": 1,
    "next_review_date": "2024-04-03T00:00:00Z",
    "review_interval": 8,
    "ease_factor": 2.6,
    "correct_streak": 3,
    "total_reviews": 5,
    "times_correct": 4,
    "created_at": "2024-03-20T12:00:00Z",
    "updated_at": "2024-03-31T12:30:00Z"
  },
  "nextReviewDate": "2024-04-03T00:00:00Z",
  "newInterval": 8
}
```

### Get Weak Words

```
GET /review/weak?limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Maximum words to return (default: 10)

**Response (200):**
```json
[
  {
    "id": 2,
    "user_word_id": 6,
    "word": "ambiguous",
    "definition": "Open to more than one interpretation",
    "part_of_speech": "adjective",
    "domain": "toeic",
    "difficulty_level": 2,
    "ease_factor": 1.8,
    "correct_streak": 0,
    "total_reviews": 8,
    "times_correct": 2,
    "examples": [...]
  }
]
```

### Get User Statistics

```
GET /review/stats
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "stats": {
    "total_words": 25,
    "due_today": 8,
    "total_reviews": 120,
    "times_correct": 95,
    "avg_ease_factor": 2.4
  },
  "accuracy": 79.17
}
```

## AI Endpoints

### Generate Example Sentences

```
POST /ai/generate-examples
Authorization: Bearer <token>
```

**Request:**
```json
{
  "word": "leverage",
  "domain": "business"
}
```

**Response (200):**
```json
{
  "word": "leverage",
  "domain": "business",
  "sentences": [
    "We can leverage our existing resources to reduce costs.",
    "The company leveraged its brand reputation for market expansion.",
    "Leverage helps teams execute strategic plans efficiently."
  ]
}
```

### Generate Practice Exercise

```
POST /ai/generate-practice
Authorization: Bearer <token>
```

**Request:**
```json
{
  "word": "leverage",
  "sentence": "We can leverage existing infrastructure to reduce rollout time.",
  "exercise_type": "fill_blank",
  "domain": "business"
}
```

**Response (200):**
```json
{
  "exercise": "Fill in the blank:\nWe can ____ existing infrastructure to reduce rollout time.",
  "options": ["leverage", "revenue", "strategy", "proposal"]
}
```

### Train Local Corpus (Web Crawl)

```
POST /ai/train-corpus
Authorization: Bearer <token>
```

**Request:**
```json
{
  "topic": "power electronics",
  "domain": "electrical",
  "max_pages": 4,
  "urls": [
    "https://en.wikipedia.org/wiki/Power_electronics"
  ]
}
```

**Response (200):**
```json
{
  "topic": "power electronics",
  "domain": "electrical",
  "pagesRequested": 4,
  "pagesAdded": 3,
  "totalDocuments": 17,
  "failed": [
    {
      "url": "https://example.com/blocked",
      "reason": "Request failed with status code 403"
    }
  ]
}
```

### Get Local Corpus Status

```
GET /ai/corpus-status
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "totalDocuments": 17,
  "byDomain": {
    "business": 5,
    "electrical": 8,
    "toeic": 4
  },
  "lastUpdated": "2026-03-31T13:22:10.182Z"
}
```

### Save Example Sentence

```
POST /ai/save-example
Authorization: Bearer <token>
```

**Request:**
```json
{
  "word_id": 1,
  "sentence": "We can leverage our resources effectively.",
  "type": "business"
}
```

**Response (201):**
```json
{
  "id": 42,
  "word_id": 1,
  "sentence": "We can leverage our resources effectively.",
  "type": "business",
  "created_at": "2024-03-31T12:30:00Z"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Email and password required"
}
```

### 401 Unauthorized

```json
{
  "error": "Invalid token"
}
```

### 404 Not Found

```json
{
  "error": "Word not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire in 7 days.

## Rate Limiting

No rate limiting is implemented in the MVP. Consider adding for production.

## Testing API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'

# Get words
curl http://localhost:5000/words?domain=business

# Get today's reviews
curl -X GET http://localhost:5000/review/today \
  -H "Authorization: Bearer <your_token>"
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables:
   - `base_url` = http://localhost:5000
   - `token` = (get from login response)
3. Use `{{base_url}}` and `{{token}}` in requests

### Using JavaScript/Frontend

See `frontend/lib/api.ts` for the API client usage.

