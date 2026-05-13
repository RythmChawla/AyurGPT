"""
Pydantic models for request/response validation
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# User Models
class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Dosha Profile Models
class DoshaAssessmentQuestion(BaseModel):
    question_id: str
    question_text: str
    category: str  # vata, pitta, kapha
    answers: List[Dict[str, Any]]


class DoshaAssessmentRequest(BaseModel):
    answers: Dict[str, str]  # question_id -> answer_id


class DoshaProfileResponse(BaseModel):
    vata_score: float
    pitta_score: float
    kapha_score: float
    primary_dosha: str
    secondary_dosha: Optional[str] = None
    dosha_description: str

    class Config:
        from_attributes = True


# Chat Models
class ChatMessageRequest(BaseModel):
    content: str
    chat_history_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    metadata: Optional[Dict[str, Any]] = Field(default=None, validation_alias="message_metadata")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryResponse(BaseModel):
    id: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse]

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    message: ChatMessageResponse
    sources: List[Dict[str, Any]] = []


# Herb Models
class HerbResponse(BaseModel):
    id: str
    name: str
    sanskrit_name: Optional[str] = None
    english_name: Optional[str] = None
    description: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    dosha_effects: Optional[Dict[str, Any]] = None
    uses: Optional[str] = None
    contraindications: Optional[str] = None
    preparation_methods: Optional[List[str]] = None
    safety_warnings: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class HerbListResponse(BaseModel):
    items: List[HerbResponse]
    total: int
    skip: int
    limit: int


# Symptom Checker Models
class SymptomCheckRequest(BaseModel):
    symptoms: List[str]


class SymptomAnalysisResponse(BaseModel):
    symptoms: List[str]
    possible_dosha_involvement: Dict[str, float]  # dosha -> confidence score
    explanation: str
    recommendations: List[str]
    disclaimer: str


# Source/Citation Models
class SourceResponse(BaseModel):
    id: str
    book_name: str
    chapter_name: Optional[str] = None
    verse_number: Optional[str] = None
    content: str

    class Config:
        from_attributes = True


# Authentication Models
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int


class TokenRefreshRequest(BaseModel):
    refresh_token: str


# Dashboard Models
class DashboardResponse(BaseModel):
    user: UserResponse
    dosha_profile: Optional[DoshaProfileResponse] = None
    recent_chats: List[ChatHistoryResponse]
    favorite_herbs: List[HerbResponse]
    wellness_recommendations: List[Dict[str, Any]]


# Health Check Models
class HealthCheckResponse(BaseModel):
    status: str
    message: str
    version: str
