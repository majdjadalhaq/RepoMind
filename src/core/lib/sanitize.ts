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
  sanitized = sanitized
    .replace(/(<\/?)(\s*thinking\s*)(>)/gi, (match, p1, p2, p3) => `\\${p1}${p2}${p3}`)
    .replace(/---\s*START\s*FILE/gi, '\\--- START FILE \\---')
    .replace(/---\s*END\s*FILE/gi, '\\--- END FILE \\---');

  // 4. Sanitize dangerous HTML/XSS vectors
  return sanitized
    .replace(/<script/gi, '&lt;script')
    .replace(/<\/script>/gi, '&lt;/script&gt;')
    .replace(/<iframe/gi, '&lt;iframe')
    .replace(/<\/iframe>/gi, '&lt;/iframe&gt;')
    .replace(/<object/gi, '&lt;object')
    .replace(/<\/object>/gi, '&lt;/object&gt;')
    .replace(/<embed/gi, '&lt;embed')
    .replace(/<\/embed>/gi, '&lt;/embed&gt;')
    .replace(/<link/gi, '&lt;link')
    .replace(/<style/gi, '&lt;style')
    .replace(/<\/style>/gi, '&lt;/style&gt;')
    .replace(/\bonerror\s*=/gi, 'on_error=')
    .replace(/\bonload\s*=/gi, 'on_load=')
    .replace(/\bonclick\s*=/gi, 'on_click=')
    .replace(/javascript:/gi, 'java-script:')
    .replace(/data:text\/html/gi, 'data:text_html');
}
