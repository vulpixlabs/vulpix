function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[char] ?? char;
  });
}

export function logoInitials(name: string): string {
  const words = name.trim().split(/[\s/._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function fallbackLogoSvg(name: string, color = "F54F1B"): string {
  const safeColor = /^[0-9a-f]{6}$/i.test(color) ? color : "F54F1B";
  const label = escapeXml(logoInitials(name));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeXml(name)}"><rect x="2" y="2" width="60" height="60" rx="8" fill="none" stroke="#${safeColor}" stroke-width="4"/><text x="32" y="39" fill="#${safeColor}" font-family="Arial,sans-serif" font-size="22" font-weight="700" text-anchor="middle">${label}</text></svg>`;
}
