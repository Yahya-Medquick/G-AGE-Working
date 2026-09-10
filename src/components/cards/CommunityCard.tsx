import React from "react";
import { CommunityDiscussion } from "../../types";
import { MessageSquare, ThumbsUp, ExternalLink } from "lucide-react";

interface CommunityCardProps {
  discussion: CommunityDiscussion;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  discussion,
}) => {
  return (
    <div className="group rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400">
            {discussion.communityName}
          </span>
          <span className="text-slate-400 text-[11px]">
            u/{discussion.author}
          </span>
        </div>

        <h3 className="font-semibold text-slate-900 dark:text-white text-base group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-2">
          {discussion.title}
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
          {discussion.snippet}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-xs">
          <span className="flex items-center gap-1 text-orange-500">
            <ThumbsUp className="w-3.5 h-3.5" />
            {(discussion.score ?? 0).toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <MessageSquare className="w-3.5 h-3.5" />
            {discussion.commentsCount ?? 0} comments
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={discussion.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-medium flex items-center gap-1 transition-colors"
          >
            <span>Thread</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
