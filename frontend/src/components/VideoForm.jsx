import { useState } from 'react'

export default function VideoForm({ onSubmit, loading }) {
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=_o4KusDr-Kg')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim() || loading) return
    onSubmit(url.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Incolla l'URL di un video YouTube"
        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={loading}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Analisi in corso...' : 'Analizza'}
      </button>
    </form>
  )
}
