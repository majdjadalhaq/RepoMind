import React, { useState } from 'react';
import { Button } from './ui/Button';

interface RepoModalProps {
  onConnect: (url: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const RepoModal: React.FC<RepoModalProps> = ({ onConnect, onClose, isLoading, error }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    await onConnect(url.trim());
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-primary/80 backdrop-blur-xl">
      <div className="w-full max-w-xl glass-panel p-10 rounded-3xl shadow-2xl border border-glass-border">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-cyan-primary/10 flex items-center justify-center border border-cyan-primary/20">
            <svg className="w-6 h-6 text-cyan-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Index Repository</h2>
            <p className="text-sm text-text-muted">Connect a GitHub project to start analyzing code.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-primary/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <input 
              autoFocus
              type="text"
              placeholder="https://github.com/username/repo"
              className="relative w-full bg-secondary border border-glass-border rounded-xl p-5 text-primary outline-none focus:border-cyan-primary/50 transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button variant="ghost" className="flex-1" onClick={onClose} type="button">Cancel</Button>
            <Button className="flex-1" isLoading={isLoading} type="submit">Index Project</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
