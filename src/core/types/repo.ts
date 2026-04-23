export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  children?: FileNode[];
  content?: string;
  isSelected?: boolean;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  branch: string;
  tree?: FileNode[];
  lastSyncedAt?: number;
}

export interface ProjectContext {
  repo: Repository;
  selectedFiles: string[]; // Paths
  totalTokens: number;
}
