/** Uniwind fill classes for Riftbound domain data. Full literals so Tailwind sees them. */
export function domainFillClass(name: string): string {
  switch (name.trim().toLowerCase()) {
    case 'fury':
      return 'bg-domain-fury';
    case 'calm':
      return 'bg-domain-calm';
    case 'mind':
      return 'bg-domain-mind';
    case 'body':
      return 'bg-domain-body';
    case 'chaos':
      return 'bg-domain-chaos';
    case 'order':
      return 'bg-domain-order';
    default:
      return 'bg-muted-foreground';
  }
}

/** Ink on a domain data fill — obsidian on the painted mark. */
export function domainInkClass(_name: string): string {
  return 'text-background';
}
