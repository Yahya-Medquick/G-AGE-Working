import dagre from 'dagre';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { ConceptMapData, ConceptMapNodeData, ConceptMapEdgeData } from '../types/conceptMap';

const NODE_WIDTH = 190;
const NODE_HEIGHT = 64;

export function sanitizeConceptMapData(data: Partial<ConceptMapData>): ConceptMapData {
  const type = (data.type === 'flowchart' || data.type === 'concept_map' || data.type === 'mindmap')
    ? data.type
    : 'mindmap';

  const title = (typeof data.title === 'string' && data.title.trim())
    ? data.title.trim()
    : 'Concept Visualization';

  // 1. Unique node IDs and cap at 12
  const seenIds = new Set<string>();
  const validNodes: ConceptMapNodeData[] = [];

  const rawNodes = Array.isArray(data.nodes) ? data.nodes : [];
  for (const rawNode of rawNodes) {
    if (!rawNode || typeof rawNode.id !== 'string' || !rawNode.id.trim()) continue;
    const cleanId = rawNode.id.trim();
    if (seenIds.has(cleanId)) continue;

    const label = typeof rawNode.label === 'string' && rawNode.label.trim()
      ? rawNode.label.trim()
      : cleanId;

    seenIds.add(cleanId);
    validNodes.push({
      id: cleanId,
      label,
      parent: typeof rawNode.parent === 'string' && rawNode.parent.trim() ? rawNode.parent.trim() : null,
    });

    if (validNodes.length >= 12) break;
  }

  // If no nodes, generate a default central node
  if (validNodes.length === 0) {
    validNodes.push({ id: 'root', label: title, parent: null });
    seenIds.add('root');
  }

  // 2. Fix parents referencing non-existent nodes
  for (const node of validNodes) {
    if (node.parent && !seenIds.has(node.parent)) {
      node.parent = null;
    }
  }

  // 3. Exactly one root for mindmaps
  if (type === 'mindmap') {
    const rootNodes = validNodes.filter((n) => n.parent === null);
    if (rootNodes.length === 0) {
      validNodes[0].parent = null;
    } else if (rootNodes.length > 1) {
      const primaryRoot = rootNodes[0];
      for (let i = 1; i < rootNodes.length; i++) {
        rootNodes[i].parent = primaryRoot.id;
      }
    }
  }

  // 4. Edges: drop any missing node IDs & build edges from parent links if needed
  const validEdges: ConceptMapEdgeData[] = [];
  const rawEdges = Array.isArray(data.edges) ? data.edges : [];

  for (const rawEdge of rawEdges) {
    if (!rawEdge || typeof rawEdge.from !== 'string' || typeof rawEdge.to !== 'string') continue;
    const from = rawEdge.from.trim();
    const to = rawEdge.to.trim();
    if (seenIds.has(from) && seenIds.has(to) && from !== to) {
      validEdges.push({
        from,
        to,
        label: typeof rawEdge.label === 'string' ? rawEdge.label.trim() : undefined,
      });
    }
  }

  // For mindmap or flowchart, if parent relationships exist but edges are sparse, synthesize edges
  if (validEdges.length === 0 || type === 'mindmap') {
    for (const node of validNodes) {
      if (node.parent && seenIds.has(node.parent)) {
        const alreadyExists = validEdges.some((e) => e.from === node.parent && e.to === node.id);
        if (!alreadyExists) {
          validEdges.push({ from: node.parent, to: node.id });
        }
      }
    }
  }

  return {
    type,
    title,
    nodes: validNodes,
    edges: validEdges,
    fallbackOutline: data.fallbackOutline,
  };
}

export function layoutConceptGraph(
  mapData: ConceptMapData,
  onNodeClick: (node: ConceptMapNodeData) => void
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Direction: LR for mindmap, TB for flowchart & concept_map
  const isHorizontal = mapData.type === 'mindmap';
  dagreGraph.setGraph({
    rankdir: isHorizontal ? 'LR' : 'TB',
    nodesep: isHorizontal ? 36 : 48,
    ranksep: isHorizontal ? 72 : 56,
    marginx: 24,
    marginy: 24,
  });

  const rootId = mapData.nodes.find((n) => n.parent === null)?.id || mapData.nodes[0]?.id;

  mapData.nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  mapData.edges.forEach((edge) => {
    dagreGraph.setEdge(edge.from, edge.to);
  });

  dagre.layout(dagreGraph);

  const nodes: Node[] = mapData.nodes.map((node) => {
    const nodeWithPos = dagreGraph.node(node.id) || { x: 0, y: 0 };
    return {
      id: node.id,
      type: 'conceptNode',
      position: {
        x: nodeWithPos.x - NODE_WIDTH / 2,
        y: nodeWithPos.y - NODE_HEIGHT / 2,
      },
      data: {
        id: node.id,
        label: node.label,
        parent: node.parent,
        mapType: mapData.type,
        isRoot: node.id === rootId,
        onNodeClick: () => onNodeClick(node),
      },
    };
  });

  const edges: Edge[] = mapData.edges.map((edge, index) => {
    const edgeId = `edge-${edge.from}-${edge.to}-${index}`;
    return {
      id: edgeId,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
      label: edge.label || undefined,
      labelStyle: { fill: '#4F6359', fontSize: 11, fontWeight: 600 },
      labelBgStyle: { fill: '#FFFFFF', rx: 6, ry: 6 },
      labelBgPadding: [6, 3] as [number, number],
      style: {
        stroke: '#0A5C45',
        strokeWidth: 2,
        opacity: 0.85,
      },
      animated: mapData.type === 'flowchart',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: '#0A5C45',
      },
    };
  });

  return { nodes, edges };
}

export function generateFallbackOutline(text: string): string[] {
  if (!text || !text.trim()) return ['No structured content available.'];
  const clean = text
    .replace(/\[\[SUGGEST_GROUP:[^\]]*\]\]/g, '')
    .replace(/^#+\s+/gm, '')
    .trim();

  const lines = clean.split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('---'));

  if (lines.length <= 8) return lines;
  return lines.slice(0, 10);
}
