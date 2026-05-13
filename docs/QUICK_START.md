"""
Quick start guide for AyurGPT
"""

# QUICK START GUIDE

## 5-Minute Setup

### 1. Clone and Enter Directory
```bash
cd AyurGPT
```

### 2. Install Backend
```bash
cd backend
python -m venv venv
# Activate venv (Windows):
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Setup Environment
```bash
# Go back to root
cd ..

# Copy environment template
cp .env.example .env

# Edit .env and add:
# - OpenAI API Key
# - Database URL (or use SQLite for quick testing)
# - Vector DB settings (Pinecone or ChromaDB)
```

### 4. Initialize Database
```bash
cd backend
python -m scripts.processing.init_db
```

### 5. Start Backend
```bash
# From backend directory
uvicorn app.main:app --reload
```

Check: http://localhost:8000/docs

### 6. Install Frontend (New Terminal)
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Check: http://localhost:3000

---

## Testing the System

1. **Visit Home Page**: http://localhost:3000
2. **API Docs**: http://localhost:8000/docs
3. **Health Check**: http://localhost:8000/health

---

## Next Steps

1. Add Ayurvedic texts to `scripts/documents/`
2. Run ingestion: `python -m scripts.ingestion.ingest_documents`
3. Test chatbot at http://localhost:3000/chat
4. Take Dosha quiz at http://localhost:3000/dosha

---

## Common Issues

**Backend won't start**
```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**Frontend won't load**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run dev
```

**API connection error**
- Ensure backend is running on http://localhost:8000
- Check .env.local has correct NEXT_PUBLIC_API_URL

---

For full documentation, see README.md and docs/DEPLOYMENT.md
