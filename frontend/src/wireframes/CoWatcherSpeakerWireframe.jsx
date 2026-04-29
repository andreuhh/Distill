import { useEffect, useState } from 'react'

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

const EVENTS_BEFORE_QUIZ = [
  { id: 's1', type: EventType.SECTION, ts: 0, title: 'Introduction' },
  { id: 'n1', type: EventType.NOTE, ts: 8, text: 'Welcome and outline of what we will build today.' },
  {
    id: 'cn1',
    type: EventType.CONCEPT,
    ts: 52,
    title: 'Self-attention',
    definition:
      'A mechanism that lets each token in a sequence attend to every other token, learning context-dependent representations.',
  },
  {
    id: 'cd1',
    type: EventType.CODE,
    ts: 98,
    language: 'python',
    caption: 'Scaled dot-product attention',
    code: `wei = q @ k.transpose(-2, -1) * head_size**-0.5
wei = wei.masked_fill(tril == 0, float('-inf'))
wei = F.softmax(wei, dim=-1)
out = wei @ v`,
  },
  { id: 'n2', type: EventType.NOTE, ts: 125, text: 'Why softmax is essential for attention.' },
]

const QUIZ_ITEM = {
  id: 'q1',
  ts: 134,
  topic: 'Self-attention',
  question: 'What does the softmax in the attention formula achieve?',
  options: [
    {
      id: 'a',
      text: 'Normalises the attention scores into a probability distribution that sums to 1.',
    },
    {
      id: 'b',
      text: 'Reduces the dimension of the output vector for efficiency.',
    },
    {
      id: 'c',
      text: 'Adds a non-linearity to improve expressiveness of the model.',
    },
  ],
  correctOptionId: 'a',
  correctExplanation:
    'Right — softmax converts raw scores into weights that sum to 1, so each position gets a proper probability distribution over the others.',
  wrongExplanation:
    "Close. Softmax doesn't change dimensions or add a typical non-linearity — it normalises raw scores into a probability distribution. Re-watch from 02:14 for the full intuition.",
}

const COUNTDOWN_START = 3
const COUNTDOWN_TICK_MS = 1000
const REVIEWED_AUTO_RESET_MS = 5000
const RESUMED_AUTO_RESET_MS = 1500

const AgentState = {
  WATCHING: 'watching',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
}

const QuizPhase = {
  COUNTDOWN: 'countdown',
  REVIEWED_CORRECT: 'reviewed_correct',
  REVIEWED_WRONG: 'reviewed_wrong',
  RESUMED: 'resumed',
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

function isReviewingPhase(phase) {
  return phase === QuizPhase.REVIEWED_CORRECT || phase === QuizPhase.REVIEWED_WRONG
}

function isQuizActivePhase(phase) {
  return phase !== QuizPhase.RESUMED
}

function getAgentStateForQuizPhase(phase) {
  if (phase === QuizPhase.RESUMED) return AgentState.WATCHING
  if (isReviewingPhase(phase)) return AgentState.SPEAKING
  return AgentState.THINKING
}

function useQuizPhaseDemoLoop() {
  const [phase, setPhase] = useState(QuizPhase.COUNTDOWN)
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [selectedOptionId, setSelectedOptionId] = useState(null)

  useEffect(() => {
    if (phase !== QuizPhase.COUNTDOWN) return
    if (countdown <= 0) {
      setPhase(QuizPhase.RESUMED)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), COUNTDOWN_TICK_MS)
    return () => clearTimeout(timer)
  }, [phase, countdown])

  useEffect(() => {
    if (phase === QuizPhase.COUNTDOWN) return
    const delayMs =
      phase === QuizPhase.RESUMED ? RESUMED_AUTO_RESET_MS : REVIEWED_AUTO_RESET_MS
    const timer = setTimeout(() => {
      setPhase(QuizPhase.COUNTDOWN)
      setCountdown(COUNTDOWN_START)
      setSelectedOptionId(null)
    }, delayMs)
    return () => clearTimeout(timer)
  }, [phase])

  const selectOption = (optionId) => {
    setSelectedOptionId(optionId)
    setPhase(
      optionId === QUIZ_ITEM.correctOptionId
        ? QuizPhase.REVIEWED_CORRECT
        : QuizPhase.REVIEWED_WRONG
    )
  }

  const skipQuiz = () => setPhase(QuizPhase.RESUMED)

  return { phase, countdown, selectedOptionId, selectOption, skipQuiz }
}

