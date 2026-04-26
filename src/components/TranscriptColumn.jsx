import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, MessageSquare, Loader2, Clock } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const TranscriptColumn = () => {
  const { 
    groqApiKey, 
    isRecording, 
    setIsRecording, 
    transcript, 
    addTranscriptChunk 
  } = useAppStore();

  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chunkIntervalRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const transcribeAudio = async (audioBlob) => {
    if (!groqApiKey || audioBlob.size < 1000) return; // Ignore tiny/empty blobs

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      if (data.text && data.text.trim()) {
        addTranscriptChunk({
          id: Date.now(),
          text: data.text.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      console.error('Transcription Error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 1024) { 
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        transcribeAudio(audioBlob);
        audioChunksRef.current = []; // Reset for next chunk
      };

      // Start recording
      recorder.start();
      setIsRecording(true);

      // Set up 30-second chunking
      chunkIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
        }
      }, 30000);

    } catch (err) {
      console.error('Mic Access Denied:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setIsRecording(false);
  };
  // New ref for auto-scroll fix
  const bottomRef = useRef(null);

  // Auto-scroll to bottom whenever transcript updates
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [transcript, isTranscribing]);

  const combinedText = transcript.map(t => t.text).join(' ');

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm font-sans">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50 backdrop-blur-sm">
        <div className="flex flex-col">
          <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-sans">
            <Mic size={14} className={isRecording ? "text-secondary animate-pulse" : "text-outline"} />
            Transcript
          </h2>
          {isRecording && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">Listening...</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            isRecording 
              ? "bg-secondary text-on-secondary hover:bg-secondary-container shadow-md" 
              : "bg-surface text-on-surface border border-outline-variant hover:bg-surface-container-low"
          }`}
        >
          {isRecording ? (
            <><MicOff size={14} /> Stop Recording</>
          ) : (
            <><Mic size={14} /> Start Recording</>
          ) }
        </button>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-8 scroll-smooth"
      >
        {transcript.length === 0 && !isRecording && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center mb-6 border border-outline-variant shadow-inner">
              <Mic size={32} className="text-outline" />
            </div>
            <h3 className="text-on-surface font-bold text-sm mb-1">Begin Transcription</h3>
            <p className="text-outline text-xs leading-relaxed max-w-[200px]">Click the recording button to start capturing the meeting dialogue.</p>
          </div>
        )}

        <div className="relative">
          <div className="text-[16px] leading-[1.8] text-on-surface text-justify font-sans selection:bg-secondary/10">
            {combinedText}
            {isTranscribing && (
              <span className="inline-flex ml-2 items-center gap-1.5 text-primary opacity-60 italic text-sm">
                <Loader2 size={12} className="animate-spin" />
                Processing conversation...
              </span>
            )}
          </div>
          
          {/* Scroll Target */}
          <div ref={bottomRef} className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
};

export default TranscriptColumn;
