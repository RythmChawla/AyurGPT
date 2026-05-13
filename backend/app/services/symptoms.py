"""
Symptom analyzer service
"""

from typing import Dict, List, Optional


class SymptomAnalyzerService:
    """Service for analyzing symptoms through Ayurvedic lens"""

    # Symptom keywords for each dosha
    VATA_SYMPTOMS = {
        "anxiety", "worry", "fear", "insomnia", "sleep issues", "light sleep",
        "dry skin", "dry", "thin", "constipation", "bloating", "gas", "flatulence",
        "irregular", "variable", "changeable", "scattered", "cold", "coldness",
        "trembling", "twitching", "restlessness", "hyperactive", "thin voice"
    }

    PITTA_SYMPTOMS = {
        "acid", "acid reflux", "heartburn", "burning", "fever", "hot", "heat",
        "rash", "skin issues", "inflammation", "inflamed", "anger", "irritable",
        "irritability", "sharp pain", "diarrhea", "loose stool", "acidic",
        "strong appetite", "intense", "competitive", "perfectionist", "aggressive"
    }

    KAPHA_SYMPTOMS = {
        "congestion", "heavy", "sluggish", "slow", "congested", "mucus", "phlegm",
        "swelling", "edema", "weight", "obesity", "lethargy", "lazy", "tired",
        "excessive sleep", "sleep too much", "sticky", "cold", "damp", "pale",
        "white coating", "attachment", "possessive", "calm", "strong", "stable"
    }

    SUGGESTIONS = [
        "anxiety",
        "acid reflux",
        "bloating",
        "cold",
        "congestion",
        "constipation",
        "cough",
        "depression",
        "diarrhea",
        "dry skin",
        "eczema",
        "fatigue",
        "fever",
        "gas",
        "headache",
        "heartburn",
        "heaviness",
        "high blood pressure",
        "hot flashes",
        "inflammation",
        "insomnia",
        "irritability",
        "joint pain",
        "lethargy",
        "mucus",
        "nausea",
        "nervous tension",
        "poor digestion",
        "rash",
        "restlessness",
        "sluggish digestion",
        "swelling",
        "trembling",
        "weak digestion",
    ]

    def analyze_symptom_pattern(self, symptoms: List[str]) -> Dict[str, float]:
        """
        Analyze symptom pattern and determine dosha involvement
        
        Args:
            symptoms: List of symptom descriptions
            
        Returns:
            Dict with vata, pitta, kapha scores (0-1)
        """
        text = " ".join(symptoms).lower()
        words = text.split()

        vata_score = 0.0
        pitta_score = 0.0
        kapha_score = 0.0

        # Count keyword matches
        for word in words:
            if word in self.VATA_SYMPTOMS:
                vata_score += 1
            if word in self.PITTA_SYMPTOMS:
                pitta_score += 1
            if word in self.KAPHA_SYMPTOMS:
                kapha_score += 1

        # Normalize scores
        total = vata_score + pitta_score + kapha_score
        if total > 0:
            vata_score = min(1.0, vata_score / total)
            pitta_score = min(1.0, pitta_score / total)
            kapha_score = min(1.0, kapha_score / total)
        else:
            # Default equal distribution if no keywords match
            vata_score = pitta_score = kapha_score = 0.33

        return {
            "vata": round(vata_score, 2),
            "pitta": round(pitta_score, 2),
            "kapha": round(kapha_score, 2),
        }

    def generate_explanation(self, symptoms: List[str], dosha_scores: Dict[str, float]) -> str:
        """Generate explanation based on symptoms and dosha involvement"""
        # Determine primary dosha
        primary = max(dosha_scores, key=dosha_scores.get)
        primary_score = dosha_scores[primary]

        explanations = {
            "vata": (
                f"Your symptoms suggest a pattern associated with elevated Vata. "
                f"Vata is characterized by qualities of movement, dryness, and irregularity. "
                f"The symptoms '{', '.join(symptoms[:2])}' often appear when Vata is imbalanced. "
                f"This typically manifests as anxiety, irregular patterns, dryness, or constipation."
            ),
            "pitta": (
                f"Your symptoms suggest a pattern associated with elevated Pitta. "
                f"Pitta is characterized by qualities of heat, transformation, and intensity. "
                f"The symptoms '{', '.join(symptoms[:2])}' often appear when Pitta is imbalanced. "
                f"This typically manifests as burning sensations, inflammation, or acidity."
            ),
            "kapha": (
                f"Your symptoms suggest a pattern associated with elevated Kapha. "
                f"Kapha is characterized by qualities of heaviness, stability, and congestion. "
                f"The symptoms '{', '.join(symptoms[:2])}' often appear when Kapha is imbalanced. "
                f"This typically manifests as heaviness, congestion, or sluggishness."
            ),
        }

        return explanations.get(primary, (
            f"Your symptoms show a mixed pattern. "
            f"The reported symptoms '{', '.join(symptoms[:2])}' may involve multiple doshic imbalances. "
            f"Understanding your unique constitution helps personalize recommendations."
        ))

    def generate_recommendations(
        self,
        symptoms: List[str],
        dosha_scores: Dict[str, float],
        is_urgent: bool
    ) -> List[str]:
        """Generate wellness recommendations based on analysis"""
        recommendations = []

        if is_urgent:
            recommendations.append(
                "URGENT: If experiencing chest pain, difficulty breathing, severe bleeding, or other serious symptoms, seek immediate medical care."
            )

        primary = max(dosha_scores, key=dosha_scores.get)

        # Generate dosha-specific recommendations
        if primary == "vata":
            recommendations.extend([
                "Establish a consistent daily routine to ground Vata energy",
                "Favor warm, nourishing, and well-cooked foods",
                "Include healthy oils and fats in your diet (sesame, ghee)",
                "Practice grounding activities like yoga or massage",
                "Ensure adequate rest and sleep (7-9 hours)",
                "Warm herbal teas like ginger or ashwagandha tea can be helpful",
            ])
        elif primary == "pitta":
            recommendations.extend([
                "Favor cooling and hydrating foods",
                "Include bitter and sweet tastes (leafy greens, fresh fruits)",
                "Avoid excess spicy foods and alcohol",
                "Practice cooling activities like swimming or meditation",
                "Eat at regular times to support steady digestion",
                "Cooling herbs like brahmi, tulsi, or coconut can be supportive",
            ])
        else:  # kapha
            recommendations.extend([
                "Increase physical activity and exercise regularly",
                "Favor light, warm, and dry foods",
                "Include spicy and stimulating flavors (ginger, black pepper, turmeric)",
                "Reduce heavy, oily, and cold foods",
                "Practice stimulating yoga or vigorous exercise",
                "Avoid sleeping excessively or during the day",
            ])

        # General recommendations
        recommendations.extend([
            "Track when symptoms occur and what seems to trigger them",
            "Keep a food and symptom diary to identify patterns",
            "Consult a qualified Ayurvedic practitioner for personalized guidance",
        ])

        return recommendations

    def get_suggestions(self, query: str) -> List[str]:
        """Get symptom suggestions based on query"""
        normalized = query.strip().lower()
        if not normalized:
            return self.SUGGESTIONS[:10]
        return [item for item in self.SUGGESTIONS if normalized in item.lower()]
