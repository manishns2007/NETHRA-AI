from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.assistant.service import ask_assistant
import logging
import traceback

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/chat", response_model=AssistantResponse)
def chat_with_assistant(
    request: AssistantRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with the AI Investigation Assistant.
    """
    try:
        response = ask_assistant(db, request)
        return response
    except Exception as e:
        logger.error(f"Error in chat_with_assistant: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
