import { useMemo, useState } from 'react'

const LIBRARY_ENTRIES = [
  {
    id: 'e1',
    title: "Let's build GPT from scratch, in code, spelled out",
    speaker: 'Andrej Karpathy',
    thumbnailVideoId: 'kCc8FmEb1nY',
    durationSeconds: 6972,
    eventsCount: 14,
    conceptsCount: 5,
    date: 'May 1, 2026',
    tags: ['llm', 'transformers'],
  },
  {
    id: 'e2',
    title: 'Building production-ready agents with Claude',
    speaker: 'Anthropic',
    thumbnailVideoId: '',
    durationSeconds: 1920,
    eventsCount: 6,
    conceptsCount: 3,
    date: 'Apr 29, 2026',
    tags: ['agents'],
  },
  {
    id: 'e3',
    title: 'Lex Fridman: Conversation with Ilya Sutskever',
    speaker: 'Lex Fridman',
    thumbnailVideoId: 'VMj-3S1tku0',
    durationSeconds: 8280,
    eventsCount: 22,
    conceptsCount: 8,
    date: 'Apr 25, 2026',
    tags: ['llm', 'ai'],
  },
  {
    id: 'e4',
    title: 'The AI Engineer Stack in 2026',
    speaker: 'swyx · Latent Space',
    thumbnailVideoId: '',
    durationSeconds: 1680,
    eventsCount: 5,
    conceptsCount: 2,
    date: 'Apr 22, 2026',
    tags: ['career', 'ai'],
  },
  {
    id: 'e5',
    title: 'Neural Networks: Zero to Hero — Backprop from scratch',
    speaker: 'Andrej Karpathy',
    thumbnailVideoId: '7xTGNNLPyMI',
    durationSeconds: 8700,
    eventsCount: 19,
    conceptsCount: 6,
    date: 'Apr 18, 2026',
    tags: ['fundamentals', 'llm'],
  },
  {
    id: 'e6',
    title: 'Next.js Conf 2026 — App Router and Server Components',
    speaker: 'Vercel',
    thumbnailVideoId: '',
    durationSeconds: 2100,
    eventsCount: 7,
    conceptsCount: 3,
    date: 'Apr 14, 2026',
    tags: ['frontend'],
  },
  {
    id: 'e7',
    title: 'Microsoft Build: Copilot Tools deep-dive',
    speaker: 'Microsoft Build',
    thumbnailVideoId: '',
    durationSeconds: 1080,
    eventsCount: 4,
    conceptsCount: 2,
    date: 'Apr 9, 2026',
    tags: ['agents'],
  },
  {
    id: 'e8',
    title: 'CMU 15-445: Database Systems — Concurrency Control',
    speaker: 'CMU Database Group',
    thumbnailVideoId: '',
    durationSeconds: 4320,
    eventsCount: 9,
    conceptsCount: 4,
    date: 'Apr 2, 2026',
    tags: ['systems', 'fundamentals'],
  },
]

const ALL_TAG_ID = 'all'
const SEARCH_FIELDS = ['title', 'speaker']

function formatDurationHuman(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function getSpeakerInitials(speaker) {
  return speaker
    .replace(/·.*$/, '')
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
}

function buildTagFilterList(entries) {
  const tagCounts = new Map()
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
  }
  const sortedTagsWithCounts = [...tagCounts.entries()]
    .map(([id, count]) => ({ id, label: id, count }))
    .sort((a, b) => b.count - a.count)
  return [
    { id: ALL_TAG_ID, label: 'All', count: entries.length },
    ...sortedTagsWithCounts,
  ]
}

function getLibraryStats(entries) {
  return {
    totalSessions: entries.length,
    totalConcepts: entries.reduce((sum, e) => sum + e.conceptsCount, 0),
    totalSeconds: entries.reduce((sum, e) => sum + e.durationSeconds, 0),
  }
}

function matchesSearch(entry, searchQuery) {
  if (!searchQuery) return true
  const query = searchQuery.toLowerCase()
  return SEARCH_FIELDS.some((field) => entry[field].toLowerCase().includes(query))
}

