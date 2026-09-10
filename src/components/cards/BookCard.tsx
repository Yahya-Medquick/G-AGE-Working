import React from "react";
import { BookItem } from "../../types";
import { ExternalLink, Star, BookOpen } from "lucide-react";

interface BookCardProps {
  book: BookItem;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
}) => {
  return (
    <div className="group rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between space-y-4">
      <div className="flex items-start gap-4">
        {/* Cover Thumbnail */}
        <div className="w-16 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
          {book.thumbnail ? (
            <img
              src={book.thumbnail}
              alt={book.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <BookOpen className="w-6 h-6 text-slate-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {book.publishedDate}
            </span>
            {book.rating && (
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{book.rating}</span>
              </div>
            )}
          </div>

          <h3 className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-2">
            {book.title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
            {Array.isArray(book.authors) ? book.authors.join(", ") : (book.authors || "Unknown Author")}
          </p>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pt-0.5 leading-normal">
            {book.description}
          </p>
        </div>
      </div>

      {/* Footer Links */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        {book.pageCount && (
          <span className="text-slate-400 font-medium text-[11px]">
            {book.pageCount} pages
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <a
            href={book.previewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-medium flex items-center gap-1 transition-colors"
          >
            <span>Preview</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
