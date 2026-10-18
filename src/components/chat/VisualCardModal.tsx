import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Download,
  Share2,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Send,
  MessageCircle,
  Link2,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { VisualStudyCard } from '../../types/visualCard';
import { renderCardToPngBlob } from '../../utils/cardRenderer';

interface VisualCardModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  card: VisualStudyCard | null;
  onClose: () => void;
  onRetry?: () => void;
}

const CLEAN_SHARE_LINK = 'https://gageai.org/?utm_source=share&utm_medium=study_card';

function logAnalyticsEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    try {
      (window as any).gtag('event', eventName, params);
    } catch {
      // Ignore analytics errors
    }
  }
}

export const VisualCardModal: React.FC<VisualCardModalProps> = ({
  isOpen,
  isLoading,
  error,
  card,
  onClose,
  onRetry,
}) => {
  const [renderedPng, setRenderedPng] = useState<{ blob: Blob; url: string; width: number; height: number } | null>(null);
  const [isRasterizing, setIsRasterizing] = useState(false);
  const [rasterError, setRasterError] = useState<string | null>(null);

  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copyImageError, setCopyImageError] = useState(false);

  // Clean filename generator
  const downloadFileName = useMemo(() => {
    if (!card?.title) return 'study-card.png';
    const slug = card.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `${slug || 'study-card'}.png`;
  }, [card?.title]);

  // Render the card ONCE to a PNG blob when card data arrives
  useEffect(() => {
    if (!card || !isOpen) {
      setRenderedPng((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return null;
      });
      return;
    }

    let isCancelled = false;
    setIsRasterizing(true);
    setRasterError(null);

    renderCardToPngBlob(card)
      .then((res) => {
        if (isCancelled) {
          URL.revokeObjectURL(res.url);
          return;
        }
        setRenderedPng((prev) => {
          if (prev?.url) URL.revokeObjectURL(prev.url);
          return res;
        });
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to rasterize visual card to PNG:', err);
          setRasterError('Failed to generate high-resolution image preview.');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsRasterizing(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [card, isOpen]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (renderedPng?.url) {
        URL.revokeObjectURL(renderedPng.url);
      }
    };
  }, [renderedPng]);

  // Download high-resolution PNG using the EXACT SAME blob as preview
  const handleDownloadPng = useCallback(() => {
    if (!renderedPng?.blob) return;
    const a = document.createElement('a');
    a.href = renderedPng.url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    logAnalyticsEvent('download_study_card', { title: card?.title });
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  }, [renderedPng, downloadFileName, card?.title]);

  // Web Share API primary path
  const handleShare = useCallback(async () => {
    if (!renderedPng?.blob || !card) return;
    const shareText = `${card.title} - made with G-AGE AI. Try it free: ${CLEAN_SHARE_LINK}`;

    try {
      const file = new File([renderedPng.blob], downloadFileName, { type: 'image/png' });
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: card.title,
          text: shareText,
          files: [file],
        });
        logAnalyticsEvent('share_study_card', { method: 'web_share' });
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // User cancelled share dialog
    }

    // Fallback: Toggle custom share menu
    setShowShareMenu((prev) => !prev);
  }, [renderedPng, card, downloadFileName]);

  // Copy Image to Clipboard
  const handleCopyImageToClipboard = useCallback(async () => {
    if (!renderedPng?.blob) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({ 'image/png': renderedPng.blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        logAnalyticsEvent('share_study_card', { method: 'copy_image' });
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        setCopyImageError(true);
        setTimeout(() => setCopyImageError(false), 3000);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      setCopyImageError(true);
      setTimeout(() => setCopyImageError(false), 3000);
    }
  }, [renderedPng]);

  // Copy Clean Marketing Link
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CLEAN_SHARE_LINK);
      setCopiedLink(true);
      logAnalyticsEvent('share_study_card', { method: 'copy_link' });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  }, []);

  if (!isOpen) return null;

  const showLoadingState = isLoading || isRasterizing;
  const currentError = error || rasterError;

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
      <div className="relative z-10 w-full sm:max-w-2xl md:max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-[24px] sm:rounded-[20px] bg-[#12231C] border border-[#27403A] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#27403A] bg-[#0E1B15]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[10px] bg-[#17352A] text-[#5BE0A5] flex items-center justify-center font-bold shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[6px] bg-[#17352A] text-[#5BE0A5] border border-[#5BE0A5]/30">
                  {card?.type ? card.type.replace('_', ' ') : 'Visual Study Card'}
                </span>
              </div>
              <h3 id="visual-card-title" className="font-heading font-bold text-sm text-[#E8F2EC] truncate mt-0.5">
                {card?.title || (showLoadingState ? 'Generating Visual Study Card...' : 'Study Card')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {renderedPng && !showLoadingState && !currentError && (
              <>
                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="min-h-[38px] px-3 py-1.5 rounded-[12px] bg-[#17352A] hover:bg-[#1E4537] text-[#5BE0A5] border border-[#5BE0A5]/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Share this visual card"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                {/* Download PNG Button */}
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-[12px] bg-[#0A5C45] hover:bg-[#0F8056] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadSuccess ? 'Downloaded!' : 'Download PNG'}</span>
                </button>
              </>
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

        {/* Modal Body: Loading Skeleton, Error State, or Scaled PNG Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0B1612]">
          {showLoadingState && (
            <div className="max-w-lg mx-auto space-y-4 animate-pulse">
              <div className="w-28 h-6 bg-[#17352A] rounded-md" />
              <div className="w-3/4 h-9 bg-[#17352A] rounded-lg" />
              <div className="w-1/2 h-5 bg-[#17352A]/60 rounded-md" />
              <div className="w-full h-0.5 bg-[#27403A] my-4" />

              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-[16px] bg-[#12231C] border border-[#27403A] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[12px] bg-[#F4B400]/40 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="w-1/3 h-5 bg-[#17352A] rounded" />
                    <div className="w-5/6 h-4 bg-[#17352A]/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showLoadingState && currentError && (
            <div className="max-w-md mx-auto my-8 p-6 rounded-[20px] bg-[#12231C] border border-red-900/40 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-[#E8F2EC]">Could Not Create Image</h4>
                <p className="text-xs text-[#9DB5A8] mt-1">{currentError}</p>
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

          {!showLoadingState && !currentError && renderedPng && (
            <div className="flex flex-col items-center w-full">
              {/* Responsive PNG Preview - exactly matching the downloaded PNG */}
              <div className="w-full max-w-lg flex items-center justify-center">
                <img
                  src={renderedPng.url}
                  alt={card?.title || 'Visual Study Card'}
                  className="max-w-full h-auto object-contain mx-auto rounded-[20px] shadow-2xl border border-[#27403A]"
                />
              </div>

              {/* Share Drawer Fallback */}
              {showShareMenu && (
                <div className="w-full max-w-lg mt-4 p-4 rounded-[16px] bg-[#12231C] border border-[#5BE0A5]/40 shadow-xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5BE0A5]">Share Study Card</span>
                    <button
                      type="button"
                      onClick={() => setShowShareMenu(false)}
                      className="text-[#9DB5A8] hover:text-[#E8F2EC] p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${card?.title} - made with G-AGE AI. Try it free: ${CLEAN_SHARE_LINK}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAnalyticsEvent('share_study_card', { method: 'whatsapp' })}
                      className="min-h-[42px] px-3 py-2 rounded-[12px] bg-[#25D366]/20 border border-[#25D366]/40 hover:bg-[#25D366]/30 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(CLEAN_SHARE_LINK)}&text=${encodeURIComponent(card?.title || 'Study Card')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAnalyticsEvent('share_study_card', { method: 'telegram' })}
                      className="min-h-[42px] px-3 py-2 rounded-[12px] bg-[#0088cc]/20 border border-[#0088cc]/40 hover:bg-[#0088cc]/30 text-sky-300 text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <Send className="w-4 h-4 text-[#0088cc]" />
                      <span>Telegram</span>
                    </a>

                    {/* Copy Image */}
                    <button
                      type="button"
                      onClick={handleCopyImageToClipboard}
                      className="min-h-[42px] px-3 py-2 rounded-[12px] bg-[#17352A] border border-[#27403A] hover:border-[#5BE0A5] text-[#E8F2EC] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      {copiedImage ? <Check className="w-4 h-4 text-[#5BE0A5]" /> : <ImageIcon className="w-4 h-4 text-[#5BE0A5]" />}
                      <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
                    </button>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="min-h-[42px] px-3 py-2 rounded-[12px] bg-[#17352A] border border-[#27403A] hover:border-[#5BE0A5] text-[#E8F2EC] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-[#5BE0A5]" /> : <Link2 className="w-4 h-4 text-[#5BE0A5]" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-[#9DB5A8] pt-1">
                    Tip: For WhatsApp, copy or download the image, then attach it to your message.
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-[#9DB5A8]">
                <Sparkles className="w-3.5 h-3.5 text-[#5BE0A5]" />
                <span>Pixel-identical 1080px export. Ready to share on WhatsApp and Instagram.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
