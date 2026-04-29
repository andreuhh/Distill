import { useState } from 'react'

const SAMPLE_TALKS = [
  {
    title: "Let's build GPT from scratch, in code, spelled out",
    speaker: 'Andrej Karpathy',
    duration: '1h 56m',
    url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
  },
  {
    title: 'Building Agentic Frontends with AG-UI',
    speaker: 'AG-UI Conference',
    duration: '32m',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    title: 'How LLMs Really Work — A Deep Dive',
    speaker: 'Latent Space',
    duration: '1h 12m',
    url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
  },
]

const URL_INPUT_ID = 'distill-url-input'

export default function HomeWireframe() {
  const [url, setUrl] = useState('')

  const focusUrlInput = () => {
    const input = document.getElementById(URL_INPUT_ID)
    if (input) input.focus()
  }

  const handleSampleClick = (sampleUrl) => {
    setUrl(sampleUrl)
    focusUrlInput()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) return
    alert(`Wireframe: would navigate to /co-watch with\n\n${url}`)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans antialiased">
      <TopBar />

      <main className="flex-1 flex items-start sm:items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-3xl text-center">
          <BrandPill />

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
            Tech talks deserve more than <br className="hidden sm:block" />
            <span className="text-slate-400">passive viewing.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Paste a YouTube link. An AI co-pilot watches with you, takes notes,
            asks the right questions, and turns passive viewing into knowledge
            that sticks.
          </p>

          <UrlInputForm
            url={url}
            onUrlChange={setUrl}
            onSubmit={handleSubmit}
          />

          <SampleTalksShelf
            talks={SAMPLE_TALKS}
            onSampleSelect={handleSampleClick}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}

function TopBar() {
  return (
    <header className="border-b border-stone-200/70 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <BrandLockup />
        <nav className="flex items-center gap-6 text-sm text-slate-600">
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors hidden sm:inline">
            How it works
          </a>
          <a
            href="#sign-in"
            className="px-3 py-1.5 rounded-lg hover:bg-stone-100 hover:text-slate-900 transition-colors"
          >
            Sign in
          </a>
        </nav>
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

function BrandPill() {
  return (
    <div className="inline-flex items-center gap-2 mb-7 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-xs text-indigo-700 font-medium">
      <PulsingDot />
      Agentic co-watching · Powered by AG-UI
    </div>
  )
}

function PulsingDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
    </span>
  )
}

function UrlInputForm({ url, onUrlChange, onSubmit }) {
  const isSubmitDisabled = !url.trim()
  return (
    <form onSubmit={onSubmit} className="mt-10 max-w-2xl mx-auto">
      <div
        className="flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-2xl border border-stone-200 shadow-sm
                   focus-within:border-indigo-300 focus-within:shadow-md
                   focus-within:ring-4 focus-within:ring-indigo-100/70 transition-all"
      >
        <input
          id={URL_INPUT_ID}
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="Paste a YouTube tech talk URL…"
          className="flex-1 px-4 py-3 bg-transparent rounded-xl focus:outline-none text-slate-900 placeholder:text-slate-400 text-base"
          aria-label="YouTube video URL"
        />
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-medium
                     hover:bg-slate-800 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed
                     shadow-sm hover:shadow"
        >
          Co-watch
          <ArrowRightIcon />
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        No signup needed for your first 3 sessions.
      </p>
    </form>
  )
}

function SampleTalksShelf({ talks, onSampleSelect }) {
  return (
    <div className="mt-14">
      <p className="text-[11px] uppercase tracking-[0.15em] font-medium text-slate-400 mb-4">
        Or try with one of these
      </p>
      <div className="grid sm:grid-cols-3 gap-3 text-left">
        {talks.map((talk) => (
          <SampleTalkCard
            key={talk.url}
            talk={talk}
            onSelect={() => onSampleSelect(talk.url)}
          />
        ))}
      </div>
    </div>
  )
}

function SampleTalkCard({ talk, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group p-4 bg-white rounded-xl border border-stone-200
                 hover:border-indigo-300 hover:shadow-sm
                 focus:outline-none focus:ring-4 focus:ring-indigo-100
                 transition-all text-left"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
          <PlayIcon className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
        </div>
        <span className="text-[11px] font-mono text-slate-400">{talk.duration}</span>
      </div>
      <h3 className="text-sm font-medium text-slate-900 leading-snug mb-1 line-clamp-2">
        {talk.title}
      </h3>
      <p className="text-xs text-slate-500">{talk.speaker}</p>
    </button>
  )
}

function Footer() {
  return (
    <footer className="border-t border-stone-200/70 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          Built with{' '}
          <a
            href="https://ag-ui.com"
            target="_blank"
            rel="noreferrer"
            className="text-slate-700 hover:text-indigo-600 underline decoration-stone-300 underline-offset-2 transition-colors"
          >
            AG-UI
          </a>{' '}
          · An indie experiment by a UI engineer.
        </p>
        <p className="font-mono">© 2026 Distill</p>
      </div>
    </footer>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function PlayIcon({ className = '' }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" className={className}>
      <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
    </svg>
  )
}
