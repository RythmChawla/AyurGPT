"""
Chat routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.database import ChatHistory, ChatMessage, User, UserProfile
from app.schemas import ChatHistoryResponse, ChatMessageRequest, ChatResponse
from app.utils.auth import get_current_user
from app.services.chatbot import ChatbotService

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)

chatbot_service: ChatbotService | None = None


def get_chatbot_service() -> ChatbotService:
    """Create the chatbot service lazily so app startup stays offline-safe."""
    global chatbot_service
    if chatbot_service is None:
        chatbot_service = ChatbotService()
    return chatbot_service


@router.post("/message", response_model=ChatResponse)
async def send_message(
    message: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send message to chatbot with RAG integration"""
    content = message.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty",
        )

    chat_history = None
    if message.chat_history_id:
        chat_history = (
            db.query(ChatHistory)
            .filter(
                ChatHistory.id == message.chat_history_id,
                ChatHistory.user_id == current_user.id,
            )
            .first()
        )
        if chat_history is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat history not found",
            )

    if chat_history is None:
        chat_history = ChatHistory(
            user_id=current_user.id,
            title=content[:60],
        )
        db.add(chat_history)
        db.flush()

    # Save user message
    user_message = ChatMessage(
        chat_history_id=chat_history.id,
        role="user",
        content=content,
    )
    db.add(user_message)
    db.flush()

    # Get user context if they have dosha profile
    user_context = None
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if profile:
        user_context = {
            "primary_dosha": profile.primary_dosha,
            "secondary_dosha": profile.secondary_dosha,
            "vata_score": profile.vata_score,
            "pitta_score": profile.pitta_score,
            "kapha_score": profile.kapha_score,
        }

    # Generate response using RAG pipeline
    try:
        response_data = await get_chatbot_service().generate_response(
            query=content,
            user_context=user_context,
            use_rag=True
        )
        assistant_content = response_data.get("content", "Unable to generate response")
        sources = response_data.get("sources", [])
    except Exception as e:
        assistant_content = (
            "I encountered an error while processing your query. "
            "Please try again or rephrase your question."
        )
        sources = []

    assistant_message = ChatMessage(
        chat_history_id=chat_history.id,
        role="assistant",
        content=assistant_content,
        message_metadata={"sources": sources, "chat_history_id": chat_history.id},
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return ChatResponse(message=assistant_message, sources=sources)


@router.get("/history/{chat_history_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    chat_history_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get chat history with all messages"""
    chat_history = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.id == chat_history_id,
            ChatHistory.user_id == current_user.id,
        )
        .first()
    )
    if chat_history is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat history not found",
        )
    return chat_history


@router.get("/list", response_model=list[ChatHistoryResponse])
async def list_chat_histories(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's chat histories"""
    chats = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return chats


@router.delete("/{chat_history_id}")
async def delete_chat_history(
    chat_history_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a chat history"""
    chat_history = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.id == chat_history_id,
            ChatHistory.user_id == current_user.id,
        )
        .first()
    )
    if chat_history is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat history not found",
        )
    
    db.delete(chat_history)
    db.commit()
    return {"message": "Chat history deleted"}
