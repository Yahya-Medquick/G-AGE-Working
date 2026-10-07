import { describe, expect, it } from 'vitest';
import { splitMarkdownCallouts } from '../src/utils/markdownCallouts';

describe('markdown callout parsing', () => {
  it('separates equation and exam-tip blocks from surrounding markdown', () => {
    expect(splitMarkdownCallouts(
      'Start here.\n\n:::equation\n$$E = mc^2$$\n:::\n\n:::examtip\nCheck the units.\n:::\n',
    )).toEqual([
      { type: 'markdown', content: 'Start here.\n\n' },
      { type: 'equation', content: '$$E = mc^2$$\n' },
      { type: 'markdown', content: '\n' },
      { type: 'examtip', content: 'Check the units.\n' },
    ]);
  });

  it('leaves markers inside fenced code and unknown markers as plain markdown', () => {
    const content = '```md\n:::equation\nx = y\n:::\n```\n\n:::warning\nCareful.\n:::';
    expect(splitMarkdownCallouts(content)).toEqual([{ type: 'markdown', content }]);
  });

  it('does not close a callout on a marker inside fenced code', () => {
    expect(splitMarkdownCallouts(
      ':::examtip\n```text\n:::\nKeep checking units.\n```\n:::\n',
    )).toEqual([
      { type: 'examtip', content: '```text\n:::\nKeep checking units.\n```\n' },
    ]);
  });

  it('falls back to plain markdown for an unclosed callout', () => {
    const content = 'Before.\n:::examtip\nunfinished';
    expect(splitMarkdownCallouts(content)).toEqual([{ type: 'markdown', content }]);
  });
});
