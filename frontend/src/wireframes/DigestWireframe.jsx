import { useEffect, useState } from 'react'

const SESSION_VIDEO = {
  thumbnailUrl: 'https://img.youtube.com/vi/kCc8FmEb1nY/maxresdefault.jpg',
  title: "Let's build GPT from scratch, in code, spelled out",
  speaker: 'Andrej Karpathy',
  totalDurationSeconds: 6972,
  watchedDurationSeconds: 4080,
  date: 'May 1, 2026',
}

const SESSION_STATS = {
  eventsCount: 14,
  conceptsCount: 5,
  quizzesAnswered: 4,
  quizzesCorrect: 3,
}

const KEY_TAKEAWAYS = [
  'Self-attention lets each token attend to every other token in the sequence, learning context-dependent representations.',
  'The matrix-multiplication formulation Q @ K.T @ V enables parallel computation across all positions.',
  'Softmax normalises raw attention scores into a probability distribution that sums to 1.',
  'BPE (Byte-Pair Encoding) merges the most frequent symbol pairs, balancing character and word granularity.',
  'Residual connections plus layer normalization make deep transformers trainable in practice.',
  'A minimal GPT can be implemented in roughly 250 lines of PyTorch.',
]

const CONCEPTS_LEARNED = [
  {
    id: 'cn1',
    title: 'Self-attention',
    definition:
      'A mechanism that lets each token in a sequence attend to every other token, learning context-dependent representations.',
    ts: 52,
  },
  {
    id: 'cn2',
    title: 'BPE (Byte-Pair Encoding)',
    definition:
      'A subword tokenisation technique that iteratively merges the most frequent pair of symbols, balancing character and word granularity.',
    ts: 230,
  },
  {
    id: 'cn3',
    title: 'Residual connection',
    definition:
      "A skip connection that adds a layer's input to its output, mitigating vanishing gradients in deep networks.",
    ts: 1820,
  },
]

const CODE_SNIPPETS_COLLECTED = [
  {
    id: 'cd1',
    language: 'python',
    caption: 'Scaled dot-product attention',
    code: `wei = q @ k.transpose(-2, -1) * head_size**-0.5
wei = wei.masked_fill(tril == 0, float('-inf'))
wei = F.softmax(wei, dim=-1)
out = wei @ v`,
    ts: 145,
  },
]

const CITATIONS_COLLECTED = [
  {
    id: 'ct1',
    refText: 'Sennrich et al. (2016) — Neural Machine Translation of Rare Words with Subword Units',
    refUrl: 'https://arxiv.org/abs/1508.07909',
    ts: 261,
  },
]

const TAKEAWAYS_FOR_SHARE_CARD = 3

function formatTimestamp(seconds) {
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

function formatDurationHuman(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function useShareModal() {
  const [isOpen, setIsOpen] = useState(false)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return { isOpen, open, close }
}

export default function DigestWireframe() {
  const shareModal = useShareModal()

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans antialiased">
      <DigestTopBar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 pb-32 space-y-10">
        <DigestHeader video={SESSION_VIDEO} />
        <StatsRow
          stats={SESSION_STATS}
          watchedDurationSeconds={SESSION_VIDEO.watchedDurationSeconds}
        />
        <KeyTakeawaysSection takeaways={KEY_TAKEAWAYS} />
        <ConceptsSection concepts={CONCEPTS_LEARNED} />
        <CodeSnippetsSection snippets={CODE_SNIPPETS_COLLECTED} />
        <CitationsSection citations={CITATIONS_COLLECTED} />
        <PersonalNotesSection />
        <WatchAnotherTalkCTA />
      </main>
      <DigestActionBar onShareClick={shareModal.open} />
      {shareModal.isOpen && (
        <ShareImageModal
          video={SESSION_VIDEO}
          stats={SESSION_STATS}
          watchedDurationSeconds={SESSION_VIDEO.watchedDurationSeconds}
          takeaways={KEY_TAKEAWAYS}
          onClose={shareModal.close}
        />
      )}
      <KeyframeStyles />
    </div>
  )
}

function DigestTopBar() {
  return (
    <header className="border-b border-stone-200/70 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <BrandLockup />
        <SessionCompleteBadge />
        <LibraryLink />
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

function SessionCompleteBadge() {
  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs">
      <CheckCircleIcon className="text-emerald-600" />
      <span className="font-medium uppercase tracking-wider text-[10px] text-emerald-700">
        Session complete
      </span>
    </div>
  )
}

function LibraryLink() {
  return (
    <a
      href="#library"
      className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
    >
      Library
      <ArrowRightIcon />
    </a>
  )
}

function DigestHeader({ video }) {
  return (
    <div>
      <SectionEyebrow>Your digest · {video.date}</SectionEyebrow>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight mt-3">
        {video.title}
      </h1>
      <p className="text-sm text-slate-500 mt-2">
        {video.speaker} · {formatDurationHuman(video.totalDurationSeconds)}
        <span className="text-slate-300 mx-2">·</span>
        <span>
          You watched{' '}
          <span className="font-mono text-slate-700">
            {formatDurationHuman(video.watchedDurationSeconds)}
          </span>
        </span>
      </p>
    </div>
  )
}

function SectionEyebrow({ children }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-slate-400">
      {children}
    </p>
  )
}

function StatsRow({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Events captured" value={stats.eventsCount} />
      <StatCard label="Concepts learned" value={stats.conceptsCount} />
      <StatCard
        label="Quizzes"
        value={`${stats.quizzesCorrect}/${stats.quizzesAnswered}`}
        suffix="correct"
      />
    </div>
  )
}

function StatCard({ label, value, suffix }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
        {label}
      </p>
      <p className="text-2xl font-semibold text-slate-900 tabular-nums">
        {value}
        {suffix && <span className="text-xs font-normal text-slate-400 ml-1.5">{suffix}</span>}
      </p>
    </div>
  )
}

