import { describe, it, expect } from 'vitest';
import { wrapText, isRtlText, generateCardSvg, escapeXml } from '../src/utils/cardRenderer';
import { VisualStudyCard } from '../src/types/visualCard';

describe('cardRenderer utility', () => {
  it('detects RTL languages like Urdu and Arabic', () => {
    expect(isRtlText('یہ ایک معلوماتی کارڈ ہے')).toBe(true);
    expect(isRtlText('Photosynthesis process in plants')).toBe(false);
  });

  it('escapes XML special characters', () => {
    expect(escapeXml('<script>&"test"</script>')).toBe('&lt;script&gt;&amp;&quot;test&quot;&lt;/script&gt;');
  });

  it('wraps text cleanly within max width', () => {
    const longText = 'This is a comprehensive study breakdown explaining how cellular respiration transforms glucose into ATP.';
    const lines = wrapText(longText, 300, 20);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(longText);
  });

  it('generates complete SVG for flowchart card with steps and branding', () => {
    const card: VisualStudyCard = {
      type: 'flowchart',
      title: 'How to Make Tea',
      summary: 'A simple step-by-step process',
      steps: [
        { title: 'Boil Water', description: 'Heat water to boiling point in a kettle.' },
        { title: 'Add Tea Leaves', description: 'Steep black tea leaves for 3-5 minutes.' },
        { title: 'Pour & Serve', description: 'Strain tea and add milk or sugar as desired.' },
      ],
    };

    const { svg, width, height } = generateCardSvg(card);
    expect(width).toBe(1080);
    expect(height).toBeGreaterThan(400);
    expect(svg).toContain('<svg');
    expect(svg).toContain('How to Make Tea');
    expect(svg).toContain('Boil Water');
    expect(svg).toContain('G-AGE');
    expect(svg).toContain('gageai.org');
  });

  it('generates complete SVG for mindmap card with groups', () => {
    const card: VisualStudyCard = {
      type: 'mindmap',
      title: 'Cell Biology',
      groups: [
        {
          title: 'Organelles',
          items: [
            { title: 'Mitochondria', description: 'Powerhouse producing cellular energy ATP.' },
            { title: 'Nucleus', description: 'Houses the genetic material and DNA.' },
          ],
        },
      ],
    };

    const { svg } = generateCardSvg(card);
    expect(svg).toContain('Cell Biology');
    expect(svg).toContain('Organelles');
    expect(svg).toContain('Mitochondria');
  });

  it('generates complete SVG for concept_map with relations', () => {
    const card: VisualStudyCard = {
      type: 'concept_map',
      title: 'Mitosis vs Meiosis',
      relations: [
        { from: 'Mitosis', label: 'produces', to: 'Diploid Cells', description: 'Two identical somatic cells' },
      ],
    };

    const { svg } = generateCardSvg(card);
    expect(svg).toContain('Mitosis vs Meiosis');
    expect(svg).toContain('Mitosis');
    expect(svg).toContain('Diploid Cells');
  });
});
