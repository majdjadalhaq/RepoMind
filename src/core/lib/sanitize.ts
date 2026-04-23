/**
 * Sanitizes user input and system prompts to prevent breakout sequences
 * and markdown corruption.
 */
export function sanitizePrompt(content: string): string {
  if (!content) return '';
  
  // 1. Guard against massive payloads (512KB limit for a single block)
  const MAX_BLOCK_SIZE = 512 * 1024;
  let sanitized = content;
  if (content.length > MAX_BLOCK_SIZE) {
    sanitized = content.substring(0, MAX_BLOCK_SIZE) + '\n[...CONTENT TRUNCATED FOR SAFETY...]';
  }

  // 2. Strip null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // 3. Escape thinking tags and markdown breakouts
  return sanitized
    .replace(/(<\/?)(\s*thinking\s*)(>)/gi, (match, p1, p2, p3) => `\\${p1}${p2}${p3}`)
    .replace(/---\s*START\s*FILE/gi, '\\--- START FILE \\---')
    .replace(/---\s*END\s*FILE/gi, '\\--- END FILE \\---')
    .replace(/<script/gi, '&lt;script')
    .replace(/<\/script>/gi, '&lt;/script&gt;')
    .replace(/javascript:/gi, 'java-script:');
}
