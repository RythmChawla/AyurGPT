"""
SQLAlchemy models for the application
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    chat_histories = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    favorite_herbs = relationship("Herb", secondary="favorite_herbs", viewonly=True)

    def __repr__(self):
        return f"<User {self.username}>"


class UserProfile(Base):
    """User Ayurvedic profile (Dosha assessment)"""
    __tablename__ = "user_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    vata_score = Column(Float, default=0.0)
    pitta_score = Column(Float, default=0.0)
    kapha_score = Column(Float, default=0.0)
    primary_dosha = Column(String, nullable=True)  # vata, pitta, kapha
    secondary_dosha = Column(String, nullable=True)
    dosha_description = Column(Text, nullable=True)
    assessment_data = Column(JSON, nullable=True)  # Store raw assessment answers
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<UserProfile user_id={self.user_id}>"


class ChatHistory(Base):
    """Chat conversation history"""
    __tablename__ = "chat_histories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chat_histories")
    messages = relationship("ChatMessage", back_populates="chat_history", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChatHistory {self.id}>"


class ChatMessage(Base):
    """Individual chat messages"""
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    chat_history_id = Column(String, ForeignKey("chat_histories.id"), nullable=False)
    role = Column(String, nullable=False)  # user or assistant
    content = Column(Text, nullable=False)
    message_metadata = Column("metadata", JSON, nullable=True)  # Store additional data like sources
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    chat_history = relationship("ChatHistory", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage {self.id}>"


class Herb(Base):
    """Ayurvedic herb information"""
    __tablename__ = "herbs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True, nullable=False)
    sanskrit_name = Column(String, nullable=True)
    english_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    properties = Column(JSON, nullable=True)  # Rasa, Virya, Vipaka, etc.
    dosha_effects = Column(JSON, nullable=True)  # How it affects each dosha
    uses = Column(Text, nullable=True)
    contraindications = Column(Text, nullable=True)
    preparation_methods = Column(JSON, nullable=True)
    safety_warnings = Column(Text, nullable=True)
    source_references = Column(JSON, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Herb {self.name}>"


class FavoriteHerb(Base):
    """User's favorite herbs (association table)"""
    __tablename__ = "favorite_herbs"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    herb_id = Column(String, ForeignKey("herbs.id"), primary_key=True)
    saved_at = Column(DateTime, default=datetime.utcnow)


class Source(Base):
    """Ayurvedic text sources"""
    __tablename__ = "sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    book_name = Column(String, index=True, nullable=False)  # e.g., "Charaka Samhita"
    chapter_name = Column(String, nullable=True)
    verse_number = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True)  # Store embedding if needed
    source_metadata = Column("metadata", JSON, nullable=True)  # Additional metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Source {self.book_name} - {self.verse_number}>"


class WellnessRecommendation(Base):
    """Personalized wellness recommendations"""
    __tablename__ = "wellness_recommendations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    recommendation_type = Column(String, nullable=False)  # diet, lifestyle, herbs, etc.
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    related_dosha = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<WellnessRecommendation {self.id}>"
