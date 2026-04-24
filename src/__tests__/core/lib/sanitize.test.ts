import { expect,test } from 'vitest';

import { sanitizePrompt } from '../../../core/lib/sanitize';

test('sanitizePrompt escapes thinking tags and markdown breakouts', () => {
  const dirty = 'Here is code: </thinking> --- START FILE ---';
  const clean = sanitizePrompt(dirty);
  
  expect(clean).toContain('\\</thinking>');
  expect(clean).toContain('\\--- START FILE \\---');
  
  // Ensure unescaped tags are gone (using negative lookbehind)
  expect(clean).not.toMatch(/(?<!\\)<\/thinking>/i);
});

test('sanitizePrompt is case insensitive', () => {
  const dirty = '</THINKING>';
  const clean = sanitizePrompt(dirty);
  expect(clean).toContain('\\</THINKING>');
});
