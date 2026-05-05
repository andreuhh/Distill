import { create } from 'zustand'

export const AgentState = {
  WATCHING: 'watching',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
}

export const LayoutState = {
  OBSERVER: 'observer',
  SPEAKER: 'speaker',
  CONVERSATION: 'conversation',
}

export const useSessionStore = create((set) => ({
  // Session identity
  sessionId: null,
  videoId: null,

  // AG-UI events dispatched so far (append-only)
  events: [],

  // Agent and layout state
  agentState: AgentState.WATCHING,
  layoutState: LayoutState.OBSERVER,

  // Active quiz (null when no quiz is running)
  activeQuiz: null,

  // Actions
  setSession: (sessionId, videoId) => set({ sessionId, videoId }),

  appendEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),

  setAgentState: (agentState) => set({ agentState }),

  setLayoutState: (layoutState) => set({ layoutState }),

  setActiveQuiz: (quiz) =>
    set({ activeQuiz: quiz, layoutState: quiz ? LayoutState.SPEAKER : LayoutState.OBSERVER }),

  resetSession: () =>
    set({
      sessionId: null,
      videoId: null,
      events: [],
      agentState: AgentState.WATCHING,
      layoutState: LayoutState.OBSERVER,
      activeQuiz: null,
    }),
}))
