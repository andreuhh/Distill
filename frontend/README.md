# Frontend — Distill

React + Vite + Tailwind. In dev fa proxy di `/api` -> `http://localhost:8000`
(vedi `vite.config.js`), quindi basta avviare il backend e poi:

```bash
npm install
npm run dev
```

Apri `http://localhost:5173`.

## Struttura
- `src/App.jsx` — container
- `src/api.js` — client HTTP verso FastAPI
- `src/components/VideoForm.jsx` — input URL
- `src/components/VideoPlayer.jsx` — player YouTube IFrame API (seek su click)
- `src/components/TOC.jsx` — indice navigabile
- `src/components/SectionsList.jsx` — lista sezioni con timestamp cliccabile
