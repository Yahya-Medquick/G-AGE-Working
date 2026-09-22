import React, { lazy, Suspense } from 'react';

interface Props {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = '' }: Props) => {
  if (!content || content.trim() === '') return null;
  return <Suspense fallback={<div className={className} aria-busy="true" /> }><MarkdownRendererContent content={content} className={className} /></Suspense>;
};

const MarkdownRendererContent = lazy(() =>
  import('./MarkdownRendererContent').then((module) => ({ default: module.MarkdownRendererContent }))
);
