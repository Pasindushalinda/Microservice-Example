import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';

import './index.css';
import { router } from './router';
import { queryClient } from '@/lib/query';
import { oidcConfig } from '@/lib/auth/oidc';
import { AuthBridge } from '@/lib/auth/AuthBridge';
import { ApiAnnotationProvider } from '@/components/api-annotation';
import { applyStoredTheme } from '@/components/theme-toggle';

applyStoredTheme();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <AuthProvider {...oidcConfig}>
        <AuthBridge>
          <QueryClientProvider client={queryClient}>
            <ApiAnnotationProvider>
              <RouterProvider router={router} />
              <Toaster richColors closeButton position="top-center" />
            </ApiAnnotationProvider>
          </QueryClientProvider>
        </AuthBridge>
      </AuthProvider>
    </MotionConfig>
  </StrictMode>,
);
