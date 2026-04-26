# Distill

Sistema che trasforma un video YouTube in una **trascrizione strutturata in sezioni**
(titolo + timestamp di inizio + testo), navigabile da interfaccia web.

## Stack
- **Backend**: Python 3.11, FastAPI, LangChain, OpenAI (GPT-4o-mini)
- **Trascrizione**: `youtube-transcript-api` con fallback a `yt-dlp` + Whisper
- **Frontend**: React 18 + Vite + TailwindCSS
- **Player**: YouTube IFrame embed con salto al timestamp della sezione

## Struttura del repo
```
youtube-section-ai/
├── backend/          # FastAPI + LangChain
│   ├── app/
│   ├── requirements.txt
│   ├── cli.py        # esecuzione da riga di comando (bonus)
│   └── .env.example
├── frontend/         # React + Vite
│   ├── src/
│   └── package.json
├── REPORT.md         # scelte progettuali, trade-off, limiti
└── README.md
```

## Setup rapido

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # poi inserisci la tua OPENAI_API_KEY
uvicorn app.main:app --reload
```
Il backend parte su `http://localhost:8000` (docs Swagger su `/docs`).

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Il frontend parte su `http://localhost:5173` e parla col backend tramite proxy Vite.

### 3. Uso da CLI (senza frontend)
```bash
cd backend
python cli.py "https://www.youtube.com/watch?v=_o4KusDr-Kg" --out ./esempio_output.json
```

## Requisiti sistema
- Python 3.11+
- Node 18+
- **Opzionale** (solo per fallback Whisper): `ffmpeg` installato (`brew install ffmpeg` su macOS)

## Chiavi API necessarie
Inserire in `backend/.env`:
- `GROQ_API_KEY` - obbligatoria
- `OPENAI_API_KEY` — obbligatoria, usata per GPT-4o-mini e (se fallback) Whisper API

## Deliverable
Vedi `REPORT.md` per scelte progettuali, trade-off e idee di miglioramento.
