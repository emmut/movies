import { ReactNode } from 'react';

type MovieSliderProps = {
  children: ReactNode;
};

export function MovieSlider({ children }: MovieSliderProps) {
  return (
    <div className="group scrollbar-thin relative flex snap-x space-x-4 overflow-x-auto pb-2">
      <div className="from-background absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r to-transparent" />
      {children}
      <div className="from-background absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l to-transparent" />
    </div>
  );
}
