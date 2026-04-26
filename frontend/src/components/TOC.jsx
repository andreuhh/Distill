/**
 * Navigable table of contents: click on a section -> seek the player to its timestamp.
 */
export default function TOC({ sections, onJump, activeIndex }) {
  if (!sections || sections.length === 0) return null
  return (
    <nav className="bg-white rounded-lg border border-slate-200 p-4 sticky top-4">
      <h3 className="text-sm uppercase tracking-wide text-slate-500 mb-3">Contents</h3>
      <ul className="space-y-1">
        {sections.map((s) => (
          <li key={s.index}>
            <button
              onClick={() => onJump(s)}
              className={
                'w-full text-left px-2 py-1.5 rounded hover:bg-indigo-50 ' +
                (activeIndex === s.index
                  ? 'bg-indigo-100 text-indigo-800 font-medium'
                  : 'text-slate-700')
              }
            >
              <span className="font-mono text-xs text-slate-500 mr-2">
                {s.start_timestamp}
              </span>
              {s.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
