import React, { lazy, Suspense } from 'react';

interface Props {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer = ({ content, className = '', isStreaming = false }: Props) => {
  if (!content || content.trim() === '') return null;
  return <Suspense fallback={<div className={className} aria-busy="true" /> }><MarkdownRendererContent content={content} className={className} isStreaming={isStreaming} /></Suspense>;
};

const MarkdownRendererContent = lazy(() =>
  import('./MarkdownRendererContent').then((module) => ({ default: module.MarkdownRendererContent }))
);
