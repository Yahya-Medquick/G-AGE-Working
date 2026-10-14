import React, { useState } from "react";
import { KnowledgeGraphData, KnowledgeNode } from "../types";
import { Network, ArrowRight, Sparkles, Compass } from "lucide-react";

interface KnowledgeGraphProps {
  graphData: KnowledgeGraphData;
  onSelectTopic: (topic: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  graphData,
  onSelectTopic,
}) => {
  const [hoveredNode, setHoveredNode] = useState<KnowledgeNode | null>(null);

  const centerNode = graphData.nodes.find((n) => n.id === "center") || graphData.nodes[0];
  const outerNodes = graphData.nodes.filter((n) => n.id !== centerNode?.id);

  return (
    <div className="rounded-[20px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-[10px] text-xs font-bold bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border border-[#0A5C45]/20">
              Graph Visualization
            </span>
            <span className="text-xs text-[#4F6359] dark:text-[#9DB5A8] font-medium">
              Knowledge Map
            </span>
          </div>
          <h3 className="font-heading font-bold text-[#10231C] dark:text-[#E8F2EC] text-xl">
            Connected Concept Network
          </h3>
          <p className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">
            Click any connected node to immediately navigate and explore that domain.
          </p>
        </div>
      </div>

      {/* Interactive Visual Network Stage */}
      <div className="relative rounded-[20px] bg-[#0B1612] border border-[#27403A] p-8 min-h-[420px] flex items-center justify-center overflow-hidden">
        {/* SVG Edge Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F8056" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#5BE0A5" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {outerNodes.map((node, idx) => {
            const angle = (idx / outerNodes.length) * Math.PI * 2;
            const centerX = 50; // percentage
            const centerY = 50;
            const targetX = 50 + Math.cos(angle) * 35;
            const targetY = 50 + Math.sin(angle) * 32;

            return (
              <line
                key={idx}
                x1={`${centerX}%`}
                y1={`${centerY}%`}
                x2={`${targetX}%`}
                y2={`${targetY}%`}
                stroke="url(#edgeGrad)"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            );
          })}
        </svg>

        {/* Center Target Node */}
        {centerNode && (
          <div className="relative z-10 p-5 rounded-[20px] bg-[#0A5C45] dark:bg-[#0F8056] text-white font-bold border border-[#5BE0A5]/40 text-center max-w-[180px] group cursor-pointer">
            <div className="text-xs uppercase tracking-wider text-[#5BE0A5] font-extrabold mb-0.5">
              Target Topic
            </div>
            <div className="text-sm font-extrabold line-clamp-1">{centerNode.label}</div>
          </div>
        )}

        {/* Orbiting Radial Connected Nodes */}
        {outerNodes.map((node, idx) => {
          const angle = (idx / outerNodes.length) * Math.PI * 2;
          const leftPct = 50 + Math.cos(angle) * 35;
          const topPct = 50 + Math.sin(angle) * 32;

          return (
            <div
              key={node.id}
              onClick={() => onSelectTopic(node.label)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 min-h-[44px] p-3 rounded-[14px] bg-[#12231C] hover:bg-[#17352A] border border-[#27403A] hover:border-[#5BE0A5] text-[#E8F2EC] cursor-pointer transition-all hover:scale-105 flex items-center gap-2 group text-xs font-semibold max-w-[160px]"
            >
              <Compass className="w-4 h-4 text-[#5BE0A5] group-hover:rotate-45 transition-transform" />
              <span className="truncate">{node.label}</span>
            </div>
          );
        })}
      </div>

      {/* Hovered Node Details Panel */}
      {hoveredNode && (
        <div className="p-4 rounded-[20px] bg-[#FFF3CC] dark:bg-[#3A2F0B] border border-[#F4B400]/40 text-[#10231C] dark:text-[#E8F2EC] text-xs flex items-center justify-between gap-4 animate-in fade-in duration-150">
          <div>
            <span className="font-bold text-[#0A5C45] dark:text-[#5BE0A5]">
              {hoveredNode.label}
            </span>
            <span className="text-[#4F6359] dark:text-[#9DB5A8] ml-2">
              ({hoveredNode.category}) — {hoveredNode.summary}
            </span>
          </div>

          <button
            onClick={() => onSelectTopic(hoveredNode.label)}
            className="min-h-[44px] px-4 py-2 rounded-[14px] bg-[#0A5C45] dark:bg-[#0F8056] text-white font-bold flex items-center gap-1.5 shrink-0 text-xs cursor-pointer border border-[#0A5C45] dark:border-[#0F8056]"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* List Grid of Connected Topics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#D5E0D8] dark:border-[#27403A]">
        {outerNodes.map((node) => (
          <div
            key={node.id}
            onClick={() => onSelectTopic(node.label)}
            className="p-4 rounded-[20px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] hover:border-[#0A5C45] dark:hover:border-[#5BE0A5] cursor-pointer transition-all group flex flex-col justify-between min-h-[44px]"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A5C45] dark:text-[#5BE0A5]">
                {node.category}
              </span>
              <h4 className="font-bold text-[#10231C] dark:text-[#E8F2EC] text-sm group-hover:text-[#0A5C45] dark:group-hover:text-[#5BE0A5] transition-colors mt-0.5">
                {node.label}
              </h4>
              <p className="text-xs text-[#4F6359] dark:text-[#9DB5A8] line-clamp-2 mt-1">
                {node.summary}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-[#D5E0D8] dark:border-[#27403A] flex items-center justify-between text-xs font-semibold text-[#0A5C45] dark:text-[#5BE0A5]">
              <span>Explore Domain</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
