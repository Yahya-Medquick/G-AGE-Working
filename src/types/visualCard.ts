export type VisualCardType = 'list' | 'flowchart' | 'mindmap' | 'concept_map';

export interface VisualCardItem {
  title: string;
  description: string;
  key_fact?: string;
}

export interface VisualCardGroup {
  title: string;
  items: VisualCardItem[];
}

export interface VisualCardRelation {
  from: string;
  label: string;
  to: string;
  description?: string;
}

export interface VisualStudyCard {
  type: VisualCardType;
  title: string;
  summary?: string;
  items?: VisualCardItem[];
  // Backwards compatibility alias for flowchart steps
  steps?: VisualCardItem[];
  groups?: VisualCardGroup[];
  relations?: VisualCardRelation[];
}