function matchesTag(entry, selectedTagId) {
  if (selectedTagId === ALL_TAG_ID) return true
  return entry.tags.includes(selectedTagId)
}

function useLibraryFilters(entries) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagId, setSelectedTagId] = useState(ALL_TAG_ID)

  const filteredEntries = useMemo(
    () => entries.filter((e) => matchesSearch(e, searchQuery) && matchesTag(e, selectedTagId)),
    [entries, searchQuery, selectedTagId]
  )

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedTagId(ALL_TAG_ID)
  }

  const hasActiveFilters = searchQuery !== '' || selectedTagId !== ALL_TAG_ID

  return {
    searchQuery,
    setSearchQuery,
    selectedTagId,
    setSelectedTagId,
    filteredEntries,
    clearAllFilters,
    hasActiveFilters,
  }
}

export default function LibraryWireframe() {
  const filters = useLibraryFilters(LIBRARY_ENTRIES)
  const tagFilterList = useMemo(() => buildTagFilterList(LIBRARY_ENTRIES), [])
  const overallStats = useMemo(() => getLibraryStats(LIBRARY_ENTRIES), [])

  const handleEntryClick = (entry) => {
    alert(`Wireframe: would navigate to /library/${entry.id}`)
  }

  const handleNewSession = () => {
    alert('Wireframe: would navigate to /')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans antialiased">
      <LibraryTopBar onNewSessionClick={handleNewSession} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8">
        <LibraryHeader stats={overallStats} onNewSessionClick={handleNewSession} />
        <LibraryToolbar
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
        />
        <TagFilterRow
          tags={tagFilterList}
          selectedTagId={filters.selectedTagId}
          onSelectTag={filters.setSelectedTagId}
        />
        <EntriesGridOrEmptyState
          entries={filters.filteredEntries}
          hasActiveFilters={filters.hasActiveFilters}
          onClearFilters={filters.clearAllFilters}
          onEntryClick={handleEntryClick}
        />
      </main>
    </div>
  )
}

function LibraryTopBar({ onNewSessionClick }) {
  return (
    <header className="border-b border-stone-200/70 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <BrandLockup />
        <ProfileLink />
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
      <span className="ml-1 text-[10px] uppercase tracking-wider font-medium text-stone-400 border border-stone-300 rounded px-1.5 py-0.5">
        beta
      </span>
    </div>
  )
}

function ProfileLink() {
  return (
    <a
      href="#account"
      className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
    >
      <ProfileAvatar />
      Andrea
    </a>
  )
}

function ProfileAvatar() {
  return (
    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">
      A
    </span>
  )
}

function LibraryHeader({ stats, onNewSessionClick }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <SectionEyebrow>Your library</SectionEyebrow>
        <NewSessionButton onClick={onNewSessionClick} />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
        Your second brain on tech.
      </h1>
      <LibraryStatsLine stats={stats} />
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

function LibraryStatsLine({ stats }) {
  return (
    <p className="text-base text-slate-500">
      <span className="font-semibold text-slate-900 tabular-nums">{stats.totalSessions}</span>{' '}
      sessions
      <StatsSeparator />
      <span className="font-semibold text-slate-900 tabular-nums">{stats.totalConcepts}</span>{' '}
      concepts
      <StatsSeparator />
      <span className="font-semibold text-slate-900">
        {formatDurationHuman(stats.totalSeconds)}
      </span>{' '}
      of distilled learning
    </p>
  )
}

function StatsSeparator() {
  return <span className="mx-2 text-slate-300">·</span>
}

function LibraryToolbar({ searchQuery, onSearchChange }) {
  return (
    <div className="flex items-center gap-3">
      <SearchInput value={searchQuery} onChange={onSearchChange} />
    </div>
  )
}

function SearchInput({ value, onChange }) {
  return (
    <div className="flex-1 relative">
      <SearchIcon />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by title or speaker…"
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white ring-1 ring-stone-200 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all"
      />
    </div>
  )
}

function NewSessionButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shrink-0"
    >
      <PlusIcon />
      <span className="hidden sm:inline">New session</span>
    </button>
  )
}

