"""
Backend-local database initialization entrypoint.

Run from the backend directory:
    python init_db.py
"""

import asyncio
import importlib.util
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
SAMPLE_DATA_PATH = PROJECT_ROOT / "scripts" / "processing" / "sample_data.py"

os.environ.setdefault("DATABASE_URL", f"sqlite:///{(BACKEND_DIR / 'ayurgpt_dev.db').as_posix()}")

from app.db.database import SessionLocal, engine
from app.models.database import Base, Herb, User
from app.utils.auth import hash_password


def load_sample_herbs():
    """Load sample herbs from the shared project script without requiring root cwd."""
    spec = importlib.util.spec_from_file_location("ayurgpt_sample_data", SAMPLE_DATA_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load sample data from {SAMPLE_DATA_PATH}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.SAMPLE_HERBS


async def init_database():
    Base.metadata.create_all(bind=engine)
    print("[ok] Database tables created")


async def populate_sample_data():
    db = SessionLocal()
    sample_herbs = load_sample_herbs()

    try:
        for herb_data in sample_herbs:
            existing_herb = db.query(Herb).filter(Herb.name == herb_data["name"]).first()
            if existing_herb:
                continue

            db.add(
                Herb(
                    name=herb_data["name"],
                    sanskrit_name=herb_data.get("sanskrit_name"),
                    english_name=herb_data.get("english_name"),
                    description=herb_data.get("description"),
                    properties=herb_data.get("properties"),
                    dosha_effects=herb_data.get("dosha_effects"),
                    uses=", ".join(herb_data.get("uses", [])),
                    contraindications=herb_data.get("contraindications"),
                    preparation_methods=herb_data.get("preparation_methods"),
                    safety_warnings=herb_data.get("safety_warnings"),
                )
            )

        db.commit()
        print("[ok] Sample herbs added to database")
    except Exception as exc:
        db.rollback()
        print(f"[error] Error populating sample data: {exc}")
        raise
    finally:
        db.close()


async def create_sample_user():
    db = SessionLocal()

    try:
        existing_user = db.query(User).filter(User.email == "demo@ayurgpt.com").first()
        if existing_user:
            print("[info] Demo user already exists")
            return

        db.add(
            User(
                email="demo@ayurgpt.com",
                username="demo",
                hashed_password=hash_password("demo123"),
                full_name="Demo User",
                is_active=True,
                is_verified=True,
            )
        )
        db.commit()
        print("[ok] Demo user created (email: demo@ayurgpt.com, password: demo123)")
    except Exception as exc:
        db.rollback()
        print(f"[error] Error creating demo user: {exc}")
        raise
    finally:
        db.close()


async def main():
    print("AyurGPT Database Initialization")
    print("=" * 50)
    await init_database()
    await populate_sample_data()
    await create_sample_user()
    print("\n[ok] Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(main())
