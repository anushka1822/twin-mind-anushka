import { create } from 'zustand';

const useAppStore = create((set) => ({
  // API Key
  groqApiKey: localStorage.getItem('groq_api_key') || '',
  setGroqApiKey: (key) => {
    localStorage.setItem('groq_api_key', key);
    set({ groqApiKey: key });
  },

  // UI State
  isSettingsOpen: !localStorage.getItem('groq_api_key'),
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),

  // Recording State
  isRecording: false,
  setIsRecording: (isRecording) => set({ isRecording }),

  // Data
  transcript: [], // Array of { id, text, timestamp }
  addTranscriptChunk: (chunk) => set((state) => ({
    transcript: [...state.transcript, chunk]
  })),

  suggestionsBatches: [], // Array of { id, timestamp, suggestions: [] }
  addSuggestionsBatch: (batch) => set((state) => ({
    suggestionsBatches: [batch, ...state.suggestionsBatches] // Keep newest at top
  })),

  chatHistory: [], // Array of { id, role, text, timestamp }
  addChatMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, message]
  })),

  chatInput: '',
  setChatInput: (text) => set({ chatInput: text }),
}));

export default useAppStore;
