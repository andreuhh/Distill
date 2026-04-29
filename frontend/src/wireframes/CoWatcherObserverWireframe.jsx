import { useEffect, useRef, useState } from 'react'

const SESSION_VIDEO = {
  thumbnailUrl: 'https://img.youtube.com/vi/kCc8FmEb1nY/maxresdefault.jpg',
  title: "Let's build GPT from scratch, in code, spelled out",
  speaker: 'Andrej Karpathy',
  totalDurationSeconds: 6972,
}

const EventType = {
  SECTION: 'section',
  NOTE: 'note',
  CONCEPT: 'concept',
  CODE: 'code',
  CITATION: 'citation',
}

const CO_WATCH_EVENTS = [
  { id: 's1', type: EventType.SECTION, ts: 0, title: 'Introduction' },
  { id: 'n1', type: EventType.NOTE, ts: 8, text: 'Welcome and outline of what we will build today.' },
  { id: 'n2', type: EventType.NOTE, ts: 24, text: "We'll build GPT from scratch — no shortcuts." },
  {
    id: 'cn1',
    type: EventType.CONCEPT,
    ts: 52,
    title: 'Self-attention',
    definition:
      'A mechanism that lets each token in a sequence attend to every other token, learning context-dependent representations.',
  },
  {
    id: 'n3',
    type: EventType.NOTE,
    ts: 98,
    text: 'The matrix-multiplication approach unlocks the parallelism.',
  },
  {
    id: 'cd1',
    type: EventType.CODE,
    ts: 145,
    language: 'python',
    caption: 'Scaled dot-product attention',
    code: `wei = q @ k.transpose(-2, -1) * head_size**-0.5
wei = wei.masked_fill(tril == 0, float('-inf'))
wei = F.softmax(wei, dim=-1)
out = wei @ v`,
  },
  { id: 's2', type: EventType.SECTION, ts: 185, title: 'Tokenisation' },
  {
    id: 'n4',
    type: EventType.NOTE,
    ts: 195,
    text: 'Why subword tokenisation matters for vocabulary efficiency.',
  },
  {
    id: 'cn2',
    type: EventType.CONCEPT,
    ts: 230,
    title: 'BPE (Byte-Pair Encoding)',
    definition:
      'A subword tokenisation technique that iteratively merges the most frequent pair of symbols, balancing character and word granularity.',
  },
  {
    id: 'ct1',
    type: EventType.CITATION,
    ts: 261,
    refText: 'Sennrich et al. (2016) — Neural Machine Translation of Rare Words with Subword Units',
    refUrl: 'https://arxiv.org/abs/1508.07909',
  },
  { id: 's3', type: EventType.SECTION, ts: 405, title: 'Self-attention in code' },
  { id: 'n5', type: EventType.NOTE, ts: 412, text: 'Setting up Q, K, V matrices in PyTorch.' },
]

const STREAM_INTERVAL_MS = 4000
const STREAM_RESTART_DELAY_MS = 3000
const AGENT_SPEAKING_DURATION_MS = 900

const AgentState = {
  WATCHING: 'watching',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
}

function formatTimestamp(seconds) {
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

function useStreamingEvents(events, intervalMs, restartDelayMs) {
  const [visibleCount, setVisibleCount] = useState(1)
  const hasStreamedAll = visibleCount >= events.length

  useEffect(() => {
    if (hasStreamedAll) return
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), intervalMs)
    return () => clearTimeout(timer)
  }, [visibleCount, hasStreamedAll, intervalMs])

  useEffect(() => {
    if (!hasStreamedAll) return
    const timer = setTimeout(() => setVisibleCount(1), restartDelayMs)
    return () => clearTimeout(timer)
  }, [hasStreamedAll, restartDelayMs])

  return events.slice(0, visibleCount)
}

function useAgentSpeakingPulse(eventsCount) {
  const [state, setState] = useState(AgentState.WATCHING)
  useEffect(() => {
    if (eventsCount === 0) return
    setState(AgentState.SPEAKING)
    const timer = setTimeout(() => setState(AgentState.WATCHING), AGENT_SPEAKING_DURATION_MS)
    return () => clearTimeout(timer)
  }, [eventsCount])
  return state
}

