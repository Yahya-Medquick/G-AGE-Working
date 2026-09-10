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
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Graph Visualization
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Knowledge Map
            </span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">
            Connected Concept Network
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any connected node to immediately navigate and explore that domain.
          </p>
        </div>
      </div>

      {/* Interactive Visual Network Stage */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-8 min-h-[420px] flex items-center justify-center overflow-hidden">
        {/* SVG Edge Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {outerNodes.map((node, idx) => {
            const angle = (idx / outerNodes.length) * Math.PI * 2;
            const radius = 140;
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
          <div className="relative z-10 p-5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold shadow-xl shadow-indigo-500/30 border border-indigo-400/30 text-center max-w-[180px] group cursor-pointer">
            <div className="text-[10px] uppercase tracking-wider text-indigo-200 font-extrabold mb-0.5">
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
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 text-white shadow-lg cursor-pointer transition-all hover:scale-110 flex items-center gap-2 group text-xs font-semibold max-w-[160px]"
            >
              <Compass className="w-4 h-4 text-indigo-400 group-hover:rotate-45 transition-transform" />
              <span className="truncate">{node.label}</span>
            </div>
          );
        })}
      </div>

      {/* Hovered Node Details Panel */}
      {hoveredNode && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-xs flex items-center justify-between gap-4 animate-in fade-in duration-150">
          <div>
            <span className="font-bold text-indigo-900 dark:text-indigo-200">
              {hoveredNode.label}
            </span>
            <span className="text-slate-500 dark:text-slate-400 ml-2">
              ({hoveredNode.category}) — {hoveredNode.summary}
            </span>
          </div>

          <button
            onClick={() => onSelectTopic(hoveredNode.label)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold flex items-center gap-1 shrink-0 text-xs"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* List Grid of Connected Topics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {outerNodes.map((node) => (
          <div
            key={node.id}
            onClick={() => onSelectTopic(node.label)}
            className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-indigo-500 cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {node.category}
              </span>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-0.5">
                {node.label}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                {node.summary}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Explore Domain</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
