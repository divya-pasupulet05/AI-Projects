from pydantic import BaseModel, Field
from datetime import datetime

class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(min_length=1, max_length=8000)

class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
