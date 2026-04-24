import { useCallback,useState } from 'react';

import { Repository } from '../../core/types/repo';
import { githubClient } from '../../infrastructure/github/client';

export const useRepo = () => {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const connectRepo = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { owner, repo: repoName } = githubClient.parseUrl(url);
      const metadata = await githubClient.fetchRepository(owner, repoName);
      const tree = await githubClient.fetchTree(owner, repoName);
      
      setRepo({ ...metadata, tree });
      setSelectedPaths(new Set());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFile = useCallback((path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const getFileContent = useCallback(async (path: string) => {
    if (!repo) return null;
    try {
      return await githubClient.fetchFileContent(repo.owner, repo.name, path, repo.branch);
    } catch {
      return null;
    }
  }, [repo]);

  return { 
    repo, 
    isLoading, 
    error, 
    selectedPaths, 
    connectRepo, 
    toggleFile,
    getFileContent
  };
};
