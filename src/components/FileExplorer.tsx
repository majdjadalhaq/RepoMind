import React, { useState } from 'react';
import { FileNode } from '../core/types/repo';

interface FileExplorerProps {
  tree: FileNode[];
  selectedPaths: Set<string>;
  onToggle: (path: string) => void;
  level?: number;
}

const FileIcon = ({ type, isOpen }: { type: 'file' | 'dir'; isOpen?: boolean }) => {
  if (type === 'dir') {
    return (
      <svg className={`w-4 h-4 ${isOpen ? 'text-cyan-primary' : 'text-text-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ tree, selectedPaths, onToggle, level = 0 }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      {tree.map((node) => {
        const isExpanded = expanded.has(node.path);
        const isSelected = selectedPaths.has(node.path);
        const isDir = node.type === 'dir';

        return (
          <div key={node.path} className="flex flex-col">
            <div 
              className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group ${
                isSelected ? 'bg-cyan-primary/10 text-cyan-primary' : 'hover:bg-white/5 text-text-secondary'
              }`}
              style={{ paddingLeft: `${(level * 12) + 8}px` }}
              onClick={() => isDir ? toggleExpand(node.path) : onToggle(node.path)}
            >
              <FileIcon type={node.type} isOpen={isExpanded} />
              <span className="text-xs font-medium truncate flex-1">{node.name}</span>
              
              {!isDir && (
                <div 
                  className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                    isSelected ? 'bg-cyan-primary border-cyan-primary' : 'border-glass-border group-hover:border-text-muted'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(node.path);
                  }}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-obsidian" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            {isDir && isExpanded && node.children && (
              <FileExplorer 
                tree={node.children} 
                selectedPaths={selectedPaths} 
                onToggle={onToggle} 
                level={level + 1} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
