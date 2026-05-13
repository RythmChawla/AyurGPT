"""
Sample Ayurvedic data for initial setup
This can be used to populate the database with basic herb information
"""

import json

SAMPLE_HERBS = [
    {
        "name": "Ashwagandha",
        "sanskrit_name": "Withania somnifera",
        "english_name": "Indian Ginseng",
        "description": "A powerful adaptogenic herb used in Ayurveda for stress management and vitality",
        "properties": {
            "Rasa": "Bitter, Astringent",
            "Virya": "Warming",
            "Vipaka": "Sweet",
            "Guna": "Heavy, Unctuous"
        },
        "dosha_effects": {
            "Vata": "Balancing",
            "Pitta": "Neutral",
            "Kapha": "Neutral"
        },
        "uses": [
            "Stress and anxiety relief",
            "Immune system support",
            "Energy and vitality",
            "Sleep quality",
            "Reproductive health"
        ],
        "contraindications": "Not recommended during pregnancy. Use with caution if on sedatives.",
        "preparation_methods": [
            "Powder mixed with warm milk",
            "Decoction",
            "Extract"
        ],
        "safety_warnings": "Generally safe. May cause drowsiness in some individuals."
    },
    {
        "name": "Tulsi",
        "sanskrit_name": "Ocimum tenuiflorum",
        "english_name": "Holy Basil",
        "description": "A sacred plant in Ayurveda known for its spiritual and medicinal properties",
        "properties": {
            "Rasa": "Pungent, Bitter",
            "Virya": "Heating",
            "Vipaka": "Pungent",
            "Guna": "Light"
        },
        "dosha_effects": {
            "Vata": "Balancing",
            "Pitta": "Slightly Aggravating",
            "Kapha": "Balancing"
        },
        "uses": [
            "Respiratory health",
            "Immune support",
            "Stress relief",
            "Digestion",
            "Anti-inflammatory"
        ],
        "contraindications": "Use with caution in high Pitta individuals",
        "preparation_methods": [
            "Tea",
            "Fresh juice",
            "Dried herbs"
        ],
        "safety_warnings": "Generally safe. May be slightly warming."
    },
    {
        "name": "Brahmi",
        "sanskrit_name": "Bacopa monnieri",
        "english_name": "Water Hyssop",
        "description": "A medhya rasayana herb specifically used for enhancing memory and cognition",
        "properties": {
            "Rasa": "Bitter, Astringent",
            "Virya": "Cooling",
            "Vipaka": "Pungent"
        },
        "dosha_effects": {
            "Vata": "Balancing",
            "Pitta": "Balancing",
            "Kapha": "Slightly Aggravating"
        },
        "uses": [
            "Memory enhancement",
            "Cognitive function",
            "Anxiety and stress",
            "Nerv health",
            "Learning capacity"
        ],
        "contraindications": "Minimal contraindications",
        "preparation_methods": [
            "Powder",
            "Ghee infusion",
            "Decoction"
        ],
        "safety_warnings": "Very safe. No known serious side effects."
    },
    {
        "name": "Triphala",
        "sanskrit_name": "Three Fruits",
        "english_name": "Ayurvedic Tonic",
        "description": "A balanced combination of three fruits that supports overall wellness",
        "properties": {
            "Rasa": "Sour, Astringent",
            "Virya": "Neutral",
            "Vipaka": "Sweet"
        },
        "dosha_effects": {
            "Vata": "Neutral",
            "Pitta": "Neutral",
            "Kapha": "Neutral"
        },
        "uses": [
            "Digestive health",
            "Gentle laxative",
            "Detoxification",
            "Overall wellness",
            "Bowel regularity"
        ],
        "contraindications": "Use cautiously in severe diarrhea",
        "preparation_methods": [
            "Powder with warm water",
            "Decoction",
            "Tablets"
        ],
        "safety_warnings": "Safe for regular use. May cause mild loose stools initially."
    }
]

def save_sample_herbs(filepath: str = "sample_herbs.json"):
    """Save sample herbs to JSON file"""
    with open(filepath, 'w') as f:
        json.dump(SAMPLE_HERBS, f, indent=2)
    print(f"✅ Sample herbs saved to {filepath}")


if __name__ == "__main__":
    save_sample_herbs()
