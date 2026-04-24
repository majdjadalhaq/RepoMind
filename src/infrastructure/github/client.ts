import { FileNode, Repository } from '../../core/types/repo';
import { AppError } from '../../core/lib/errors';

export class GithubClient {
  private static BASE_URL = 'https://api.github.com';

  async fetchRepository(owner: string, repo: string, branch: string = 'main'): Promise<Repository> {
    const url = `${GithubClient.BASE_URL}/repos/${owner}/${repo}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new AppError('GITHUB_REPO_NOT_FOUND', `Repository ${owner}/${repo} not found`, undefined, 404);
      }
      if (response.status === 403 || response.status === 429) {
        throw new AppError('GITHUB_RATE_LIMIT', 'GitHub API rate limit exceeded', undefined, response.status);
      }
      throw new AppError('API_ERROR', `Failed to fetch repository: ${response.statusText}`, undefined, response.status);
    }

    const data = await response.json();

    return {
      id: String(data.id),
      name: data.name,
      owner: data.owner.login,
      url: data.html_url,
      branch,
      lastSyncedAt: Date.now()
    };
  }

  async fetchTree(owner: string, repo: string, sha: string = 'main'): Promise<FileNode[]> {
    const url = `${GithubClient.BASE_URL}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new AppError('GITHUB_REF_NOT_FOUND', `Branch or SHA not found: ${sha}`, undefined, 404);
      }
      throw new AppError('API_ERROR', `Failed to fetch repository tree: ${response.statusText}`, undefined, response.status);
    }

    const data = await response.json();
    return this.transformTree(data.tree);
  }

  async fetchFileContent(owner: string, repo: string, path: string, branch: string = 'main'): Promise<string> {
    const url = `${GithubClient.BASE_URL}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3.raw' }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new AppError('GITHUB_FILE_NOT_FOUND', `File not found at path: ${path}`, undefined, 404);
      }
      throw new AppError('API_ERROR', `Failed to fetch file content: ${response.statusText}`, undefined, response.status);
    }

    return response.text();
  }

  private transformTree(githubTree: Array<{ path: string; type: string; size?: number }>): FileNode[] {
    const root: FileNode[] = [];
    const map: Record<string, FileNode> = {};

    githubTree.forEach(node => {
      const parts = node.path.split('/');
      const name = parts.pop() || '';
      const parentPath = parts.join('/');

      const fileNode: FileNode = {
        name,
        path: node.path,
        type: node.type === 'blob' ? 'file' : 'dir',
        size: node.size
      };

      if (fileNode.type === 'dir') {
        fileNode.children = [];
      }

      map[node.path] = fileNode;

      if (!parentPath) {
        root.push(fileNode);
      } else {
        const parent = map[parentPath];
        if (parent && parent.children) {
          parent.children.push(fileNode);
        }
      }
    });

    return root;
  }

  parseUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new AppError('INTERNAL_ERROR', `Invalid GitHub URL: ${url}`);
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }
}

export const githubClient = new GithubClient();
