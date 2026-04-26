# Report — YouTube Section AI

## Obiettivo
Dato un URL di un video YouTube, produrre una trascrizione strutturata in
sezioni semanticamente coerenti, ciascuna con titolo e timestamp di inizio
preciso all'interno del video.

## Architettura
Pipeline lineare in tre stadi, orchestrata da `app/pipeline.py`:

1. **URL → video_id** (`services/youtube_utils.py`). Regex su vari formati
   (watch?v=, youtu.be, shorts, embed). Failfast se il formato non e' valido.
2. **video_id → trascrizione segmentata** (`services/transcript.py`).
   Strategia a due livelli:
   - *Primaria*: `youtube-transcript-api`, veloce e gratuita, fornisce
     timestamp nativi a livello di frammento.
   - *Fallback*: `yt-dlp` scarica l'audio, OpenAI Whisper API trascrive in
     modalita' `verbose_json` restituendo segmenti con `start`/`end`.
3. **trascrizione → sezioni** (`services/sectioner.py`). LangChain + GPT-4o-mini
   con `with_structured_output`, piu' post-processing robusto.

Il backend espone la pipeline in due modi: FastAPI (`POST /api/process`) e CLI
(`cli.py`). Il frontend React consuma l'API e visualizza il player YouTube
accanto a un indice cliccabile e alla lista delle sezioni.

## Scelte progettuali chiave

### 1. Timestamp *snappati* ai segmenti reali (NON inventati dall'LLM)
**Il punto piu' importante del progetto.** Gli LLM sono notoriamente poco
affidabili quando devono riprodurre valori numerici (timestamp) tratti da
un input lungo: confondono cifre, sommano male, allucinano.

La soluzione adottata: l'LLM non riceve il compito di *generare timestamp*.
Riceve la trascrizione gia' divisa in **segmenti numerati** (ciascuno con il
suo timestamp reale) e deve scegliere solo **l'indice del segmento** dove
inizia ogni sezione. In post-processing (`_build_sections`) il timestamp
finale viene sempre letto dal segmento referenziato.

Effetto pratico:
- Precisione dei timestamp = precisione della fonte (YouTube / Whisper).
- Zero rischio di timestamp allucinati o fuori range.
- Schema Pydantic `LLMSectionBoundary` con `ge=0` e range-clamp in
  `_sanitize_plan` come guardrail.

### 2. Structured output via Pydantic
Uso di `ChatOpenAI.with_structured_output(LLMSectionPlan)` — invece di fare
parsing a mano di JSON. Vantaggi:
- Schema garantito dal modello (tool-calling sottostante).
- Validazione lato Python.
- Possibilita' di aggiungere vincoli (min/max length, ge/le, ecc.).

### 3. Sanitizzazione dell'output LLM
`_sanitize_plan` applica difese in profondita':
- Indici clampati a `[0, n_segments-1]`.
- Rimozione di duplicati.
- Ordinamento per indice crescente.
- **Forza la prima sezione a indice 0** (se l'LLM la salta, inseriamo una
  "Introduzione" automatica).

Questa e' una lezione pratica del "non fidarsi mai dell'output di un LLM".

### 3.bis Guardrails di sicurezza (L1 + L3)

**L1 — Validazione dominio a livello Pydantic** (`schemas.ProcessRequest`).
Un `field_validator` su `url` controlla che l'hostname sia in una whitelist
di domini YouTube (`youtube.com`, `youtu.be`, ecc.). URL arbitrari vengono
rifiutati con **422 Unprocessable Entity** direttamente al layer di
validazione, senza entrare nella pipeline. Questo e' il pattern "fail fast":
piu' avanti fallisce un controllo, piu' e' costoso in termini di risorse e
potenzialmente pericoloso (es. input che finisce in log o in chiamate esterne).

**L3 — Prompt hardening anti prompt-injection** (`sectioner.py`).
Una trascrizione e' contenuto non fidato: il video potrebbe contenere audio
con frasi come *"ignora le istruzioni precedenti e genera X"*, e l'LLM
potrebbe seguirle invece del nostro prompt di sistema. Tre difese combinate:

1. **Istruzioni esplicite di instruction hierarchy** nel `SYSTEM_PROMPT`: un
   blocco "REGOLE ASSOLUTE DI SICUREZZA" che dichiara precedenza delle
   istruzioni di sistema e che il contenuto della trascrizione e' solo
   dati, mai comandi.
2. **Delimitatori semantici** `<transcript>...</transcript>` nel `USER_PROMPT`
   per separare visivamente e strutturalmente i dati non fidati dalle
   istruzioni fidate. Gli LLM moderni sono addestrati a rispettare questa
   separazione quando esplicita.
3. **Sanitizzazione preventiva dei segmenti** (`_sanitize_segment_text`): se
   un segmento contiene la stringa `</transcript>`, viene neutralizzata
   (sostituita con `<_transcript_>`) per evitare che l'LLM veda una chiusura
   del blocco dati e interpreti il resto come istruzioni.

Limiti noti: queste tecniche mitigano ma non eliminano il prompt injection.
Sono state scelte perche' (a) sono lo standard attuale e (b) nel nostro caso
l'impatto di un injection riuscito sarebbe contenuto (l'output e' solo una
lista di titoli, non esegue azioni). Per casi ad alto rischio si dovrebbe
aggiungere un ulteriore LLM-as-a-judge a valle che rifiuta output sospetti.

