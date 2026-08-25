import { cn } from '@/lib/utils';

export default function Khatam({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cn('inline-block', className)}>
      <g fill="currentColor">
        <polygon points="50,4 61,32 50,50 39,32" />
        <polygon points="50,96 61,68 50,50 39,68" />
        <polygon points="4,50 32,39 50,50 32,61" />
        <polygon points="96,50 68,39 50,50 68,61" />
        <polygon points="17,17 40,30 50,50 30,40" />
        <polygon points="83,83 60,70 50,50 70,60" />
        <polygon points="17,83 40,70 50,50 30,60" />
        <polygon points="83,17 60,30 50,50 70,40" />
      </g>
    </svg>
  );
}
