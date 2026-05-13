"""
Symptom checker routes
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas import SymptomCheckRequest, SymptomAnalysisResponse
from app.utils.helpers import is_serious_symptom
from app.services.symptoms import SymptomAnalyzerService

router = APIRouter(
    prefix="/symptoms",
    tags=["symptoms"],
)

symptom_analyzer = SymptomAnalyzerService()


@router.post("/analyze", response_model=SymptomAnalysisResponse)
async def analyze_symptoms(request: SymptomCheckRequest, db: Session = Depends(get_db)):
    """Analyze symptoms through Ayurvedic lens"""
    symptoms = [symptom.strip() for symptom in request.symptoms if symptom.strip()]
    
    if not symptoms:
        return SymptomAnalysisResponse(
            symptoms=[],
            possible_dosha_involvement={"vata": 0.0, "pitta": 0.0, "kapha": 0.0},
            explanation="Please provide at least one symptom.",
            recommendations=[],
            disclaimer="This information is for education only and does not replace medical advice."
        )
    
    # Analyze symptoms for dosha involvement
    dosha_scores = symptom_analyzer.analyze_symptom_pattern(symptoms)
    
    # Check for serious symptoms
    urgent = is_serious_symptom(symptoms)
    
    # Generate recommendations
    recommendations = symptom_analyzer.generate_recommendations(symptoms, dosha_scores, urgent)
    
    # Generate explanation
    explanation = symptom_analyzer.generate_explanation(symptoms, dosha_scores)
    
    return SymptomAnalysisResponse(
        symptoms=symptoms,
        possible_dosha_involvement=dosha_scores,
        explanation=explanation,
        recommendations=recommendations,
        disclaimer=(
            "This information is for educational purposes only and does not replace "
            "professional medical diagnosis or treatment. Always consult a qualified "
            "healthcare provider, especially for persistent or serious symptoms."
        ),
    )


@router.get("/suggestions")
async def get_symptom_suggestions(query: str = Query("")):
    """Get symptom suggestions for autocomplete"""
    return symptom_analyzer.get_suggestions(query)
