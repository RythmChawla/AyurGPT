"""
Dosha Assessment Service
Implements the Ayurvedic constitution assessment quiz
"""

from typing import Dict, List, Optional
from app.schemas import DoshaProfileResponse
from app.utils.helpers import get_dosha_description


class DoshaAssessmentService:
    """Service for Dosha assessment and personalization"""

    # Assessment questions
    QUESTIONS = [
        # Vata questions
        {
            "id": "q1",
            "question": "What is your typical body frame?",
            "category": "Vata",
            "answers": [
                {"id": "a1", "text": "Thin, light, tall or short", "weight": 3},
                {"id": "a2", "text": "Medium, balanced", "weight": 2},
                {"id": "a3", "text": "Heavy, strong, broader", "weight": 1},
            ]
        },
        {
            "id": "q2",
            "question": "What are your joints typically like?",
            "category": "Vata",
            "answers": [
                {"id": "a1", "text": "Thin, prominent, cracking easily", "weight": 3},
                {"id": "a2", "text": "Medium", "weight": 2},
                {"id": "a3", "text": "Large, padded, stable", "weight": 1},
            ]
        },
        {
            "id": "q3",
            "question": "How is your digestion typically?",
            "category": "Vata",
            "answers": [
                {"id": "a1", "text": "Irregular, variable, tends toward gas", "weight": 3},
                {"id": "a2", "text": "Good with spicy foods", "weight": 2},
                {"id": "a3", "text": "Strong, slow, heavy", "weight": 1},
            ]
        },
        # Pitta questions
        {
            "id": "q4",
            "question": "How do you respond to heat and sun?",
            "category": "Pitta",
            "answers": [
                {"id": "a1", "text": "Tolerate well, prefer warmth", "weight": 1},
                {"id": "a2", "text": "Prefer coolness, sun bothers me", "weight": 3},
                {"id": "a3", "text": "Don't mind either way", "weight": 2},
            ]
        },
        {
            "id": "q5",
            "question": "What's your typical skin condition?",
            "category": "Pitta",
            "answers": [
                {"id": "a1", "text": "Dry, rough, cool", "weight": 1},
                {"id": "a2", "text": "Fair, warm, prone to rashes/acne", "weight": 3},
                {"id": "a3", "text": "Cool, moist, pale", "weight": 1},
            ]
        },
        {
            "id": "q6",
            "question": "What's your typical appetite?",
            "category": "Pitta",
            "answers": [
                {"id": "a1", "text": "Variable, often skip meals", "weight": 1},
                {"id": "a2", "text": "Strong, regular, can't skip meals", "weight": 3},
                {"id": "a3", "text": "Moderate, steady", "weight": 2},
            ]
        },
        # Kapha questions
        {
            "id": "q7",
            "question": "How is your energy and endurance?",
            "category": "Kapha",
            "answers": [
                {"id": "a1", "text": "Variable, gets tired easily", "weight": 1},
                {"id": "a2", "text": "Good but need stimulation", "weight": 2},
                {"id": "a3", "text": "Steady, strong, good endurance", "weight": 3},
            ]
        },
        {
            "id": "q8",
            "question": "How do you typically sleep?",
            "category": "Kapha",
            "answers": [
                {"id": "a1", "text": "Light, easily disturbed, insomnia", "weight": 1},
                {"id": "a2", "text": "Moderate, need less sleep", "weight": 2},
                {"id": "a3", "text": "Deep, sound, sleep too much", "weight": 3},
            ]
        },
        {
            "id": "q9",
            "question": "What's your typical mood and emotions?",
            "category": "Kapha",
            "answers": [
                {"id": "a1", "text": "Changeable, anxious, worry easily", "weight": 1},
                {"id": "a2", "text": "Focused, ambitious, irritable easily", "weight": 2},
                {"id": "a3", "text": "Calm, stable, emotionally patient", "weight": 3},
            ]
        },
    ]

    @classmethod
    def get_assessment_questions(cls) -> List[Dict]:
        """Get all assessment questions"""
        return cls.QUESTIONS

    @classmethod
    def calculate_dosha_scores(cls, answers: Dict[str, str]) -> Dict[str, float]:
        """
        Calculate Dosha scores from assessment answers
        
        Args:
            answers: Dict of question_id -> answer_id
            
        Returns:
            Dict with vata_score, pitta_score, kapha_score
        """
        scores = {"vata": 0.0, "pitta": 0.0, "kapha": 0.0}
        question_count = {"vata": 0, "pitta": 0, "kapha": 0}

        for question in cls.QUESTIONS:
            q_id = question["id"]
            category = question["category"].lower()

            if q_id in answers:
                answer_id = answers[q_id]
                # Find the weight for this answer
                for answer in question["answers"]:
                    if answer["id"] == answer_id:
                        scores[category] += answer["weight"]
                        question_count[category] += 1
                        break

        # Normalize scores
        for dosha in scores:
            if question_count[dosha] > 0:
                scores[dosha] = (scores[dosha] / (question_count[dosha] * 3)) * 100
            else:
                scores[dosha] = 0.0

        return scores

    @classmethod
    def assess_dosha(cls, answers: Dict[str, str]) -> DoshaProfileResponse:
        """
        Complete Dosha assessment
        
        Args:
            answers: User's quiz answers
            
        Returns:
            DoshaProfileResponse with assessment results
        """
        scores = cls.calculate_dosha_scores(answers)

        # Determine primary and secondary doshas
        sorted_doshas = sorted(
            scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        primary_dosha = sorted_doshas[0][0].capitalize()
        secondary_dosha = sorted_doshas[1][0].capitalize() if sorted_doshas[1][1] > 0 else None

        # Generate description
        description = get_dosha_description(
            scores["vata"],
            scores["pitta"],
            scores["kapha"]
        )

        return DoshaProfileResponse(
            vata_score=scores["vata"],
            pitta_score=scores["pitta"],
            kapha_score=scores["kapha"],
            primary_dosha=primary_dosha,
            secondary_dosha=secondary_dosha,
            dosha_description=description
        )

    @classmethod
    def generate_dosha_description(cls, primary_dosha: str, secondary_dosha: Optional[str], scores: Dict[str, float]) -> str:
        """Generate personalized dosha description based on scores"""
        descriptions = {
            "Vata": "You are primarily a Vata constitution. Vata is associated with movement, creativity, and change. Vata types tend to be flexible, imaginative, and quick learners. Key characteristics include a slender frame, quick thinking, and preference for warmth and routine.",
            "Pitta": "You are primarily a Pitta constitution. Pitta is associated with transformation, metabolism, and intelligence. Pitta types tend to be ambitious, focused, and have strong digestion. Key characteristics include a medium frame, sharp intellect, and preference for coolness.",
            "Kapha": "You are primarily a Kapha constitution. Kapha is associated with stability, strength, and nourishment. Kapha types tend to be calm, grounded, and patient. Key characteristics include a strong, sturdy frame, emotional stability, and steady energy.",
        }
        
        desc = descriptions.get(primary_dosha, "")
        if secondary_dosha:
            secondary_desc = {
                "Vata": " You also have some Vata qualities, bringing flexibility and creativity to your nature.",
                "Pitta": " You also have some Pitta qualities, bringing focus and transformation to your nature.",
                "Kapha": " You also have some Kapha qualities, bringing stability and grounding to your nature.",
            }
            desc += secondary_desc.get(secondary_dosha, "")
        
        return desc

    @classmethod
    def get_dosha_recommendations(cls, primary_dosha: str) -> Dict[str, List[str]]:
        """Get wellness recommendations based on Dosha"""
        recommendations = {
            "Vata": {
                "diet": [
                    "Warm, cooked foods",
                    "Oils and healthy fats",
                    "Warm spices (ginger, cumin)",
                    "Regular meal times",
                    "Warm drinks"
                ],
                "lifestyle": [
                    "Regular routine",
                    "Warm oil massage (Abhyanga)",
                    "Adequate sleep",
                    "Grounding activities",
                    "Avoid excessive cold"
                ],
                "herbs": ["Ashwagandha", "Sesame", "Ghee", "Ginger"]
            },
            "Pitta": {
                "diet": [
                    "Cool, hydrating foods",
                    "Bitter and sweet tastes",
                    "Cooling spices",
                    "Plenty of water",
                    "Avoid excess salt and spice"
                ],
                "lifestyle": [
                    "Cooling practices",
                    "Swimming or water activities",
                    "Calm environments",
                    "Meditation",
                    "Avoid excessive heat"
                ],
                "herbs": ["Brahmi", "Tulsi", "Mint", "Coconut"]
            },
            "Kapha": {
                "diet": [
                    "Light, dry foods",
                    "Spicy and bitter tastes",
                    "Stimulating spices",
                    "Warm drinks",
                    "Limited oils and fats"
                ],
                "lifestyle": [
                    "Regular exercise",
                    "Dry massage (Ubtan)",
                    "Stimulating activities",
                    "Early rising",
                    "Variety in routine"
                ],
                "herbs": ["Ginger", "Black pepper", "Turmeric", "Fenugreek"]
            }
        }

        return recommendations.get(primary_dosha, {})
