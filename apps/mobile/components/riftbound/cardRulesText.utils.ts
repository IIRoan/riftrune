type ReminderChunk = { value: string; reminder?: boolean };

export function splitReminderText(text: string): ReminderChunk[] {
  const chunks: ReminderChunk[] = [];
  const re = /\([^)]*\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      chunks.push({ value: text.slice(lastIndex, match.index) });
    }
    chunks.push({ value: match[0], reminder: true });
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    chunks.push({ value: text.slice(lastIndex) });
  }

  return chunks.length > 0 ? chunks : [{ value: text }];
}
