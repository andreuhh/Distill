import { forwardRef, useEffect, useRef } from 'react'

/**
 * YouTube player based on the IFrame API.
 * Exposes a ref with .seekTo(seconds) to jump to a section's timestamp.
 */
const VideoPlayer = forwardRef(function VideoPlayer({ videoId }, ref) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)

  // Load IFrame API script only once
  useEffect(() => {
    if (window.YT && window.YT.Player) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
  }, [])

  // Create the player when videoId changes
  useEffect(() => {
    if (!videoId) return

    let cancelled = false
    const create = () => {
      if (cancelled || !containerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
      })
    }

    if (window.YT && window.YT.Player) {
      create()
    } else {
      // Wait for the global API callback
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev && prev()
        create()
      }
    }

    return () => {
      cancelled = true
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy()
      }
    }
  }, [videoId])

  // Expose a minimal imperative API to the parent
  if (ref) {
    ref.current = {
      seekTo: (seconds) => {
        if (playerRef.current && playerRef.current.seekTo) {
          playerRef.current.seekTo(seconds, true)
          playerRef.current.playVideo && playerRef.current.playVideo()
        }
      },
    }
  }

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
})

export default VideoPlayer
