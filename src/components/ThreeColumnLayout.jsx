import React from 'react';
import { Settings, Download, BrainCircuit, Sparkles } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import TranscriptColumn from './TranscriptColumn';
import SuggestionsColumn from './SuggestionsColumn';
import ChatColumn from './ChatColumn';

const ThreeColumnLayout = () => {
  const { 
    setSettingsOpen, 
    transcript, 
    suggestionsBatches, 
    chatHistory, 
    addChatMessage,
    groqApiKey 
  } = useAppStore();

  const handleExport = () => {
    const sessionData = {
      sessionName: "TwinMind Meeting Session",
      exportTime: new Date().toISOString(),
      transcript,
      suggestions: suggestionsBatches,
      chatHistory
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `twinmind-session-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSuggestionClick = (suggestion) => {
    // Populate the chat input with the detailed editable text
    // as per the new requirement: populate, do not auto-send.
    const textToEdit = suggestion.editable_chat_text || suggestion.preview || "";
    useAppStore.getState().setChatInput(textToEdit);
  };

  return (
    <div className="h-screen w-screen bg-surface text-on-surface overflow-hidden flex flex-col font-sans selection:bg-primary/10">
      {/* Header */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-outline-variant bg-surface-container-lowest z-20 sticky top-0">
        <div className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-300">
            <BrainCircuit size={22} className="text-on-primary" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-primary font-heading leading-tight">
              TwinMind
            </h1>
            <div className="flex items-center gap-1.5 opacity-70">
              <Sparkles size={10} className="text-secondary" />
              <span className="text-label-sm font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Live Suggestions Copilot</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-8 w-px bg-outline-variant mx-2 hidden sm:block"></div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2.5 px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg text-label-sm font-semibold hover:bg-surface-container-low transition-all active:scale-95 shadow-sm"
          >
            <Download size={15} />
            Export Session
          </button>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 bg-surface text-on-surface border border-outline-variant rounded-lg hover:bg-surface-container-low transition-all active:scale-95 group relative shadow-sm"
            title="Settings"
          >
            <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 overflow-hidden p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1440px] mx-auto w-full">
        <div className="h-full overflow-hidden flex flex-col min-w-0">
          <TranscriptColumn />
        </div>
        <div className="h-full overflow-hidden flex flex-col min-w-0">
          <SuggestionsColumn onSuggestionClick={handleSuggestionClick} />
        </div>
        <div className="h-full overflow-hidden flex flex-col min-w-0">
          <ChatColumn />
        </div>
      </main>
      
      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-outline-variant bg-surface-container-low px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.3)]"></div>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">System Ready</span>
          </div>
          <span className="text-label-sm text-outline">|</span>
          <span className="text-label-sm font-medium text-on-surface-variant">Cognitive Premium v1.0</span>
        </div>
        <div className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">
          © 2026 TwinMind AI
        </div>
      </footer>
    </div>
  );
};

export default ThreeColumnLayout;
