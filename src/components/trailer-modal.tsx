import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerKey: string;
}

export function TrailerModal({
  isOpen,
  onClose,
  trailerKey,
}: TrailerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px]">
        <div className="aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
