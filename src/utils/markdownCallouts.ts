export type MarkdownSegment =
  | { type: 'markdown'; content: string }
  | { type: 'equation' | 'examtip'; content: string };

function lineWithoutNewline(line: string): string {
  return line.replace(/\r?\n$/, '');
}

function fenceMarker(line: string): { character: string; length: number; closing: boolean } | null {
  const match = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
  if (!match) return null;
  return {
    character: match[1][0],
    length: match[1].length,
    closing: match[2].trim() === '',
  };
}

export function splitMarkdownCallouts(content: string): MarkdownSegment[] {
  const lines = content.match(/[^\n]*\n|[^\n]+$/g) || [];
  const segments: MarkdownSegment[] = [];
  let markdown = '';
  let callout: { type: 'equation' | 'examtip'; content: string; raw: string } | null = null;
  let openFence: { character: string; length: number } | null = null;

  const flushMarkdown = () => {
    if (!markdown) return;
    segments.push({ type: 'markdown', content: markdown });
    markdown = '';
  };

  const updateFence = (line: string) => {
    const marker = fenceMarker(line);
    if (!marker) return;
    if (!openFence) {
      openFence = { character: marker.character, length: marker.length };
      return;
    }
    if (
      marker.closing &&
      marker.character === openFence.character &&
      marker.length >= openFence.length
    ) {
      openFence = null;
    }
  };

  for (const rawLine of lines) {
    const line = lineWithoutNewline(rawLine);
    if (callout) {
      if (!openFence && line.trim() === ':::') {
        segments.push({ type: callout.type, content: callout.content });
        callout = null;
        continue;
      }
      callout.content += rawLine;
      callout.raw += rawLine;
      updateFence(line);
      continue;
    }

    const marker = !openFence ? /^\s*:::(equation|examtip)\s*$/.exec(line) : null;
    if (marker) {
      flushMarkdown();
      callout = {
        type: marker[1] === 'equation' ? 'equation' : 'examtip',
        content: '',
        raw: rawLine,
      };
      continue;
    }

    markdown += rawLine;
    updateFence(line);
  }

  if (callout) {
    const lastSegment = segments[segments.length - 1];
    if (lastSegment?.type === 'markdown') lastSegment.content += callout.raw;
    else markdown += callout.raw;
  }
  flushMarkdown();
  return segments;
}
