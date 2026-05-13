"""
Herb library routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.database import User
from app.schemas import HerbListResponse, HerbResponse
from app.services.herbs import HerbService
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/herbs",
    tags=["herbs"],
)


@router.get("/", response_model=HerbListResponse)
async def list_herbs(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    dosha: str = Query(None),
    db: Session = Depends(get_db)
):
    """List herbs with optional filtering"""
    herbs, total = HerbService.list_herbs(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        dosha=dosha,
    )
    return HerbListResponse(items=herbs, total=total, skip=skip, limit=limit)


@router.get("/favorites", response_model=list[HerbResponse])
async def get_favorite_herbs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's favorite herbs"""
    return HerbService.get_favorite_herbs(db, current_user.id)


@router.get("/{herb_id}", response_model=HerbResponse)
async def get_herb(herb_id: str, db: Session = Depends(get_db)):
    """Get herb details"""
    herb = HerbService.get_herb(db, herb_id)
    if herb is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Herb not found",
        )
    return herb


@router.post("/{herb_id}/favorite")
async def favorite_herb(
    herb_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add herb to favorites"""
    herb = HerbService.get_herb(db, herb_id)
    if herb is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Herb not found",
        )

    if not HerbService.add_favorite(db, current_user.id, herb_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Herb is already in favorites",
        )

    return {"message": "Herb added to favorites"}
