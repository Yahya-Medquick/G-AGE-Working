import { describe, expect, it } from 'vitest';
import { mergeChatSpecs } from '../src/utils/chatSpecs';

describe('mergeChatSpecs', () => {
  it('updates one mode without clobbering the others', () => {
    const current = {
      concept: { level: 'advanced' as const },
      exam: { targetExam: 'Punjab Board', subject: 'Physics' },
      research: { recency: 'all_time' as const, minCitations: '50+' as const, includeCode: false, includeDatasets: true },
    };

    expect(mergeChatSpecs(current, {
      concept: { level: 'expert' },
    })).toEqual({
      concept: { level: 'expert' },
      exam: { targetExam: 'Punjab Board', subject: 'Physics' },
      research: { recency: 'all_time', minCitations: '50+', includeCode: false, includeDatasets: true },
    });
  });

  it('merges partial values within the selected mode', () => {
    expect(mergeChatSpecs({
      exam: { targetExam: 'Punjab Board', subject: 'Physics', className: '10th' },
    }, {
      exam: { subject: 'Chemistry' },
    })).toEqual({
      exam: { targetExam: 'Punjab Board', subject: 'Chemistry', className: '10th' },
    });
  });
});
