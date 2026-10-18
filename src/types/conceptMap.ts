export type ConceptMapType = 'mindmap' | 'flowchart' | 'concept_map';

export interface ConceptMapNodeData {
  id: string;
  label: string;
  parent: string | null;
}

export interface ConceptMapEdgeData {
  from: string;
  to: string;
  label?: string;
}

export interface ConceptMapData {
  type: ConceptMapType;
  title: string;
  nodes: ConceptMapNodeData[];
  edges: ConceptMapEdgeData[];
  fallbackOutline?: string[];
}
