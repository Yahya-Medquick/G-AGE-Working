export type VisualCardType = 'flowchart' | 'mindmap' | 'concept_map';

export interface VisualCardStep {
  title: string;
  description: string;
}

export interface VisualCardGroupItem {
  title: string;
  description: string;
}

export interface VisualCardGroup {
  title: string;
  items: VisualCardGroupItem[];
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
  steps?: VisualCardStep[];
  groups?: VisualCardGroup[];
  relations?: VisualCardRelation[];
}
