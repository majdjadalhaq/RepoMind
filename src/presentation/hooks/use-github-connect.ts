import { fetchRepoStructure, fetchGithubFileContent } from '../../infrastructure/githubService';
import { useRepoStore } from '../../application/store/repo-store';
import { useChatStore } from '../../application/store/chat-store';
import { useUIStore } from '../../application/store/ui-store';
import { FileNode } from '../../core/types';

export const useGithubConnect = () => {
  const {
    repoDetails,
    repoTree, setRepoTree,
    loadingFilePaths, setLoadingFilePaths,
    setIsRepoLoading
  } = useRepoStore();

  const {
    activeFiles, setActiveFiles
  } = useChatStore();

  const {
    setIsRepoModalOpen
  } = useUIStore();

  const handleAttachRepoFiles = async () => {
    if (!repoDetails) return;

    setIsRepoLoading(true);

    try {
      const { tree, mapFile } = await fetchRepoStructure(repoDetails);

      setRepoTree(tree);
      setActiveFiles([...activeFiles.filter(f => f.name !== 'REPOSITORY_MAP.md'), mapFile]);

      setIsRepoModalOpen(false);
    } catch {
      alert("Failed to load repository structure.");
    } finally {
      setIsRepoLoading(false);
    }
  };

  const handleRepoFileClick = async (path: string) => {
    if (!repoDetails) return;

    if (activeFiles.some(f => f.name === path)) {
      setActiveFiles(activeFiles.filter(f => f.name !== path));
      return;
    }

    if (loadingFilePaths.includes(path)) return;
    
    try {
      const { fetchFileContent } = useRepoStore.getState();
      const fileContext = await fetchFileContent(
        repoDetails.owner.login,
        repoDetails.name,
        repoDetails.default_branch,
        path
      );

      setActiveFiles([...activeFiles, fileContext]);
    } catch {
      // console.error("Error fetching specific file:", e);
    }
  };

  const handleSelectAllFiles = async () => {
    if (!repoDetails || !repoTree || repoTree.length === 0) return;

    setIsRepoLoading(true);
    const paths: string[] = [];

    const walk = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'blob') paths.push(node.path);
        if (node.children) walk(node.children);
      });
    };
    walk(repoTree);

    // Filter out both already active files AND files currently loading
    const filteredPaths = paths.filter(p =>
      !activeFiles.some(f => f.name === p) &&
      !loadingFilePaths.includes(p)
    ).slice(0, 40);

    if (filteredPaths.length === 0) {
      setIsRepoLoading(false);
      return;
    }

    setLoadingFilePaths([...loadingFilePaths, ...filteredPaths]);

    try {
      const promises = filteredPaths.map(path =>
        fetchGithubFileContent(
          repoDetails!.owner.login,
          repoDetails!.name,
          repoDetails!.default_branch,
          path
        )
      );

      const newFiles = await Promise.all(promises);
      setActiveFiles([...activeFiles, ...newFiles]);
    } catch {
      // console.error("Select all failed", err);
    } finally {
      setIsRepoLoading(false);
      setLoadingFilePaths(loadingFilePaths.filter(p => !filteredPaths.includes(p)));
    }
  };

  return {
    handleAttachRepoFiles,
    handleRepoFileClick,
    handleSelectAllFiles
  };
};
