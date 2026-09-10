import React, { useState, useEffect } from "react";
import { VideoItem } from "../../types";
import { Play, Clock, Eye, X, ExternalLink, Sparkles } from "lucide-react";

interface VideoCardProps {
  video: VideoItem;
}

/**
 * Extracts clean 11-char YouTube video ID from various formats (URL, embed, ID string, thumbnail)
 */
export function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId || typeof urlOrId !== "string") return null;
  const trimmed = urlOrId.trim();

  // If already clean 11-char alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // If standard YouTube URL (youtube.com, youtu.be, embed, shorts, vi/ID)
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|(?:img|i)\.ytimg\.com\/vi\/)([\w-]{11})/
  );
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract valid YouTube Video ID if present across any field
  const videoId =
    extractYouTubeId(video.videoId) ||
    extractYouTubeId(video.url) ||
    extractYouTubeId((video as any).videoUrl) ||
    extractYouTubeId((video as any).link) ||
    extractYouTubeId(video.id) ||
    extractYouTubeId(video.thumbnailUrl);

  // Primary and fallback thumbnail resolution
  const initialThumbnail =
    video.thumbnailUrl ||
    (videoId
      ? `https://i.ytimg.com/vi/${videoId}/hq720.jpg`
      : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80");

  const [imgSrc, setImgSrc] = useState<string>(initialThumbnail);

  // Sync image source if video item changes
  useEffect(() => {
    if (video.thumbnailUrl) {
      setImgSrc(video.thumbnailUrl);
    } else if (videoId) {
      setImgSrc(`https://i.ytimg.com/vi/${videoId}/hq720.jpg`);
    }
  }, [video.thumbnailUrl, videoId]);

  // Handle image error by cycling through YouTube CDN resolutions
  const handleImageError = () => {
    if (videoId) {
      if (imgSrc.includes("hq720.jpg")) {
        setImgSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      } else if (imgSrc.includes("hqdefault.jpg")) {
        setImgSrc(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      } else if (imgSrc.includes("mqdefault.jpg")) {
        setImgSrc(`https://img.youtube.com/vi/${videoId}/0.jpg`);
      }
    }
  };

  // Determine target YouTube watch URL for external link
  const watchUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : video.url || (video as any).videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(video.title || "educational lecture")}`;

  // Keyboard Escape listener to close player modal
  useEffect(() => {
    if (!isPlaying) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPlaying(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlaying]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoId) {
      setIsPlaying(true);
    } else if (watchUrl) {
      window.open(watchUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <div
        onClick={handlePlayClick}
        className="group rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden hover:border-rose-500/40 dark:hover:border-rose-500/40 hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer"
      >
        {/* Thumbnail with overlay play button */}
        <div
          className="relative aspect-video w-full bg-slate-950 overflow-hidden group"
          title="Click to play lecture in app"
        >
          <img
            src={imgSrc}
            alt={video.title || "Video lecture thumbnail"}
            onError={handleImageError}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            referrerPolicy="no-referrer"
            loading="lazy"
          />

          {/* Dark hover overlay */}
          <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/15 flex items-center justify-center transition-colors">
            <div className="w-11 h-11 rounded-full bg-rose-600/90 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 transition-all shadow-lg ring-4 ring-white/20">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Duration badge */}
          {video.duration && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-slate-950/85 text-white text-[10px] font-semibold tracking-wider backdrop-blur-xs shadow-xs">
              {video.duration}
            </span>
          )}

          {/* In-App Player Badge */}
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/85 border border-white/10 text-white text-[10px] font-medium flex items-center gap-1 backdrop-blur-xs shadow-xs">
            <Play className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
            In-App Lecture
          </span>
        </div>

        {/* Video Info */}
        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 truncate flex items-center gap-1">
              <span>{video.channelTitle || (video as any).channel || "Academic Resource"}</span>
            </div>
            <h3
              className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-snug"
              title={video.title}
            >
              {video.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {video.description || "In-depth visual lecture and step-by-step academic explanation."}
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {video.views || "150K+ views"}
            </span>

            <div className="flex items-center gap-2">
              {video.publishedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {video.publishedAt}
                </span>
              )}
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                title="Open on YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded In-App Video Modal Player */}
      {isPlaying && videoId && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPlaying(false);
          }}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-white truncate" title={video.title}>
                  {video.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
                <button
                  onClick={() => setIsPlaying(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Close Player (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* In-App Embedded Video Frame */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between gap-4 text-xs text-slate-400">
              <div className="truncate">
                <span className="font-semibold text-rose-400">{video.channelTitle}</span>
                {video.description && (
                  <span className="hidden md:inline text-slate-400"> — {video.description.slice(0, 120)}...</span>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-slate-400">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> to exit
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
