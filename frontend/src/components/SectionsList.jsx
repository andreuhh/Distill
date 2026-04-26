function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
      : part
  )
}

export default function SectionsList({ sections, onJump, activeIndex, searchQuery = '' }) {
  if (!sections || sections.length === 0) return null
  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <article
          id={`section-${s.index}`}
          key={s.index}
          className={
            'bg-white rounded-lg border p-5 transition-colors ' +
            (activeIndex === s.index ? 'border-indigo-400' : 'border-slate-200')
          }
        >
          <header className="flex items-baseline justify-between gap-4 mb-3">
            <h2 className="text-lg font-semibold text-slate-900">
              {highlight(s.title, searchQuery)}
            </h2>
            <button
              onClick={() => onJump(s)}
              className="font-mono text-sm text-indigo-600 hover:underline shrink-0"
            >
              [{s.start_timestamp}] ▶
            </button>
          </header>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
            {highlight(s.transcript, searchQuery)}
          </p>
        </article>
      ))}
    </div>
  )
}