function KeyTakeawaysSection({ takeaways }) {
  return (
    <section>
      <SectionEyebrow>Key takeaways</SectionEyebrow>
      <ol className="mt-4 space-y-2">
        {takeaways.map((text, idx) => (
          <TakeawayBullet key={idx} index={idx + 1} text={text} />
        ))}
      </ol>
    </section>
  )
}

function TakeawayBullet({ index, text }) {
  return (
    <li className="flex items-start gap-3 group hover:bg-white rounded-lg -mx-2 px-2 py-2 transition-colors cursor-text">
      <NumberBadge value={index} />
      <p className="text-base text-slate-800 leading-relaxed flex-1">{text}</p>
      <EditAffordance />
    </li>
  )
}

function NumberBadge({ value }) {
  return (
    <span className="shrink-0 w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-mono font-semibold text-slate-600 mt-0.5">
      {value}
    </span>
  )
}

function EditAffordance() {
  return (
    <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1 text-slate-400">
      <PencilIcon />
    </span>
  )
}

function ConceptsSection({ concepts }) {
  return (
    <section>
      <SectionEyebrow>Concepts</SectionEyebrow>
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {concepts.map((concept) => (
          <ConceptCard key={concept.id} event={concept} />
        ))}
      </div>
    </section>
  )
}

