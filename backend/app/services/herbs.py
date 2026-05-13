"""
Herb service for managing herb database
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.database import Herb, FavoriteHerb
from app.db.database import SessionLocal


class HerbService:
    """Service for herb-related operations"""

    @staticmethod
    def list_herbs(
        db: Session,
        skip: int = 0,
        limit: int = 10,
        search: Optional[str] = None,
        dosha: Optional[str] = None
    ) -> tuple:
        """
        List herbs with filtering
        
        Returns:
            Tuple of (herbs, total_count)
        """
        query = db.query(Herb)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Herb.name.ilike(search_term)) |
                (Herb.sanskrit_name.ilike(search_term)) |
                (Herb.description.ilike(search_term))
            )

        if dosha:
            dosha_key = dosha.strip().capitalize()
            query = query.filter(Herb.dosha_effects[dosha_key].as_string().isnot(None))

        total = query.count()
        herbs = query.offset(skip).limit(limit).all()

        return herbs, total

    @staticmethod
    def get_herb(db: Session, herb_id: str) -> Optional[Herb]:
        """Get a single herb by ID"""
        return db.query(Herb).filter(Herb.id == herb_id).first()

    @staticmethod
    def create_herb(db: Session, herb_data: dict) -> Herb:
        """Create a new herb"""
        herb = Herb(**herb_data)
        db.add(herb)
        db.commit()
        db.refresh(herb)
        return herb

    @staticmethod
    def update_herb(db: Session, herb_id: str, herb_data: dict) -> Optional[Herb]:
        """Update a herb"""
        herb = db.query(Herb).filter(Herb.id == herb_id).first()
        if herb:
            for key, value in herb_data.items():
                setattr(herb, key, value)
            db.commit()
            db.refresh(herb)
        return herb

    @staticmethod
    def delete_herb(db: Session, herb_id: str) -> bool:
        """Delete a herb"""
        herb = db.query(Herb).filter(Herb.id == herb_id).first()
        if herb:
            db.delete(herb)
            db.commit()
            return True
        return False

    @staticmethod
    def add_favorite(db: Session, user_id: str, herb_id: str) -> bool:
        """Add herb to user's favorites"""
        try:
            favorite = FavoriteHerb(user_id=user_id, herb_id=herb_id)
            db.add(favorite)
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False

    @staticmethod
    def remove_favorite(db: Session, user_id: str, herb_id: str) -> bool:
        """Remove herb from favorites"""
        try:
            db.query(FavoriteHerb).filter(
                FavoriteHerb.user_id == user_id,
                FavoriteHerb.herb_id == herb_id
            ).delete()
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False

    @staticmethod
    def get_favorite_herbs(db: Session, user_id: str) -> List[Herb]:
        """Get user's favorite herbs"""
        favorites = db.query(Herb).join(
            FavoriteHerb
        ).filter(FavoriteHerb.user_id == user_id).all()
        return favorites
