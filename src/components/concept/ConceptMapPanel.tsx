import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import html2canvas from 'html2canvas';
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  HelpCircle,
  ListTree,
  Network,
  Share2,
} from 'lucide-react';
import { ConceptMapData, ConceptMapNodeData } from '../../types/conceptMap';
import { layoutConceptGraph } from '../../utils/graphLayout';
import { ConceptMapNode } from './ConceptMapNode';

interface ConceptMapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mapData: ConceptMapData | null;
  onAskAboutNode: (label: string) => void;
}

const nodeTypes = {
  conceptNode: ConceptMapNode,
};

export const ConceptMapPanel: React.FC<ConceptMapPanelProps> = ({
  isOpen,
  onClose,
  mapData,
  onAskAboutNode,
}) => {
  const [selectedNode, setSelectedNode] = useState<ConceptMapNodeData | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showOutlineView, setShowOutlineView] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement>(null);

  // Layout the graph nodes and edges
  const handleNodeSelect = useCallback((node: ConceptMapNodeData) => {
    setSelectedNode(node);
  }, []);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!mapData) return { initialNodes: [], initialEdges: [] };
    const { nodes, edges } = layoutConceptGraph(mapData, handleNodeSelect);
    return { initialNodes: nodes, initialEdges: edges };
  }, [mapData, handleNodeSelect]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  // Keep state synchronized when mapData updates
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNode(null);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Export handlers
  const handleCopyJson = useCallback(() => {
    if (!mapData) return;
    const jsonStr = JSON.stringify(mapData, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    });
  }, [mapData]);

  const handleDownloadPng = useCallback(async () => {
    if (!flowContainerRef.current || isExporting) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(flowContainerRef.current, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0B1612' : '#F3F6F1',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      a.download = `${(mapData?.title || 'concept-map').toLowerCase().replace(/\s+/g, '-')}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to export concept map PNG:', err);
    } finally {
      setIsExporting(false);
    }
  }, [mapData, isExporting]);

  if (!isOpen || !mapData) return null;

  const typeLabels = {
    mindmap: 'Mind Map',
    flowchart: 'Flowchart',
    concept_map: 'Concept Map',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Drawer Container: Slide from right on desktop, Bottom Sheet on mobile */}
      <div
        className="relative z-10 flex h-full w-full flex-col bg-[#FFFFFF] dark:bg-[#12231C] shadow-2xl transition-transform duration-300 sm:max-w-xl md:max-w-2xl lg:max-w-3xl border-l border-[#D5E0D8] dark:border-[#27403A]"
        role="dialog"
        aria-modal="true"
        aria-label="Concept Map Visualization"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#D5E0D8] dark:border-[#27403A] px-5 py-3.5 bg-[#FFFFFF] dark:bg-[#12231C]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-[10px] bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5]">
              <Network className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[8px] bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border border-[#0A5C45]/20">
                  {typeLabels[mapData.type] || 'Concept Graph'}
                </span>
              </div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-[#10231C] dark:text-[#E8F2EC] truncate mt-0.5">
                {mapData.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Mode Switcher (Graph vs Outline) */}
            <button
              onClick={() => setShowOutlineView((prev) => !prev)}
              className={`min-h-[40px] px-2.5 py-1 rounded-[10px] border border-[#D5E0D8] dark:border-[#27403A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showOutlineView
                  ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white'
                  : 'bg-white dark:bg-[#12231C] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A]'
              }`}
              title={showOutlineView ? 'Switch to Graph View' : 'Switch to Outline View'}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showOutlineView ? 'Graph' : 'Outline'}</span>
            </button>

            {/* Export Menu Buttons */}
            <button
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="min-h-[40px] px-2.5 py-1 rounded-[10px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Download Graph PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'PNG'}</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="min-h-[40px] px-2.5 py-1 rounded-[10px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy graph JSON"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#0A5C45] dark:text-[#5BE0A5]" />
                  <span className="hidden sm:inline text-[#0A5C45] dark:text-[#5BE0A5]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">JSON</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] p-2 rounded-[10px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#4F6359] dark:text-[#9DB5A8] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer ml-1"
              aria-label="Close Concept Map"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area: Graph Canvas or Fallback Outline */}
        <div className="relative flex-1 bg-[#F3F6F1] dark:bg-[#0B1612] overflow-hidden" ref={flowContainerRef}>
          {showOutlineView ? (
            <div className="p-6 h-full overflow-y-auto space-y-4 max-w-xl mx-auto">
              <div className="p-4 rounded-[16px] bg-white dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A]">
                <h3 className="font-heading font-bold text-sm text-[#0A5C45] dark:text-[#5BE0A5] mb-2 flex items-center gap-2">
                  <ListTree className="w-4 h-4" />
                  Structured Hierarchy
                </h3>
                <ul className="space-y-2.5 text-xs text-[#10231C] dark:text-[#E8F2EC]">
                  {mapData.nodes.map((node) => (
                    <li
                      key={node.id}
                      onClick={() => handleNodeSelect(node)}
                      className={`p-2.5 rounded-[10px] border transition-colors cursor-pointer flex items-center justify-between ${
                        node.parent === null
                          ? 'bg-[#DDEFE6] dark:bg-[#17352A] border-[#0A5C45] dark:border-[#5BE0A5] font-bold text-[#0A5C45] dark:text-[#5BE0A5]'
                          : 'bg-white dark:bg-[#12231C] border-[#D5E0D8] dark:border-[#27403A] hover:bg-[#DDEFE6]/40 dark:hover:bg-[#17352A]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A5C45] dark:bg-[#5BE0A5]" />
                        <span>{node.label}</span>
                      </div>
                      {node.parent && (
                        <span className="text-[10px] text-[#4F6359] dark:text-[#9DB5A8]">
                          child of: {node.parent}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2}
              defaultEdgeOptions={{ type: 'smoothstep' }}
              className="bg-[#F3F6F1] dark:bg-[#0B1612]"
            >
              <Background
                color={document.documentElement.classList.contains('dark') ? '#27403A' : '#D5E0D8'}
                gap={20}
                size={1.5}
              />
              <Controls
                showInteractive={false}
                className="!bg-white dark:!bg-[#12231C] !border-[#D5E0D8] dark:!border-[#27403A] !rounded-[12px] !shadow-md [&>button]:!border-b-[#D5E0D8] dark:[&>button]:!border-b-[#27403A] [&>button]:!text-[#10231C] dark:[&>button]:!text-[#E8F2EC]"
              />
            </ReactFlow>
          )}

          {/* Interactive Selected Node Inspector & 'Ask about this' Floating Dock */}
          {selectedNode && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 p-4 rounded-[16px] bg-white dark:bg-[#12231C] border border-[#0A5C45] dark:border-[#5BE0A5] shadow-xl animate-in slide-in-from-bottom-3 duration-200 z-20">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0A5C45] dark:text-[#5BE0A5]">
                    Selected Node
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#10231C] dark:text-[#E8F2EC] truncate">
                    {selectedNode.label}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-[8px] text-[#4F6359] hover:bg-[#DDEFE6] dark:text-[#9DB5A8] dark:hover:bg-[#17352A]"
                  aria-label="Deselect node"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onAskAboutNode(selectedNode.label);
                    onClose();
                  }}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-[10px] bg-[#0A5C45] hover:bg-[#0F8056] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask about this (&quot;Explain: {selectedNode.label}&quot;)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
