import { sanitizePrompt } from '../../core/lib/sanitize';
import { ChatMessage } from '../../core/types/ai';
import { Repository } from '../../core/types/repo';

export class PromptBuilder {
  static buildSystemPrompt(repo?: Repository, selectedFiles: { path: string; content: string }[] = []): string {
    let prompt = `You are RepoMind, an advanced AI code intelligence hub.
Your goal is to provide expert-level analysis and guidance based on the provided repository context.

CORE INSTRUCTIONS:
1. Analyze the codebase structure and specific file contents provided.
2. Provide concise, performant, and secure code suggestions.
3. Use Mermaid for architectural diagrams when helpful.
4. Be explicit about assumptions when information is missing.
5. If thinking is supported, use it for deep reasoning before providing answers.

`;

    if (repo) {
      prompt += `REPOSITORY CONTEXT:
Name: ${repo.name}
Owner: ${repo.owner}
Branch: ${repo.branch}
URL: ${repo.url}

`;
    }

    if (selectedFiles.length > 0) {
      prompt += `SELECTED FILES CONTEXT:
The following files are currently relevant to the user's request. Each file is delimited by standardized headers.

`;
      selectedFiles.forEach(file => {
        prompt += `--- START FILE: ${file.path} ---\n`;
        prompt += sanitizePrompt(file.content);
        prompt += `\n--- END FILE: ${file.path} ---\n\n`;
      });
    }

    return prompt;
  }

  static augmentMessages(messages: ChatMessage[], systemPrompt: string): ChatMessage[] {
    const hasSystem = messages.some(m => m.role === 'system');
    if (hasSystem) {
      return messages.map(m => m.role === 'system' ? { ...m, content: systemPrompt } : m);
    }
    return [{ role: 'system', content: systemPrompt }, ...messages];
  }
}
