"""
User profile and dashboard routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.database import ChatHistory, FavoriteHerb, Herb, User, UserProfile
from app.schemas import DashboardResponse, UserResponse, UserUpdate
from app.utils.auth import get_current_user as require_current_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(require_current_user)):
    """Get current user profile"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    profile: UserUpdate,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    """Update user profile"""
    update_data = profile.model_dump(exclude_unset=True)

    username = update_data.get("username")
    if username is not None:
        username = username.strip()
        if not username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username cannot be empty",
            )

        existing_user = (
            db.query(User)
            .filter(User.username == username, User.id != current_user.id)
            .first()
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already taken",
            )
        update_data["username"] = username

    if "full_name" in update_data and update_data["full_name"] is not None:
        update_data["full_name"] = update_data["full_name"].strip() or None

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    """Get user dashboard"""
    dosha_profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )
    recent_chats = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.updated_at.desc())
        .limit(5)
        .all()
    )
    favorite_herbs = (
        db.query(Herb)
        .join(FavoriteHerb, FavoriteHerb.herb_id == Herb.id)
        .filter(FavoriteHerb.user_id == current_user.id)
        .all()
    )

    return DashboardResponse(
        user=current_user,
        dosha_profile=dosha_profile,
        recent_chats=recent_chats,
        favorite_herbs=favorite_herbs,
        wellness_recommendations=[],
    )
