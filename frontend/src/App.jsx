import { useRef, useState } from 'react'
import { processVideo } from './api.js'
import SectionsList from './components/SectionsList.jsx'
import TOC from './components/TOC.jsx'
import VideoForm from './components/VideoForm.jsx'
import VideoPlayer from './components/VideoPlayer.jsx'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeIndex, setActiveIndex] = useState(null)

  const playerRef = useRef(null)

  const handleSubmit = async (url) => {
    setLoading(true)
    setError(null)
    setActiveIndex(null)
    try {
      const data = await processVideo(url)
      setResult(data)
    } catch (e) {
      setError(e.message || 'Errore')
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
    // Scroll-into-view dell'articolo
    const el = document.getElementById(`sezione-${section.index}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Distill</h1>
          <p className="text-sm text-slate-500">
            Trasforma un video in trascrizione strutturata con titoli e timestamp
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
            Sto estraendo la trascrizione e generando le sezioni. Puo' richiedere 10-60 secondi…
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonna sinistra: TOC */}
            <aside className="md:col-span-1">
              <TOC
                sections={result.sections}
                onJump={handleJump}
                activeIndex={activeIndex}
              />
            </aside>

            {/* Colonna destra: player + sezioni */}
            <section className="md:col-span-2 space-y-4">
              <VideoPlayer ref={playerRef} videoId={result.video.video_id} />
              <div className="text-xs text-slate-500">
                Sorgente trascrizione: <code>{result.video.transcript_source}</code>
                {' — '}lingua: <code>{result.video.language}</code>
                {' — '}durata: {Math.round(result.video.total_duration_seconds)}s
                {' — '}{result.sections.length} sezioni
              </div>
              <SectionsList
                sections={result.sections}
                onJump={handleJump}
                activeIndex={activeIndex}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
