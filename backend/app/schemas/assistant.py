from pydantic import BaseModel, Field
from typing import List, Optional, Dict

import enum

class ConfidenceTier(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class RelationshipCategory(str, enum.Enum):
    EXPLICIT_RELATIONSHIP = "EXPLICIT_RELATIONSHIP"
    SHARED_INDICATOR = "SHARED_INDICATOR"
    CO_OCCURRENCE = "CO_OCCURRENCE"
    NONE = "NONE"

class SourceMetadata(BaseModel):
    type: str
    id: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    retrieval_score: Optional[float] = None
    confidence_level: Optional[ConfidenceTier] = None
    retrieval_reason: Optional[str] = None

class AssistantRequest(BaseModel):
    question: str = Field(..., description="The investigation question to ask the AI.")
    history: List[Dict[str, str]] = Field(default=[], description="Previous conversation messages (max 5-10 recommended).")

class AssistantResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[SourceMetadata]
