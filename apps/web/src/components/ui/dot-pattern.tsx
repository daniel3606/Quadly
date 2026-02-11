'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
}

/**
 * Static dot pattern background (Magic UI style). No animation for zero deps.
 */
export function DotPattern({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  const cols = Math.ceil(1200 / width);
  const rows = Math.ceil(800 / height);
  const dots: { x: number; y: number }[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      dots.push({ x: i * width + cx, y: j * height + cy });
    }
  }

  return (
    <svg
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full text-gray-300/60 dark:text-gray-600/50',
        className
      )}
      {...props}
    >
      {dots.map((dot, i) => (
        <circle
          key={`${dot.x}-${dot.y}-${i}`}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