function ConceptCard({ event }) {
  return (
    <div className="rounded-xl p-3.5 bg-white ring-1 ring-stone-200 hover:ring-indigo-200 transition-all">
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

function Timestamp({ seconds }) {
  return (
    <span className="shrink-0 text-xs font-mono text-slate-400">
      [{formatTimestamp(seconds)}]
    </span>
  )
}

function CodeSnippetsSection({ snippets }) {
  return (
    <section>
      <SectionEyebrow>Code snippets</SectionEyebrow>
      <div className="mt-4 space-y-3">
        {snippets.map((snippet) => (
          <CodeSnippetCard key={snippet.id} event={snippet} />
        ))}
      </div>
    </section>
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

function CitationsSection({ citations }) {
  return (
    <section>
      <SectionEyebrow>Citations</SectionEyebrow>
      <div className="mt-4 space-y-2">
        {citations.map((citation) => (
          <CitationCard key={citation.id} event={citation} />
        ))}
      </div>
    </section>
  )
}

function CitationCard({ event }) {
  return (
    <a
      href={event.refUrl}
      target="_blank"
      rel="noreferrer"
      className="block py-3 px-3 rounded-lg ring-1 ring-stone-200 hover:ring-indigo-200 hover:bg-white transition-all group"
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
          <p className="text-sm leading-relaxed text-slate-700">{event.refText}</p>
        </div>
        <ExternalLinkIcon />
      </div>
    </a>
  )
}

function PersonalNotesSection() {
  return (
    <section>
      <SectionEyebrow>Your notes</SectionEyebrow>
      <textarea
        placeholder="Add a personal note about this session…"
        className="mt-4 w-full min-h-[100px] px-4 py-3 rounded-xl bg-white ring-1 ring-stone-200 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed resize-none transition-all"
      />
    </section>
  )
}

function WatchAnotherTalkCTA() {
  const [nextVideoUrl, setNextVideoUrl] = useState('')

  const handleStartNewSession = (e) => {
    e.preventDefault()
    if (!nextVideoUrl.trim()) return
    alert(`Wireframe: would navigate to /co-watch with\n\n${nextVideoUrl}`)
  }

  const isSubmitDisabled = !nextVideoUrl.trim()

  return (
    <section className="border-t border-stone-200 pt-10 text-center space-y-3">
      <p className="text-sm text-slate-500">Ready for another?</p>
      <h2 className="text-2xl font-semibold text-slate-900">Watch another talk</h2>
      <form onSubmit={handleStartNewSession} className="max-w-md mx-auto flex gap-2 mt-4">
        <input
          type="url"
          value={nextVideoUrl}
          onChange={(e) => setNextVideoUrl(e.target.value)}
          placeholder="Paste a YouTube tech talk URL…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white ring-1 ring-stone-200 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Co-watch
          <ArrowRightIcon />
        </button>
      </form>
    </section>
  )
}

function DigestActionBar({ onShareClick }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 px-3">
      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-stone-200 px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
        <SavedToLibraryConfirmation />
        <ActionBarDivider />
        <ActionBarButton
          icon={<ImageIcon />}
          label="Share as image"
          onClick={onShareClick}
          highlight
        />
        <ActionBarButton icon={<DownloadIcon />} label="Export markdown" />
        <ActionBarButton icon={<ClockIcon />} label="Schedule review" />
      </div>
    </div>
  )
}

function SavedToLibraryConfirmation() {
  return (
    <div className="flex items-center gap-1.5 px-2 text-xs text-emerald-700 shrink-0">
      <CheckCircleIcon className="text-emerald-600" />
      <span className="font-medium hidden sm:inline">Saved to library</span>
    </div>
  )
}

function ActionBarDivider() {
  return <div className="w-px h-5 bg-stone-200 shrink-0" />
}

function ActionBarButton({ icon, label, onClick, highlight }) {
  const variantClass = highlight
    ? 'bg-slate-900 text-white hover:bg-slate-800'
    : 'text-slate-700 hover:bg-stone-100'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${variantClass}`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  )
}

function ShareImageModal({ video, stats, watchedDurationSeconds, takeaways, onClose }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ animation: 'distill-modal-fade-in 200ms ease-out' }}
    >
      <ModalBackdrop onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ animation: 'distill-modal-pop-in 250ms ease-out' }}
      >
        <ModalHeader onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
          <SharePreviewCard
            video={video}
            stats={stats}
            watchedDurationSeconds={watchedDurationSeconds}
            takeaways={takeaways}
          />
        </div>
        <ModalActionBar />
      </div>
    </div>
  )
}

function ModalBackdrop({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
    />
  )
}

function ModalHeader({ onClose }) {
  return (
    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Share your digest</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Post your tech learning to X or LinkedIn
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
        aria-label="Close"
      >
        <CrossIcon />
      </button>
    </div>
  )
}

function SharePreviewCard({ video, stats, watchedDurationSeconds, takeaways }) {
  const topTakeaways = takeaways.slice(0, TAKEAWAYS_FOR_SHARE_CARD)
  return (
    <div className="aspect-[1.91/1] bg-gradient-to-br from-white to-stone-100 rounded-2xl ring-1 ring-stone-200 shadow-sm overflow-hidden p-6 flex flex-col gap-3 relative">
      <SharePreviewBrandRow date={video.date} />
      <SharePreviewTitleBlock video={video} />
      <SharePreviewTakeawaysList takeaways={topTakeaways} />
      <SharePreviewFooter stats={stats} watchedDurationSeconds={watchedDurationSeconds} />
    </div>
  )
}

function SharePreviewBrandRow({ date }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center">
          <span className="text-white font-bold text-[10px]">D</span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-slate-700">
          Distill
        </span>
      </div>
      <span className="text-[10px] text-slate-400 font-mono">{date}</span>
    </div>
  )
}

function SharePreviewTitleBlock({ video }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
        Today I distilled
      </p>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight line-clamp-1">
        {video.title}
      </h3>
      <p className="text-[11px] text-slate-500 mt-0.5">
        by {video.speaker} · {formatDurationHuman(video.totalDurationSeconds)}
      </p>
    </div>
  )
}

function SharePreviewTakeawaysList({ takeaways }) {
  return (
    <div className="flex-1">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1.5">
        Top takeaways
      </p>
      <ul className="space-y-1">
        {takeaways.map((text, idx) => (
          <li
            key={idx}
            className="text-[11px] text-slate-700 leading-snug flex items-start gap-1.5 line-clamp-2"
          >
            <span className="text-indigo-500 shrink-0">▸</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SharePreviewFooter({ stats, watchedDurationSeconds }) {
  return (
    <div className="flex items-end justify-between">
      <p className="text-[10px] text-slate-500 font-mono">
        {stats.conceptsCount} concepts · {CODE_SNIPPETS_COLLECTED.length} code snippet
        {CODE_SNIPPETS_COLLECTED.length === 1 ? '' : 's'} ·{' '}
        {formatDurationHuman(watchedDurationSeconds)} active
      </p>
      <span className="text-[10px] text-slate-400 font-mono">distill.so</span>
    </div>
  )
}

function ModalActionBar() {
  return (
    <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-white flex-wrap">
      <ModalSecondaryAction icon={<CopyIcon />} label="Copy" />
      <ModalSecondaryAction icon={<DownloadIcon />} label="Download .png" />
      <ModalPrimaryAction icon={<XLogoIcon />} label="Post to X" />
      <ModalPrimaryAction icon={<LinkedInLogoIcon />} label="Post to LinkedIn" />
    </div>
  )
}

function ModalSecondaryAction({ icon, label }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-stone-100 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}

function ModalPrimaryAction({ icon, label }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}

function CheckCircleIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
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

function PencilIcon() {
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
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
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

function ImageIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function XLogoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInLogoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function KeyframeStyles() {
  return (
    <style>{`
      @keyframes distill-modal-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes distill-modal-pop-in {
        from { opacity: 0; transform: scale(0.96) translateY(8px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>
  )
}