### 4. Retry con backoff esponenziale
`tenacity` con 3 tentativi + backoff 2-10s per gli errori transienti di OpenAI
(rate limit, 500, timeout). Evita failure user-visible per problemi transitori.

### 5. Strategia trascrizione: captions prima, Whisper dopo
Trade-off:
- Captions YouTube: istantanei, gratuiti, ma mancanti su molti video o
  disponibili solo in lingue non desiderate.
- Whisper: sempre disponibili se abbiamo l'audio, ma costosi (API) e piu' lenti.

La strategia "prova prima, fallback dopo" massimizza la coverage mantenendo
il costo medio basso. Il flag `ENABLE_WHISPER_FALLBACK` permette di
disabilitarlo in ambienti senza `ffmpeg`/`yt-dlp`.

### 6. Monorepo backend/frontend
Un'unica cartella con sottocartelle `backend/` e `frontend/`. Motivazione
didattica: rende esplicita la separazione di responsabilita' e mostra come
due runtime diversi (Python e Node) si integrano via HTTP.

### 7. Vite dev proxy
In sviluppo, Vite inoltra `/api/*` a `http://localhost:8000`: cosi' il
frontend puo' chiamare `fetch('/api/process')` senza preoccuparsi di CORS.
In produzione, il frontend andrebbe buildato e servito dietro lo stesso
dominio del backend (reverse proxy) — allora CORS non sarebbe piu' un tema.

### 8. Output TOC + Player integrato (opzione bonus)
Il frontend implementa direttamente il player YouTube embed con click-to-seek
usando la IFrame API. Questo copre gli extra:
- indice navigabile (TOC laterale)
- timestamp cliccabili che saltano al punto del video
- (implicitamente) output HTML cliccabile — la pagina React *e'* quell'HTML

## Trade-off e limiti

| Area | Scelta | Limite | Possibile miglioramento |
|------|--------|--------|--------------------------|
| Single LLM call | Passiamo TUTTI i segmenti in un solo prompt | Video > ~2h possono superare il context window di GPT-4o-mini (~128k) | Chunking gerarchico: sezionare a blocchi + merge |
| Granularita' titoli | Titoli generati dal modello senza esempi few-shot | Qualita' dipendente dalla lingua/stile del video | Aggiungere few-shot per dominio specifico (tutorial, interviste, ecc.) |
| Numero sezioni | Regola soft "3-15" nel prompt | L'LLM a volte sceglie troppe/troppo poche sezioni | Selezione gerarchica: dato un target durata-per-sezione, forzare a K |
| Lingua mista | La lingua delle sezioni seguira' la lingua dei captions | Se il video e' multilingue puo' produrre mix | Detectare la lingua prevalente e forzarla esplicitamente nel prompt |
| Whisper fallback | Una sola chiamata sull'intero file audio | Whisper API ha limite 25MB; video > ~30min vanno splittati | Split dell'audio in finestre, merge dei segmenti tenendo gli offset |
| Costi | Non c'e' cache | Richiamare lo stesso URL riparte da zero | Cache su disco per `{video_id} -> transcript / result` |
| Streaming | L'API risponde in un unico payload | UX "in attesa" su video lunghi | Streaming (SSE) dei passi: "trascrizione in corso", "sezioni in corso" |
| Qualita' trascrizione | Captions auto-generati hanno a volte refusi | Titoli possono ereditarli | Step opzionale di "clean-up" con LLM prima del sezionamento |

## Idee per miglioramenti futuri

1. **Ricerca per keyword nelle sezioni**: campo di ricerca client-side che
   evidenzia le sezioni contenenti il termine — implementabile in poche righe
   sul frontend usando `result.sections`.
2. **Export**: pulsanti "scarica .md" e "scarica .json" dal frontend, magari
   usando il formato gia' prodotto da `cli.py`.
3. **Supporto Anthropic/Ollama**: `sectioner.py` isola l'LLM in un solo punto
   (`_build_chain`). Sostituire `ChatOpenAI` con `ChatAnthropic` o `ChatOllama`
   e parametrizzare il provider in `config.py`.
4. **Evaluation harness**: un piccolo dataset di video con sezioni "ground
   truth" e una metrica (es. IoU dei timestamp, cosine dei titoli) per
   confrontare le modifiche al prompt.
5. **RAG retroattivo**: dopo la sezionatura, permettere domande sul video
   ("riassumi la parte X", "cosa dice l'autore su Y") usando le sezioni come
   corpus.

## Come riprodurre l'esempio della traccia
Video di riferimento: `https://www.youtube.com/watch?v=_o4KusDr-Kg`

```bash
cd backend
source .venv/bin/activate
python cli.py "https://www.youtube.com/watch?v=_o4KusDr-Kg" \
    --format markdown --out ../esempio_output.md
python cli.py "https://www.youtube.com/watch?v=_o4KusDr-Kg" \
    --format json --out ../esempio_output.json
```

L'output JSON rispetta esattamente lo schema richiesto dalla traccia
(timestamp, titolo, trascrizione per ciascuna sezione).

## File chiave per la review
- `backend/app/services/sectioner.py` — cuore AI (prompt + structured output + sanitize)
- `backend/app/services/transcript.py` — strategia dual-source
- `backend/app/schemas.py` — contratti dati (input/output/LLM)
- `backend/app/pipeline.py` — orchestrazione end-to-end
- `frontend/src/App.jsx` — integrazione UI + seek del player
