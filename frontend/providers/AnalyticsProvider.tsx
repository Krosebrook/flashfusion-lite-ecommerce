import React, { createContext, useContext, useEffect } from 'react';
import { posthogApiKey, posthogHost } from '../config';

interface AnalyticsContextType {
  track: (event: string, properties?: any) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  track: () => {},
});

export function useAnalytics() {
  return useContext(AnalyticsContext);
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    if (posthogApiKey && typeof window !== 'undefined') {
      // Initialize PostHog
      const script = document.createElement('script');
      script.src = 'https://app.posthog.com/static/array.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        (window as any).posthog?.init(posthogApiKey, {
          api_host: posthogHost,
        });
      };
    }
  }, []);

  const track = (event: string, properties?: any) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event, properties);
    }
  };

  return (
    <AnalyticsContext.Provider value={{ track }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
