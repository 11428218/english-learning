#!/bin/bash

# DuoLingual Setup Script
# Complete setup for local development

echo "🚀 DuoLingual Setup"
echo "==================="

# Check prerequisites
echo ""
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12+"
    exit 1
fi

echo "✓ Node.js $(node -v)"
echo "✓ npm $(npm -v)"
echo "✓ PostgreSQL installed"

# Setup Backend
echo ""
echo "Setting up Backend..."
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your database credentials and API keys"
fi

echo "Installing backend dependencies..."
npm install

# Setup Frontend
echo ""
echo "Setting up Frontend..."
cd ../frontend

if [ ! -f .env.local ]; then
    echo "Creating .env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
fi

echo "Installing frontend dependencies..."
npm install

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure backend/.env with database credentials and API keys"
echo "2. In one terminal: cd backend && npm run db:init && npm run db:seed && npm run dev"
echo "3. In another terminal: cd frontend && npm run dev"
echo "4. Open http://localhost:3000"