export default function CoWatcherSpeakerWireframe() {
  const quizState = useQuizPhaseDemoLoop()
  const isVideoPaused = isQuizActivePhase(quizState.phase)
  const agentState = getAgentStateForQuizPhase(quizState.phase)

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans antialiased">
      <CoWatchTopBar video={SESSION_VIDEO} />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 p-4 max-w-[1400px] w-full mx-auto">
        <VideoColumn
          video={SESSION_VIDEO}
          currentSeconds={QUIZ_ITEM.ts}
          isPaused={isVideoPaused}
        />
        <CoPilotPanel
          previousEvents={EVENTS_BEFORE_QUIZ}
          quiz={QUIZ_ITEM}
          quizState={quizState}
          agentState={agentState}
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

function VideoColumn({ video, currentSeconds, isPaused }) {
  return (
    <section className="space-y-3">
      <VideoFrame video={video} isPaused={isPaused} />
      <VideoCustomControls
        video={video}
        currentSeconds={currentSeconds}
        isPaused={isPaused}
      />
      <VideoMeta video={video} />
    </section>
  )
}

function VideoFrame({ video, isPaused }) {
  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md">
      <img
        src={video.thumbnailUrl}
        alt=""
        className={`w-full h-full object-cover bg-slate-900 transition-opacity duration-500 ${
          isPaused ? 'opacity-50' : 'opacity-100'
        }`}
      />
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
          isPaused ? 'bg-slate-900/60' : 'bg-slate-900/30'
        }`}
      />
      {isPaused ? <PausedForQuizIndicator /> : <PlayingIndicator />}
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

function PausedForQuizIndicator() {
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-white uppercase tracking-wider">
      <PauseDotIcon />
      Paused for quiz
    </div>
  )
}

function VideoCustomControls({ video, currentSeconds, isPaused }) {
  const progressPercent = Math.min(100, (currentSeconds / video.totalDurationSeconds) * 100)
  return (
    <div
      className={`bg-white rounded-xl border border-stone-200 p-3 flex items-center gap-3 transition-opacity duration-500 ${
        isPaused ? 'opacity-60' : 'opacity-100'
      }`}
    >
      <PlayPauseButton isPaused={isPaused} />
      <VideoScrubBar progressPercent={progressPercent} isDisabled={isPaused} />
      <VideoTimeDisplay current={currentSeconds} total={video.totalDurationSeconds} />
      <PlaybackSpeedSelector isDisabled={isPaused} />
      <AskTheAIButton isDisabled={isPaused} />
    </div>
  )
}

function PlayPauseButton({ isPaused }) {
  return (
    <button
      type="button"
      aria-label={isPaused ? 'Play' : 'Pause'}
      disabled={isPaused}
      className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-colors"
    >
      {isPaused ? <PlayIcon /> : <PauseIcon />}
    </button>
  )
}

function VideoScrubBar({ progressPercent, isDisabled }) {
  return (
    <div
      className={`flex-1 relative h-1.5 bg-stone-200 rounded-full overflow-hidden ${
        isDisabled ? 'opacity-60' : ''
      }`}
    >
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

function PlaybackSpeedSelector({ isDisabled }) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      className="text-xs font-mono text-slate-600 hover:text-slate-900 hover:bg-stone-100 disabled:hover:bg-transparent disabled:cursor-not-allowed px-2 py-1 rounded transition-colors shrink-0"
    >
      1.0×
    </button>
  )
}

function AskTheAIButton({ isDisabled }) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:hover:bg-transparent disabled:cursor-not-allowed px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
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

function CoPilotPanel({ previousEvents, quiz, quizState, agentState }) {
  return (
    <aside className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col h-[calc(100vh-100px)] max-h-[820px] overflow-hidden">
      <CoPilotPanelHeader agentState={agentState} eventsCount={previousEvents.length + 1} />
      <CoPilotEventTimeline
        previousEvents={previousEvents}
        quiz={quiz}
        quizState={quizState}
      />
      <ChatInputFooter isMuted={isQuizActivePhase(quizState.phase)} />
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

function CoPilotEventTimeline({ previousEvents, quiz, quizState }) {
  const isQuizActive = isQuizActivePhase(quizState.phase)
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div
        className={`space-y-2 transition-opacity duration-500 ${
          isQuizActive ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {previousEvents.map((event) => (
          <EventRenderer key={event.id} event={event} />
        ))}
      </div>
      {isQuizActive && (
        <div className="mt-4">
          <QuizCard quiz={quiz} quizState={quizState} />
        </div>
      )}
    </div>
  )
}

