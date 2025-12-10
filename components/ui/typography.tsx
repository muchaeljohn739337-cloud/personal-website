import { cn } from '@/lib/utils/cn';
import { ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

// H1 — Page Title (Main)
export function H1({ children, className }: TypographyProps) {
  return (
    <h1
      className={cn(
        'scroll-m-20 text-4xl font-bold tracking-tight text-white lg:text-5xl',
        className
      )}
    >
      {children}
    </h1>
  );
}

// H2 — Section Title
export function H2({ children, className }: TypographyProps) {
  return (
    <h2
      className={cn(
        'scroll-m-20 text-3xl font-semibold tracking-tight text-white first:mt-0',
        className
      )}
    >
      {children}
    </h2>
  );
}

// H3 — Subsections
export function H3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn('scroll-m-20 text-2xl font-semibold tracking-tight text-white', className)}>
      {children}
    </h3>
  );
}

// H4 — Minor Group Labels
export function H4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn('scroll-m-20 text-xl font-semibold tracking-tight text-white', className)}>
      {children}
    </h4>
  );
}

// H5 — Small Labels
export function H5({ children, className }: TypographyProps) {
  return (
    <h5 className={cn('scroll-m-20 text-lg font-medium tracking-tight text-slate-300', className)}>
      {children}
    </h5>
  );
}

// H6 — Tiny Labels (Tables, Cards, Sidebar)
export function H6({ children, className }: TypographyProps) {
  return (
    <h6
      className={cn(
        'scroll-m-20 text-sm font-medium uppercase tracking-wider text-slate-500',
        className
      )}
    >
      {children}
    </h6>
  );
}

// Paragraph
export function P({ children, className }: TypographyProps) {
  return (
    <p className={cn('leading-7 text-slate-400 [&:not(:first-child)]:mt-4', className)}>
      {children}
    </p>
  );
}

// Lead text (larger intro paragraph)
export function Lead({ children, className }: TypographyProps) {
  return <p className={cn('text-xl text-slate-400', className)}>{children}</p>;
}

// Large text
export function Large({ children, className }: TypographyProps) {
  return <div className={cn('text-lg font-semibold text-white', className)}>{children}</div>;
}

// Small text
export function Small({ children, className }: TypographyProps) {
  return (
    <small className={cn('text-sm font-medium leading-none text-slate-500', className)}>
      {children}
    </small>
  );
}

// Muted text
export function Muted({ children, className }: TypographyProps) {
  return <p className={cn('text-sm text-slate-500', className)}>{children}</p>;
}

// Inline code
export function InlineCode({ children, className }: TypographyProps) {
  return (
    <code
      className={cn(
        'relative rounded bg-slate-800 px-[0.3rem] py-[0.2rem] font-mono text-sm text-violet-400',
        className
      )}
    >
      {children}
    </code>
  );
}

// Blockquote
export function Blockquote({ children, className }: TypographyProps) {
  return (
    <blockquote
      className={cn('mt-6 border-l-2 border-violet-500 pl-6 italic text-slate-400', className)}
    >
      {children}
    </blockquote>
  );
}

// Gradient text for hero sections
export function GradientText({ children, className }: TypographyProps) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent',
        className
      )}
    >
      {children}
    </span>
  );
}
