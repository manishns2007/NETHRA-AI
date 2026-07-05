from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.assistant.service import ask_assistant

router = APIRouter()

@router.post("/chat", response_model=AssistantResponse)
def chat_with_assistant(
    request: AssistantRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with the AI Investigation Assistant.
    """
    response = ask_assistant(db, request)
    return response