function useAutoScrollToBottom(trigger) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.scrollTo({
      top: ref.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [trigger])
  return ref
}

export default function CoWatcherObserverWireframe() {
  const visibleEvents = useStreamingEvents(
    CO_WATCH_EVENTS,
    STREAM_INTERVAL_MS,
    STREAM_RESTART_DELAY_MS
  )
  const agentState = useAgentSpeakingPulse(visibleEvents.length)
  const eventsScrollRef = useAutoScrollToBottom(visibleEvents.length)

  const activeEvent = visibleEvents[visibleEvents.length - 1]
  const currentVideoSeconds = activeEvent?.ts ?? 0

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans antialiased">
      <CoWatchTopBar video={SESSION_VIDEO} />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 p-4 max-w-[1400px] w-full mx-auto">
        <VideoColumn video={SESSION_VIDEO} currentSeconds={currentVideoSeconds} />
        <CoPilotPanel
          events={visibleEvents}
          activeEventId={activeEvent?.id}
          agentState={agentState}
          eventsScrollRef={eventsScrollRef}
        />
      </main>
      <KeyframeStyles />
    </div>
  )
}

function CoWatchTopBar({ video }) {
  return (
    <header className="border-b border-stone-200/70 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <BrandLockup />
        <SessionStatusBadge title={video.title} speaker={video.speaker} />
        <EndSessionButton />
      </div>
    </header>
  )
}

function BrandLockup() {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center shadow-sm">
        <span className="text-white font-bold text-sm tracking-tight">D</span>
      </div>
      <span className="text-slate-900 font-semibold tracking-tight">Distill</span>
    </div>
  )
}

function SessionStatusBadge({ title, speaker }) {
  return (
    <div className="hidden md:flex items-center gap-2 text-xs min-w-0 flex-1 justify-center">
      <LiveSessionDot />
      <span className="font-medium uppercase tracking-wider text-[10px] text-emerald-700 shrink-0">
        Co-watching
      </span>
      <span className="text-slate-300 shrink-0">·</span>
      <span className="truncate text-slate-600">
        {speaker} — {title}
      </span>
    </div>
  )
}

function LiveSessionDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
    </span>
  )
}

function EndSessionButton() {
  return (
    <button
      type="button"
      className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
    >
      End session
    </button>
  )
}

function VideoColumn({ video, currentSeconds }) {
  return (
    <section className="space-y-3">
      <VideoFrame video={video} />
      <VideoCustomControls video={video} currentSeconds={currentSeconds} />
      <VideoMeta video={video} />
    </section>
  )
}

function VideoFrame({ video }) {
  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md">
      <img
        src={video.thumbnailUrl}
        alt=""
        className="w-full h-full object-cover bg-slate-900"
      />
      <div className="absolute inset-0 bg-slate-900/30 pointer-events-none" />
      <PlayingIndicator />
    </div>
  )
}

function PlayingIndicator() {
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-[10px] text-white uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      Playing
    </div>
  )
}

function VideoCustomControls({ video, currentSeconds }) {
  const progressPercent = Math.min(100, (currentSeconds / video.totalDurationSeconds) * 100)
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-3 flex items-center gap-3">
      <PlayPauseButton />
      <VideoScrubBar progressPercent={progressPercent} />
      <VideoTimeDisplay current={currentSeconds} total={video.totalDurationSeconds} />
      <PlaybackSpeedSelector />
      <AskTheAIButton />
    </div>
  )
}

function PlayPauseButton() {
  return (
    <button
      type="button"
      aria-label="Pause"
      className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shrink-0 transition-colors"
    >
      <PauseIcon />
    </button>
  )
}

function VideoScrubBar({ progressPercent }) {
  return (
    <div className="flex-1 relative h-1.5 bg-stone-200 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all duration-700"
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  )
}

function VideoTimeDisplay({ current, total }) {
  return (
    <span className="text-xs font-mono text-slate-500 shrink-0 tabular-nums">
      {formatTimestamp(current)} / {formatTimestamp(total)}
    </span>
  )
}

