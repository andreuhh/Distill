import { useEffect, useState } from 'react'

const PIPELINE_STEPS = [
  {
    id: 'transcript',
    label: 'Reading transcript',
    detail: 'Fetching captions and segments from YouTube',
  },
  {
    id: 'concepts',
    label: 'Identifying key concepts',
    detail: 'Recognising what matters in the talk',
  },
  {
    id: 'script',
    label: 'Generating co-watch script',
    detail: 'Crafting questions, notes, and pause moments',
  },
  {
    id: 'copilot',
    label: 'Setting up your co-pilot',
    detail: 'Final preparations before we begin',
  },
]

const ROTATING_TIPS = [
  'Press space anytime to pause and ask the agent a question.',
  'Each session gets saved to your library — review it any time.',
  'The agent will pause for short quizzes at key moments. You can skip them.',
  'Click any timestamp in the side panel to jump there in the video.',
  'Your weekly digest is a shareable card with what you learned.',
]

const STEP_DURATION_MS = 1800
const TIP_ROTATION_MS = 3500
const RESTART_DELAY_MS = 2400

const FALLBACK_THUMBNAIL_URL = 'https://img.youtube.com/vi/kCc8FmEb1nY/hqdefault.jpg'

const VIDEO = {
  thumbnail: 'https://img.youtube.com/vi/kCc8FmEb1nY/maxresdefault.jpg',
  title: "Let's build GPT from scratch, in code, spelled out",
  speaker: 'Andrej Karpathy',
  duration: '1h 56m',
}

const StepStatus = {
  COMPLETE: 'complete',
  ACTIVE: 'active',
  PENDING: 'pending',
}

function getStepStatus(stepIndex, activeStepIndex) {
  if (stepIndex < activeStepIndex) return StepStatus.COMPLETE
  if (stepIndex === activeStepIndex) return StepStatus.ACTIVE
  return StepStatus.PENDING
}

function useLoopingStepTicker(totalSteps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const isPipelineComplete = activeStepIndex >= totalSteps

  useEffect(() => {
    if (isPipelineComplete) return
    const timer = setTimeout(() => setActiveStepIndex((i) => i + 1), STEP_DURATION_MS)
    return () => clearTimeout(timer)
  }, [activeStepIndex, isPipelineComplete])

  useEffect(() => {
    if (!isPipelineComplete) return
    const timer = setTimeout(() => setActiveStepIndex(0), RESTART_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isPipelineComplete])

  return activeStepIndex
}

function useRotatingIndex(totalItems, intervalMs) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % totalItems), intervalMs)
    return () => clearInterval(timer)
  }, [totalItems, intervalMs])
  return index
}

export default function LoadingWireframe() {
  const activeStepIndex = useLoopingStepTicker(PIPELINE_STEPS.length)
  const tipIndex = useRotatingIndex(ROTATING_TIPS.length, TIP_ROTATION_MS)

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans antialiased">
      <TopBar />
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">
          <SectionEyebrow>Preparing your session</SectionEyebrow>

          <div className="rounded-2xl overflow-hidden shadow-sm">
            <VideoPreviewHeader video={VIDEO} />
            <div className="bg-white border-x border-b border-stone-200">
              <PipelineStepsList
                steps={PIPELINE_STEPS}
                activeStepIndex={activeStepIndex}
              />
              <RotatingTipStrip
                tip={ROTATING_TIPS[tipIndex]}
                tipKey={tipIndex}
              />
            </div>
          </div>

          <FirstTimeReassurance />
        </div>
      </main>

      <KeyframeStyles />
    </div>
  )
}

function TopBar() {
  return (
    <header className="border-b border-stone-200/70 bg-white/70 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <BrandLockup />
        <button
          type="button"
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </header>
  )
}

function BrandLockup() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center shadow-sm">
        <span className="text-white font-bold text-sm tracking-tight">D</span>
      </div>
      <span className="text-slate-900 font-semibold tracking-tight">Distill</span>
      <span className="ml-1 text-[10px] uppercase tracking-wider font-medium text-stone-400 border border-stone-300 rounded px-1.5 py-0.5">
        beta
      </span>
    </div>
  )
}

