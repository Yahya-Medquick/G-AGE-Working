import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Download, RefreshCw, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { VisualStudyCard } from '../../types/visualCard';
import { generateCardSvg, rasterizeSvgToPng } from '../../utils/cardRenderer';

interface VisualCardModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  card: VisualStudyCard | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const VisualCardModal: React.FC<VisualCardModalProps> = ({
  isOpen,
  isLoading,
  error,
  card,
  onClose,
  onRetry,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Generate SVG string & layout dimensions when card changes
  const svgData = useMemo(() => {
    if (!card) return null;
    try {
      return generateCardSvg(card);
    } catch (err) {
      console.error('Failed to generate card SVG:', err);
      return null;
    }
  }, [card]);

  // Clean filename generator
  const downloadFileName = useMemo(() => {
    if (!card?.title) return 'study-card.png';
    const slug = card.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `${slug || 'visual-study-card'}.png`;
  }, [card?.title]);

  // Download high-resolution PNG
  const handleDownloadPng = useCallback(async () => {
    if (!svgData || isDownloading) return;
    try {
      setIsDownloading(true);
      const pngBlob = await rasterizeSvgToPng(svgData.svg, svgData.width, svgData.height);
      const url = URL.createObjectURL(pngBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [svgData, downloadFileName, isDownloading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visual-card-title"
    >
      {/* Backdrop overlay dismiss */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal / Bottom Sheet */}
      <div
        className="relative z-10 w-full sm:max-w-2xl md:max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-[24px] sm:rounded-[20px] bg-[#12231C] border border-[#27403A] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#27403A] bg-[#0E1B15]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[10px] bg-[#17352A] text-[#5BE0A5] flex items-center justify-center font-bold">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[6px] bg-[#17352A] text-[#5BE0A5] border border-[#5BE0A5]/30">
                  {card?.type ? card.type.replace('_', ' ') : 'Visual Study Card'}
                </span>
              </div>
              <h3 id="visual-card-title" className="font-heading font-bold text-sm text-[#E8F2EC] truncate mt-0.5">
                {card?.title || (isLoading ? 'Generating Visual Study Card...' : 'Study Card')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {card && !isLoading && !error && (
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isDownloading}
                className="min-h-[38px] px-3.5 py-1.5 rounded-[12px] bg-[#0A5C45] hover:bg-[#0F8056] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? 'Exporting...' : downloadSuccess ? 'Downloaded!' : 'Download PNG'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] min-w-[38px] p-2 rounded-[10px] text-[#9DB5A8] hover:bg-[#17352A] hover:text-[#E8F2EC] transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Loading Skeleton, Error State, or High-Resolution Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0B1612]">
          {isLoading && (
            <div className="max-w-lg mx-auto space-y-4 animate-pulse">
              {/* Skeleton Header Badge */}
              <div className="w-28 h-6 bg-[#17352A] rounded-md" />
              {/* Skeleton Title */}
              <div className="w-3/4 h-9 bg-[#17352A] rounded-lg" />
              <div className="w-1/2 h-5 bg-[#17352A]/60 rounded-md" />
              <div className="w-full h-0.5 bg-[#27403A] my-4" />

              {/* Skeleton Stacked Cards */}
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-[16px] bg-[#12231C] border border-[#27403A] flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-[12px] bg-[#F4B400]/40 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="w-1/3 h-5 bg-[#17352A] rounded" />
                    <div className="w-5/6 h-4 bg-[#17352A]/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="max-w-md mx-auto my-8 p-6 rounded-[20px] bg-[#12231C] border border-red-900/40 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-[#E8F2EC]">Could Not Create Image</h4>
                <p className="text-xs text-[#9DB5A8] mt-1">{error}</p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-4 py-2 rounded-[12px] bg-[#0A5C45] hover:bg-[#0F8056] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && svgData && (
            <div className="flex flex-col items-center">
              {/* Rendered SVG Card Preview scaled to container width */}
              <div
                className="w-full max-w-lg rounded-[20px] overflow-hidden shadow-2xl border border-[#27403A] bg-[#0B1612]"
                dangerouslySetInnerHTML={{ __html: svgData.svg }}
              />

              <div className="mt-4 flex items-center gap-2 text-xs text-[#9DB5A8]">
                <Sparkles className="w-3.5 h-3.5 text-[#5BE0A5]" />
                <span>Rendered at 1080px portrait format. Ready to save or share.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