function PlaybackSpeedSelector() {
  return (
    <button
      type="button"
      className="text-xs font-mono text-slate-600 hover:text-slate-900 hover:bg-stone-100 px-2 py-1 rounded transition-colors shrink-0"
    >
      1.0×
    </button>
  )
}

function AskTheAIButton() {
  return (
    <button
      type="button"
      className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
    >
      <SparkIcon />
      Ask the AI
    </button>
  )
}

function VideoMeta({ video }) {
  return (
    <div className="px-1">
      <h2 className="text-base font-semibold text-slate-900 leading-tight">{video.title}</h2>
      <p className="text-xs text-slate-500 mt-0.5">
        {video.speaker} · {formatTimestamp(video.totalDurationSeconds)}
      </p>
    </div>
  )
}

function CoPilotPanel({ events, activeEventId, agentState, eventsScrollRef }) {
  return (
    <aside className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col h-[calc(100vh-100px)] max-h-[820px] overflow-hidden">
      <CoPilotPanelHeader agentState={agentState} eventsCount={events.length} />
      <CoPilotEventTimeline
        events={events}
        activeEventId={activeEventId}
        scrollRef={eventsScrollRef}
      />
      <ChatInputFooter />
    </aside>
  )
}

function CoPilotPanelHeader({ agentState, eventsCount }) {
  return (
    <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AgentStatusOrb state={agentState} />
        <span className="text-sm font-semibold text-slate-900">Co-pilot</span>
        <AgentStatusLabel state={agentState} />
      </div>
      <EventsCountTag count={eventsCount} />
    </div>
  )
}

