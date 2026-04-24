import { CheckCircle, ChevronDown, ChevronRight, FileCode, Folder, FolderOpen } from 'lucide-react';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

import { FileContext, FileNode } from '../core/types';

interface FileExplorerProps {
  nodes: FileNode[];
  activeFiles: FileContext[];
  onFileClick: (path: string) => void;
  loadingFilePaths?: string[];
}

const TreeNode: React.FC<{
  node: FileNode;
  depth: number;
  activeFiles: FileContext[];
  onFileClick: (path: string) => void;
  loadingFilePaths?: string[];
  isOpen: boolean;
  onToggle: (path: string) => void;
  isFocused: boolean;
}> = ({ node, depth, activeFiles, onFileClick, loadingFilePaths, isOpen, onToggle, isFocused }) => {
  const isActive = activeFiles.some(f => f.name === node.path);
  const isLoading = loadingFilePaths?.includes(node.path);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isFocused]);

  const handleAction = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (node.type === 'tree') {
      onToggle(node.path);
    } else {
      onFileClick(node.path);
    }
  };

  const getIcon = () => {
    if (node.type === 'tree') {
      return isOpen ?
        <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" /> :
        <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
    return <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-teal-400' : 'text-gray-400'}`} />;
  };

  return (
    <div>
      <div
        ref={itemRef}
        role="treeitem"
        aria-expanded={node.type === 'tree' ? isOpen : undefined}
        aria-selected={isActive}
        tabIndex={isFocused ? 0 : -1}
        onClick={handleAction}
        className={`
          flex items-center gap-1.5 py-1 pr-2 rounded-lg cursor-pointer transition-colors select-none outline-none
          ${isActive ? 'bg-teal-500/10' : 'hover:bg-white/5'}
          ${isFocused ? 'ring-2 ring-teal-500/50' : ''}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.type === 'tree' && (
          <span className="opacity-70">
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
        {node.type === 'blob' && <span className="w-3" />}

        {getIcon()}

        <span className={`text-xs truncate ${isActive ? 'text-teal-400 font-medium' : 'dark:text-gray-300 text-gray-700'}`}>
          {node.name}
        </span>

        {isLoading && (
          <div className="ml-auto w-2.5 h-2.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        )}

        {!isLoading && isActive && (
          <CheckCircle className="ml-auto w-3 h-3 text-teal-500" />
        )}
      </div>

      {node.type === 'tree' && isOpen && node.children && (
        <div className="animate-in slide-in-from-top-1 duration-200">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFiles={activeFiles}
              onFileClick={onFileClick}
              loadingFilePaths={loadingFilePaths}
              isOpen={false} // This will be managed by parent
              onToggle={onToggle}
              isFocused={false} // Will be managed by parent
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Flatten only managed nodes to avoid infinite recursion or complexity
const flatten = (nodes: FileNode[], openPaths: Set<string>, result: FileNode[] = []) => {
  nodes.forEach(node => {
    result.push(node);
    if (node.type === 'tree' && openPaths.has(node.path) && node.children) {
      flatten(node.children, openPaths, result);
    }
  });
  return result;
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ nodes, activeFiles, onFileClick, loadingFilePaths }) => {
  const [openPaths, setOpenPaths] = useState<Set<string>>(new Set());
  const [focusedPath, setFocusedPath] = useState<string | null>(null);

  const togglePath = useCallback((path: string) => {
    setOpenPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const visibleNodes = useMemo(() => flatten(nodes, openPaths), [nodes, openPaths]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focusedPath && visibleNodes.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setFocusedPath(visibleNodes[0].path);
        return;
      }
    }

    const currentIndex = visibleNodes.findIndex(n => n.path === focusedPath);
    if (currentIndex === -1) return;

    const node = visibleNodes[currentIndex];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < visibleNodes.length - 1) {
          setFocusedPath(visibleNodes[currentIndex + 1].path);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setFocusedPath(visibleNodes[currentIndex - 1].path);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (node.type === 'tree' && !openPaths.has(node.path)) {
          togglePath(node.path);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (node.type === 'tree' && openPaths.has(node.path)) {
          togglePath(node.path);
        } else {
          // Focus parent if possible
          const parts = node.path.split('/');
          if (parts.length > 1) {
            const parentPath = parts.slice(0, -1).join('/');
            setFocusedPath(parentPath);
          }
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (node.type === 'tree') togglePath(node.path);
        else onFileClick(node.path);
        break;
    }
  };

  const renderNodes = (nodeList: FileNode[], depth = 0): React.ReactNode => {
    return nodeList.map(node => (
      <React.Fragment key={node.path}>
        <TreeNode
          node={node}
          depth={depth}
          activeFiles={activeFiles}
          onFileClick={onFileClick}
          loadingFilePaths={loadingFilePaths}
          isOpen={openPaths.has(node.path)}
          onToggle={togglePath}
          isFocused={focusedPath === node.path}
        />
        {node.type === 'tree' && openPaths.has(node.path) && node.children && (
          renderNodes(node.children, depth + 1)
        )}
      </React.Fragment>
    ));
  };

  if (nodes.length === 0) {
    return (
      <div className="p-4 text-center text-xs dark:text-gray-500 text-gray-400">
        No files to display.
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-0.5 pb-4 outline-none"
      role="tree"
      aria-label="File Explorer"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onFocus={() => {
        if (!focusedPath && visibleNodes.length > 0) {
          setFocusedPath(visibleNodes[0].path);
        }
      }}
    >
      {renderNodes(nodes)}
    </div>
  );
};
