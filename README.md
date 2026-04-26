# Distill

System that transforms a YouTube video into a **structured transcript split into sections**
(title + start timestamp + text), navigable from a web interface.

## Stack
- **Backend**: Python 3.11, FastAPI, LangChain, OpenAI (GPT-4o-mini)
- **Transcript**: `youtube-transcript-api` with fallback to `yt-dlp` + Whisper
- **Frontend**: React 18 + Vite + TailwindCSS
- **Player**: YouTube IFrame embed with jump-to-section-timestamp

## Repository structure
```
youtube-section-ai/
├── backend/          # FastAPI + LangChain
│   ├── app/
│   ├── requirements.txt
│   ├── cli.py        # command-line execution (bonus)
│   └── .env.example
├── frontend/         # React + Vite
│   ├── src/
│   └── package.json
├── REPORT.md         # design choices, trade-offs, limits
└── README.md
```

## Quick setup

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then add your GROQ_API_KEY
uvicorn app.main:app --reload
```
The backend starts at `http://localhost:8000` (Swagger docs at `/docs`).

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend starts at `http://localhost:5173` and communicates with the backend via the Vite proxy.

### 3. CLI usage (without frontend)
```bash
cd backend
python cli.py "https://www.youtube.com/watch?v=_o4KusDr-Kg" --out ./example_output.json
```

## System requirements
- Python 3.11+
- Node 18+
- **Optional** (only for Whisper fallback): `ffmpeg` installed (`brew install ffmpeg` on macOS)

## Required API keys
Add to `backend/.env`:
- `GROQ_API_KEY` — required
- `OPENAI_API_KEY` — required, used for GPT-4o-mini and (if fallback) Whisper API

## Deliverable
See `REPORT.md` for design choices, trade-offs, and improvement ideas.
