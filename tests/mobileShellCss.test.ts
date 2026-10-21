import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mobileShellCss = readFileSync(
  new URL('../src/components/MobileShell.css', import.meta.url),
  'utf8'
);

describe('mobile shell fixed elements', () => {
  it('does not hide fixed elements that are drawers', () => {
    const rules = mobileShellCss.matchAll(/([^{}]+)\{([^{}]*)\}/g);

    for (const [, selectors, declarations] of rules) {
      if (!/display\s*:\s*none\s*;?/i.test(declarations)) continue;

      const fixedSelectors = selectors
        .split(',')
        .map((selector) => selector.trim())
        .filter((selector) => /\.fixed\b/.test(selector));

      expect(
        fixedSelectors.every((selector) => selector.includes('.fixed:not([data-drawer])')),
        `display:none rule has an unexcluded .fixed selector: ${selectors.trim()}`
      ).toBe(true);
    }
  });
});