function EventRenderer({ event }) {
  if (event.type === EventType.SECTION) return <SectionDivider event={event} />
  if (event.type === EventType.NOTE) return <NoteBullet event={event} />
  if (event.type === EventType.CONCEPT) return <ConceptCard event={event} />
  if (event.type === EventType.CODE) return <CodeSnippetCard event={event} />
  if (event.type === EventType.CITATION) return <CitationCard event={event} />
  return null
}

function SectionDivider({ event }) {
  return (
    <div className="pt-4 pb-2 first:pt-0">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
          {event.title}
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>
    </div>
  )
}

function NoteBullet({ event }) {
  return (
    <div className="w-full flex items-start gap-2.5 py-1.5 pl-3 pr-2 rounded-lg group">
      <Timestamp seconds={event.ts} />
      <span className="text-sm leading-relaxed text-slate-700">{event.text}</span>
    </div>
  )
}

function Timestamp({ seconds }) {
  return (
    <span className="shrink-0 text-xs font-mono pt-0.5 text-slate-400 group-hover:text-indigo-600 transition-colors">
      [{formatTimestamp(seconds)}]
    </span>
  )
}

function ConceptCard({ event }) {
  return (
    <div className="rounded-xl p-3.5 bg-stone-50 ring-1 ring-stone-200">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <ConceptIcon />
          <h3 className="text-sm font-semibold text-slate-900">{event.title}</h3>
        </div>
        <Timestamp seconds={event.ts} />
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{event.definition}</p>
    </div>
  )
}

function CodeSnippetCard({ event }) {
  return (
    <div className="rounded-xl overflow-hidden ring-1 ring-stone-200">
      <div className="px-3 py-1.5 flex items-center justify-between gap-2 bg-stone-50">
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <CodeIcon />
          <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px] shrink-0">
            {event.language}
          </span>
          <span className="text-slate-300 shrink-0">·</span>
          <span className="text-slate-600 truncate">{event.caption}</span>
        </div>
        <Timestamp seconds={event.ts} />
      </div>
      <pre className="bg-slate-900 text-slate-100 text-[11px] font-mono leading-relaxed p-3 overflow-x-auto">
        <code>{event.code}</code>
      </pre>
    </div>
  )
}

function CitationCard({ event }) {
  return (
    <a
      href={event.refUrl}
      target="_blank"
      rel="noreferrer"
      className="block py-2 pl-3 pr-2 rounded-lg group"
    >
      <div className="flex items-start gap-2.5">
        <Timestamp seconds={event.ts} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <CitationIcon />
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Citation
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">{event.refText}</p>
        </div>
        <ExternalLinkIcon />
      </div>
    </a>
  )
}

function QuizCard({ quiz, quizState }) {
  return (
    <div
      className="rounded-2xl bg-white ring-2 ring-indigo-200 shadow-md p-4"
      style={{ animation: 'distill-quiz-arrive 500ms ease-out' }}
    >
      <QuizCardHeader quiz={quiz} quizState={quizState} />
      <QuizQuestion question={quiz.question} />
      <QuizOptionsList quiz={quiz} quizState={quizState} />
      <QuizFeedbackBlock quiz={quiz} quizState={quizState} />
      <QuizActionBar quiz={quiz} quizState={quizState} />
    </div>
  )
}

function QuizCardHeader({ quiz, quizState }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-1.5">
        <QuizIcon />
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-700">
          Quiz
        </span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-600">{quiz.topic}</span>
      </div>
      <span className="shrink-0 text-xs font-mono text-slate-400">
        [{formatTimestamp(quiz.ts)}]
      </span>
    </div>
  )
}

function QuizQuestion({ question }) {
  return (
    <h3 className="text-base font-semibold text-slate-900 leading-snug mb-4">{question}</h3>
  )
}

function QuizOptionsList({ quiz, quizState }) {
  return (
    <ul className="space-y-2 mb-4">
      {quiz.options.map((option) => (
        <li key={option.id}>
          <QuizOption
            option={option}
            isCorrect={option.id === quiz.correctOptionId}
            isSelected={option.id === quizState.selectedOptionId}
            phase={quizState.phase}
            onSelect={() => quizState.selectOption(option.id)}
          />
        </li>
      ))}
    </ul>
  )
}

