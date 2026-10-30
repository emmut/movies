'use client';

import { Button } from '@movies/ui/components/button';
import { cn } from 'cn';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';

import Pill from '@/components/pill';

export function KeywordBubbles({
  keywords,
  type,
}: {
  keywords: { id: number; name: string }[];
  type: 'movie' | 'tv';
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-zinc-400 uppercase">Themes &amp; Keywords</h3>
      <div
        id={contentId}
        inert={!expanded}
        aria-hidden={!expanded}
        className={cn(!expanded && 'max-h-20 overflow-hidden mask-b-from-35% mask-b-to-100%')}
      >
        <ul className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <li key={keyword.id} className="max-w-full min-w-0">
              <Link
                href={`/keyword/${keyword.id}?mediaType=${type}`}
                className="block max-w-full rounded-full focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Pill className="h-auto min-h-7 max-w-full py-1 wrap-anywhere whitespace-normal">
                  <span className={cn(!expanded && 'invisible')}>{keyword.name}</span>
                </Pill>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-zinc-400"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? 'Hide tags' : 'Show tags'}
        <ChevronDown
          className={cn(
            'transition-transform motion-reduce:transition-none',
            expanded && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </Button>
    </div>
  );
}
