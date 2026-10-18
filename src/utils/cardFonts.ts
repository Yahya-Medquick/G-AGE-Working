// Font definitions for Visual Study Card rendering

export const CARD_FONT_STACK = "'Baloo 2', 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const CARD_URDU_FONT_STACK = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', 'Arabic Typesetting', 'Geeza Pro', serif, sans-serif";

/**
 * Embedded CSS styles for inside the SVG <defs><style>.
 * Defines font families, fallback rules, numeric variants, and text rendering properties
 * ensuring that numerals (0-9, %, +) and Latin/Urdu text render consistently
 * when loaded into a sandboxed Canvas Image element.
 */
export const CARD_SVG_STYLES = `
  text {
    font-family: ${CARD_FONT_STACK};
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
  .urdu-text {
    font-family: ${CARD_URDU_FONT_STACK};
    direction: rtl;
    unicode-bidi: embed;
  }
  .digit-text {
    font-family: ${CARD_FONT_STACK};
    font-variant-numeric: tabular-nums lining-nums;
  }
`;
