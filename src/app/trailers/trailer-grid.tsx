'use client';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';
import { PlayCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type TrailerItem =
  | (Movie & { media_type: 'movie' })
  | (TvShow & { media_type: 'tv' });
type TrailerItemWithKey = TrailerItem & { trailer_key: string };

interface TrailerGridProps {
  trailers: TrailerItemWithKey[];
}

export function TrailerGrid({ trailers }: TrailerGridProps) {
  const [selectedTrailer, setSelectedTrailer] =
    useState<TrailerItemWithKey | null>(null);

  const getTitle = (item: TrailerItem) => {
    return item.media_type === 'movie'
      ? (item as Movie).title
      : (item as TvShow).name;
  };

  const getDate = (item: TrailerItem) => {
    const date =
      item.media_type === 'movie'
        ? (item as Movie).release_date
        : (item as TvShow).first_air_date;
    return date ? new Date(date).getFullYear() : 'N/A';
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {trailers.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div
                className="relative cursor-pointer"
                onClick={() => setSelectedTrailer(item)}
              >
                <AspectRatio ratio={16 / 9}>
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
                    alt={getTitle(item)}
                    fill
                    className="object-cover transition-all hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </AspectRatio>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                  <PlayCircle className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{getTitle(item)}</h3>
                <p className="text-muted-foreground text-sm">{getDate(item)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!selectedTrailer}
        onOpenChange={() => setSelectedTrailer(null)}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogTitle className="sr-only">
            {selectedTrailer && getTitle(selectedTrailer)} - Trailer
          </DialogTitle>
          <div className="aspect-video">
            {selectedTrailer && (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedTrailer.trailer_key}?autoplay=1`}
                title={`${getTitle(selectedTrailer)} - Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
