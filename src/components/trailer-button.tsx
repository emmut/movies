'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PlayCircle } from 'lucide-react';
import { useState } from 'react';

interface TrailerButtonProps {
  movieTitle: string;
  trailerKey: string;
}

export function TrailerButton({ movieTitle, trailerKey }: TrailerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className="bg-red-600 p-0 text-neutral-50 hover:bg-red-700"
        size="sm"
      >
        <PlayCircle className="mr-2 h-2 w-2" />
        Play Trailer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogTitle className="sr-only">{movieTitle} - Trailer</DialogTitle>
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title={`${movieTitle} - Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
