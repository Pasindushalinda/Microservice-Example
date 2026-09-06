import { cn } from '@/lib/utils';

/** Events carry no image in the 10.5 API — this is a deterministic placeholder. */
export function EventImage({
  title,
  className,
  label = 'event image',
}: {
  title?: string;
  className?: string;
  label?: string;
}) {
  const hue = [...(title ?? 'event')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <div
      className={cn(
        'surface-hatch grid place-items-center rounded-md border text-xs text-muted-foreground',
        className,
      )}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 45% 90%), hsl(${(hue + 40) % 360} 45% 85%))` }}
    >
      <span className="rounded bg-background/70 px-2 py-0.5">{label}</span>
    </div>
  );
}
