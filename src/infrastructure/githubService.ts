import { RepoDetails, RepoContent, FileContext, FileNode } from "../core/types";
import { buildFileTree } from "../core/utils";
import { AppError } from "../core/lib/errors";

interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  url: string;
  sha: string;
  size?: number;
}

const IGNORED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.lock', '.pdf', '.mp4', '.mov', '.mp3', '.zip', '.tar', '.gz'
];

const IGNORED_DIRS = [
  'node_modules', 'dist', 'build', 'coverage', '.git', '.idea', '.vscode'
];

export const fetchRepoDetails = async (input: string): Promise<RepoDetails | null> => {
  try {
    let owner = '';
    let repo = '';

    const cleanInput = input.trim().replace(/\/$/, '');

    if (cleanInput.startsWith('http')) {
      try {
        const urlObj = new URL(cleanInput);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          owner = parts[0];
          repo = parts[1];
        }
      } catch {
        return null;
      }
    } else {
      const parts = cleanInput.split('/');
      if (parts.length === 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }

    if (!owner || !repo) return null;

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

    if (!response.ok) {
      if (response.status === 404) throw new AppError('REPO_NOT_FOUND', `Repository ${owner}/${repo} not found`);
      if (response.status === 403) throw new AppError('RATE_LIMIT', 'GitHub API rate limit exceeded');
      throw new AppError('API_ERROR', `GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

    try {
      const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
      if (contentsResponse.ok) {
        const contents: RepoContent[] = await contentsResponse.json();
        data.contents = contents.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'dir' ? -1 : 1;
        });
      } else {
        data.contents = [];
      }
    } catch {
      data.contents = [];
    }

    return data as RepoDetails;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('NETWORK_ERROR', 'Failed to connect to GitHub', error);
  }
};

export const fetchGithubFileContent = async (owner: string, repo: string, branch: string, path: string): Promise<FileContext> => {
  const downloadUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new AppError('API_ERROR', `Failed to fetch file content: ${path}`);
  }

  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(path);
  let content = '';

  if (isImage) {
    const blob = await response.blob();
    content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    content = await response.text();
  }

  return {
    id: `gh-${path}-${Date.now()}`,
    name: path,
    type: isImage ? `image/${path.split('.').pop() === 'jpg' ? 'jpeg' : path.split('.').pop()}` : (path.endsWith('.svg') ? 'image/svg+xml' : 'text/plain'),
    content: content,
    category: isImage ? 'image' : 'code'
  };
};

export interface RepoStructureResult {
  tree: FileNode[];
  mapFile: FileContext;
  warning?: { limit: string; actual: string };
}

export const fetchRepoStructure = async (repo: RepoDetails): Promise<RepoStructureResult> => {
  try {
    const { owner, name, default_branch } = repo;

    const treeResponse = await fetch(`https://api.github.com/repos/${owner.login}/${name}/git/trees/${default_branch}?recursive=1`);

    if (!treeResponse.ok) {
      throw new AppError('API_ERROR', "Failed to fetch repository tree from GitHub");
    }

    const treeData = await treeResponse.json();
    const allItems: GitHubTreeItem[] = treeData.tree;
    const visualTree = buildFileTree(allItems);

    const allPaths = allItems.map((item) => {
      return item.type === 'tree' ? `${item.path}/` : item.path;
    });

    let structureContent = `Repository Map for ${owner.login}/${name} (${default_branch})\n` +
      `--------------------------------------------------\n` +
      `Total Items: ${allPaths.length}\n\n` +
      `### FILE STRUCTURE ###\n` +
      allPaths.join('\n') +
      `\n\n### FULL REPOSITORY CONTENT ###\n` +
      `Below is the content of all text-based files in the repository:\n\n`;

    let warning: { limit: string; actual: string } | undefined;
    const MAX_FILES = 60;
    const MAX_TOTAL_SIZE = 400 * 1024;
    let currentSize = 0;

    const targetFiles = allItems.filter((item) => {
      if (!item || !item.path || item.type !== 'blob') return false;
      const ext = '.' + item.path.split('.').pop()?.toLowerCase();
      return !IGNORED_EXTENSIONS.includes(ext) && 
             !IGNORED_DIRS.some(d => (item.path as string).includes(`/${d}/`) || (item.path as string).startsWith(`${d}/`));
    });

    const subset = targetFiles.slice(0, MAX_FILES);
    if (targetFiles.length > MAX_FILES) {
      warning = { limit: `${MAX_FILES} files`, actual: `${targetFiles.length} files` };
    }

    const filePromises = subset.map(async (item) => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner.login}/${name}/${default_branch}/${item.path}`;
        const res = await fetch(rawUrl);
        if (!res.ok) return "";

        const content = await res.text();
        // Since this is parallel, we'll do a simple check. 
        // A better way would be sequential or a semaphore, but for this scale this is fine.
        if (currentSize + content.length > MAX_TOTAL_SIZE) {
          warning = { limit: '400KB', actual: 'Larger than 400KB' };
          return "";
        }

        currentSize += content.length;
        return `\n--- START FILE: ${item.path} ---\n${content}\n--- END FILE: ${item.path} ---\n`;
      } catch {
        return "";
      }
    });

    const fileContents = await Promise.all(filePromises);
    structureContent += fileContents.filter(c => c !== "").join('\n');

    if (warning) {
      structureContent += `\n\n[Note: Repository content was truncated: ${warning.limit} limit reached.]\n`;
    }

    const mapFile: FileContext = {
      id: `repo-structure-${Date.now()}`,
      name: 'REPOSITORY_MAP.md',
      type: 'text/markdown',
      content: structureContent,
      category: 'other'
    };

    return { tree: visualTree, mapFile, warning };

  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('API_ERROR', 'Failed to analyze repository structure', error);
  }
};