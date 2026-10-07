import React, { lazy, Suspense } from 'react';
import type { UiLanguage } from '../i18n/ui';

interface Props {
  content: string;
  className?: string;
  isStreaming?: boolean;
  language?: UiLanguage;
}

export const MarkdownRenderer = ({ content, className = '', isStreaming = false, language = 'english' }: Props) => {
  if (!content || content.trim() === '') return null;
  return <Suspense fallback={<div className={className} aria-busy="true" /> }><MarkdownRendererContent content={content} className={className} isStreaming={isStreaming} language={language} /></Suspense>;
};

const MarkdownRendererContent = lazy(() =>
  import('./MarkdownRendererContent').then((module) => ({ default: module.MarkdownRendererContent }))
);
