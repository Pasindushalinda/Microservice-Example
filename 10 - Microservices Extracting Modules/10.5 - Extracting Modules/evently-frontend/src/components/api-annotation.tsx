import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The dashed blue endpoint chips from the wireframes. They document which
 * gateway call backs a piece of UI and can be toggled off from the shell.
 */
const AnnotationContext = createContext<{ show: boolean; toggle: () => void }>({
  show: true,
  toggle: () => {},
});

const STORAGE_KEY = 'evently.showApiAnnotations';

export function ApiAnnotationProvider({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(show));
    } catch {
      /* ignore */
    }
  }, [show]);

  return (
    <AnnotationContext.Provider value={{ show, toggle: () => setShow((v) => !v) }}>
      {children}
    </AnnotationContext.Provider>
  );
}

export function useApiAnnotations() {
  return useContext(AnnotationContext);
}

export function Api({ children, className }: { children: ReactNode; className?: string }) {
  const { show } = useApiAnnotations();
  if (!show) return null;
  return (
    <code
      className={cn(
        'inline-block rounded border border-dashed border-primary/60 bg-primary/5 px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-tight text-primary',
        className,
      )}
    >
      {children}
    </code>
  );
}
