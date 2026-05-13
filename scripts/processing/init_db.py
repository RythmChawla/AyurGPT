"""
Database initialization and sample-data utilities.
"""

import asyncio
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

DEFAULT_SQLITE_URL = f"sqlite:///{(BACKEND_DIR / 'ayurgpt_dev.db').as_posix()}"
os.environ.setdefault("DATABASE_URL", DEFAULT_SQLITE_URL)

from app.db.database import SessionLocal, engine
from app.models.database import Base, Herb, Source, User
from app.utils.auth import hash_password
from scripts.processing.sample_data import SAMPLE_HERBS


async def init_database():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
    print("[ok] Database tables created")


async def populate_sample_data():
    """Populate database with sample herb data."""
    db = SessionLocal()

    try:
        for herb_data in SAMPLE_HERBS:
            existing_herb = db.query(Herb).filter(Herb.name == herb_data["name"]).first()
            if existing_herb:
                continue

            herb = Herb(
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
            db.add(herb)

        db.commit()
        print("[ok] Sample herbs added to database")

    except Exception as exc:
        db.rollback()
        print(f"[error] Error populating sample data: {exc}")
        raise
    finally:
        db.close()


async def create_sample_user():
    """Create a sample user for testing."""
    db = SessionLocal()

    try:
        existing_user = db.query(User).filter(User.email == "demo@ayurgpt.com").first()
        if existing_user:
            print("[info] Demo user already exists")
            return

        user = User(
            email="demo@ayurgpt.com",
            username="demo",
            hashed_password=hash_password("demo123"),
            full_name="Demo User",
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        print("[ok] Demo user created (email: demo@ayurgpt.com, password: demo123)")

    except Exception as exc:
        db.rollback()
        print(f"[error] Error creating demo user: {exc}")
        raise
    finally:
        db.close()


async def main():
    """Main initialization script."""
    print("AyurGPT Database Initialization")
    print("=" * 50)

    await init_database()
    await populate_sample_data()
    await create_sample_user()

    print("\n[ok] Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(main())
