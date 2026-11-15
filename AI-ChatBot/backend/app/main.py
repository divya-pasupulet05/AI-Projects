from uuid import uuid4
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database import Base, engine, get_db
from .models import Conversation, Message
from .schemas import ChatRequest, ChatResponse, ConversationOut, MessageOut
from .config import FRONTEND_ORIGIN
from .ai_service import generate_reply

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nova Conversational AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Nova Conversational AI"}

@app.get("/api/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db)):
    return db.scalars(select(Conversation).order_by(Conversation.created_at.desc())).all()

@app.get("/api/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return db.scalars(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.id)
    ).all()

@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conversation)
    db.commit()
    return {"deleted": True}

@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, payload.conversation_id) if payload.conversation_id else None
    if payload.conversation_id and not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if not conversation:
        conversation = Conversation(id=str(uuid4()), title=payload.message[:45])
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_message = Message(
        conversation_id=conversation.id, role="user", content=payload.message.strip()
    )
    db.add(user_message)
    db.commit()

    rows = db.scalars(
        select(Message).where(Message.conversation_id == conversation.id).order_by(Message.id)
    ).all()
    history = [{"role": m.role, "content": m.content} for m in rows]

    try:
        reply = generate_reply(history)
    except Exception as exc:
        # Keep the user's message, but don't save an error as an assistant response.
        raise HTTPException(status_code=502, detail=str(exc))

    db.add(Message(conversation_id=conversation.id, role="assistant", content=reply))
    db.commit()
    return ChatResponse(conversation_id=conversation.id, reply=reply)
