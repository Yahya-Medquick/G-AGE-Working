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

  it('generates complete SVG for list layout without arrows and with key_fact', () => {
    const card: VisualStudyCard = {
      type: 'list',
      title: 'Five Pillars of Islam',
      summary: 'Essential acts of worship in Islam',
      items: [
        { title: 'Shahada', description: 'Declaration of faith in oneness of Allah.', key_fact: 'Foundational pillar' },
        { title: 'Salah', description: 'Five daily prayers facing the Kaaba in Mecca.', key_fact: 'Prayed 5 times daily' },
        { title: 'Zakat', description: 'Giving alms to the needy as a compulsory charity.', key_fact: '2.5% of annual savings' },
        { title: 'Sawm', description: 'Fasting during the holy month of Ramadan.', key_fact: 'Dawn until sunset fasting' },
        { title: 'Hajj', description: 'Pilgrimage to Mecca at least once if physically and financially able.', key_fact: 'Once in a lifetime' },
      ],
    };

    const { svg } = generateCardSvg(card);
    expect(svg).toContain('Five Pillars of Islam');
    expect(svg).toContain('Shahada');
    expect(svg).toContain('Salah');
    expect(svg).toContain('Zakat');
    expect(svg).toContain('Sawm');
    expect(svg).toContain('Hajj');
    expect(svg).toContain('Foundational pillar');
    expect(svg).toContain('2.5% of annual savings');
    // List layout must NOT contain downward arrow polygon
    expect(svg).not.toContain('points="-7,10 7,10 0,20"');
  });
});

describe('Visualize button visibility rules', () => {
  const thirtyWordText = 'This is an explanation of computer science fundamentals covering data structures algorithms memory management and compilation processes with sufficient detail and depth to provide value to the reader during revision and study.';

  it('shows button in Concept mode with 30+ words', async () => {
    const { shouldShowVisualizeButton } = await import('../src/services/visualCard');
    expect(shouldShowVisualizeButton('concept', thirtyWordText)).toBe(true);
  });

  it('hides button in any mode other than concept (Chat, Quiz, Notes)', async () => {
    const { shouldShowVisualizeButton } = await import('../src/services/visualCard');
    expect(shouldShowVisualizeButton('chat', thirtyWordText)).toBe(false);
    expect(shouldShowVisualizeButton('quiz', thirtyWordText)).toBe(false);
    expect(shouldShowVisualizeButton('notes', thirtyWordText)).toBe(false);
    expect(shouldShowVisualizeButton(undefined, thirtyWordText)).toBe(false);
  });

  it('hides button for very short answers (< 30 words) even in Concept mode', async () => {
    const { shouldShowVisualizeButton } = await import('../src/services/visualCard');
    const shortText = 'Mitosis produces two diploid cells.';
    expect(shouldShowVisualizeButton('concept', shortText)).toBe(false);
  });

  it('persists button for messages generated in Concept mode even if active chat mode switches', async () => {
    const { shouldShowVisualizeButton } = await import('../src/services/visualCard');
    // A message with msg.mode = 'concept' retains button even if current session.mode is 'quiz'
    const messageMode: string = 'concept';
    expect(shouldShowVisualizeButton(messageMode, thirtyWordText)).toBe(true);
  });
});
