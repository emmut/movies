'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PlayCircle } from 'lucide-react';
import { useState } from 'react';

interface TrailerButtonProps {
  movieId: number;
  movieTitle: string;
}

export function TrailerButton({ movieId, movieTitle }: TrailerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrailer = async () => {
    if (trailerKey) return; // Already fetched

    setIsLoading(true);
    try {
      const response = await fetch(`/api/movie/${movieId}/trailer`);
      if (response.ok) {
        const data = await response.json();
        setTrailerKey(data.trailerKey);
      }
    } catch (error) {
      console.error('Failed to fetch trailer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (!trailerKey && !isLoading) {
      fetchTrailer();
    }
    setIsOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700"
      >
        <PlayCircle className="mr-2 h-4 w-4" />
        {isLoading ? 'Laddar...' : 'Se Trailer'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogTitle className="sr-only">{movieTitle} - Trailer</DialogTitle>
          <div className="aspect-video">
            {trailerKey ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title={`${movieTitle} - Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded bg-zinc-900">
                <p className="text-zinc-400">
                  {isLoading ? 'Loading trailer...' : 'No trailer available'}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
