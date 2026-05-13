# AyurGPT Backend

Run commands from this `backend` directory.

## Initialize local dev database

```powershell
python init_db.py
```

By default this creates and seeds `ayurgpt_dev.db` using SQLite. To use PostgreSQL,
set `DATABASE_URL` before running the command.

## Start API server

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
