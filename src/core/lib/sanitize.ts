/**
 * Sanitizes user input and system prompts to prevent breakout sequences
 * and markdown corruption.
 */
export function sanitizePrompt(content: string): string {
  if (!content) return '';
  
  return content
    .replace(/(<\/?)(\s*thinking\s*)(>)/gi, (match, p1, p2, p3) => `\\${p1}${p2}${p3}`)
    .replace(/---\s*START\s*FILE/gi, '\\--- START FILE \\---')
    .replace(/---\s*END\s*FILE/gi, '\\--- END FILE \\---');
}
