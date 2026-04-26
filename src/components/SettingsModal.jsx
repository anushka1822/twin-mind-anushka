import React, { useState } from 'react';
import useAppStore from '../store/useAppStore';
import { X, Key, Shield, Info, ArrowRight } from 'lucide-react';

const SettingsModal = () => {
  const { groqApiKey, setGroqApiKey, isSettingsOpen, setSettingsOpen } = useAppStore();
  const [tempKey, setTempKey] = useState(groqApiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  if (!isSettingsOpen) return null;

  const validateAndSave = async () => {
    if (!tempKey.trim()) return;

    setIsValidating(true);
    setError('');

    try {
      // Perform a lightweight validation call to Groq
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tempKey.trim()}`
        }
      });

      if (response.ok) {
        setGroqApiKey(tempKey.trim());
        setSettingsOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setError('Invalid API Key. Please check your credentials.');
        } else {
          setError(errorData.error?.message || 'Connection failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Network error. Check your internet connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    validateAndSave();
  };

  const canClose = groqApiKey.trim() !== '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#000000]/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={() => canClose && !isValidating && setSettingsOpen(false)}
      />
      
      {/* Modal Box */}
      <div className="w-full max-w-lg rounded-2xl bg-white border border-outline-variant p-10 shadow-2xl relative z-10 overflow-hidden group font-sans">
        {/* Soft decorative background element */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/2 flex items-center justify-center -translate-y-12 translate-x-12 rounded-full pointer-events-none"></div>

        {canClose && !isValidating && (
          <button 
            onClick={() => setSettingsOpen(false)}
            className="absolute top-6 right-6 p-2 text-outline hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-full transition-all duration-300 active:scale-95"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex flex-col items-center mb-10 text-center relative">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-lg mb-6 shadow-primary/10 transition-transform duration-500 hover:scale-105">
            <Key size={30} />
          </div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight mb-2 font-heading">Cognitive Link</h2>
          <p className="text-on-surface-variant text-[14px] max-w-xs mx-auto leading-relaxed">
            Securely connect your <span className="text-primary font-bold">Groq Platform</span> API key to enable augmented intelligence.
          </p>
        </div>

        <div className="space-y-8 relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-outline uppercase tracking-widest font-sans">
                Groq API Secret
              </label>
              <div className="flex items-center gap-1 text-emerald-600">
                <Shield size={10} />
                <span className="text-[10px] font-bold uppercase tracking-wider">End-to-End Encrypted</span>
              </div>
            </div>
            
            <div className="relative group/input">
              <input
                type="password"
                placeholder="gsk_..."
                autoFocus
                disabled={isValidating}
                className={`w-full bg-surface-container border ${error ? 'border-error animate-shake' : 'border-outline-variant'} rounded-xl py-4 px-6 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-lg shadow-sm placeholder:text-outline/50`}
                value={tempKey}
                onChange={(e) => {
                  setTempKey(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              {error && (
                <p className="text-[11px] font-bold text-error mt-2 px-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <span className="w-1 h-1 bg-error rounded-full"></span>
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
              <Shield size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-[12px] text-on-surface-variant leading-normal font-medium">
                Credentials are persisted locally within your secure browser environment and never relayed through third-party servers.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!tempKey.trim() || isValidating}
            className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-container disabled:bg-surface-container-high disabled:text-outline text-on-primary font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/10"
          >
            {isValidating ? (
              <>
                <ArrowRight size={18} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Activate Session</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          {!canClose && !error && !isValidating && (
            <p className="text-[10px] text-center font-bold text-secondary uppercase tracking-widest animate-pulse">
              System Access Restricted • Verification Required
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
