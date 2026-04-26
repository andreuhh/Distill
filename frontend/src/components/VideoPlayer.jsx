import { forwardRef, useEffect, useRef } from 'react'

/**
 * Player YouTube basato su IFrame API.
 * Espone un ref con .seekTo(seconds) per saltare al timestamp della sezione.
 */
const VideoPlayer = forwardRef(function VideoPlayer({ videoId }, ref) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)

  // Carica script IFrame API una volta sola
  useEffect(() => {
    if (window.YT && window.YT.Player) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
  }, [])

  // Crea il player quando videoId cambia
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
      // Aspetta il callback globale dell'API
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

  // Espone al parent una API imperativa minimal
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
