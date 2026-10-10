import type { CSSProperties } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

// From shadcn/ui, with Sonner's color variables pointed at the tokens.md colors
const TOKEN_COLORS = {
  fontFamily: 'inherit',
  '--normal-bg': 'var(--color-surface)',
  '--normal-text': 'var(--color-text)',
  '--normal-border': 'var(--color-border)',
  '--success-bg': 'var(--color-success-bg)',
  '--success-text': 'var(--color-success-text)',
  '--success-border': 'var(--color-success-border)',
  '--error-bg': 'var(--color-surface)',
  '--error-text': 'var(--color-error-text)',
  '--error-border': 'var(--color-error-border)',
} as CSSProperties;

function Toaster(props: ToasterProps) {
  return <Sonner richColors position="bottom-center" style={TOKEN_COLORS} {...props} />;
}

export { Toaster };
