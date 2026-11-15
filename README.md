# Nova AI — Conversational Chatbot

A full-stack conversational AI chatbot built with **React.js, Python FastAPI, Google Gemini API, SQLAlchemy, and SQLite**.

## Features

- Responsive conversational chat interface
- AI-generated responses using the Google Gemini API
- Conversation context passed to the model
- Persistent conversations and messages stored in SQLite
- Create, reopen, and delete conversations
- Loading indicators, error handling, and suggested prompts
- Backend-only API key configuration (the key is never exposed in React)

## Architecture

```text
React + Vite (http://localhost:5173)
        |
        | HTTP / REST API
        v
FastAPI (http://localhost:8000)
        |
        +---- SQLAlchemy ---- SQLite database
        |
        +---- Google Gemini API ---- AI response
```

## Prerequisites

- Python 3.10 or later
- Node.js 18 or later
- A Google Gemini API key from Google AI Studio

Gemini API access and free-tier quotas depend on your account, region, and selected model. Free access is subject to limits and is not guaranteed to be unlimited.

## 1. Set up the backend

Open PowerShell and move into the backend directory:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell blocks activation, use the virtual environment's Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Configure the Gemini API key

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Edit `backend/.env`:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
DATABASE_URL=sqlite:///./chatbot.db
FRONTEND_ORIGIN=http://localhost:5173
```

`gemini-3.5-flash-lite` is a documented Gemini API model ID. If it is not enabled for your API key, select another currently supported model ID from the official model list.

**Security:** Keep the API key only in `backend/.env`. Never put it in React/frontend code, screenshots, public repositories, or chat messages. Do not commit `.env`.

### Start FastAPI

Run this from the `backend` directory:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

If you encounter `ModuleNotFoundError: No module named 'google'`, install the SDK into the exact environment used to run the backend:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade google-genai
.\.venv\Scripts\python.exe -c "from google import genai; print('Gemini SDK installed successfully')"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Backend URLs:
- Health check: http://localhost:8000/api/health
- Interactive API documentation: http://localhost:8000/docs

Keep the backend terminal running.

## 2. Set up the React frontend

Open a **second terminal**:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173. Keep this terminal running too.

## 3. Test the application

1. Confirm FastAPI is running on port `8000`.
2. Confirm Vite is running on port `5173`.
3. Open the frontend in your browser and send Nova a message.
4. Create another conversation and switch between conversations.
5. Refresh the page and verify that saved conversations are still available.

The SQLite database is created automatically at `backend/chatbot.db`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend status |
| GET | `/api/conversations` | List saved conversations |
| GET | `/api/conversations/{id}/messages` | Load messages for a conversation |
| POST | `/api/chat` | Send a message and receive an AI reply |
| DELETE | `/api/conversations/{id}` | Delete a conversation |

Example request body for `POST /api/chat`:

```json
{
  "conversation_id": null,
  "message": "Explain Spring Boot dependency injection"
}
```

## Troubleshooting

**`ModuleNotFoundError: No module named 'google'`**

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade google-genai
.\.venv\Scripts\python.exe -c "from google import genai; print('OK')"
```

Then restart Uvicorn using `.venv\Scripts\python.exe`.

**401 or 403 API-key error**
- Check `GEMINI_API_KEY` in `backend/.env`.
- Ensure the key has no accidental spaces or quotation marks.
- Restart FastAPI after changing `.env`.

**404 model-not-found error**
- Check the exact model ID supported by your Gemini API key.
- Update `GEMINI_MODEL` in `.env` and restart FastAPI.

**429 quota or rate-limit error**
- Check your current usage and quota in Google AI Studio.
- Gemini free-tier limits vary by model and account. Wait for the quota window to reset or select a model available under your account's limits.

## Suggested resume entry

**Nova AI — Full-Stack Conversational AI Chatbot**  
**Technologies:** React.js, JavaScript, Python, FastAPI, Google Gemini API, SQLAlchemy, SQLite, REST APIs

- Developed a full-stack conversational AI chatbot using React.js and Python FastAPI, integrating Google's Gemini API for AI-generated responses.
- Built REST APIs for chat interactions and conversation management.
- Persisted conversations and message history using SQLAlchemy and SQLite.
- Implemented a responsive chat interface with conversation history, loading states, and error handling.
- Kept AI provider credentials on the backend using environment-based configuration.

Only include features that you have personally run, tested, and can confidently explain in an interview.

## Official documentation

- Gemini API models: https://ai.google.dev/gemini-api/docs/models
- Gemini API quickstart: https://ai.google.dev/gemini-api/docs/quickstart
- Google Gen AI Python SDK: https://github.com/googleapis/python-genai

## Production considerations

This is a learning and portfolio project. Before deploying publicly, add user authentication, per-user conversation authorization, rate limiting, usage controls, structured logging, monitoring, automated tests, and stronger input/output validation. The current demo does not implement user accounts or conversation ownership.
