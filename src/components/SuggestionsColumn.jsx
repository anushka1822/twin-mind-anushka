import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Lightbulb, MessageSquare, ListTodo, ShieldCheck, Loader2, Info } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const SuggestionsColumn = ({ onSuggestionClick }) => {
  const { 
    groqApiKey, 
    transcript, 
    isRecording, 
    suggestionsBatches, 
    addSuggestionsBatch 
  } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSuggestions = useCallback(async () => {
    if (!groqApiKey) return;
    
    // Only generate if we have some transcript text to work with 
    // and we're not already loading
    if (transcript.length === 0 || isLoading) return;

    console.log('Triggering suggestions... Context size:', transcript.length);
    setIsLoading(true);
    setError(null);

    try {
      // Get the last 15 transcript chunks for even better context
      const contextText = transcript.slice(-15).map(t => t.text).join(' ');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "You are TwinMind, an elite AI meeting copilot. Analyze the recent meeting transcript. Generate EXACTLY 3 highly strategic, context-aware suggestions. You must dynamically mix the types based on the flow of conversation (e.g., if someone asks a question, provide an 'answer' type. If a vague statement is made, provide a 'clarification' or 'fact_check'). Do not state the obvious. Output strictly as a JSON array of objects with this exact schema: [{ \"type\": \"question\" | \"talking_point\" | \"fact_check\" | \"answer\" | \"clarification\", \"ui_preview\": \"A punchy 5-8 word summary for the UI card\", \"editable_chat_text\": \"A detailed, multi-sentence query or detailed explanation that will populate the user's chat box for them to edit.\" }]"
            },
            {
              role: "user",
              content: `Meeting context: ${contextText}`
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;
      
      const cleanContent = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const suggestions = JSON.parse(cleanContent);
      const suggestionsArray = Array.isArray(suggestions) ? suggestions : (suggestions.suggestions || []);

      if (suggestionsArray.length > 0) {
        addSuggestionsBatch({
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          suggestions: suggestionsArray.slice(0, 3)
        });
      }
    } catch (err) {
      console.error("Suggestion Error:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [groqApiKey, transcript, addSuggestionsBatch, isLoading]);

  // Trigger suggestions whenever a new transcript chunk is added
  useEffect(() => {
    if (isRecording && transcript.length > 0) {
      const timer = setTimeout(() => {
        generateSuggestions();
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [transcript.length, isRecording]);

  const getIcon = (type) => {
    switch (type) {
      case 'question': return <MessageSquare size={16} className="text-blue-500" />;
      case 'talking_point': return <ListTodo size={16} className="text-purple-500" />;
      case 'fact_check': return <ShieldCheck size={16} className="text-emerald-500" />;
      case 'answer': return <Sparkles size={16} className="text-amber-500" />;
      case 'clarification': return <Info size={16} className="text-slate-500" />;
      default: return <Lightbulb size={16} className="text-primary" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50 backdrop-blur-sm">
        <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-sans">
          <Lightbulb size={14} className="text-secondary" />
          Live Suggestions
        </h2>
        <button 
          onClick={generateSuggestions}
          disabled={isLoading || !groqApiKey || transcript.length === 0}
          className="text-outline hover:text-primary disabled:text-outline-variant transition-colors bg-surface-container rounded-lg p-1.5"
          title="Force refresh suggestions"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        {error && (
          <div className="p-4 bg-error-container border border-error/20 rounded-xl text-on-error-container text-xs text-center">
            <div className="font-bold mb-1 uppercase tracking-tight">System Notification</div>
            {error}
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-xl border border-outline-variant bg-white animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-surface-container-low rounded-lg shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-2 w-16 bg-surface-container-high rounded"></div>
                    <div className="h-4 w-full bg-surface-container rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {suggestionsBatches.length === 0 && !isLoading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center mb-6 border border-outline-variant">
              <Sparkles size={32} className="text-outline" />
            </div>
            <h3 className="text-on-surface font-bold mb-1 text-sm">Waiting for Context</h3>
            <p className="text-on-surface-variant text-xs leading-relaxed max-w-[200px]">
              {isRecording ? "Listening for key moments to generate suggestions..." : "Recording required for AI assistance."}
            </p>
          </div>
        )}

        {suggestionsBatches.map((batch, index) => (
          <div 
            key={batch.id} 
            className="space-y-5 transition-all duration-700"
            style={{ opacity: index === 0 ? 1 : Math.max(0.4, 1 - index * 0.2) }}
          >
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-outline-variant/50"></span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-outline-variant shadow-sm">
                <Clock size={10} className="text-outline" />
                <span className="text-[10px] font-bold text-on-surface-variant tracking-wider">{batch.timestamp}</span>
              </div>
              <span className="h-px flex-1 bg-outline-variant/50"></span>
            </div>
            
            <div className="space-y-4">
              {batch.suggestions.map((suggestion, sIdx) => (
                <div 
                  key={`${batch.id}-${sIdx}`}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className={`p-5 rounded-xl border border-outline-variant bg-white hover:border-primary-container cursor-pointer transition-all active:scale-[0.98] group shadow-sm hover:shadow-md ai-highlight`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 shrink-0 p-2 bg-surface-container-low rounded-lg group-hover:bg-primary-container/10 transition-colors">
                      {getIcon(suggestion.type)}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-1.5 group-hover:text-primary transition-colors font-sans">
                        {suggestion.type.replace('_', ' ')}
                      </h4>
                      <p className="text-[15px] text-on-surface leading-normal font-semibold font-sans">
                        {suggestion.ui_preview || suggestion.preview}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Internal icon dependency fix
const Clock = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const Sparkles = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);

export default SuggestionsColumn;
