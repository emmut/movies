'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PlayCircle } from 'lucide-react';
import { useState } from 'react';

interface TrailerButtonProps {
  title: string;
  trailerKey: string;
  mediaType: 'movie' | 'tv';
}

/**
 * Renders a button that opens a dialog to play a movie trailer in an embedded YouTube player.
 *
 * @param title - The title of the movie, used for dialog accessibility and iframe title
 * @param trailerKey - The YouTube video key for the trailer to embed
 * @param mediaType - The type of media (movie or tv)
 * @returns A React element containing the play button and trailer dialog
 */
export function TrailerButton({
  title,
  trailerKey,
  mediaType,
}: TrailerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className={cn(
          mediaType === 'movie' && 'bg-yellow-600 hover:bg-yellow-700',
          mediaType === 'tv' && 'bg-red-600 text-neutral-50 hover:bg-red-700'
        )}
        size="sm"
      >
        <PlayCircle className="h-2 w-2" />
        Play Trailer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[min(98vw,1440px)]">
          <DialogTitle className="sr-only">{title} - Trailer</DialogTitle>
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title={`${title} - Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
