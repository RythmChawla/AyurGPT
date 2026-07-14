# AyurGPT - AI-Powered Ayurvedic Knowledge & Wellness Assistant

A full-stack, production-grade RAG (Retrieval-Augmented Generation) based web platform that provides trustworthy Ayurvedic wellness information using classical Ayurvedic texts and modern AI.

## 🌿 Project Overview

AyurGPT combines classical Ayurvedic wisdom with modern RAG architecture to create an intelligent platform that:

- **Interactive Chatbot**: Ask health and wellness questions with citations from classical texts
- **Dosha Assessment**: Personalized Ayurvedic constitution (Prakriti) analysis
- **Herb Library**: Searchable database of Ayurvedic herbs and their uses
- **Symptom Checker**: Understand symptoms through an Ayurvedic lens
- **Personalized Dashboard**: Track your Dosha profile and wellness journey

## ⚠️ Important Disclaimer

**This platform is ONLY for educational and wellness-awareness purposes. It must NEVER replace professional medical advice, diagnosis, or emergency healthcare.**

## 🏗️ Technology Stack

### Frontend
- Next.js 14+
- React 18+
- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion
- Streaming responses

### Backend
- FastAPI
- Python 3.10+
- PostgreSQL
- JWT Authentication
- Google OAuth

### Data & AI
- Vector Database: Pinecone or ChromaDB
- Embedding Model: Sentence Transformers
- LLM: Groq OpenAI-compatible API
- Retrieval: Hybrid (semantic + BM25)
- RAG Pipeline with advanced chunking

### Deployment
- Frontend: Vercel
- Backend: Railway / Render
- Vector DB: Pinecone / Self-hosted ChromaDB
- Database: PostgreSQL

## 📁 Project Structure

```
AyurGPT/
├── frontend/                 # Next.js application
│   ├── app/                 # App directory
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities and helpers
│   ├── styles/              # TailwindCSS styles
│   ├── types/               # TypeScript types
│   └── public/              # Static assets
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── rag/             # RAG pipeline
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   ├── prompts/         # System prompts
│   │   └── db/              # Database config
│   ├── main.py              # FastAPI entry point
│   └── requirements.txt      # Python dependencies
├── scripts/                  # Data processing scripts
│   ├── ingestion/           # PDF/text ingestion
│   └── processing/          # Chunking and embedding
├── docker/                   # Docker configurations
├── docs/                     # Documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Clone and Setup

```bash
# Navigate to project
cd AyurGPT

# Create environment file
cp .env.example .env
# Update .env with your credentials
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload
```

Backend runs on: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

Frontend runs on: `http://localhost:3000`

## 📚 Core Features

### 1. Interactive RAG Chatbot
- Conversational AI trained on classical Ayurvedic texts
- Source attribution for all answers
- Context-aware responses
- Personalized based on user's Dosha profile
- Streaming responses with markdown support

### 2. Dosha Assessment Quiz
- Multi-step questionnaire
- Weighted scoring system
- Personalized Dosha distribution visualization
- Results saved to user profile for chatbot personalization

### 3. Herb Library
- Searchable database of Ayurvedic herbs
- Sanskrit names and traditional uses
- Dosha effects and properties
- Safety information and contraindications
- Preparation methods

### 4. Symptom Checker
- Map symptoms to Ayurvedic concepts
- Educational explanations
- Suggest possible Dosha imbalances
- Never claims to diagnose diseases

### 5. Personalized Dashboard
- User's Dosha profile
- Chat history
- Wellness recommendations
- Saved herbs
- Daily routine suggestions

## 🔐 Safety & Guardrails

The AI system includes multiple safety layers:

1. **Strict System Prompts**: Ensures AI only answers from retrieved context
2. **Source Verification**: All answers are cited from classical texts
3. **Medical Disclaimers**: Clear warnings about educational-only purpose
4. **Emergency Detection**: Immediate redirection to professional help for serious symptoms
5. **Hallucination Prevention**: Retrieval-based responses avoid fabrication

## 🔧 RAG Pipeline Architecture

1. **Document Ingestion**: PDF parsing, OCR for scanned texts
2. **Text Processing**: Chapter and verse detection
3. **Semantic Chunking**: Context-aware text segmentation
4. **Metadata Tagging**: Book, chapter, verse, topic, Dosha references
5. **Embedding Generation**: Using sentence transformers
6. **Vector Storage**: Pinecone or ChromaDB
7. **Hybrid Retrieval**: Semantic + BM25 keyword search
8. **Reranking**: Relevance-based result ordering
9. **Grounded Generation**: LLM respects retrieved context

## 📖 Classical Ayurvedic Texts Included

- Charaka Samhita
- Sushruta Samhita
- Ashtanga Hridayam
- Bhava Prakasha
- And more public Ayurvedic wellness texts

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and profiles
- **user_profiles**: Dosha assessments and personalization
- **chat_messages**: Conversation history
- **herbs**: Herb library
- **sources**: Ayurvedic text citations
- **embeddings_metadata**: Vector DB metadata

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google-login` - Google OAuth login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Chat
- `POST /api/chat/message` - Send message to chatbot
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/{chat_id}` - Delete chat
- `GET /api/chat/{message_id}/sources` - Get sources for message

### Dosha Assessment
- `POST /api/dosha/assess` - Submit assessment
- `GET /api/dosha/profile` - Get user's Dosha profile
- `PUT /api/dosha/profile` - Update Dosha profile

### Herbs
- `GET /api/herbs` - List herbs (with pagination/search)
- `GET /api/herbs/{herb_id}` - Get herb details
- `POST /api/herbs/favorite` - Save favorite herb
- `GET /api/herbs/favorites` - Get favorite herbs

### Symptom Checker
- `POST /api/symptoms/analyze` - Analyze symptoms
- `GET /api/symptoms/suggestions` - Get symptom suggestions

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/dashboard` - Get dashboard data

## 📦 Environment Variables

See `.env.example` for complete list. Key variables:

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ayurgpt_db

# Vector DB
PINECONE_API_KEY=your-key
VECTOR_DB_TYPE=pinecone

# LLM
GROQ_API_KEY=your-key
GROQ_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.1-8b-instant

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🐳 Docker Deployment

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

See `/docs` folder for:
- API Documentation
- RAG Pipeline Guide
- Database Schema
- Deployment Guide
- Contributing Guidelines

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Automatic deployment from GitHub
# Or manual:
vercel deploy
```

### Backend (Railway/Render)
```bash
# Follow deployment platform specific instructions
# Push to GitHub and connect repository
```

## 🙏 Acknowledgments

- Classical Ayurvedic texts authors
- Ayurveda scholars and practitioners
- Modern AI/ML communities
- Open source contributors

---

**Remember**: AyurGPT provides educational information only. Always consult qualified healthcare professionals for medical advice.

🌿 **Discover Ayurvedic Wellness with AI**