function AgentStatusOrb({ state }) {
  const colorByState = {
    [AgentState.WATCHING]: 'bg-emerald-500',
    [AgentState.THINKING]: 'bg-amber-500',
    [AgentState.SPEAKING]: 'bg-indigo-500',
  }
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={`absolute inline-flex h-full w-full rounded-full ${colorByState[state]} opacity-60 animate-ping`}
      />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${colorByState[state]}`} />
    </span>
  )
}

function AgentStatusLabel({ state }) {
  const labelByState = {
    [AgentState.WATCHING]: 'Watching',
    [AgentState.THINKING]: 'Thinking',
    [AgentState.SPEAKING]: 'Speaking',
  }
  return <span className="text-xs text-slate-500 font-medium">{labelByState[state]}</span>
}

function EventsCountTag({ count }) {
  return (
    <span className="text-[10px] uppercase tracking-wider font-medium text-slate-400 font-mono">
      {count} {count === 1 ? 'event' : 'events'}
    </span>
  )
}

function CoPilotEventTimeline({ events, activeEventId, scrollRef }) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
      {events.map((event) => (
        <EventRenderer key={event.id} event={event} isActive={event.id === activeEventId} />
      ))}
    </div>
  )
}

function EventRenderer({ event, isActive }) {
  if (event.type === EventType.SECTION) return <SectionDivider event={event} />
  if (event.type === EventType.NOTE) return <NoteBullet event={event} isActive={isActive} />
  if (event.type === EventType.CONCEPT) return <ConceptCard event={event} isActive={isActive} />
  if (event.type === EventType.CODE) return <CodeSnippetCard event={event} isActive={isActive} />
  if (event.type === EventType.CITATION) return <CitationCard event={event} isActive={isActive} />
  return null
}

function EventArrival({ children }) {
  return (
    <div style={{ animation: 'distill-event-arrive 400ms ease-out' }}>{children}</div>
  )
}

function SectionDivider({ event }) {
  return (
    <EventArrival>
      <div className="pt-4 pb-2 first:pt-0">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
            {event.title}
          </span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>
      </div>
    </EventArrival>
  )
}

function NoteBullet({ event, isActive }) {
  const containerClass = isActive
    ? 'bg-indigo-50/60 ring-1 ring-indigo-100'
    : 'hover:bg-stone-50'
  const textClass = isActive ? 'text-slate-900 font-medium' : 'text-slate-700'
  return (
    <EventArrival>
      <button
        type="button"
        className={`w-full text-left flex items-start gap-2.5 py-1.5 pl-3 pr-2 rounded-lg transition-colors group ${containerClass}`}
      >
        <Timestamp seconds={event.ts} isActive={isActive} />
        <span className={`text-sm leading-relaxed ${textClass}`}>{event.text}</span>
      </button>
    </EventArrival>
  )
}

function Timestamp({ seconds, isActive }) {
  const colorClass = isActive
    ? 'text-indigo-600 font-semibold'
    : 'text-slate-400 group-hover:text-indigo-600 transition-colors'
  return (
    <span className={`shrink-0 text-xs font-mono pt-0.5 ${colorClass}`}>
      [{formatTimestamp(seconds)}]
    </span>
  )
}

function ConceptCard({ event, isActive }) {
  const containerClass = isActive
    ? 'bg-indigo-50 ring-2 ring-indigo-200'
    : 'bg-stone-50 ring-1 ring-stone-200'
  return (
    <EventArrival>
      <div className={`rounded-xl p-3.5 transition-all ${containerClass}`}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <ConceptIcon />
            <h3 className="text-sm font-semibold text-slate-900">{event.title}</h3>
          </div>
          <Timestamp seconds={event.ts} isActive={isActive} />
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{event.definition}</p>
      </div>
    </EventArrival>
  )
}

function CodeSnippetCard({ event, isActive }) {
  const ringClass = isActive ? 'ring-indigo-200' : 'ring-stone-200'
  const headerBgClass = isActive ? 'bg-indigo-50' : 'bg-stone-50'
  return (
    <EventArrival>
      <div className={`rounded-xl overflow-hidden ring-1 ${ringClass}`}>
        <div className={`px-3 py-1.5 flex items-center justify-between gap-2 ${headerBgClass}`}>
          <div className="flex items-center gap-1.5 text-xs min-w-0">
            <CodeIcon />
            <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px] shrink-0">
              {event.language}
            </span>
            <span className="text-slate-300 shrink-0">·</span>
            <span className="text-slate-600 truncate">{event.caption}</span>
          </div>
          <Timestamp seconds={event.ts} isActive={isActive} />
        </div>
        <pre className="bg-slate-900 text-slate-100 text-[11px] font-mono leading-relaxed p-3 overflow-x-auto">
          <code>{event.code}</code>
        </pre>
      </div>
    </EventArrival>
  )
}

function CitationCard({ event, isActive }) {
  const containerClass = isActive
    ? 'bg-indigo-50/60 ring-1 ring-indigo-100'
    : 'hover:bg-stone-50'
  const textClass = isActive ? 'text-slate-900' : 'text-slate-600'
  return (
    <EventArrival>
      <a
        href={event.refUrl}
        target="_blank"
        rel="noreferrer"
        className={`block py-2 pl-3 pr-2 rounded-lg transition-colors group ${containerClass}`}
      >
        <div className="flex items-start gap-2.5">
          <Timestamp seconds={event.ts} isActive={isActive} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <CitationIcon />
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Citation
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${textClass}`}>{event.refText}</p>
          </div>
          <ExternalLinkIcon />
        </div>
      </a>
    </EventArrival>
  )
}

function ChatInputFooter() {
  return (
    <div className="border-t border-stone-100 p-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 ring-1 ring-stone-200 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:bg-white transition-all">
        <SparkIcon className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Ask the AI anything about this video…"
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-stone-200 rounded px-1.5 py-0.5 shrink-0">
          ↵
        </kbd>
      </div>
      <p className="text-[10px] text-slate-400 text-center mt-1.5">
        Press space to pause · Click any timestamp to jump
      </p>
    </div>
  )
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

function SparkIcon({ className = '' }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z" />
    </svg>
  )
}

function ConceptIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-indigo-600"
    >
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8a6 6 0 0 0-12 0c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-500"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

function CitationIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-500"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-400 group-hover:text-indigo-600 transition-colors mt-1 shrink-0"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function KeyframeStyles() {
  return (
    <style>{`
      @keyframes distill-event-arrive {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  )
}
