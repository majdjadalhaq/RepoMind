import { create } from 'zustand';

import { FileContext,FileNode, RepoDetails } from '../../core/types';
import { fetchGithubFileContent,fetchRepoDetails, fetchRepoStructure } from '../../infrastructure/githubService';

interface RepoState {
  repoDetails: RepoDetails | null;
  repoTree: FileNode[];
  githubRepoLink: string;
  isRepoLoading: boolean;
  loadingFilePaths: string[];
  truncationWarning: { limit: string; actual: string } | null;
  
  // Actions
  setRepoDetails: (details: RepoDetails | null) => void;
  setRepoTree: (tree: FileNode[]) => void;
  setGithubRepoLink: (link: string) => void;
  setIsRepoLoading: (isLoading: boolean) => void;
  setLoadingFilePaths: (paths: string[]) => void;
  setTruncationWarning: (warning: { limit: string; actual: string } | null) => void;
  
  // Async Thunks
  loadRepository: (url: string) => Promise<void>;
  fetchFileContent: (owner: string, repo: string, branch: string, path: string) => Promise<FileContext>;
}

export const useRepoStore = create<RepoState>((set) => ({
  repoDetails: null,
  repoTree: [],
  githubRepoLink: '',
  isRepoLoading: false,
  loadingFilePaths: [],
  truncationWarning: null,

  setRepoDetails: (repoDetails) => set({ repoDetails }),
  setRepoTree: (repoTree) => set({ repoTree }),
  setGithubRepoLink: (githubRepoLink) => set({ githubRepoLink }),
  setIsRepoLoading: (isRepoLoading) => set({ isRepoLoading }),
  setLoadingFilePaths: (loadingFilePaths) => set({ loadingFilePaths }),
  setTruncationWarning: (truncationWarning) => set({ truncationWarning }),

  loadRepository: async (url: string) => {
    set({ isRepoLoading: true, githubRepoLink: url, truncationWarning: null });
    try {
      const details = await fetchRepoDetails(url);
      if (details) {
        set({ repoDetails: details });
        const { tree, warning } = await fetchRepoStructure(details);
        set({ repoTree: tree });
        if (warning) {
          set({ truncationWarning: warning });
        }
      }
    } catch (error) {
      // Error handling will be moved to a toast/notification system in future phases
      throw error;
    } finally {
      set({ isRepoLoading: false });
    }
  },

  fetchFileContent: async (owner: string, repo: string, branch: string, path: string) => {
    set((state) => ({ loadingFilePaths: [...state.loadingFilePaths, path] }));
    try {
      const content = await fetchGithubFileContent(owner, repo, branch, path);
      return content;
    } finally {
      set((state) => ({ 
        loadingFilePaths: state.loadingFilePaths.filter(p => p !== path) 
      }));
    }
  }
}));
