import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl } from './support';

describe('buildWhatsAppUrl', () => {
  it('does not invent a support contact when none is configured', () => {
    expect(buildWhatsAppUrl(undefined, 'Please help', 'staging')).toBeNull();
  });

  it('prefixes messages in non-production environments', () => {
    expect(buildWhatsAppUrl('1234567890', 'Please help', 'preview'))
      .toBe('https://wa.me/1234567890?text=%5BSTAGING%5D%20Please%20help');
  });

  it('leaves production messages unchanged', () => {
    expect(buildWhatsAppUrl('1234567890', 'Please help', 'production'))
      .toBe('https://wa.me/1234567890?text=Please%20help');
  });
});