function SectionEyebrow({ children }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.18em] font-medium text-slate-400 text-center mb-4">
      {children}
    </p>
  )
}

function VideoPreviewHeader({ video }) {
  const handleImageError = (e) => {
    e.currentTarget.src = FALLBACK_THUMBNAIL_URL
  }
  return (
    <div className="relative aspect-video bg-white">
      <img
        src={video.thumbnail}
        alt=""
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
      <ScanningShimmer />
      <VideoCaption video={video} />
    </div>
  )
}

function ScanningShimmer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -inset-y-4 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-12deg]"
        style={{ animation: 'distill-shimmer 3s ease-in-out infinite' }}
      />
    </div>
  )
}

function VideoCaption({ video }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
      <h2 className="text-base font-semibold leading-tight line-clamp-1">
        {video.title}
      </h2>
      <p className="text-xs text-white/70 mt-1 font-mono">
        {video.speaker} · {video.duration}
      </p>
    </div>
  )
}

function PipelineStepsList({ steps, activeStepIndex }) {
  return (
    <div className="px-6 py-5">
      <ul className="space-y-3">
        {steps.map((step, idx) => (
          <PipelineStepRow
            key={step.id}
            step={step}
            status={getStepStatus(idx, activeStepIndex)}
          />
        ))}
      </ul>
    </div>
  )
}

function PipelineStepRow({ step, status }) {
  const labelColorByStatus = {
    [StepStatus.ACTIVE]: 'text-slate-900',
    [StepStatus.COMPLETE]: 'text-slate-400',
    [StepStatus.PENDING]: 'text-slate-400',
  }
  const isActive = status === StepStatus.ACTIVE
  return (
    <li className="flex items-start gap-3 min-h-[36px]">
      <StepStatusIcon status={status} />
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-sm font-medium transition-colors duration-300 ${labelColorByStatus[status]}`}>
          {step.label}
        </p>
        {isActive && (
          <p className="text-xs text-slate-500 mt-0.5 animate-pulse">
            {step.detail}
          </p>
        )}
      </div>
    </li>
  )
}

function StepStatusIcon({ status }) {
  if (status === StepStatus.COMPLETE) return <CompleteStepIcon />
  if (status === StepStatus.ACTIVE) return <ActiveStepIcon />
  return <PendingStepIcon />
}

function CompleteStepIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
      <CheckmarkIcon />
    </div>
  )
}

function ActiveStepIcon() {
  return (
    <div className="relative w-6 h-6 shrink-0 mt-0.5">
      <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500"
        style={{ animation: 'distill-orbit 1.5s linear infinite' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
      </div>
    </div>
  )
}

function PendingStepIcon() {
  return <div className="w-6 h-6 rounded-full border-2 border-stone-200 shrink-0 mt-0.5" />
}

function CheckmarkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function RotatingTipStrip({ tip, tipKey }) {
  return (
    <div className="border-t border-stone-100 px-6 py-3 bg-stone-50/60">
      <p className="text-xs text-slate-500 flex items-baseline gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium shrink-0">
          Tip ·
        </span>
        <span
          key={tipKey}
          className="leading-relaxed"
          style={{ animation: 'distill-fade-in 400ms ease-out' }}
        >
          {tip}
        </span>
      </p>
    </div>
  )
}

function FirstTimeReassurance() {
  return (
    <p className="mt-6 text-center text-xs text-slate-400">
      This usually takes 30–60 seconds the first time.<br />
      Cached videos open instantly.
    </p>
  )
}

function KeyframeStyles() {
  return (
    <style>{`
      @keyframes distill-shimmer {
        0%   { transform: translateX(0%) skewX(-12deg); }
        100% { transform: translateX(500%) skewX(-12deg); }
      }
      @keyframes distill-fade-in {
        from { opacity: 0; transform: translateY(2px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes distill-orbit {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    `}</style>
  )
}
