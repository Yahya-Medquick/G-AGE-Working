import { VisualStudyCard, VisualCardItem, VisualCardGroup, VisualCardRelation } from '../types/visualCard';
import { CARD_FONT_STACK, CARD_URDU_FONT_STACK, CARD_SVG_STYLES } from './cardFonts';

const CANVAS_WIDTH = 1080;
const PADDING_X = 64;
const CONTENT_WIDTH = CANVAS_WIDTH - PADDING_X * 2; // 952px

// Detect Right-to-Left script (Urdu, Arabic, Persian)
export function isRtlText(text: string): boolean {
  if (!text) return false;
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlRegex.test(text);
}

// Measure and wrap text into multiple lines using Canvas 2D measurement when available
export function wrapText(text: string, maxWidth: number, fontSize: number, fontWeight = 'normal'): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [];

  const isUrdu = isRtlText(text);
  const fontFam = isUrdu ? CARD_URDU_FONT_STACK : CARD_FONT_STACK;

  let measureFn = (str: string): number => {
    // Fallback heuristic if canvas is not initialized
    return str.length * (fontSize * (isUrdu ? 0.65 : 0.58));
  };

  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `${fontWeight} ${fontSize}px ${fontFam}`;
        measureFn = (str: string) => ctx.measureText(str).width;
      }
    } catch {
      // Fallback heuristic used
    }
  }

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    if (measureFn(testLine) <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// Escape XML entities for safe SVG text embedding
export function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate an SVG string directly from VisualStudyCard
export function generateCardSvg(card: VisualStudyCard): { svg: string; width: number; height: number } {
  const isOverallRtl = isRtlText(card.title) || isRtlText(card.summary || '');
  const titleFont = isOverallRtl ? CARD_URDU_FONT_STACK : CARD_FONT_STACK;

  const svgElements: string[] = [];
  let currentY = 56;

  // 1. Header: Brand Tagline
  const categoryLabel = card.type === 'flowchart' ? 'PROCESS FLOW'
    : card.type === 'concept_map' ? 'CONCEPT MAP'
    : card.type === 'mindmap' ? 'MINDMAP'
    : 'STUDY CARD';

  svgElements.push(`
    <g transform="translate(${PADDING_X}, ${currentY})">
      <rect x="0" y="0" width="168" height="34" rx="10" fill="#17352A" stroke="#5BE0A5" stroke-opacity="0.35" stroke-width="1.5"/>
      <text x="84" y="22" text-anchor="middle" font-family="${CARD_FONT_STACK}" font-size="13" font-weight="700" fill="#5BE0A5" letter-spacing="1">
        ${categoryLabel}
      </text>
    </g>
  `);
  currentY += 52;

  // 2. Title Heading (Wrap if needed)
  const titleLines = wrapText(card.title, CONTENT_WIDTH, 40, 'bold');
  const titleLineHeight = isOverallRtl ? 58 : 50;
  const titleAnchor = isOverallRtl ? 'end' : 'start';
  const titleX = isOverallRtl ? CANVAS_WIDTH - PADDING_X : PADDING_X;

  svgElements.push(`
    <text x="${titleX}" y="${currentY + (isOverallRtl ? 42 : 36)}" font-family="${titleFont}" font-size="40" font-weight="700" fill="#E8F2EC" text-anchor="${titleAnchor}" direction="${isOverallRtl ? 'rtl' : 'ltr'}">
      ${titleLines.map((line, idx) => `<tspan x="${titleX}" dy="${idx === 0 ? 0 : titleLineHeight}">${escapeXml(line)}</tspan>`).join('')}
    </text>
  `);
  currentY += titleLines.length * titleLineHeight + 16;

  // 3. Optional Summary
  if (card.summary && card.summary.trim()) {
    const summaryRtl = isRtlText(card.summary);
    const summaryFont = summaryRtl ? CARD_URDU_FONT_STACK : CARD_FONT_STACK;
    const summaryLines = wrapText(card.summary, CONTENT_WIDTH, 21, 'normal');
    const summaryLineHeight = summaryRtl ? 36 : 30;
    const summaryAnchor = summaryRtl ? 'end' : 'start';
    const summaryX = summaryRtl ? CANVAS_WIDTH - PADDING_X : PADDING_X;

    svgElements.push(`
      <text x="${summaryX}" y="${currentY + 20}" font-family="${summaryFont}" font-size="21" font-weight="500" fill="#9DB5A8" text-anchor="${summaryAnchor}" direction="${summaryRtl ? 'rtl' : 'ltr'}">
        ${summaryLines.map((line, idx) => `<tspan x="${summaryX}" dy="${idx === 0 ? 0 : summaryLineHeight}">${escapeXml(line)}</tspan>`).join('')}
      </text>
    `);
    currentY += summaryLines.length * summaryLineHeight + 20;
  }

  // Divider under header
  svgElements.push(`
    <line x1="${PADDING_X}" y1="${currentY}" x2="${CANVAS_WIDTH - PADDING_X}" y2="${currentY}" stroke="#27403A" stroke-width="2"/>
  `);
  currentY += 36;

  // 4. Content Layout by Type: List, Flowchart, Mindmap, or Concept Map
  const cardType = card.type || 'list';

  // Normalizing items vs legacy steps
  const itemsList: VisualCardItem[] = (Array.isArray(card.items) && card.items.length > 0)
    ? card.items
    : (Array.isArray(card.steps) && card.steps.length > 0)
    ? card.steps
    : [];

  if (cardType === 'list' || cardType === 'flowchart' || (!card.groups?.length && !card.relations?.length)) {
    // Both 'list' and 'flowchart' use numbered cards stacked vertically.
    // 'flowchart' draws directional downward arrows between cards. 'list' does NOT draw arrows.
    const hasArrows = cardType === 'flowchart';
    const items: VisualCardItem[] = itemsList.length > 0
      ? itemsList.slice(0, 8)
      : [{ title: card.title, description: card.summary || 'Overview' }];

    items.forEach((item, index) => {
      const stepNumber = String(index + 1).padStart(2, '0');
      const itemRtl = isRtlText(item.title) || isRtlText(item.description) || (item.key_fact ? isRtlText(item.key_fact) : isOverallRtl);
      const textFont = itemRtl ? CARD_URDU_FONT_STACK : CARD_FONT_STACK;

      const textWidth = CONTENT_WIDTH - 124; // Room for number badge
      const itemTitleLines = wrapText(item.title, textWidth, 25, 'bold');
      const itemDescLines = wrapText(item.description, textWidth, 19, 'normal');
      const keyFactLines = item.key_fact ? wrapText(item.key_fact, textWidth - 36, 17, 'bold') : [];

      const titleHeight = itemTitleLines.length * (itemRtl ? 34 : 30);
      const descHeight = itemDescLines.length * (itemRtl ? 30 : 26);
      const keyFactHeight = keyFactLines.length > 0 ? (keyFactLines.length * 24 + 18) : 0;

      const cardPaddingY = 22;
      const cardHeight = Math.max(92, cardPaddingY * 2 + titleHeight + descHeight + (keyFactHeight ? keyFactHeight + 12 : 0) + 8);

      const badgeX = itemRtl ? CANVAS_WIDTH - PADDING_X - 74 : PADDING_X + 22;
      const textLeft = itemRtl ? CANVAS_WIDTH - PADDING_X - 108 : PADDING_X + 104;
      const cardAnchor = itemRtl ? 'end' : 'start';

      svgElements.push(`
        <!-- Item Card ${index + 1} -->
        <g transform="translate(0, ${currentY})">
          <rect x="${PADDING_X}" y="0" width="${CONTENT_WIDTH}" height="${cardHeight}" rx="18" fill="#12231C" stroke="#27403A" stroke-width="2"/>
          
          <!-- Number Badge (Digits always use CARD_FONT_STACK) -->
          <rect x="${badgeX}" y="22" width="48" height="48" rx="14" fill="#F4B400"/>
          <text x="${badgeX + 24}" y="53" font-family="${CARD_FONT_STACK}" class="digit-text" font-size="20" font-weight="800" fill="#10231C" text-anchor="middle">
            ${stepNumber}
          </text>

          <!-- Item Title -->
          <text x="${textLeft}" y="44" font-family="${textFont}" font-size="24" font-weight="700" fill="#E8F2EC" text-anchor="${cardAnchor}" direction="${itemRtl ? 'rtl' : 'ltr'}">
            ${itemTitleLines.map((line, idx) => `<tspan x="${textLeft}" dy="${idx === 0 ? 0 : (itemRtl ? 34 : 30)}">${escapeXml(line)}</tspan>`).join('')}
          </text>

          <!-- Item Description -->
          <text x="${textLeft}" y="${44 + titleHeight + 2}" font-family="${textFont}" font-size="19" font-weight="500" fill="#9DB5A8" text-anchor="${cardAnchor}" direction="${itemRtl ? 'rtl' : 'ltr'}">
            ${itemDescLines.map((line, idx) => `<tspan x="${textLeft}" dy="${idx === 0 ? 0 : (itemRtl ? 30 : 26)}">${escapeXml(line)}</tspan>`).join('')}
          </text>
      `);

      // Optional Key Fact Highlight Pill
      if (keyFactLines.length > 0) {
        const keyFactY = 44 + titleHeight + descHeight + 10;
        const keyFactBoxWidth = textWidth;
        const keyFactBoxX = itemRtl ? CANVAS_WIDTH - PADDING_X - 108 - keyFactBoxWidth : PADDING_X + 104;
        const keyFactTextX = itemRtl ? keyFactBoxX + keyFactBoxWidth - 16 : keyFactBoxX + 16;

        svgElements.push(`
          <!-- Key Fact Highlight -->
          <rect x="${keyFactBoxX}" y="${keyFactY}" width="${keyFactBoxWidth}" height="${keyFactHeight}" rx="10" fill="#17352A" stroke="#0F8056" stroke-width="1.5"/>
          <text x="${keyFactTextX}" y="${keyFactY + 18}" font-family="${textFont}" font-size="16" font-weight="700" fill="#5BE0A5" text-anchor="${cardAnchor}" direction="${itemRtl ? 'rtl' : 'ltr'}">
            <tspan fill="#F4B400">★ </tspan>${keyFactLines.map((line, idx) => `<tspan x="${keyFactTextX}" dy="${idx === 0 ? 0 : 22}">${escapeXml(line)}</tspan>`).join('')}
          </text>
        `);
      }

      svgElements.push(`</g>`);
      currentY += cardHeight;

      // Downward connector arrow ONLY for flowchart (never for list)
      if (hasArrows && index < items.length - 1) {
        svgElements.push(`
          <g transform="translate(${CANVAS_WIDTH / 2}, ${currentY + 14})">
            <line x1="0" y1="-8" x2="0" y2="12" stroke="#5BE0A5" stroke-width="3" stroke-linecap="round"/>
            <polygon points="-7,10 7,10 0,20" fill="#5BE0A5"/>
          </g>
        `);
        currentY += 40;
      } else {
        currentY += 16;
      }
    });

  } else if (cardType === 'mindmap' && card.groups?.length) {
    // Mindmap: Group sections with colored headers & items
    const groups: VisualCardGroup[] = card.groups.slice(0, 5);

    groups.forEach((group, gIdx) => {
      const groupRtl = isRtlText(group.title) || isOverallRtl;
      const groupFont = groupRtl ? CARD_URDU_FONT_STACK : CARD_FONT_STACK;
      const items = (group.items || []).slice(0, 6);

      // Measure items height accurately
      let itemsTotalHeight = 0;
      const measuredItems = items.map((item) => {
        const itemRtl = groupRtl || isRtlText(item.title) || isRtlText(item.description);
        const itemFont = itemRtl ? CARD_URDU_FONT_STACK : CARD_FONT_STACK;
        const itemWidth = CONTENT_WIDTH - 64;
        const itemTitleLines = wrapText(item.title, itemWidth, 22, 'bold');
        const itemDescLines = wrapText(item.description, itemWidth, 18, 'normal');
        const keyFactLines = item.key_fact ? wrapText(item.key_fact, itemWidth - 32, 16, 'bold') : [];

        const tHeight = itemTitleLines.length * (itemRtl ? 30 : 26);
        const dHeight = itemDescLines.length * (itemRtl ? 26 : 24);
        const kHeight = keyFactLines.length > 0 ? (keyFactLines.length * 22 + 16) : 0;
        const itemHeight = 22 + tHeight + dHeight + (kHeight ? kHeight + 8 : 0) + 8;
        itemsTotalHeight += itemHeight + 12;

        return { item, itemTitleLines, itemDescLines, keyFactLines, itemHeight, itemRtl, itemFont, tHeight, dHeight, kHeight };
      });

      const groupCardHeight = 60 + itemsTotalHeight + 12;
      const groupHeaderAnchor = groupRtl ? 'end' : 'start';
      const groupHeaderX = groupRtl ? CANVAS_WIDTH - PADDING_X - 28 : PADDING_X + 28;

      svgElements.push(`
        <!-- Mindmap Group ${gIdx + 1} -->
        <g transform="translate(0, ${currentY})">
          <rect x="${PADDING_X}" y="0" width="${CONTENT_WIDTH}" height="${groupCardHeight}" rx="20" fill="#12231C" stroke="#27403A" stroke-width="2"/>
          
          <!-- Group Header Banner -->
          <rect x="${PADDING_X}" y="0" width="${CONTENT_WIDTH}" height="54" rx="20" fill="#17352A" stroke="#27403A" stroke-width="2"/>
          <text x="${groupHeaderX}" y="35" font-family="${groupFont}" font-size="22" font-weight="700" fill="#5BE0A5" text-anchor="${groupHeaderAnchor}" direction="${groupRtl ? 'rtl' : 'ltr'}">
            ${escapeXml(group.title)}
          </text>
        </g>
      `);

      let itemY = currentY + 68;
      measuredItems.forEach(({ itemTitleLines, itemDescLines, keyFactLines, itemHeight, itemRtl, itemFont, tHeight, dHeight, kHeight }) => {
        const itemBoxX = PADDING_X + 18;
        const itemBoxWidth = CONTENT_WIDTH - 36;
        const textX = itemRtl ? itemBoxX + itemBoxWidth - 20 : itemBoxX + 20;
        const itemAnchor = itemRtl ? 'end' : 'start';

        svgElements.push(`
          <g transform="translate(0, ${itemY})">
            <rect x="${itemBoxX}" y="0" width="${itemBoxWidth}" height="${itemHeight}" rx="12" fill="#0E1B15" stroke="#27403A" stroke-width="1.5"/>
            <text x="${textX}" y="28" font-family="${itemFont}" font-size="21" font-weight="700" fill="#E8F2EC" text-anchor="${itemAnchor}" direction="${itemRtl ? 'rtl' : 'ltr'}">
              ${itemTitleLines.map((line, idx) => `<tspan x="${textX}" dy="${idx === 0 ? 0 : 26}">${escapeXml(line)}</tspan>`).join('')}
            </text>
            <text x="${textX}" y="${28 + tHeight + 2}" font-family="${itemFont}" font-size="18" font-weight="500" fill="#9DB5A8" text-anchor="${itemAnchor}" direction="${itemRtl ? 'rtl' : 'ltr'}">
              ${itemDescLines.map((line, idx) => `<tspan x="${textX}" dy="${idx === 0 ? 0 : 24}">${escapeXml(line)}</tspan>`).join('')}
            </text>
        `);

        if (keyFactLines.length > 0) {
          const kfY = 28 + tHeight + dHeight + 6;
          svgElements.push(`
            <rect x="${itemRtl ? textX - (itemBoxWidth - 40) : textX}" y="${kfY}" width="${itemBoxWidth - 40}" height="${kHeight}" rx="8" fill="#17352A" stroke="#0F8056" stroke-width="1"/>
            <text x="${textX + (itemRtl ? -12 : 12)}" y="${kfY + 16}" font-family="${itemFont}" font-size="15" font-weight="700" fill="#5BE0A5" text-anchor="${itemAnchor}" direction="${itemRtl ? 'rtl' : 'ltr'}">
              <tspan fill="#F4B400">★ </tspan>${keyFactLines.map((line, idx) => `<tspan x="${textX + (itemRtl ? -12 : 12)}" dy="${idx === 0 ? 0 : 20}">${escapeXml(line)}</tspan>`).join('')}
            </text>
          `);
        }

        svgElements.push(`</g>`);
        itemY += itemHeight + 12;
      });

      currentY += groupCardHeight + 24;
    });

  } else if (cardType === 'concept_map' && card.relations?.length) {
    // Concept Map: Relationship cards [From] —label→ [To] with explanation
    const relations: VisualCardRelation[] = card.relations.slice(0, 8);

    relations.forEach((rel, rIdx) => {
      const relRtl = isRtlText(rel.from) || isRtlText(rel.to) || isRtlText(rel.label) || (rel.description ? isRtlText(rel.description) : isOverallRtl);
      const relFont = relRtl ? CARD_URDU_FONT_STACK : CARD_FONT_STACK;
      const descLines = rel.description ? wrapText(rel.description, CONTENT_WIDTH - 64, 19, 'normal') : [];
      const relHeight = 104 + (descLines.length ? descLines.length * 26 + 18 : 0);

      svgElements.push(`
        <!-- Relation Card ${rIdx + 1} -->
        <g transform="translate(0, ${currentY})">
          <rect x="${PADDING_X}" y="0" width="${CONTENT_WIDTH}" height="${relHeight}" rx="18" fill="#12231C" stroke="#27403A" stroke-width="2"/>
          
          <!-- Node [From] -->
          <rect x="${PADDING_X + 24}" y="22" width="260" height="48" rx="12" fill="#17352A" stroke="#5BE0A5" stroke-opacity="0.5" stroke-width="1.5"/>
          <text x="${PADDING_X + 154}" y="53" font-family="${relFont}" font-size="18" font-weight="700" fill="#5BE0A5" text-anchor="middle">
            ${escapeXml(rel.from.slice(0, 24))}
          </text>

          <!-- Center Label & Arrow -->
          <g transform="translate(${PADDING_X + 310}, 46)">
            <line x1="0" y1="0" x2="310" y2="0" stroke="#0F8056" stroke-width="2.5" stroke-dasharray="6,4"/>
            <polygon points="310,0 300,-6 300,6" fill="#5BE0A5"/>
            <rect x="75" y="-18" width="160" height="36" rx="8" fill="#0B1612" stroke="#27403A" stroke-width="1.5"/>
            <text x="155" y="6" font-family="${relFont}" font-size="15" font-weight="700" fill="#E8F2EC" text-anchor="middle">
              ${escapeXml(rel.label.slice(0, 18))}
            </text>
          </g>

          <!-- Node [To] -->
          <rect x="${PADDING_X + 668}" y="22" width="260" height="48" rx="12" fill="#17352A" stroke="#5BE0A5" stroke-opacity="0.5" stroke-width="1.5"/>
          <text x="${PADDING_X + 798}" y="53" font-family="${relFont}" font-size="18" font-weight="700" fill="#5BE0A5" text-anchor="middle">
            ${escapeXml(rel.to.slice(0, 24))}
          </text>
      `);

      if (descLines.length > 0) {
        const descX = relRtl ? CANVAS_WIDTH - PADDING_X - 32 : PADDING_X + 32;
        const descAnchor = relRtl ? 'end' : 'start';
        svgElements.push(`
          <!-- Relation Description -->
          <text x="${descX}" y="100" font-family="${relFont}" font-size="18" font-weight="500" fill="#9DB5A8" text-anchor="${descAnchor}" direction="${relRtl ? 'rtl' : 'ltr'}">
            ${descLines.map((line, idx) => `<tspan x="${descX}" dy="${idx === 0 ? 0 : 26}">${escapeXml(line)}</tspan>`).join('')}
          </text>
        `);
      }

      svgElements.push(`</g>`);
      currentY += relHeight + 18;
    });
  }

  // 5. Footer (Branding & URL)
  currentY += 20;
  svgElements.push(`
    <!-- Footer -->
    <g transform="translate(${PADDING_X}, ${currentY})">
      <line x1="0" y1="0" x2="${CONTENT_WIDTH}" y2="0" stroke="#27403A" stroke-width="2"/>
      
      <!-- Compass icon and G-AGE AI brand -->
      <g transform="translate(0, 22)">
        <rect x="0" y="0" width="36" height="36" rx="10" fill="#0A5C45"/>
        <circle cx="18" cy="18" r="9" stroke="#5BE0A5" stroke-width="2" fill="none"/>
        <polygon points="18,12 21,18 18,24 15,18" fill="#5BE0A5"/>
        
        <text x="48" y="24" font-family="${CARD_FONT_STACK}" font-size="20" font-weight="800" fill="#E8F2EC">
          G-AGE <tspan fill="#5BE0A5">AI</tspan>
        </text>
      </g>

      <!-- Domain link -->
      <text x="${CONTENT_WIDTH}" y="46" font-family="${CARD_FONT_STACK}" font-size="18" font-weight="600" fill="#9DB5A8" text-anchor="end">
        gageai.org
      </text>
    </g>
  `);

  const totalHeight = currentY + 90;

  // Assemble complete standalone SVG with embedded styling
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${totalHeight}" width="${CANVAS_WIDTH}" height="${totalHeight}">
    <defs>
      <style>
        ${CARD_SVG_STYLES}
      </style>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0E1E18"/>
        <stop offset="60%" stop-color="#0B1612"/>
        <stop offset="100%" stop-color="#07100D"/>
      </linearGradient>
    </defs>
    <!-- Background Canvas -->
    <rect width="${CANVAS_WIDTH}" height="${totalHeight}" fill="url(#bgGrad)"/>
    ${svgElements.join('\n')}
  </svg>`;

  return { svg, width: CANVAS_WIDTH, height: totalHeight };
}

// Single-pass Canvas PNG Rasterizer: renders SVG directly to a PNG Blob at 2x sharpness
export async function renderCardToPngBlob(card: VisualStudyCard): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  // Ensure document fonts are loaded before rasterizing
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue anyway
    }
  }

  const { svg, width, height } = generateCardSvg(card);
  const scale = 2; // Sharp 2x retina rasterization

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Canvas 2D context not available'));
    }

    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width * scale, height * scale);
      URL.revokeObjectURL(blobUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          const finalUrl = URL.createObjectURL(blob);
          resolve({ blob, url: finalUrl, width, height });
        } else {
          reject(new Error('Failed to create PNG blob from canvas'));
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error(`Failed to rasterize SVG into image: ${err}`));
    };

    img.src = blobUrl;
  });
}