function QuizOption({ option, isCorrect, isSelected, phase, onSelect }) {
  const isReviewing = isReviewingPhase(phase)
  const visualClass = getQuizOptionVisualClass({ isReviewing, isCorrect, isSelected })
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isReviewing}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${visualClass}`}
    >
      <QuizOptionLetterBadge
        letter={option.id}
        isReviewing={isReviewing}
        isCorrect={isCorrect}
        isSelected={isSelected}
      />
      <span className="text-sm leading-relaxed text-slate-700 flex-1">{option.text}</span>
      <QuizOptionResultIcon
        isReviewing={isReviewing}
        isCorrect={isCorrect}
        isSelected={isSelected}
      />
    </button>
  )
}

function getQuizOptionVisualClass({ isReviewing, isCorrect, isSelected }) {
  if (!isReviewing) {
    return 'border-stone-200 hover:border-indigo-300 hover:bg-stone-50 cursor-pointer'
  }
  if (isCorrect) {
    return 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200 cursor-default'
  }
  if (isSelected) {
    return 'border-rose-300 bg-rose-50 ring-1 ring-rose-200 cursor-default'
  }
  return 'border-stone-200 opacity-50 cursor-default'
}

function QuizOptionLetterBadge({ letter, isReviewing, isCorrect, isSelected }) {
  const colorClass = getLetterBadgeColorClass({ isReviewing, isCorrect, isSelected })
  return (
    <span
      className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-semibold uppercase ${colorClass}`}
    >
      {letter}
    </span>
  )
}

function getLetterBadgeColorClass({ isReviewing, isCorrect, isSelected }) {
  if (!isReviewing) return 'bg-stone-100 text-slate-600'
  if (isCorrect) return 'bg-emerald-500 text-white'
  if (isSelected) return 'bg-rose-500 text-white'
  return 'bg-stone-100 text-slate-400'
}

function QuizOptionResultIcon({ isReviewing, isCorrect, isSelected }) {
  if (!isReviewing) return null
  if (isCorrect) return <CheckCircleIcon className="text-emerald-600 mt-0.5 shrink-0" />
  if (isSelected) return <CrossCircleIcon className="text-rose-600 mt-0.5 shrink-0" />
  return null
}

function QuizFeedbackBlock({ quiz, quizState }) {
  if (!isReviewingPhase(quizState.phase)) return null
  const isCorrectAnswer = quizState.phase === QuizPhase.REVIEWED_CORRECT
  const colorClass = isCorrectAnswer
    ? 'bg-emerald-50 ring-emerald-100 text-emerald-900'
    : 'bg-amber-50 ring-amber-100 text-amber-900'
  const text = isCorrectAnswer ? quiz.correctExplanation : quiz.wrongExplanation
  return (
    <div
      className={`rounded-xl p-3 ring-1 mb-4 ${colorClass}`}
      style={{ animation: 'distill-feedback-arrive 350ms ease-out' }}
    >
      <p className="text-xs leading-relaxed">{text}</p>
    </div>
  )
}

function QuizActionBar({ quiz, quizState }) {
  if (isReviewingPhase(quizState.phase)) {
    return <ContinueBar />
  }
  return <CountdownSkipBar countdown={quizState.countdown} onSkip={quizState.skipQuiz} />
}

function CountdownSkipBar({ countdown, onSkip }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500">
        Click an option to answer, or skip and resume the video.
      </span>
      <button
        type="button"
        onClick={onSkip}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
      >
        Skip
        <CountdownNumber value={countdown} />
      </button>
    </div>
  )
}

function CountdownNumber({ value }) {
  return (
    <span
      key={value}
      className="font-mono tabular-nums text-slate-400"
      style={{ animation: 'distill-countdown-pulse 600ms ease-out' }}
    >
      ({value}s)
    </span>
  )
}

function ContinueBar() {
  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors"
      >
        Continue
        <ArrowRightIcon />
      </button>
    </div>
  )
}

function ChatInputFooter({ isMuted }) {
  return (
    <div
      className={`border-t border-stone-100 p-3 transition-opacity duration-500 ${
        isMuted ? 'opacity-60' : 'opacity-100'
      }`}
    >
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

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  )
}

function PauseDotIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
      <rect x="7" y="5" width="3" height="14" rx="1" />
      <rect x="14" y="5" width="3" height="14" rx="1" />
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

function QuizIcon() {
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
      className="text-indigo-600"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function CheckCircleIcon({ className = '' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  )
}

function CrossCircleIcon({ className = '' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function KeyframeStyles() {
  return (
    <style>{`
      @keyframes distill-quiz-arrive {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes distill-feedback-arrive {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes distill-countdown-pulse {
        0%   { transform: scale(1.2); opacity: 0.6; }
        100% { transform: scale(1); opacity: 1; }
      }
    `}</style>
  )
}