function TagFilterRow({ tags, selectedTagId, onSelectTag }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tags.map((tag) => (
        <TagFilterChip
          key={tag.id}
          tag={tag}
          isSelected={tag.id === selectedTagId}
          onSelect={() => onSelectTag(tag.id)}
        />
      ))}
    </div>
  )
}

function TagFilterChip({ tag, isSelected, onSelect }) {
  const variantClass = isSelected
    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
    : 'bg-white text-slate-700 ring-1 ring-stone-200 hover:ring-stone-300'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-sm font-medium px-3 py-1.5 rounded-full transition-all ${variantClass}`}
    >
      {tag.id === ALL_TAG_ID ? tag.label : `#${tag.label}`}
      <TagCountBadge count={tag.count} isSelected={isSelected} />
    </button>
  )
}

function TagCountBadge({ count, isSelected }) {
  const colorClass = isSelected ? 'text-indigo-500' : 'text-slate-400'
  return <span className={`text-xs ml-1.5 font-mono ${colorClass}`}>{count}</span>
}

function EntriesGridOrEmptyState({ entries, hasActiveFilters, onClearFilters, onEntryClick }) {
  if (entries.length === 0) {
    return <EmptyFilterState hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
  }
  return <EntriesGrid entries={entries} onEntryClick={onEntryClick} />
}

function EntriesGrid({ entries, onEntryClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} />
      ))}
    </div>
  )
}

function EntryCard({ entry, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left group flex flex-col bg-white rounded-xl ring-1 ring-stone-200 hover:ring-indigo-200 hover:shadow-md transition-all overflow-hidden"
    >
      <EntryThumbnail thumbnailVideoId={entry.thumbnailVideoId} speaker={entry.speaker} />
      <EntryContent entry={entry} />
    </button>
  )
}

function EntryThumbnail({ thumbnailVideoId, speaker }) {
  const [hasImageError, setHasImageError] = useState(false)
  if (!thumbnailVideoId || hasImageError) {
    return <FallbackThumbnail speaker={speaker} />
  }
  return (
    <img
      src={`https://img.youtube.com/vi/${thumbnailVideoId}/mqdefault.jpg`}
      alt=""
      className="aspect-video w-full object-cover bg-stone-100 group-hover:opacity-95 transition-opacity"
      onError={() => setHasImageError(true)}
    />
  )
}

function FallbackThumbnail({ speaker }) {
  return (
    <div className="aspect-video w-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
      <span className="text-4xl font-bold text-white/25 tracking-tight">
        {getSpeakerInitials(speaker)}
      </span>
    </div>
  )
}

function EntryContent({ entry }) {
  return (
    <div className="p-4 flex-1 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 mb-1.5 group-hover:text-indigo-700 transition-colors">
        {entry.title}
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        {entry.speaker} · {formatDurationHuman(entry.durationSeconds)}
      </p>
      <EntryTagsList tags={entry.tags} />
      <EntryMetadataFooter entry={entry} />
    </div>
  )
}

function EntryTagsList({ tags }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-3">
      {tags.map((tag) => (
        <EntryTagPill key={tag} label={tag} />
      ))}
    </div>
  )
}

function EntryTagPill({ label }) {
  return (
    <span className="text-[10px] font-mono text-slate-500 bg-stone-100 px-1.5 py-0.5 rounded">
      #{label}
    </span>
  )
}

function EntryMetadataFooter({ entry }) {
  return (
    <div className="mt-auto flex items-center justify-between text-xs text-slate-500 font-mono">
      <span>{entry.conceptsCount} concepts</span>
      <span>{entry.date}</span>
    </div>
  )
}

function EmptyFilterState({ hasActiveFilters, onClearFilters }) {
  return (
    <div className="text-center py-20 space-y-4">
      <p className="text-base text-slate-500">
        {hasActiveFilters
          ? 'No entries match your filters.'
          : 'Your library is empty. Watch a tech talk to start.'}
      </p>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Clear filters →
        </button>
      )}
    </div>
  )
}

function SearchIcon() {
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
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
