import { create } from 'zustand'

export const useLibraryStore = create((set, get) => ({
  // Library entries fetched from the API
  entries: [],

  // Filter state
  searchQuery: '',
  selectedTag: null,

  // Actions
  setEntries: (entries) => set({ entries }),

  appendEntry: (entry) =>
    set((state) => ({ entries: [entry, ...state.entries] })),

  updateEntry: (id, patch) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  removeEntry: (id) =>
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setSelectedTag: (selectedTag) => set({ selectedTag }),

  clearFilters: () => set({ searchQuery: '', selectedTag: null }),

  // Derived: entries filtered by current search + tag (call inside component with useLibraryStore)
  getFilteredEntries: () => {
    const { entries, searchQuery, selectedTag } = get()
    return entries.filter((entry) => {
      const matchesSearch =
        !searchQuery.trim() ||
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.speaker?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTag =
        !selectedTag || entry.tags?.includes(selectedTag)
      return matchesSearch && matchesTag
    })
  },
}))
