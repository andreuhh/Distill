import { useRef, useState } from 'react'
import { processVideo } from './services/api.js'
import SectionsList from './components/SectionsList.jsx'
import TOC from './components/TOC.jsx'
import VideoForm from './components/VideoForm.jsx'
import VideoPlayer from './components/VideoPlayer.jsx'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeIndex, setActiveIndex] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const playerRef = useRef(null)

  const handleSubmit = async (url) => {
    setLoading(true)
    setError(null)
    setActiveIndex(null)
    setSearchQuery('')
    try {
      const data = await processVideo(url)
      setResult(data)
    } catch (e) {
      setError(e.message || 'Error')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleJump = (section) => {
    setActiveIndex(section.index)
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(section.start_seconds)
    }
    // Scroll article into view
    const el = document.getElementById(`section-${section.index}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filteredSections = result
    ? searchQuery.trim()
      ? result.sections.filter((s) => {
          const q = searchQuery.toLowerCase()
          return s.title.toLowerCase().includes(q) || s.transcript.toLowerCase().includes(q)
        })
      : result.sections
    : []

  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Distill</h1>
          <p className="text-sm text-slate-500">
            Transform a video into a structured transcript with titles and timestamps
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <VideoForm onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-slate-500">
            Extracting the transcript and generating sections. This may take 10–60 seconds…
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex items-center gap-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in sections…"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <span className="text-xs text-slate-500 shrink-0">
                  {filteredSections.length} / {result.sections.length} sections
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left column: TOC */}
              <aside className="md:col-span-1">
                <TOC
                  sections={filteredSections}
                  onJump={handleJump}
                  activeIndex={activeIndex}
                />
              </aside>

              {/* Right column: player + sections */}
              <section className="md:col-span-2 space-y-4">
                <VideoPlayer ref={playerRef} videoId={result.video.video_id} />
                <div className="text-xs text-slate-500">
                  Transcript source: <code>{result.video.transcript_source}</code>
                  {' — '}language: <code>{result.video.language}</code>
                  {' — '}duration: {Math.round(result.video.total_duration_seconds)}s
                  {' — '}{result.sections.length} sections
                </div>
                <SectionsList
                  sections={filteredSections}
                  onJump={handleJump}
                  activeIndex={activeIndex}
                  searchQuery={searchQuery}
                />
                {filteredSections.length === 0 && searchQuery && (
                  <p className="text-slate-400 text-sm text-center py-6">
                    No sections match &ldquo;{searchQuery}&rdquo;
                  </p>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
