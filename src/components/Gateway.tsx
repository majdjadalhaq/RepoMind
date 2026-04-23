import React, { useState } from 'react';
import { useApiKeys } from '../presentation/hooks/use-api-keys';
import { Button } from './ui/Button';
import { LLMProvider } from '../core/types/ai';

interface GatewayProps {
  onComplete?: () => void;
}

export const Gateway: React.FC<GatewayProps> = ({ onComplete }) => {
  const { keys, updateKey } = useApiKeys();
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [inputValue, setInputValue] = useState('');

  const providers: { id: LLMProvider; name: string; icon: string }[] = [
    { id: 'openai', name: 'OpenAI', icon: '⚡' },
    { id: 'anthropic', name: 'Anthropic', icon: '🧠' },
    { id: 'google', name: 'Google Gemini', icon: '💎' },
    { id: 'deepseek', name: 'DeepSeek', icon: '🔍' },
    { id: 'openrouter', name: 'OpenRouter', icon: '🌐' },
  ];

  const handleSave = async () => {
    if (editingProvider) {
      await updateKey(editingProvider, inputValue);
      setEditingProvider(null);
      setInputValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary/80 backdrop-blur-xl">
      <div className="w-full max-w-2xl glass-panel p-12 rounded-3xl flex flex-col items-center relative">
        <div className="flex items-center justify-center gap-6 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-cyan-primary/10 flex items-center justify-center border border-cyan-primary/20">
             <img src="/favicon.png" alt="Logo" className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-primary">Initialize <span className="text-cyan-primary">epo</span>Mind</h1>
        </div>
        
        {onComplete && (
          <button 
            onClick={onComplete}
            className="absolute top-8 right-8 p-3 rounded-full hover:bg-secondary text-text-muted transition-colors"
            aria-label="Close Settings"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <p className="text-text-muted mb-12 text-center max-w-md">
          Enter your API keys to unlock the intelligence hub. Your keys are encrypted locally and never leave your browser.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {providers.map((p) => (
            <div 
              key={p.id}
              className={`p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                keys[p.id] 
                  ? 'bg-cyan-primary/5 border-cyan-primary/20 shadow-sm' 
                  : 'bg-glass-bg border-glass-border hover:border-text-muted'
              }`}
            >
              <div className="text-2xl">{p.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-primary">{p.name}</div>
                <div className="text-xs text-text-muted">
                  {keys[p.id] ? 'Connected' : 'Not Configured'}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setEditingProvider(p.id);
                  setInputValue(keys[p.id] || '');
                }}
              >
                {keys[p.id] ? 'Edit' : 'Setup'}
              </Button>
            </div>
          ))}
        </div>

        {editingProvider && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-2xl transition-all duration-300">
            <div className="w-full max-w-md bg-secondary border border-glass-border p-10 rounded-3xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] transform scale-100 animate-in fade-in zoom-in duration-200">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-primary mb-2">Setup {editingProvider}</h3>
                <p className="text-xs text-text-muted">Enter your secure API credentials to begin.</p>
              </div>
              <input 
                autoFocus
                type="password"
                placeholder="Paste API Key here..."
                className="w-full bg-primary border border-glass-border rounded-2xl p-5 text-primary focus:ring-2 focus:ring-cyan-primary outline-none mb-8 text-sm placeholder:opacity-30"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1 h-12" onClick={() => setEditingProvider(null)}>Cancel</Button>
                <Button className="flex-1 h-12" onClick={handleSave}>Save Identity</Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col items-center gap-6">
          <Button 
            variant="ghost" 
            className="text-cyan-primary border-cyan-primary/20 hover:bg-cyan-primary/10"
            onClick={() => updateKey('openai', 'mock-key')}
          >
            🚀 Try with Mock Intelligence
          </Button>

          <div className="flex items-center gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-cyan-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Non-extractable Storage
            </div>
            <div className="w-1 h-1 bg-glass-border rounded-full" />
            <div>AES-256-GCM Encryption</div>
          </div>
        </div>
      </div>
    </div>
  );
};
