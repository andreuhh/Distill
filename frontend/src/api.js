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
