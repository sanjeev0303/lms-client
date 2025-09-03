"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamic import with SSR disabled and loading fallback
const PerformanceOptimizer = dynamic(
  () => import("./performance-optimizer"),
  {
    ssr: false,
    loading: () => null, // No loading UI to reduce bundle size
  }
);

interface PerformanceOptimizerWrapperProps {
  children: React.ReactNode;
}

export default function PerformanceOptimizerWrapper({ children }: PerformanceOptimizerWrapperProps) {
  return (
    <Suspense fallback={null}>
      <PerformanceOptimizer>{children}</PerformanceOptimizer>
    </Suspense>
  );
}
