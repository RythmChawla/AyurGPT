"""
General utility functions
"""

import uuid
from typing import Optional, List
import httpx


def generate_id() -> str:
    """Generate a unique ID"""
    return str(uuid.uuid4())


def is_valid_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


async def send_email(
    to: str,
    subject: str,
    body: str,
    html: Optional[str] = None
) -> bool:
    """Send email"""
    # Implementation would go here
    # For now, just return True
    return True


def is_serious_symptom(symptoms: List[str]) -> bool:
    """Check if symptoms indicate a serious condition requiring immediate attention"""
    serious_keywords = [
        "chest pain",
        "seizure",
        "suicidal",
        "severe bleeding",
        "breathing",
        "unconscious",
        "choking",
        "severe allergic",
        "poison",
        "overdose",
    ]
    
    symptoms_lower = [s.lower() for s in symptoms]
    for symptom in symptoms_lower:
        for keyword in serious_keywords:
            if keyword in symptom:
                return True
    
    return False


def get_dosha_description(vata: float, pitta: float, kapha: float) -> str:
    """Generate description of Dosha balance"""
    total = vata + pitta + kapha
    if total == 0:
        return "Assessment incomplete"
    
    vata_pct = (vata / total) * 100
    pitta_pct = (pitta / total) * 100
    kapha_pct = (kapha / total) * 100
    
    # Determine primary and secondary doshas
    doshas = [
        ("Vata", vata_pct),
        ("Pitta", pitta_pct),
        ("Kapha", kapha_pct)
    ]
    doshas.sort(key=lambda x: x[1], reverse=True)
    
    primary = doshas[0][0]
    secondary = doshas[1][0]
    
    descriptions = {
        "Vata": "Characterized by movement, change, and air-like qualities",
        "Pitta": "Characterized by transformation, fire, and intensity",
        "Kapha": "Characterized by stability, heaviness, and earth-like qualities"
    }
    
    return f"{primary}-{secondary} with {descriptions.get(primary, '')}"
