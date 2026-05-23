const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

const ESCAPE_REGEX = /[&<>"']/g;

export function escapeHtml(text: string): string {
  return text.replace(ESCAPE_REGEX, char => ESCAPE_MAP[char]);
}
