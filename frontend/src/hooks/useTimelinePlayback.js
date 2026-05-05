import { useEffect, useRef } from 'react'
import { useSessionStore, AgentState } from '../store/sessionStore.js'

// Listens to the YouTube player's currentTime and dispatches pre-computed
// AG-UI events into sessionStore when currentTime >= event.ts.
//
// Usage:
//   const playerRef = useRef(null)  // ref to VideoPlayer component
//   useTimelinePlayback(timeline, playerRef)
//
// timeline: AG-UI event array from GET /api/sessions/:id/timeline, sorted by ts asc

export function useTimelinePlayback(timeline, playerRef) {
  const appendEvent = useSessionStore((s) => s.appendEvent)
  const setAgentState = useSessionStore((s) => s.setAgentState)
  const setActiveQuiz = useSessionStore((s) => s.setActiveQuiz)

  const cursorRef = useRef(0)

  useEffect(() => {
    cursorRef.current = 0
  }, [timeline])

  useEffect(() => {
    if (!timeline?.length || !playerRef?.current) return

    const interval = setInterval(() => {
      const player = playerRef.current
      if (!player?.getCurrentTime) return

      const currentTime = player.getCurrentTime()
      const cursor = cursorRef.current

      if (cursor >= timeline.length) {
        clearInterval(interval)
        return
      }

      const next = timeline[cursor]
      if (currentTime < next.ts) return

      // Dispatch the event
      appendEvent(next)
      cursorRef.current = cursor + 1

      // Side-effects per event type
      if (next.type === 'co_watch.quiz_request') {
        setActiveQuiz(next.data)
      } else {
        setAgentState(AgentState.SPEAKING)
        // Return to WATCHING after 900ms (matches wireframe distill-event-arrive)
        setTimeout(() => setAgentState(AgentState.WATCHING), 900)
      }
    }, 250)

    return () => clearInterval(interval)
  }, [timeline, playerRef, appendEvent, setAgentState, setActiveQuiz])
}
