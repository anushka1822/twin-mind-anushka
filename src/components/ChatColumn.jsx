import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, MessageCircle } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import ReactMarkdown from 'react-markdown';

const ChatColumn = () => {
  const { groqApiKey, transcript, chatHistory, addChatMessage, chatInput, setChatInput } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const askGroq = async (userMessage) => {
    if (!groqApiKey || !userMessage.trim()) return;

    setIsLoading(true);
    try {
      // Append user message to history
      addChatMessage({
        id: Date.now(),
        role: 'user',
        text: userMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Prepare context from transcript
      const contextText = transcript.map(t => t.text).join('\n');

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
              content: `You are TwinMind, a real-time, in-ear AI meeting copilot. The user is in a live meeting. Provide a fast, highly analytical answer based on the transcript.

STRICT FORMATTING RULES:

MAXIMUM LENGTH: 3 short paragraphs.

You may use a maximum of one short bulleted list.

ABSOLUTELY NO MARKDOWN TABLES.

ABSOLUTELY NO HEADERS (#, ##, ###).

Tone: Conversational, fast, and brilliant. Like a quick text message from a senior engineer.

If you generate a table or a header, the system will crash. Stick to plain text and simple bullets.

Transcript Context:
${contextText}`
            },
            ...chatHistory.map(msg => ({
              role: msg.role,
              content: msg.text
            })),
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('Chat API failed');

      const data = await response.json();
      const botResponse = data.choices[0].message.content;

      // Append bot response
      addChatMessage({
        id: Date.now() + 1,
        role: 'assistant',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.error('Chat Error:', err);
      addChatMessage({
        id: Date.now() + 1,
        role: 'assistant',
        text: "Sorry, I encountered an error while processing your request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (chatInput.trim() && !isLoading) {
      const msg = chatInput;
      setChatInput('');
      askGroq(msg);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  const textareaRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [chatInput]);

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50 backdrop-blur-sm">
        <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-sans">
          <MessageCircle size={14} className="text-primary" />
          Insight Chat
        </h2>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth bg-surface/30 px-6"
      >
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center mb-4 border border-outline-variant">
              <MessageCircle size={24} className="text-outline" />
            </div>
            <p className="text-on-surface-variant text-sm font-medium">No messages yet.</p>
            <p className="text-outline text-xs mt-1 max-w-[200px]">
              Ask questions about the meeting transcript or expand on AI suggestions.
            </p>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex items-center gap-2 mb-1.5 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${msg.role === 'user' ? 'bg-primary' : 'bg-surface-container-high'}`}>
                {msg.role === 'user' ? <User size={12} className="text-on-primary" /> : <Bot size={12} className="text-primary" />}
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-sans">{msg.role}</span>
              <span className="text-[9px] text-outline">{msg.timestamp}</span>
            </div>
            <div className={`max-w-[95%] p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm font-sans ${
              msg.role === 'user' 
                ? 'bg-primary text-on-primary rounded-tr-none whitespace-pre-wrap' 
                : 'bg-white text-on-surface rounded-tl-none border border-outline-variant markdown-container'
            }`}>
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div className="w-5 h-5 rounded-md bg-surface-container-high flex items-center justify-center">
                <Bot size={12} className="text-primary" />
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-sans">TwinMind</span>
              <Loader2 size={10} className="animate-spin text-primary" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-outline-variant shadow-sm px-5">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                <span className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-outline-variant">
        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea 
              ref={textareaRef}
              placeholder="Ask TwinMind anything... (Shift+Enter for new line)"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !groqApiKey}
              rows={1}
              className="w-full bg-surface-container border border-outline-variant rounded-2xl pl-5 pr-12 py-3 text-[14px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-outline disabled:opacity-50 resize-none max-h-[120px] overflow-y-auto scrollbar-chat"
            />
            <button 
              type="submit"
              disabled={!chatInput.trim() || isLoading || !groqApiKey}
              className="absolute right-2 bottom-2 bg-primary p-2 rounded-xl text-on-primary hover:bg-primary-container transition-all active:scale-95 disabled:bg-surface-container-high disabled:text-outline shadow-sm h-9 w-9 flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatColumn;
