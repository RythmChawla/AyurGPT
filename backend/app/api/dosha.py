"""
Dosha assessment routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.database import User, UserProfile
from app.schemas import DoshaAssessmentRequest, DoshaProfileResponse
from app.services.dosha import DoshaAssessmentService
from app.utils.auth import get_current_user
from datetime import datetime

router = APIRouter(
    prefix="/dosha",
    tags=["dosha"],
)


@router.get("/questions")
async def get_assessment_questions():
    """Get Dosha assessment questions"""
    return DoshaAssessmentService.get_assessment_questions()


@router.post("/assess", response_model=DoshaProfileResponse)
async def assess_dosha(
    assessment: DoshaAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit Dosha assessment and save to user profile"""
    scores = DoshaAssessmentService.calculate_dosha_scores(assessment.answers)
    
    # Determine primary and secondary doshas
    sorted_doshas = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary_dosha = sorted_doshas[0][0].capitalize()
    secondary_dosha = sorted_doshas[1][0].capitalize() if sorted_doshas[1][1] > 0 else None
    
    # Generate dosha description
    dosha_description = DoshaAssessmentService.generate_dosha_description(
        primary_dosha=primary_dosha,
        secondary_dosha=secondary_dosha,
        scores=scores
    )
    
    # Check if user already has a profile
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )
    
    if profile:
        # Update existing profile
        profile.vata_score = scores.get("vata", 0.0)
        profile.pitta_score = scores.get("pitta", 0.0)
        profile.kapha_score = scores.get("kapha", 0.0)
        profile.primary_dosha = primary_dosha
        profile.secondary_dosha = secondary_dosha
        profile.dosha_description = dosha_description
        profile.assessment_data = assessment.answers
        profile.updated_at = datetime.utcnow()
    else:
        # Create new profile
        profile = UserProfile(
            user_id=current_user.id,
            vata_score=scores.get("vata", 0.0),
            pitta_score=scores.get("pitta", 0.0),
            kapha_score=scores.get("kapha", 0.0),
            primary_dosha=primary_dosha,
            secondary_dosha=secondary_dosha,
            dosha_description=dosha_description,
            assessment_data=assessment.answers,
        )
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    
    return DoshaProfileResponse(
        vata_score=profile.vata_score,
        pitta_score=profile.pitta_score,
        kapha_score=profile.kapha_score,
        primary_dosha=profile.primary_dosha,
        secondary_dosha=profile.secondary_dosha,
        dosha_description=profile.dosha_description,
    )


@router.get("/profile", response_model=DoshaProfileResponse)
async def get_dosha_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's Dosha profile"""
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dosha profile not found. Please complete the assessment first.",
        )
    return profile
