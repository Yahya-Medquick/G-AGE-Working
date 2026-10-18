import { VisualStudyCard, VisualCardStep, VisualCardGroup, VisualCardRelation } from '../types/visualCard';

const CANVAS_WIDTH = 1080;
const PADDING_X = 64;
const CONTENT_WIDTH = CANVAS_WIDTH - PADDING_X * 2; // 952px

// Detect Right-to-Left script (Urdu, Arabic, Persian)
export function isRtlText(text: string): boolean {
  if (!text) return false;
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlRegex.test(text);
}

// Measure and wrap text into multiple lines
export function wrapText(text: string, maxWidth: number, fontSize: number, fontWeight = 'normal'): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [];

  // If in browser, use canvas measureText for pixel-perfect wrapping
  let measureFn = (str: string): number => {
    // Fallback heuristic: approx 0.58 width-to-fontSize ratio
    return str.length * (fontSize * 0.58);
  };

  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `${fontWeight} ${fontSize}px 'Baloo 2', 'Nunito Sans', 'Noto Nastaliq Urdu', system-ui, sans-serif`;
        measureFn = (str: string) => ctx.measureText(str).width;
      }
    } catch {
      // Use fallback heuristic
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
  const isRtl = isRtlText(card.title) || isRtlText(card.summary || '');
  const fontStack = "'Baloo 2', 'Nunito Sans', 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', system-ui, sans-serif";

  // Elements to render
  const svgElements: string[] = [];
  let currentY = 64;

  // 1. Header: Brand Tagline
  svgElements.push(`
    <g transform="translate(${PADDING_X}, ${currentY})">
      <rect x="0" y="0" width="168" height="36" rx="10" fill="#17352A" stroke="#5BE0A5" stroke-opacity="0.3" stroke-width="1.5"/>
      <text x="84" y="23" text-anchor="middle" font-family="${fontStack}" font-size="14" font-weight="700" fill="#5BE0A5" letter-spacing="1">
        STUDY CARD
      </text>
    </g>
  `);
  currentY += 56;

  // 2. Title Heading (Wrap if needed)
  const titleLines = wrapText(card.title, CONTENT_WIDTH, 42, 'bold');
  const titleLineHeight = 52;
  const titleAnchor = isRtl ? 'end' : 'start';
  const titleX = isRtl ? CANVAS_WIDTH - PADDING_X : PADDING_X;

  svgElements.push(`
    <text x="${titleX}" y="${currentY + 38}" font-family="${fontStack}" font-size="42" font-weight="700" fill="#E8F2EC" text-anchor="${titleAnchor}" direction="${isRtl ? 'rtl' : 'ltr'}">
      ${titleLines.map((line, idx) => `<tspan x="${titleX}" dy="${idx === 0 ? 0 : titleLineHeight}">${escapeXml(line)}</tspan>`).join('')}
    </text>
  `);
  currentY += titleLines.length * titleLineHeight + 16;

  // 3. Optional Summary
  if (card.summary && card.summary.trim()) {
    const summaryLines = wrapText(card.summary, CONTENT_WIDTH, 22, 'normal');
    const summaryLineHeight = 32;
    svgElements.push(`
      <text x="${titleX}" y="${currentY + 20}" font-family="${fontStack}" font-size="22" font-weight="500" fill="#9DB5A8" text-anchor="${titleAnchor}" direction="${isRtl ? 'rtl' : 'ltr'}">
        ${summaryLines.map((line, idx) => `<tspan x="${titleX}" dy="${idx === 0 ? 0 : summaryLineHeight}">${escapeXml(line)}</tspan>`).join('')}
      </text>
    `);
    currentY += summaryLines.length * summaryLineHeight + 24;
  }

  // Divider under header
  svgElements.push(`
    <line x1="${PADDING_X}" y1="${currentY}" x2="${CANVAS_WIDTH - PADDING_X}" y2="${currentY}" stroke="#27403A" stroke-width="2"/>
  `);
  currentY += 40;

  // 4. Content Layout by Type: Flowchart, Mindmap, or Concept Map
  const cardType = card.type || 'flowchart';

  if (cardType === 'flowchart' || (!card.groups?.length && !card.relations?.length)) {
    // Flowchart: Numbered steps stacked vertically with small directional arrows
    const steps: VisualCardStep[] = Array.isArray(card.steps) && card.steps.length > 0
      ? card.steps.slice(0, 8)
      : [{ title: card.title, description: card.summary || 'Core concept overview' }];

    steps.forEach((step, index) => {
      const stepNumber = String(index + 1).padStart(2, '0');
      const stepRtl = isRtl || isRtlText(step.title) || isRtlText(step.description);
      const textWidth = CONTENT_WIDTH - 120; // Room for number badge
      const titleLines = wrapText(step.title, textWidth, 26, 'bold');
      const descLines = wrapText(step.description, textWidth, 20, 'normal');

      const cardPaddingY = 24;
      const cardHeight = Math.max(96, cardPaddingY * 2 + titleLines.length * 34 + descLines.length * 28 + (descLines.length ? 12 : 0));

      const badgeX = stepRtl ? CANVAS_WIDTH - PADDING_X - 72 : PADDING_X + 24;
      const textLeft = stepRtl ? CANVAS_WIDTH - PADDING_X - 104 : PADDING_X + 104;
      const cardAnchor = stepRtl ? 'end' : 'start';

      svgElements.push(`
        <!-- Step Card ${index + 1} -->
        <g transform="translate(0, ${currentY})">
          <rect x="${PADDING_X}" y="0" width="${CONTENT_WIDTH}" height="${cardHeight}" rx="18" fill="#12231C" stroke="#27403A" stroke-width="2"/>
          
          <!-- Step Badge -->
          <rect x="${badgeX}" y="24" width="48" height="48" rx="14" fill="#F4B400"/>
          <text x="${badgeX + 24}" y="55" font-family="${fontStack}" font-size="20" font-weight="800" fill="#10231C" text-anchor="middle">
            ${stepNumber}
          </text>

          <!-- Step Title -->
          <text x="${textLeft}" y="48" font-family="${fontStack}" font-size="24" font-weight="700" fill="#E8F2EC" text-anchor="${cardAnchor}" direction="${stepRtl ? 'rtl' : 'ltr'}">
            ${titleLines.map((line, idx) => `<tspan x="${textLeft}" dy="${idx === 0 ? 0 : 32}">${escapeXml(line)}</tspan>`).join('')}
          </text>

          <!-- Step Description -->
          <text x="${textLeft}" y="${48 + titleLines.length * 32 + 4}" font-family="${fontStack}" font-size="19" font-weight="500" fill="#9DB5A8" text-anchor="${cardAnchor}" direction="${stepRtl ? 'rtl' : 'ltr'}">
            ${descLines.map((line, idx) => `<tspan x="${textLeft}" dy="${idx === 0 ? 0 : 28}">${escapeXml(line)}</tspan>`).join('')}
          </text>
        </g>
      `);

      currentY += cardHeight;

      // Downward connector arrow between cards (if not last)
      if (index < steps.length - 1) {
        svgElements.push(`
          <g transform="translate(${CANVAS_WIDTH / 2}, ${currentY + 14})">
            <line x1="0" y1="-8" x2="0" y2="12" stroke="#5BE0A5" stroke-width="3" stroke-linecap="round"/>
            <polygon points="-7,10 7,10 0,20" fill="#5BE0A5"/>
          </g>
        `);
        currentY += 40;
      }
    });

  } else if (cardType === 'mindmap' && card.groups?.length) {
    // Mindmap: Group sections with colored headers & items
    const groups: VisualCardGroup[] = card.groups.slice(0, 5);

    groups.forEach((group, gIdx) => {
      const groupRtl = isRtl || isRtlText(group.title);
      const items = (group.items || []).slice(0, 4);

      // Measure items height
      let itemsTotalHeight = 0;
      const measuredItems = items.map((item) => {
        const itemRtl = groupRtl || isRtlText(item.title) || isRtlText(item.description);
        const itemWidth = CONTENT_WIDTH - 64;
        const itemTitleLines = wrapText(item.title, itemWidth, 22, 'bold');
        const itemDescLines = wrapText(item.description, itemWidth, 19, 'normal');
        const itemHeight = 24 + itemTitleLines.length * 28 + itemDescLines.length * 26 + 12;
        itemsTotalHeight += itemHeight + 12;
        return { item, itemTitleLines, itemDescLines, itemHeight, itemRtl };
      });

      const groupCardHeight = 64 + itemsTotalHeight + 16;
      const groupHeaderAnchor = groupRtl ? 'end' : 'start';
      const groupHeaderX = groupRtl ? CANVAS_WIDTH - PADDING_X - 28 : PADDING_X + 28;

      svgElements.push(`
        <!-- Mindmap Group ${gIdx + 1} -->
        <g transform="translate(0, ${currentY})">
          <rect x="${PADDING_X}" y="0" width="${CONTENT_WIDTH}" height="${groupCardHeight}" rx="20" fill="#12231C" stroke="#27403A" stroke-width="2"/>
          
          <!-- Group Header Banner -->
          <rect x="${PADDING_X}" y="0" width="${CONTENT_WIDTH}" height="56" rx="20" fill="#17352A" stroke="#27403A" stroke-width="2"/>
          <text x="${groupHeaderX}" y="36" font-family="${fontStack}" font-size="22" font-weight="700" fill="#5BE0A5" text-anchor="${groupHeaderAnchor}" direction="${groupRtl ? 'rtl' : 'ltr'}">
            ${escapeXml(group.title)}
          </text>
        </g>
      `);

      let itemY = currentY + 72;
      measuredItems.forEach(({ itemTitleLines, itemDescLines, itemHeight, itemRtl }) => {
        const itemBoxX = PADDING_X + 20;
        const itemBoxWidth = CONTENT_WIDTH - 40;
        const textX = itemRtl ? itemBoxX + itemBoxWidth - 20 : itemBoxX + 20;
        const itemAnchor = itemRtl ? 'end' : 'start';

        svgElements.push(`
          <g transform="translate(0, ${itemY})">
            <rect x="${itemBoxX}" y="0" width="${itemBoxWidth}" height="${itemHeight}" rx="12" fill="#0E1B15" stroke="#27403A" stroke-width="1"/>
            <text x="${textX}" y="28" font-family="${fontStack}" font-size="21" font-weight="700" fill="#E8F2EC" text-anchor="${itemAnchor}" direction="${itemRtl ? 'rtl' : 'ltr'}">
              ${itemTitleLines.map((line, idx) => `<tspan x="${textX}" dy="${idx === 0 ? 0 : 28}">${escapeXml(line)}</tspan>`).join('')}
            </text>
            <text x="${textX}" y="${28 + itemTitleLines.length * 28 + 2}" font-family="${fontStack}" font-size="18" font-weight="500" fill="#9DB5A8" text-anchor="${itemAnchor}" direction="${itemRtl ? 'rtl' : 'ltr'}">
              ${itemDescLines.map((line, idx) => `<tspan x="${textX}" dy="${idx === 0 ? 0 : 26}">${escapeXml(line)}</tspan>`).join('')}
            </text>
          </g>
        `);
        itemY += itemHeight + 12;
      });

      currentY += groupCardHeight + 28;
    });

  } else if (cardType === 'concept_map' && card.relations?.length) {
    // Concept Map: Relationship cards [From] —label→ [To] with explanation
    const relations: VisualCardRelation[] = card.relations.slice(0, 8);

    relations.forEach((rel, rIdx) => {
      const relRtl = isRtl || isRtlText(rel.from) || isRtlText(rel.to) || isRtlText(rel.label);
      const descLines = rel.description ? wrapText(rel.description, CONTENT_WIDTH - 64, 19, 'normal') : [];
      const relHeight = 108 + (descLines.length ? descLines.length * 26 + 20 : 0);

      svgElements.push(`
        <!-- Relation Card ${rIdx + 1} -->
        <g transform="translate(0, ${currentY})">
          <rect x="${PADDING_X}" y="0" width="${CONTENT_WIDTH}" height="${relHeight}" rx="18" fill="#12231C" stroke="#27403A" stroke-width="2"/>
          
          <!-- Node [From] -->
          <rect x="${PADDING_X + 24}" y="24" width="260" height="48" rx="12" fill="#17352A" stroke="#5BE0A5" stroke-opacity="0.5" stroke-width="1.5"/>
          <text x="${PADDING_X + 154}" y="55" font-family="${fontStack}" font-size="18" font-weight="700" fill="#5BE0A5" text-anchor="middle">
            ${escapeXml(rel.from.slice(0, 24))}
          </text>

          <!-- Center Label & Arrow -->
          <g transform="translate(${PADDING_X + 310}, 48)">
            <line x1="0" y1="0" x2="310" y2="0" stroke="#0F8056" stroke-width="2.5" stroke-dasharray="6,4"/>
            <polygon points="310,0 300,-6 300,6" fill="#5BE0A5"/>
            <rect x="75" y="-18" width="160" height="36" rx="8" fill="#0B1612" stroke="#27403A" stroke-width="1.5"/>
            <text x="155" y="6" font-family="${fontStack}" font-size="15" font-weight="700" fill="#E8F2EC" text-anchor="middle">
              ${escapeXml(rel.label.slice(0, 18))}
            </text>
          </g>

          <!-- Node [To] -->
          <rect x="${PADDING_X + 668}" y="24" width="260" height="48" rx="12" fill="#17352A" stroke="#5BE0A5" stroke-opacity="0.5" stroke-width="1.5"/>
          <text x="${PADDING_X + 798}" y="55" font-family="${fontStack}" font-size="18" font-weight="700" fill="#5BE0A5" text-anchor="middle">
            ${escapeXml(rel.to.slice(0, 24))}
          </text>
      `);

      if (descLines.length > 0) {
        const descX = relRtl ? CANVAS_WIDTH - PADDING_X - 32 : PADDING_X + 32;
        const descAnchor = relRtl ? 'end' : 'start';
        svgElements.push(`
          <!-- Relation Description -->
          <text x="${descX}" y="104" font-family="${fontStack}" font-size="18" font-weight="500" fill="#9DB5A8" text-anchor="${descAnchor}" direction="${relRtl ? 'rtl' : 'ltr'}">
            ${descLines.map((line, idx) => `<tspan x="${descX}" dy="${idx === 0 ? 0 : 26}">${escapeXml(line)}</tspan>`).join('')}
          </text>
        `);
      }

      svgElements.push(`</g>`);
      currentY += relHeight + 20;
    });
  }

  // 5. Footer (Branding & URL)
  currentY += 24;
  svgElements.push(`
    <!-- Footer -->
    <g transform="translate(${PADDING_X}, ${currentY})">
      <line x1="0" y1="0" x2="${CONTENT_WIDTH}" y2="0" stroke="#27403A" stroke-width="2"/>
      
      <!-- Compass icon and G-AGE AI brand -->
      <g transform="translate(0, 24)">
        <rect x="0" y="0" width="36" height="36" rx="10" fill="#0A5C45"/>
        <circle cx="18" cy="18" r="9" stroke="#5BE0A5" stroke-width="2" fill="none"/>
        <polygon points="18,12 21,18 18,24 15,18" fill="#5BE0A5"/>
        
        <text x="48" y="24" font-family="${fontStack}" font-size="20" font-weight="800" fill="#E8F2EC">
          G-AGE <tspan fill="#5BE0A5">AI</tspan>
        </text>
      </g>

      <!-- Domain link -->
      <text x="${CONTENT_WIDTH}" y="48" font-family="${fontStack}" font-size="18" font-weight="600" fill="#9DB5A8" text-anchor="end">
        gageai.org
      </text>
    </g>
  `);

  const totalHeight = currentY + 96;

  // Assemble complete standalone SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${totalHeight}" width="${CANVAS_WIDTH}" height="${totalHeight}">
    <defs>
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

// Convert SVG to PNG Blob using offscreen canvas at 2x resolution
export async function rasterizeSvgToPng(svgString: string, width: number, height: number): Promise<Blob> {
  // Ensure document fonts are loaded for accurate font rendering
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue anyway
    }
  }

  return new Promise((resolve, reject) => {
    const scale = 2; // Sharp 2x retina export
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Canvas 2D context not available'));
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width * scale, height * scale);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob from canvas'));
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load SVG into image: ${err}`));
    };

    img.src = url;
  });
}
