import type { ReactNode } from 'react';
import Khatam from '@/components/khatam';

interface PageHeadProps {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}

export default function PageHead({ eyebrow, title, children }: PageHeadProps) {
  return (
    <div className="page-enter relative overflow-hidden bg-emerald-deep px-6 pb-10 pt-11 text-center text-ivory">
      <Khatam className="pointer-events-none absolute -right-10 -top-10 h-[220px] w-[220px] text-gold opacity-10" />
      <p className="eyebrow relative flex items-center justify-center gap-2 text-gold-bright">
        <Khatam className="h-[11px] w-[11px]" />
        {eyebrow}
      </p>
      <h1 className="relative mb-2 mt-2.5 text-[clamp(28px,4vw,42px)] leading-tight">{title}</h1>
      {children && (
        <p className="relative mx-auto max-w-[520px] text-sm leading-relaxed text-ivory-dim">
          {children}
        </p>
      )}
    </div>
  );
}
