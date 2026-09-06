import { cn } from '@/lib/utils';

/** Decorative QR-ish block — a placeholder for a real QR render of the ticket code. */
export function QrGlyph({ className, seed = '' }: { className?: string; seed?: string }) {
  const cells = 7;
  const hash = [...seed].reduce((acc, ch) => (acc * 33 + ch.charCodeAt(0)) >>> 0, 5381);
  return (
    <div
      className={cn(
        'grid aspect-square gap-px rounded-sm border bg-card p-1',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${cells}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: cells * cells }, (_, i) => {
        const corner =
          (i % cells < 2 && i < cells * 2) ||
          (i % cells >= cells - 2 && i < cells * 2) ||
          (i % cells < 2 && i >= cells * (cells - 2));
        const on = corner || ((hash >> i % 31) & 1) === 1;
        return (
          <span
            key={i}
            className={cn('rounded-[1px]', on ? 'bg-foreground' : 'bg-transparent')}
          />
        );
      })}
    </div>
  );
}
