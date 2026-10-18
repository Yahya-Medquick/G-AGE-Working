import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface ConceptNodeCustomData {
  id: string;
  label: string;
  parent: string | null;
  mapType: 'mindmap' | 'flowchart' | 'concept_map';
  isRoot?: boolean;
  onNodeClick?: () => void;
  [key: string]: unknown;
}

export const ConceptMapNode = memo(({ data, selected }: NodeProps) => {
  const customData = data as unknown as ConceptNodeCustomData;
  const isHorizontal = customData.mapType === 'mindmap';
  const isRoot = !!customData.isRoot;

  return (
    <div
      onClick={customData.onNodeClick}
      className={`group relative min-w-[180px] max-w-[220px] px-3.5 py-2.5 rounded-[14px] border transition-all cursor-pointer select-none shadow-xs ${
        isRoot
          ? 'bg-[#DDEFE6] dark:bg-[#17352A] border-[#0A5C45] dark:border-[#5BE0A5] text-[#0A5C45] dark:text-[#5BE0A5] font-bold'
          : selected
          ? 'bg-white dark:bg-[#12231C] border-[#0A5C45] dark:border-[#5BE0A5] ring-2 ring-[#0A5C45]/20 dark:ring-[#5BE0A5]/30 text-[#10231C] dark:text-[#E8F2EC]'
          : 'bg-white dark:bg-[#12231C] border-[#D5E0D8] dark:border-[#27403A] hover:border-[#0A5C45] dark:hover:border-[#5BE0A5] text-[#10231C] dark:text-[#E8F2EC]'
      }`}
    >
      {/* React Flow Connection Handles */}
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className="!bg-[#0A5C45] dark:!bg-[#5BE0A5] !w-2 !h-2 !border-white dark:!border-[#12231C]"
      />

      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {isRoot ? (
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#0A5C45] dark:text-[#5BE0A5]" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#0A5C45] dark:bg-[#5BE0A5]" />
          )}
          <span className="text-xs font-semibold leading-tight line-clamp-2">
            {customData.label}
          </span>
        </div>
        <ArrowRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#0A5C45] dark:text-[#5BE0A5]" />
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-[#0A5C45] dark:!bg-[#5BE0A5] !w-2 !h-2 !border-white dark:!border-[#12231C]"
      />
    </div>
  );
});

ConceptMapNode.displayName = 'ConceptMapNode';
