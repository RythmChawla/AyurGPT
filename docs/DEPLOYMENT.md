"""
DEPLOYMENT & SETUP GUIDE

This document provides comprehensive instructions for deploying AyurGPT
"""

# Table of Contents
1. Local Development Setup
2. Docker Deployment
3. Production Deployment
4. Environment Configuration
5. Database Setup
6. Vector Store Setup
7. Troubleshooting

---

## 1. LOCAL DEVELOPMENT SETUP

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Git

### Backend Setup

```bash
# Navigate to project
cd AyurGPT

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Copy environment template
cp ../.env.example ../.env

# Update .env with your settings
# IMPORTANT: Update:
# - DATABASE_URL
# - SECRET_KEY (generate a new one)
# - OPENAI_API_KEY
# - PINECONE_API_KEY or configure ChromaDB

# Initialize database
python -m scripts.processing.init_db

# Run development server
uvicorn app.main:app --reload
```

Backend runs on: http://localhost:8000
API Docs: http://localhost:8000/docs

### Frontend Setup

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install
# or
yarn install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
# or
yarn dev
```

Frontend runs on: http://localhost:3000

---

## 2. DOCKER DEPLOYMENT

### Prerequisites
- Docker
- Docker Compose

### Quick Start

```bash
# From project root
cd docker

# Build and start all services
docker-compose build
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

All services will be available:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Docs: http://localhost:8000/docs

### Using ChromaDB (optional)

```bash
# Start with ChromaDB
docker-compose --profile chromadb up -d
```

---

## 3. PRODUCTION DEPLOYMENT

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel deploy --prod

# Or connect GitHub repository in Vercel dashboard
# for automatic deployments
```

### Backend Deployment (Railway/Render)

#### Using Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Using Render

1. Push code to GitHub
2. Connect repository in Render dashboard
3. Configure environment variables
4. Deploy

### Environment Variables for Production

```
# Database
DATABASE_URL=postgresql://user:password@host:5432/ayurgpt_prod

# Security
SECRET_KEY=generate-a-secure-random-key
ENVIRONMENT=production
DEBUG=false

# LLM
OPENAI_API_KEY=your-key

# Vector Database
VECTOR_DB_TYPE=pinecone
PINECONE_API_KEY=your-key
PINECONE_INDEX_NAME=ayurgpt-prod

# Frontend
NEXT_PUBLIC_API_URL=https://api.ayurgpt.com

# CORS
ALLOWED_ORIGINS=["https://ayurgpt.com", "https://www.ayurgpt.com"]
```

---

## 4. ENVIRONMENT CONFIGURATION

### .env File Template

Copy `.env.example` and update:

```bash
cp .env.example .env
```

### Critical Settings

1. **DATABASE_URL** - PostgreSQL connection string
   ```
   postgresql://user:password@localhost:5432/ayurgpt_db
   ```

2. **SECRET_KEY** - Generate using:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **OPENAI_API_KEY** - Get from openai.com

4. **Vector Database** - Choose one:
   - Pinecone: Set PINECONE_API_KEY
   - ChromaDB: Set CHROMADB_PATH (local storage)

---

## 5. DATABASE SETUP

### PostgreSQL Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE ayurgpt_db;"

# Create user
psql -U postgres -c "CREATE USER ayurgpt WITH PASSWORD 'password';"

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ayurgpt_db TO ayurgpt;"

# Connect and initialize
psql -U ayurgpt -d ayurgpt_db < scripts/sql/init.sql
```

### Run Migrations

```bash
# Initialize database tables
cd backend
python -m scripts.processing.init_db

# Load sample data
python -m scripts.processing.sample_data
```

---

## 6. VECTOR STORE SETUP

### Option A: Pinecone

1. Create account at pinecone.io
2. Create an index named "ayurgpt"
3. Set PINECONE_API_KEY in .env
4. Upload documents:
   ```bash
   python scripts/ingestion/ingest_documents.py
   ```

### Option B: ChromaDB (Local)

```bash
# ChromaDB data will be stored locally in chromadb_data/
# No additional setup needed

# Ingest documents
python scripts/ingestion/ingest_documents.py
```

---

## 7. DOCUMENT INGESTION

### Prepare Your Documents

1. Place Ayurvedic texts in `scripts/documents/` folder
2. Supported formats: .txt, .pdf, .json

### Ingest Documents

```bash
cd backend

# Run ingestion script
python -m scripts.ingestion.ingest_documents

# Documents will be:
# 1. Processed and cleaned
# 2. Split into chunks
# 3. Embedded using sentence-transformers
# 4. Stored in vector database
```

### Verify Ingestion

```bash
# Test retrieval
python -c "
from app.rag.pipeline import get_rag_pipeline
import asyncio

async def test():
    rag = get_rag_pipeline()
    results = await rag.retrieve_context('What is Vata?')
    print(f'Found {len(results)} documents')

asyncio.run(test())
"
```

---

## 8. MONITORING & MAINTENANCE

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/
```

### Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Application logs
tail -f backend/logs/app.log
```

### Database Backups

```bash
# Backup PostgreSQL
pg_dump -U ayurgpt ayurgpt_db > backup.sql

# Restore
psql -U ayurgpt ayurgpt_db < backup.sql

# Backup ChromaDB (if using)
cp -r chromadb_data chromadb_data_backup
```

---

## 9. TROUBLESHOOTING

### Backend Issues

#### Port 8000 already in use
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
```

#### Database connection error
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify connection string in .env
```

#### OpenAI API errors
- Verify API key is correct
- Check account has credits
- Rate limit: wait a minute and retry

### Frontend Issues

#### API connection errors
- Ensure backend is running on port 8000
- Check NEXT_PUBLIC_API_URL in .env.local
- Verify CORS settings in backend

#### Build errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Vector Database Issues

#### Pinecone connection failed
- Verify API key
- Check index exists
- Verify index dimension matches embeddings

#### ChromaDB not found
- Ensure chromadb_data directory exists
- Check file permissions
- Verify ChromaDB is installed

---

## 10. SECURITY CHECKLIST

Before production deployment:

- [ ] Change SECRET_KEY
- [ ] Use strong DATABASE password
- [ ] Enable SSL/TLS for connections
- [ ] Set DEBUG=false
- [ ] Update ALLOWED_ORIGINS
- [ ] Enable rate limiting
- [ ] Setup database backups
- [ ] Configure monitoring/alerts
- [ ] Use environment variables for all secrets
- [ ] Setup authentication properly
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Setup firewall rules
- [ ] Regular security updates

---

## 11. PERFORMANCE OPTIMIZATION

### Database
- Add indexes on frequently queried columns
- Implement query caching
- Use connection pooling

### Frontend
- Enable image optimization
- Implement code splitting
- Use service workers for caching

### Backend
- Setup API rate limiting
- Implement response caching
- Optimize database queries
- Use async operations

---

## 12. SUPPORT & ISSUES

For issues or questions:
- GitHub Issues: [project-url]
- Email: support@ayurgpt.com
- Documentation: [docs-url]

---

Generated: 2024
Last Updated: 2024
