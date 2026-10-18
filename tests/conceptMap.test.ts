import { describe, it, expect } from 'vitest';
import { sanitizeConceptMapData, generateFallbackOutline } from '../src/utils/graphLayout';

describe('sanitizeConceptMapData', () => {
  it('enforces single root for mindmaps and caps at 12 nodes', () => {
    const rawNodes = Array.from({ length: 15 }, (_, i) => ({
      id: `node-${i}`,
      label: `Node ${i}`,
      parent: null,
    }));

    const sanitized = sanitizeConceptMapData({
      type: 'mindmap',
      title: 'Mindmap Test',
      nodes: rawNodes,
      edges: [],
    });

    expect(sanitized.nodes.length).toBe(12);
    expect(sanitized.type).toBe('mindmap');
    // Only the first node should have parent === null
    const rootNodes = sanitized.nodes.filter((n) => n.parent === null);
    expect(rootNodes.length).toBe(1);
    expect(rootNodes[0].id).toBe('node-0');
    // All other nodes should be assigned to the primary root
    expect(sanitized.nodes[1].parent).toBe('node-0');
  });

  it('drops edges referencing non-existent nodes', () => {
    const sanitized = sanitizeConceptMapData({
      type: 'concept_map',
      title: 'Edge Test',
      nodes: [
        { id: 'a', label: 'Node A', parent: null },
        { id: 'b', label: 'Node B', parent: 'a' },
      ],
      edges: [
        { from: 'a', to: 'b', label: 'relates to' },
        { from: 'a', to: 'missing-node', label: 'invalid' },
      ],
    });

    expect(sanitized.edges.length).toBe(1);
    expect(sanitized.edges[0]).toEqual({ from: 'a', to: 'b', label: 'relates to' });
  });

  it('generates fallback outline when content is provided', () => {
    const text = `
# How Photosynthesis Works
Light absorption by chlorophyll
Water splitting and oxygen release
ATP and NADPH generation
Calvin cycle carbon fixation
    `.trim();

    const outline = generateFallbackOutline(text);
    expect(outline.length).toBeGreaterThan(0);
    expect(outline).toContain('How Photosynthesis Works');
  });
});
