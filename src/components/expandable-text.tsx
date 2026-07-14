'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

type ExpandableTextProps = {
  text: string;
  className?: string;
};

// Below this length five clamped lines fit the whole text anyway, so the
// toggle would do nothing.
const EXPANDABLE_THRESHOLD = 300;

/**
 * Long-form text clamped to a few lines with a "Show more" / "Show less"
 * toggle. Short texts render without the toggle.
 */
export function ExpandableText({ text, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandable = text.length > EXPANDABLE_THRESHOLD;

  return (
    <div>
      <p className={cn(!isExpanded && 'line-clamp-5', className)}>{text}</p>
      {isExpandable && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 text-sm text-zinc-400 underline hover:text-white"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
