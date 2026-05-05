// REST client — esteso progressivamente con i nuovi endpoint (Step 1-8)

export async function processVideo(url) {
  const res = await fetch('/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    let detail
    try {
      const data = await res.json()
      detail = data.detail || res.statusText
    } catch {
      detail = res.statusText
    }
    throw new Error(detail)
  }
  return res.json()
}

// Step 3 — Sessions
export async function createSession(url) {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error((await res.json()).detail ?? res.statusText)
  return res.json()
}

export async function getTimeline(sessionId) {
  const res = await fetch(`/api/sessions/${sessionId}/timeline`)
  if (!res.ok) throw new Error((await res.json()).detail ?? res.statusText)
  return res.json()
}

export async function completeSession(sessionId) {
  const res = await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' })
  if (!res.ok) throw new Error((await res.json()).detail ?? res.statusText)
  return res.json()
}

// Step 6 — Library
export async function getLibrary() {
  const res = await fetch('/api/library')
  if (!res.ok) throw new Error((await res.json()).detail ?? res.statusText)
  return res.json()
}

export async function updateLibraryEntry(id, patch) {
  const res = await fetch(`/api/library/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error((await res.json()).detail ?? res.statusText)
  return res.json()
}

export async function deleteLibraryEntry(id) {
  const res = await fetch(`/api/library/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error((await res.json()).detail ?? res.statusText)
}
