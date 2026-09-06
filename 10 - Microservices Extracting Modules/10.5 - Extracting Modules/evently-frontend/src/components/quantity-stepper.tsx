import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  disabled,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div
      className={cn(
        'inline-flex h-9 items-stretch overflow-hidden rounded-md border border-input bg-card',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        className="grid w-9 place-items-center border-r border-input transition-colors hover:bg-accent disabled:pointer-events-none"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="grid min-w-9 place-items-center px-2 text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid w-9 place-items-center border-l border-input transition-colors hover:bg-accent disabled:pointer-events-none"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
